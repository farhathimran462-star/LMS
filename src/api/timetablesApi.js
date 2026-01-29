import { supabase } from '../config/supabaseClient';

// ============= TIMETABLES API =============

/**
 * Upload timetable file to Supabase Storage and create database record
 * @param {Object} metadata - Timetable metadata
 * @param {File} file - File object to upload
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const uploadTimetable = async (metadata, file) => {
  try {
    console.log('Uploading timetable:', metadata, file);

    // 1. Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `timetables/${metadata.institution_id}/${metadata.batch_id}/${fileName}`;

    // 2. Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('timetables') // Bucket name: 'timetables'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Get public URL
    const { data: urlData } = supabase.storage
      .from('timetables')
      .getPublicUrl(filePath);

    // 4. Create database record
    const insertData = {
      timetable_name: metadata.timetable_name,
      description: metadata.description,
      institute_id: metadata.institution_id, // FIX: Use institution_id from metadata
      course_id: metadata.course_id,
      level_id: metadata.level_id,
      programme_id: metadata.programme_id,
      batch_id: metadata.batch_id,
      class_id: metadata.class_id || null,
      file_url: urlData.publicUrl,
      file_path: filePath,
      file_name: file.name,
      file_type: fileExt.toLowerCase(),
      file_size: file.size,
      start_date: metadata.start_date || null,
      end_date: metadata.end_date || null,
      academic_year: metadata.academic_year || null,
      uploaded_by: metadata.uploaded_by || null,
      notes: metadata.notes || null,
      is_active: true
    };

    console.log('Inserting to database:', insertData);

    const { data: timetableData, error: dbError } = await supabase
      .from('timetables')
      .insert([insertData])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }

    console.log('Timetable uploaded successfully:', timetableData);
    return { data: timetableData, error: null };
  } catch (error) {
    console.error('Error uploading timetable:', error);
    return { data: null, error };
  }
};

/**
 * Get all timetables (with optional filters)
 * @param {Object} filters - Optional filters {institute_id, course_id, batch_id, class_id}
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getAllTimetables = async (filters = {}) => {
  try {
    let query = supabase
      .from('timetables')
      .select('*')
      .eq('is_active', true)
      .order('uploaded_at', { ascending: false });

    // Apply filters if provided
    if (filters.institute_id) query = query.eq('institute_id', filters.institute_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.level_id) query = query.eq('level_id', filters.level_id);
    if (filters.programme_id) query = query.eq('programme_id', filters.programme_id);
    if (filters.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters.class_id) query = query.eq('class_id', filters.class_id);

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return { data: null, error };
  }
};

/**
 * Get timetables by batch
 * @param {string} batchId - Batch UUID
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getTimetablesByBatch = async (batchId) => {
  return getAllTimetables({ batch_id: batchId });
};

/**
 * Get timetables by class
 * @param {string} classId - Class UUID
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getTimetablesByClass = async (classId) => {
  return getAllTimetables({ class_id: classId });
};

/**
 * Get timetable by ID
 * @param {string} id - Timetable UUID
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const getTimetableById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return { data: null, error };
  }
};

/**
 * Update timetable metadata (not the file)
 * @param {string} id - Timetable UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const updateTimetable = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('timetables')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating timetable:', error);
    return { data: null, error };
  }
};

/**
 * Delete timetable (soft delete - sets is_active to false)
 * @param {string} id - Timetable UUID
 * @returns {Promise<{error: Object}>}
 */
export const deleteTimetable = async (id) => {
  try {
    const { error } = await supabase
      .from('timetables')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting timetable:', error);
    return { error };
  }
};

/**
 * Permanently delete timetable and its file
 * @param {string} id - Timetable UUID
 * @returns {Promise<{error: Object}>}
 */
export const permanentlyDeleteTimetable = async (id) => {
  try {
    // 1. Get timetable to find file path
    const { data: timetable, error: fetchError } = await getTimetableById(id);
    if (fetchError) throw fetchError;

    // 2. Delete file from storage
    if (timetable.file_path) {
      const { error: storageError } = await supabase.storage
        .from('timetables')
        .remove([timetable.file_path]);
      
      if (storageError) console.error('Error deleting file:', storageError);
    }

    // 3. Delete database record
    const { error: dbError } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
    return { error: null };
  } catch (error) {
    console.error('Error permanently deleting timetable:', error);
    return { error };
  }
};

/**
 * Download timetable file
 * @param {string} filePath - File path in storage
 * @param {string} fileName - Original file name
 * @returns {Promise<void>}
 */
export const downloadTimetable = async (filePath, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('timetables')
      .download(filePath);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading timetable:', error);
    throw error;
  }
};
