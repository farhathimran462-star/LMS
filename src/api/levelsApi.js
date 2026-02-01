import { supabase } from '../config/supabaseClient';

// ============= LEVELS API =============

// Get all levels
export const getAllLevels = async () => {
  try {
    const { data, error } = await supabase
      .from('levels')
      .select(`
        *,
        courses (id, course_name, course_id)
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching levels:', error);
    return { data: null, error };
  }
};

// Get levels by course ID
export const getLevelsByCourse = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching levels by course:', error);
    return { data: null, error };
  }
};

// Get level by ID
export const getLevelById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('levels')
      .select(`
        *,
        courses (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching level:', error);
    return { data: null, error };
  }
};

// Create level
export const createLevel = async (levelData) => {
    console.log('Creating level with data:', levelData);
  try {
    const { data, error } = await supabase
      .from('levels')
      .insert([levelData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating level:', error);
    return { data: null, error };
  }
};

// Update level
export const updateLevel = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('levels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating level:', error);
    return { data: null, error };
  }
};

// Delete level
export const deleteLevel = async (id) => {
  try {
    const { error } = await supabase
      .from('levels')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting level:', error);
    return { error };
  }
};
