// Create programme (simple, no subjects)
export const createProgramme = async (programmeData, subjectIds = []) => {
  try {
    const { data, error } = await supabase
      .from('programmes')
      .insert([programmeData])
      .select()
      .single();
    if (error) throw error;
    
    // Link subjects to programme if provided
    if (subjectIds && subjectIds.length > 0) {
      const programmeSubjects = subjectIds.map(subjectId => ({
        programme_id: data.id,
        subject_id: subjectId
      }));

      console.log('Inserting programme_subjects:', programmeSubjects);
      const { error: linkError } = await supabase
        .from('programme_subjects')
        .insert(programmeSubjects);

      if (linkError) {
        console.error('Error linking subjects:', linkError);
        throw linkError;
      }
      console.log('Successfully linked', subjectIds.length, 'subjects to programme');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating programme:', error);
    return { data: null, error };
  }
};
import { supabase } from '../config/supabaseClient';

// ============= PROGRAMMES API =============

// Get all programmes with relationships
export const getAllProgrammes = async () => {
  try {
    const { data, error } = await supabase
      .from('programmes')
      .select(`
        *,
        courses (id, course_name, course_id),
        levels (id, level_name, level_id),
        programme_subjects (
          id,
          subjects (*)
        )
      `)
      .order('programme_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return { data: null, error };
  }
};

// Get programmes by course and level
export const getProgrammesByCourseLevel = async (courseId, levelId) => {
  console.log('getProgrammesByCourseLevel called with courseId:', courseId, 'levelId:', levelId);
  try {
    const { data, error } = await supabase
      .from('programmes')
      .select(`
        *,
        programme_subjects (
          subjects (*)
        )
      `)
      .eq('course_id', courseId)
      .eq('level_id', levelId)
      .order('programme_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return { data: null, error };
  }
};

// Get programme by ID with subjects
export const getProgrammeById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('programmes')
      .select(`
        *,
        courses (*),
        levels (*),
        programme_subjects (
          id,
          subjects (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching programme:', error);
    return { data: null, error };
  }
};

// Create programme with subjects
export const createProgrammeWithSubjects = async (programmeData, subjectIds) => {
  try {
    // 1. Create programme
    const { data: programme, error: progError } = await supabase
      .from('programmes')
      .insert([programmeData])
      .select()
      .single();

    if (progError) throw progError;

    // 2. Link subjects to programme
    if (subjectIds && subjectIds.length > 0) {
      const programmeSubjects = subjectIds.map(subjectId => ({
        programme_id: programme.id,
        subject_id: subjectId
      }));

      const { error: linkError } = await supabase
        .from('programme_subjects')
        .insert(programmeSubjects);

      if (linkError) throw linkError;
    }

    return { data: programme, error: null };
  } catch (error) {
    console.error('Error creating programme:', error);
    return { data: null, error };
  }
};

// Update programme
export const updateProgramme = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('programmes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating programme:', error);
    return { data: null, error };
  }
};

// Update programme subjects
export const updateProgrammeSubjects = async (programmeId, newSubjectIds) => {
  try {
    // 1. Delete existing subject links
    const { error: deleteError } = await supabase
      .from('programme_subjects')
      .delete()
      .eq('programme_id', programmeId);

    if (deleteError) throw deleteError;

    // 2. Insert new subject links
    if (newSubjectIds && newSubjectIds.length > 0) {
      const programmeSubjects = newSubjectIds.map(subjectId => ({
        programme_id: programmeId,
        subject_id: subjectId
      }));

      const { error: insertError } = await supabase
        .from('programme_subjects')
        .insert(programmeSubjects);

      if (insertError) throw insertError;
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating programme subjects:', error);
    return { error };
  }
};

// Delete programme
export const deleteProgramme = async (id) => {
  try {
    const { error } = await supabase
      .from('programmes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting programme:', error);
    return { error };
  }
};

// Get subjects for a programme
export const getProgrammeSubjects = async (programmeId) => {
  try {
    const { data, error } = await supabase
      .from('programme_subjects')
      .select(`
        *,
        subjects (*)
      `)
      .eq('programme_id', programmeId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching programme subjects:', error);
    return { data: null, error };
  }
};
