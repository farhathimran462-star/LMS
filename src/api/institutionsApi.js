import { supabase } from '../config/supabaseClient';

// ============= HELPER FUNCTIONS =============

// Check if user is Super Admin
const checkSuperAdminAccess = async (userId) => {
  if (!userId) {
    return { hasAccess: false, error: 'User ID is required' };
  }

  try {
    const { data, error } = await supabase
      .from('Users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    const hasAccess = data?.role === 'Super Admin';
    return { 
      hasAccess, 
      error: hasAccess ? null : 'Access denied. Super Admin role required.' 
    };
  } catch (error) {
    console.error('Error checking user role:', error);
    return { hasAccess: false, error: 'Failed to verify user permissions' };
  }
};

// Helper function to upload photo to Supabase Storage
const uploadInstitutionPhoto = async (file, instituteId) => {
  try {
    if (!file || !(file instanceof File)) {
      return { data: null, error: null }; // No file to upload
    }

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${instituteId}_${Date.now()}.${fileExt}`;
    const filePath = `institutions/${fileName}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('institution-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('institution-photos')
      .getPublicUrl(filePath);

    return { data: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { data: null, error };
  }
};

// Helper function to delete old photo from storage
const deleteInstitutionPhoto = async (photoUrl) => {
  try {
    if (!photoUrl) return { error: null };

    // Extract file path from URL
    const urlParts = photoUrl.split('/institution-photos/');
    if (urlParts.length < 2) return { error: null };
    
    const filePath = `institutions/${urlParts[1]}`;

    const { error } = await supabase.storage
      .from('institution-photos')
      .remove([filePath]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting photo:', error);
    return { error };
  }
};

// ============= INSTITUTIONS API =============

// Get all institutions with their courses from junction table
export const getAllInstitutions = async () => {
  try {
    // First get all institutions
    const { data: institutions, error } = await supabase
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get all course associations from junction table
    const { data: associations, error: assocError } = await supabase
      .from('institution_courses')
      .select('institution_id, course_id');

    if (assocError) throw assocError;

    // Get all admin associations with user names
    const { data: adminAssociations, error: adminError } = await supabase
      .from('admin_institutions')
      .select(`
        institute_id,
        admins!inner (
          user_id,
          Users!inner (
            full_name
          )
        )
      `);

    if (adminError) throw adminError;

    // Map course_ids and admin_names to each institution
    const institutionsWithData = institutions.map(inst => {
      // Get course IDs
      const courseIds = associations
        ?.filter(a => a.institution_id === inst.id)
        .map(a => a.course_id) || [];

      // Get admin names
      const adminNames = adminAssociations
        ?.filter(a => a.institute_id === inst.id)
        .map(a => a.admins?.Users?.full_name)
        .filter(name => name) || [];

      return {
        ...inst,
        course_ids: courseIds,
        admin_names: adminNames
      };
    });

    return { data: institutionsWithData, error: null };
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return { data: null, error };
  }
};

// Get single institution by ID
export const getInstitutionById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching institution:', error);
    return { data: null, error };
  }
};

// Get institution by institute_id (unique code)
export const getInstitutionByCode = async (instituteId) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('institute_id', instituteId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching institution:', error);
    return { data: null, error };
  }
};

// Create new institution with courses (Super Admin only)
export const createInstitution = async (institutionData, userId) => {
  try {
    // Check Super Admin access
    const accessCheck = await checkSuperAdminAccess(userId);
    if (!accessCheck.hasAccess) {
      return { data: null, error: { message: accessCheck.error } };
    }

    // Separate course_ids and photo from institution data
    const { course_ids, photo, ...instData } = institutionData;

    // Upload photo if provided
    let photoUrl = null;
    if (photo && photo instanceof File) {
      const { data: uploadedUrl, error: uploadError } = await uploadInstitutionPhoto(photo, instData.institute_id);
      if (uploadError) {
        console.error('Photo upload failed:', uploadError);
        // Continue without photo if upload fails
      } else {
        photoUrl = uploadedUrl;
      }
    }

    // Insert institution with photo URL
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .insert([{ ...instData, photo: photoUrl }])
      .select()
      .single();

    if (instError) throw instError;

    // Insert course associations into junction table if courses selected
    if (course_ids && course_ids.length > 0) {
      const junctionRecords = course_ids.map(courseId => ({
        institution_id: institution.id,
        course_id: courseId
      }));

      const { error: junctionError } = await supabase
        .from('institution_courses')
        .insert(junctionRecords);

      if (junctionError) throw junctionError;
    }

    return { data: { ...institution, course_ids }, error: null };
  } catch (error) {
    console.error('Error creating institution:', error);
    return { data: null, error };
  }
};

// Update institution with courses (Super Admin only)
export const updateInstitution = async (id, updates, userId) => {
  try {
    // Check Super Admin access
    const accessCheck = await checkSuperAdminAccess(userId);
    if (!accessCheck.hasAccess) {
      return { data: null, error: { message: accessCheck.error } };
    }

    // Separate course_ids and photo from institution data
    const { course_ids, photo, ...instData } = updates;

    // Get existing institution to check for old photo
    const { data: existingInst } = await supabase
      .from('institutions')
      .select('photo, id')
      .eq('institute_id', id)
      .single();

    // Upload new photo if provided
    let photoUrl = existingInst?.photo || null;
    if (photo && photo instanceof File) {
      // Delete old photo if exists
      if (existingInst?.photo) {
        await deleteInstitutionPhoto(existingInst.photo);
      }
      
      // Upload new photo
      const { data: uploadedUrl, error: uploadError } = await uploadInstitutionPhoto(photo, id);
      if (uploadError) {
        console.error('Photo upload failed:', uploadError);
        // Keep old photo if upload fails
      } else {
        photoUrl = uploadedUrl;
      }
    }

    // Update institution with photo URL
    const { data, error: instError } = await supabase
      .from('institutions')
      .update({ ...instData, photo: photoUrl })
      .eq('institute_id', id)
      .select()
      .single();

    if (instError) throw instError;

    // Delete existing course associations using institution.id
    const { error: deleteError } = await supabase
      .from('institution_courses')
      .delete()
      .eq('institution_id', data.id);

    if (deleteError) throw deleteError;

    // Insert new course associations using institution.id
    if (course_ids && course_ids.length > 0) {
      const junctionRecords = course_ids.map(courseId => ({
        institution_id: data.id,
        course_id: courseId
      }));

      const { error: junctionError } = await supabase
        .from('institution_courses')
        .insert(junctionRecords);

      if (junctionError) throw junctionError;
    }

    return { data: { ...data, course_ids }, error: null };
  } catch (error) {
    console.error('Error updating institution:', error);
    return { data: null, error };
  }
};

// Delete institution (Super Admin only)
export const deleteInstitution = async (id, userId) => {
  try {
    // Check Super Admin access
    const accessCheck = await checkSuperAdminAccess(userId);
    if (!accessCheck.hasAccess) {
      return { error: { message: accessCheck.error } };
    }

    const { error } = await supabase
      .from('institutions')
      .delete()
      .eq('institute_id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting institution:', error);
    return { error };
  }
};

// Search institutions by name or location
export const searchInstitutions = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .or(`institute_name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .order('institute_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching institutions:', error);
    return { data: null, error };
  }
};
