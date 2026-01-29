import { supabase } from '../config/supabaseClient';

// ============= COURSE COMPLETION API =============

/**
 * Create a new course completion with file upload
 * @param {Object} completionData - Course completion details
 * @param {File} file - Proof document file (optional)
 * @returns {Object} { data, error }
 */
export const createCourseCompletion = async (completionData, file = null) => {
  try {
    let fileData = {};

    // Upload file to Storage if provided
    if (file) {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `completions/${completionData.institution_id}/${completionData.teacher_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-completion-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-completion-documents')
        .getPublicUrl(filePath);

      fileData = {
        proof_document_url: publicUrl,
        proof_document_path: filePath,
        proof_document_name: file.name,
        proof_document_type: file.type,
        proof_document_size: file.size
      };
    }

    // Clean up empty date fields (convert empty strings to null)
    const cleanedData = { ...completionData };
    if (cleanedData.completion_date === '' || cleanedData.completion_date === undefined) {
      cleanedData.completion_date = null;
    }
    
    // Set default status to Pending if not provided
    if (!cleanedData.status) {
      cleanedData.status = 'Pending';
    }
    
    // Set submitted_date to current timestamp if not provided
    if (!cleanedData.submitted_date) {
      cleanedData.submitted_date = new Date().toISOString();
    }

    // Insert course completion
    const { data, error } = await supabase
      .from('course_completions')
      .insert([{ ...cleanedData, ...fileData }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating course completion:', error);
    return { data: null, error };
  }
};

/**
 * Get all course completions with optional filters
 * @param {Object} filters - Filter options (teacher_id, institution_id, status, etc.)
 * @returns {Object} { data, error }
 */
export const getAllCourseCompletions = async (filters = {}) => {
  try {
    let query = supabase
      .from('course_completions')
      .select(`
        *,
        subjects(id, subject_code, subject_name),
        chapters(id, chapter_number, chapter_name),
        institutions(id, institute_name),
        batches(id, batch_name),
        classes(id, class_name)
      `)
      .order('submitted_date', { ascending: false });

    // Apply filters
    if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.level_id) query = query.eq('level_id', filters.level_id);
    if (filters.programme_id) query = query.eq('programme_id', filters.programme_id);
    if (filters.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course completions:', error);
    return { data: null, error };
  }
};

/**
 * Get course completions by teacher
 * @param {string} teacherId - Teacher ID
 * @returns {Object} { data, error }
 */
export const getCourseCompletionsByTeacher = async (teacherId) => {
  return getAllCourseCompletions({ teacher_id: teacherId });
};

/**
 * Get course completions by institution
 * @param {string} institutionId - Institution ID
 * @returns {Object} { data, error }
 */
export const getCourseCompletionsByInstitution = async (institutionId) => {
  return getAllCourseCompletions({ institution_id: institutionId });
};

/**
 * Get single course completion by ID
 * @param {string} id - Course completion ID
 * @returns {Object} { data, error }
 */
export const getCourseCompletionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('course_completions')
      .select(`
        *,
        subjects(id, subject_code, subject_name),
        chapters(id, chapter_number, chapter_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course completion:', error);
    return { data: null, error };
  }
};

/**
 * Update course completion status
 * @param {string} id - Course completion ID
 * @param {string} status - New status (Approved/Rejected/OnHold)
 * @param {string} approvedBy - User ID of approver
 * @param {string} rejectionReason - Reason for rejection (optional)
 * @returns {Object} { error }
 */
export const updateCourseCompletionStatus = async (id, status, approvedBy, rejectionReason = null) => {
  try {
    const updateData = {
      status,
      approved_by: approvedBy,
      approval_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (status === 'Rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('course_completions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating course completion status:', error);
    return { error };
  }
};

/**
 * Update course completion details
 * @param {string} id - Course completion ID
 * @param {Object} completionData - Updated completion data
 * @param {File} newFile - New proof document (optional)
 * @returns {Object} { error }
 */
export const updateCourseCompletion = async (id, completionData, newFile = null) => {
  try {
    // Check if status is Pending
    const { data: existing, error: fetchError } = await getCourseCompletionById(id);
    if (fetchError) throw fetchError;
    
    if (existing.status !== 'Pending') {
      throw new Error('Only Pending course completions can be edited');
    }

    let fileData = {};

    // Handle file replacement
    if (newFile) {
      // Delete old file if exists
      if (existing.proof_document_path) {
        await supabase.storage
          .from('course-completion-documents')
          .remove([existing.proof_document_path]);
      }

      // Upload new file
      const timestamp = Date.now();
      const fileName = `${timestamp}_${newFile.name}`;
      const filePath = `completions/${completionData.institution_id}/${completionData.teacher_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-completion-documents')
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-completion-documents')
        .getPublicUrl(filePath);

      fileData = {
        proof_document_url: publicUrl,
        proof_document_path: filePath,
        proof_document_name: newFile.name,
        proof_document_type: newFile.type,
        proof_document_size: newFile.size
      };
    }

    // Update course completion
    const { error } = await supabase
      .from('course_completions')
      .update({ 
        ...completionData, 
        ...fileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating course completion:', error);
    return { error };
  }
};

/**
 * Delete course completion
 * @param {string} id - Course completion ID
 * @returns {Object} { error }
 */
export const deleteCourseCompletion = async (id) => {
  try {
    // Check if status is Pending
    const { data: existing, error: fetchError } = await getCourseCompletionById(id);
    if (fetchError) throw fetchError;
    
    if (existing.status !== 'Pending') {
      throw new Error('Only Pending course completions can be deleted');
    }

    // Delete file from Storage if exists
    if (existing.proof_document_path) {
      await supabase.storage
        .from('course-completion-documents')
        .remove([existing.proof_document_path]);
    }

    // Delete course completion
    const { error } = await supabase
      .from('course_completions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting course completion:', error);
    return { error };
  }
};

/**
 * Download course completion document
 * @param {string} filePath - File path in storage
 * @param {string} fileName - Original file name
 * @returns {Object} { error }
 */
export const downloadCourseCompletionDocument = async (filePath, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('course-completion-documents')
      .download(filePath);

    if (error) throw error;

    // Create blob URL and trigger download
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { error: null };
  } catch (error) {
    console.error('Error downloading document:', error);
    return { error };
  }
};

/**
 * Get course completion statistics
 * @param {Object} filters - Filter options
 * @returns {Object} { data, error }
 */
export const getCourseCompletionStatistics = async (filters = {}) => {
  try {
    const { data: completions, error } = await getAllCourseCompletions(filters);
    if (error) throw error;

    const stats = {
      totalRequests: completions.length,
      pendingCount: completions.filter(c => c.status === 'Pending').length,
      approvedCount: completions.filter(c => c.status === 'Approved').length,
      rejectedCount: completions.filter(c => c.status === 'Rejected').length,
      onHoldCount: completions.filter(c => c.status === 'OnHold').length,
      totalHoursCompleted: completions
        .filter(c => c.status === 'Approved')
        .reduce((sum, c) => sum + (parseFloat(c.hours_taken) || 0), 0)
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return { data: null, error };
  }
};
