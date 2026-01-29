import { supabase } from '../config/supabaseClient';

// ============= COURSES API =============

// Get all courses
export const getAllCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('course_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { data: null, error };
  }
};

// Get courses by institution ID
export const getCoursesByInstitution = async (institutionId) => {
  try {
    // Get course IDs from institution_courses junction table
    const { data: associations, error: assocError } = await supabase
      .from('institution_courses')
      .select('course_id')
      .eq('institution_id', institutionId);

    if (assocError) throw assocError;

    if (!associations || associations.length === 0) {
      return { data: [], error: null };
    }

    // Get the actual course details
    const courseIds = associations.map(a => a.course_id);
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .order('course_name', { ascending: true });

    if (coursesError) throw coursesError;
    return { data: courses, error: null };
  } catch (error) {
    console.error('Error fetching courses by institution:', error);
    return { data: null, error };
  }
};

// Get course by ID
export const getCourseById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { data: null, error };
  }
};

// Create course
export const createCourse = async (courseData) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating course:', error);
    return { data: null, error };
  }
};

// Update course
export const updateCourse = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating course:', error);
    return { data: null, error };
  }
};

// Delete course
export const deleteCourse = async (id) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { error };
  }
};
