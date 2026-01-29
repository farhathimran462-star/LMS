import { supabase } from '../config/supabaseClient';

// ============= SUBJECTS API =============

// Get all subjects with chapters
export const getAllSubjects = async () => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        levels (id, level_name, level_id),
        chapters (*)
      `)
      .order('subject_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return { data: null, error };
  }
};

// Get subjects by level ID
export const getSubjectsByLevel = async (levelId) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        chapters (*)
      `)
      .eq('level_id', levelId)
      .order('subject_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching subjects by level:', error);
    return { data: null, error };
  }
};

// Get subject by ID with chapters
export const getSubjectById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        levels (*),
        chapters (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching subject:', error);
    return { data: null, error };
  }
};

// Create subject
export const createSubject = async (subjectData) => {
  console.log('Creating subject with data:', subjectData);
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subjectData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating subject:', error);
    return { data: null, error };
  }
};

// Update subject
export const updateSubject = async (id, updates) => {
    console.log('Updating subject ID:', id, 'with data:', updates);
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('subject_code', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating subject:', error);
    return { data: null, error };
  }
};

// Delete subject
export const deleteSubject = async (id) => {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting subject:', error);
    return { error };
  }
};

// ============= CHAPTERS API =============

// Get chapters by subject
export const getChaptersBySubject = async (subjectId) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .order('chapter_number', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return { data: null, error };
  }
};

// Create chapter
export const createChapter = async (chapterData) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .insert([chapterData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating chapter:', error);
    return { data: null, error };
  }
};

// Create multiple chapters
export const createMultipleChapters = async (chaptersArray) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .insert(chaptersArray)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating chapters:', error);
    return { data: null, error };
  }
};

// Update chapter
export const updateChapter = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating chapter:', error);
    return { data: null, error };
  }
};

// Delete chapter
export const deleteChapter = async (id) => {
  try {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return { error };
  }
};

// Delete all chapters for a subject (useful when updating)
export const deleteChaptersBySubject = async (subjectId) => {
  try {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('subject_id', subjectId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting chapters:', error);
    return { error };
  }
};

// ============= TOPICS API =============

// Get topics by chapter
export const getTopicsByChapter = async (chapterId) => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching topics:', error);
    return { data: null, error };
  }
};

// Get topics by subject (all chapters)
export const getTopicsBySubject = async (subjectId) => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*, chapters!inner(*)')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching topics by subject:', error);
    return { data: null, error };
  }
};

// Create topic
export const createTopic = async (topicData) => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .insert([topicData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating topic:', error);
    return { data: null, error };
  }
};

// Update topic
export const updateTopic = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating topic:', error);
    return { data: null, error };
  }
};

// Delete topic
export const deleteTopic = async (id) => {
  try {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting topic:', error);
    return { error };
  }
};

// Get chapter with topics and calculate estimated hours
export const getChapterWithTopicsAndHours = async (chapterId) => {
  try {
    const { data: topics, error } = await supabase
      .from('topics')
      .select('estimated_hours')
      .eq('chapter_id', chapterId);

    if (error) throw error;

    const totalHours = topics?.reduce((sum, topic) => sum + (topic.estimated_hours || 0), 0) || 0;
    
    return { data: { topics, totalHours }, error: null };
  } catch (error) {
    console.error('Error calculating chapter hours:', error);
    return { data: null, error };
  }
};
