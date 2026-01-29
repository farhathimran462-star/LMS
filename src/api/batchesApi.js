import { supabase } from '../config/supabaseClient';

// ============= BATCHES API =============

// Get all batches with relationships
export const getAllBatches = async () => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        institutions (id, institute_name, institute_id),
        courses (id, course_name, course_id),
        levels (id, level_name, level_id),
        programmes (id, programme_name, programme_id)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching batches:', error);
    return { data: null, error };
  }
};

// Get batches by institute with student counts
export const getBatchesByInstituteWithStudents = async (instituteUUID) => {
  try {
    // Get batches for the institution
    const { data: batches, error: batchError } = await supabase
      .from('batches')
      .select(`
        *,
        courses (id, course_name),
        levels (id, level_name),
        programmes (id, programme_name)
      `)
      .eq('institute_id', instituteUUID)
      .order('batch_name', { ascending: true });

    if (batchError) throw batchError;

    // Get student counts for each batch
    const { data: studentCounts, error: countError } = await supabase
      .from('students')
      .select('batch_id')
      .eq('institute_id', instituteUUID);

    if (countError) throw countError;

    // Count students per batch
    const studentCountMap = {};
    studentCounts?.forEach(student => {
      if (student.batch_id) {
        studentCountMap[student.batch_id] = (studentCountMap[student.batch_id] || 0) + 1;
      }
    });

    // Add student count to each batch
    const batchesWithCounts = batches?.map(batch => ({
      ...batch,
      student_count: studentCountMap[batch.id] || 0
    })) || [];

    return { data: batchesWithCounts, error: null };
  } catch (error) {
    console.error('Error fetching batches with student counts:', error);
    return { data: null, error };
  }
};

// Get batches by institute
export const getBatchesByInstitute = async (instituteId) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        courses (*),
        levels (*),
        programmes (*)
      `)
      .eq('institute_id', instituteId)
      .order('batch_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching batches by institute:', error);
    return { data: null, error };
  }
};

// Get batch by ID
export const getBatchById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        institutions (*),
        courses (*),
        levels (*),
        programmes (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching batch:', error);
    return { data: null, error };
  }
};

// Create batch
export const createBatch = async (batchData) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .insert([batchData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating batch:', error);
    return { data: null, error };
  }
};

// Update batch
export const updateBatch = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating batch:', error);
    return { data: null, error };
  }
};

// Delete batch
export const deleteBatch = async (id) => {
  try {
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting batch:', error);
    return { error };
  }
};

// Get active batches
export const getActiveBatches = async () => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        institutions (institute_name),
        programmes (programme_name)
      `)
      .eq('status', 'Active')
      .order('batch_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching active batches:', error);
    return { data: null, error };
  }
};

// Get batches for a specific teacher
export const getBatchesByTeacher = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('class_teachers')
      .select(`
        *,
        classes (
          *,
          batches (
            *,
            institutions (id, institute_name),
            courses (id, course_name, course_id),
            levels (id, level_name),
            programmes (
              id, 
              programme_name,
              programme_subjects (
                subjects (id, subject_name, subject_code)
              )
            )
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    if (error) throw error;

    // Transform data to extract batch information with class details
    const batchesMap = new Map();
    
    data?.forEach(assignment => {
      const classData = assignment.classes;
      const batchData = classData?.batches;
      
      if (batchData && classData) {
        const batchId = batchData.id;
        
        if (!batchesMap.has(batchId)) {
          // Extract subjects from programme_subjects
          const subjects = batchData.programmes?.programme_subjects?.map(
            ps => ps.subjects?.subject_name
          ).filter(Boolean) || [];
          
          batchesMap.set(batchId, {
            ...batchData,
            classes: [],
            subjects: new Set(subjects),
            totalClasses: 0
          });
        }
        
        const batch = batchesMap.get(batchId);
        batch.classes.push({
          id: classData.id,
          class_name: classData.class_name,
          assignment_id: assignment.id,
          assigned_date: assignment.assigned_date
        });
        
        batch.totalClasses++;
      }
    });

    // Convert map to array and format subjects
    const formattedBatches = Array.from(batchesMap.values()).map(batch => ({
      ...batch,
      subjects: Array.from(batch.subjects),
      subjectsCount: batch.subjects.size
    }));

    return { data: formattedBatches, error: null };
  } catch (error) {
    console.error('Error fetching teacher batches:', error);
    return { data: null, error };
  }
};
