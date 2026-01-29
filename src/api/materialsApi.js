import { supabase } from '../config/supabaseClient';

// ============= MATERIALS API =============

/**
 * Create a new material with optional file upload
 * @param {Object} materialData - Material details
 * @param {File} file - Material file (optional)
 * @returns {Object} { data, error }
 */
export const createMaterial = async (materialData, file = null) => {
  try {
    let fileData = {};

    // Upload file to Storage if provided
    if (file) {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const institutionPart = materialData.institution_id || 'global';
      const filePath = `materials/${materialData.material_type}/${institutionPart}/${materialData.uploaded_by}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('materials-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('materials-documents')
        .getPublicUrl(filePath);

      fileData = {
        file_url: publicUrl,
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size_kb: Math.round(file.size / 1024)
      };
    }

    // Clean up empty date fields
    const cleanedData = { ...materialData };
    if (cleanedData.start_date === '' || cleanedData.start_date === undefined) {
      cleanedData.start_date = null;
    }
    if (cleanedData.end_date === '' || cleanedData.end_date === undefined) {
      cleanedData.end_date = null;
    }

    // Set status based on user role
    // Super Admin materials are auto-approved, Admin materials need approval
    if (!cleanedData.status) {
      const userRole = cleanedData.user_role?.toLowerCase().trim();
      console.log('🔍 Material creation - User role:', userRole);
      
      if (userRole === 'super admin') {
        cleanedData.status = 'Approved';
        cleanedData.approved_by = cleanedData.uploaded_by;
        cleanedData.approved_date = new Date().toISOString();
        console.log('✅ Super Admin material - Auto-approved');
      } else {
        cleanedData.status = 'Pending';
        console.log('⏳ Non-Super Admin material - Status set to Pending');
      }
    }
    
    // Remove user_role from data (not a DB field)
    delete cleanedData.user_role;

    // Set uploaded_date to current timestamp if not provided
    if (!cleanedData.uploaded_date) {
      cleanedData.uploaded_date = new Date().toISOString();
    }

    // Insert material
    const { data, error } = await supabase
      .from('materials')
      .insert([{ ...cleanedData, ...fileData }])
      .select(`
        *,
        institutions(id, institute_id, institute_name),
        courses(id, course_id, course_name),
        levels(id, level_id, level_name),
        programmes(id, programme_id, programme_name),
        batches(id, batch_name),
        classes(id, class_name),
        subjects(id, subject_code, subject_name)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating material:', error);
    return { data: null, error };
  }
};

/**
 * Get all materials with optional filters and joins
 * @param {Object} filters - Filter options
 * @returns {Object} { data, error }
 */
export const getAllMaterials = async (filters = {}) => {
  try {
    let query = supabase
      .from('materials')
      .select(`
        *,
        institutions(id, institute_id, institute_name),
        courses(id, course_id, course_name),
        levels(id, level_id, level_name),
        programmes(id, programme_id, programme_name),
        batches(id, batch_name),
        classes(id, class_name),
        subjects(id, subject_code, subject_name)
      `)
      .order('uploaded_date', { ascending: false });

    // Apply filters
    if (filters.material_type) query = query.eq('material_type', filters.material_type);
    if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.level_id) query = query.eq('level_id', filters.level_id);
    if (filters.programme_id) query = query.eq('programme_id', filters.programme_id);
    if (filters.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.uploaded_by) query = query.eq('uploaded_by', filters.uploaded_by);

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching materials:', error);
    return { data: null, error };
  }
};

/**
 * Get materials by type (MCP-Materials, MCP-Notes, Class-Notes, Tasks)
 * @param {string} materialType - Material type
 * @returns {Object} { data, error }
 */
export const getMaterialsByType = async (materialType) => {
  return getAllMaterials({ material_type: materialType });
};

/**
 * Get materials visible to a specific student (filtered by their class/course/level)
 * @param {Object} studentData - Student's class, course, level info
 * @returns {Object} { data, error }
 */
export const getMaterialsByStudent = async (studentData) => {
  try {
    const { course_id, level_id, programme_id, batch_id, class_id } = studentData;

    // Get all approved materials
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        institutions(id, institute_id, institute_name),
        courses(id, course_id, course_name),
        levels(id, level_id, level_name),
        programmes(id, programme_id, programme_name),
        batches(id, batch_name),
        classes(id, class_name),
        subjects(id, subject_code, subject_name)
      `)
      .eq('status', 'Approved');

    if (error) throw error;

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Filter results: include MCP materials (global) + materials matching student's hierarchy
    const filteredData = data.filter(material => {
      // MCP materials (global - no institution/class restrictions)
      const isMCPMaterial = (material.material_type === 'MCP-Materials' || material.material_type === 'MCP-Notes') &&
                           !material.institution_id && 
                           !material.class_id;
      
      // Class-specific materials (Class-Notes and Tasks) - must match exact class
      const isClassMaterial = (material.material_type === 'Class-Notes' || material.material_type === 'Tasks') &&
                             material.course_id === course_id &&
                             material.level_id === level_id &&
                             material.programme_id === programme_id && 
                             material.batch_id === batch_id &&
                             material.class_id === class_id;
      
      return isMCPMaterial || isClassMaterial;
    });

    return { data: filteredData, error: null };
  } catch (error) {
    console.error('Error fetching student materials:', error);
    return { data: null, error: error.message || error };
  }
};

/**
 * Get single material by ID
 * @param {string} id - Material ID
 * @returns {Object} { data, error }
 */
export const getMaterialById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        institutions(id, institute_id, institute_name),
        courses(id, course_id, course_name),
        levels(id, level_id, level_name),
        programmes(id, programme_id, programme_name),
        batches(id, batch_name),
        classes(id, class_name),
        subjects(id, subject_code, subject_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching material:', error);
    return { data: null, error };
  }
};

/**
 * Update material status (Approve/Reject)
 * @param {string} id - Material ID
 * @param {string} status - New status (Approved/Rejected)
 * @param {string} approvedBy - User ID of approver
 * @returns {Object} { error }
 */
export const updateMaterialStatus = async (id, status, approvedBy) => {
  try {
    const updateData = {
      status,
      approved_by: approvedBy,
      approved_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating material status:', error);
    return { error };
  }
};

/**
 * Update material details (Only Pending materials)
 * @param {string} id - Material ID
 * @param {Object} updateData - Updated material data
 * @param {File} newFile - New file if replacing (optional)
 * @returns {Object} { data, error }
 */
export const updateMaterial = async (id, updateData, newFile = null) => {
  try {
    // First check if material is Pending
    const { data: material } = await getMaterialById(id);
    if (!material) throw new Error('Material not found');
    if (material.status !== 'Pending') {
      throw new Error('Only Pending materials can be edited');
    }

    let fileData = {};

    // Upload new file if provided
    if (newFile) {
      // Delete old file if exists
      if (material.file_path) {
        await supabase.storage
          .from('materials-documents')
          .remove([material.file_path]);
      }

      // Upload new file
      const timestamp = Date.now();
      const fileName = `${timestamp}_${newFile.name}`;
      const institutionPart = updateData.institution_id || material.institution_id || 'global';
      const filePath = `materials/${material.material_type}/${institutionPart}/${material.uploaded_by}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('materials-documents')
        .upload(filePath, newFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('materials-documents')
        .getPublicUrl(filePath);

      fileData = {
        file_url: publicUrl,
        file_path: filePath,
        file_name: newFile.name,
        file_type: newFile.type,
        file_size_kb: Math.round(newFile.size / 1024)
      };
    }

    // Clean up empty date fields
    const cleanedData = { ...updateData };
    if (cleanedData.start_date === '' || cleanedData.start_date === undefined) {
      cleanedData.start_date = null;
    }
    if (cleanedData.end_date === '' || cleanedData.end_date === undefined) {
      cleanedData.end_date = null;
    }

    // Update material
    const { data, error } = await supabase
      .from('materials')
      .update({ ...cleanedData, ...fileData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        institutions(id, institute_id, institute_name),
        courses(id, course_id, course_name),
        levels(id, level_id, level_name),
        programmes(id, programme_id, programme_name),
        batches(id, batch_name),
        classes(id, class_name),
        subjects(id, subject_code, subject_name)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating material:', error);
    return { data: null, error };
  }
};

/**
 * Delete material (Only Pending materials)
 * @param {string} id - Material ID
 * @returns {Object} { error }
 */
export const deleteMaterial = async (id) => {
  try {
    // First check if material is Pending
    const { data: material } = await getMaterialById(id);
    if (!material) throw new Error('Material not found');
    if (material.status !== 'Pending') {
      throw new Error('Only Pending materials can be deleted');
    }

    // Delete file from storage if exists
    if (material.file_path) {
      await supabase.storage
        .from('materials-documents')
        .remove([material.file_path]);
    }

    // Delete material record
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting material:', error);
    return { error };
  }
};

/**
 * Download material document
 * @param {string} filePath - File path in storage
 * @param {string} fileName - Original file name
 * @returns {Object} { error }
 */
export const downloadMaterialDocument = async (filePath, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('materials-documents')
      .download(filePath);

    if (error) throw error;

    // Create download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { error: null };
  } catch (error) {
    console.error('Error downloading material:', error);
    return { error };
  }
};
