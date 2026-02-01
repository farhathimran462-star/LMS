import { supabase } from '../config/supabaseClient';

// ============= HELPER FUNCTIONS =============

// Convert UUID back to institute_id
const getInstituteIdFromUUID = async (uuid) => {
  if (!uuid) return { institute_id: null, error: null };

  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('institute_id')
      .eq('id', uuid)
      .single();

    if (error) throw error;
    return { institute_id: data.institute_id, error: null };
  } catch (error) {
    console.error('Error converting UUID to institute_id:', error);
    return { institute_id: null, error };
  }
};

// Convert institute_id to UUID (id) from institutions table
const getInstitutionUUIDs = async (instituteIds) => {
  if (!instituteIds || (Array.isArray(instituteIds) && instituteIds.length === 0)) {
    return { uuids: [], error: null };
  }

  try {
    // Handle single string or array
    const idsArray = Array.isArray(instituteIds) ? instituteIds : [instituteIds];
    
    const { data, error } = await supabase
      .from('institutions')
      .select('id, institute_id')
      .in('institute_id', idsArray);

    if (error) throw error;

    // Create a map of institute_id -> UUID
    const uuidMap = {};
    data.forEach(inst => {
      uuidMap[inst.institute_id] = inst.id;
    });

    // Convert provided institute_ids to UUIDs
    const uuids = idsArray.map(instId => {
      const uuid = uuidMap[instId];
      if (!uuid) {
        throw new Error(`Institute ID '${instId}' not found in institutions table`);
      }
      return uuid;
    });

    // Return single UUID if input was single string
    return { uuids: Array.isArray(instituteIds) ? uuids : uuids[0], error: null };
  } catch (error) {
    console.error('Error converting institute IDs to UUIDs:', error);
    return { uuids: null, error };
  }
};

// ============= USERS API (Base) =============

// Get all users
export const getAllUsers = async () => {
  try {
    // Fetch all users
    const { data: usersData, error: usersError } = await supabase
      .from('Users')
      .select('*, password')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Fetch all students data with institute information
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(`
        user_id,
        roll_number,
        institute_id,
        institutions!students_institute_id_fkey(institute_name)
      `);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    }

    // Fetch all teachers data
    const { data: teachersData, error: teachersError } = await supabase
      .from('teachers')
      .select('user_id, employee_id');

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
    }

    // Fetch all super_admins data
    const { data: superAdminsData, error: superAdminsError } = await supabase
      .from('super_admins')
      .select('user_id, employee_id');

    if (superAdminsError) {
      console.error('Error fetching super_admins:', superAdminsError);
    }

    // Fetch all admins data
    const { data: adminsData, error: adminsError } = await supabase
      .from('admins')
      .select('id, user_id, employee_id');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
    }

    // Fetch admin_institutions junction table with institute names
    const { data: adminInstitutionsData, error: adminInstError } = await supabase
      .from('admin_institutions')
      .select(`
        admin_id,
        institutions!admin_institutions_institute_id_fkey(institute_name)
      `);

    if (adminInstError) {
      console.error('Error fetching admin institutions:', adminInstError);
    }

    // Create a map of admin_id to managed institutes
    const adminInstitutesMap = (adminInstitutionsData || []).reduce((acc, item) => {
      if (!acc[item.admin_id]) {
        acc[item.admin_id] = [];
      }
      if (item.institutions?.institute_name) {
        acc[item.admin_id].push(item.institutions.institute_name);
      }
      return acc;
    }, {});

    // Create lookup maps
    const studentsMap = (studentsData || []).reduce((acc, student) => {
      acc[student.user_id] = {
        roll_number: student.roll_number,
        institute_name: student.institutions?.institute_name || 'N/A'
      };
      return acc;
    }, {});

    const teachersMap = (teachersData || []).reduce((acc, teacher) => {
      acc[teacher.user_id] = {
        employee_id: teacher.employee_id
      };
      return acc;
    }, {});

    const adminsMap = (adminsData || []).reduce((acc, admin) => {
      const managedInstitutes = adminInstitutesMap[admin.id] || [];
      acc[admin.user_id] = {
        employee_id: admin.employee_id,
        managed_institutes: managedInstitutes.length > 0 ? managedInstitutes.join(', ') : 'N/A'
      };
      return acc;
    }, {});

    const superAdminsMap = (superAdminsData || []).reduce((acc, superAdmin) => {
      acc[superAdmin.user_id] = {
        employee_id: superAdmin.employee_id
      };
      return acc;
    }, {});

    // Merge user data with role-specific data
    const mergedData = usersData.map(user => {
      const baseUser = { ...user };
      // Always include password if present
      if (user.role === 'Student' && studentsMap[user.user_id]) {
        return { ...baseUser, ...studentsMap[user.user_id], password: user.password };
      } else if (user.role === 'Teacher' && teachersMap[user.user_id]) {
        return { ...baseUser, ...teachersMap[user.user_id], password: user.password };
      } else if (user.role === 'Admin' && adminsMap[user.user_id]) {
        return { ...baseUser, ...adminsMap[user.user_id], password: user.password };
      } else if (user.role === 'Super Admin' && superAdminsMap[user.user_id]) {
        return { ...baseUser, ...superAdminsMap[user.user_id], password: user.password };
      }
      return { ...baseUser, password: user.password };
    });

    return { data: mergedData, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('role', role)
      .order('full_name', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return { data: null, error };
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }
};

// Create user (base)
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

// Update user
export const updateUser = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }
};

// Update user suspension status
export const updateUserSuspension = async (userId, suspensionData) => {
  try {
    const { suspension_reason, suspension_start, suspension_end } = suspensionData;
    
    // Check if current date is between start and end dates
    const now = new Date();
    const startDate = suspension_start ? new Date(suspension_start) : null;
    const endDate = suspension_end ? new Date(suspension_end) : null;
    
    let isActive = true;
    
    // If suspending with dates
    if (suspension_reason) {
      if (startDate && (!endDate || now <= endDate)) {
        // If start date exists and (no end date OR current date is before/equal to end date)
        if (now >= startDate) {
          isActive = false; // Suspend if current date is after/equal to start date
        }
      } else if (startDate && endDate && now > endDate) {
        // If both dates exist and current date is after end date, don't suspend
        isActive = true;
      } else if (!startDate && !endDate) {
        // No dates provided, suspend immediately
        isActive = false;
      }
    }
    
    const updates = {
      suspension_reason: suspension_reason || null,
      suspension_start: suspension_start || null,
      suspension_end: suspension_end || null,
      is_active: isActive
    };
    
    const { data, error } = await supabase
      .from('Users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user suspension:', error);
    return { data: null, error };
  }
};

// Reactivate user
export const reactivateUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .update({
        is_active: true,
        suspension_reason: null,
        suspension_start: null,
        suspension_end: null
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { data: null, error };
  }
};

// Delete user
export const deleteUser = async (id) => {
  try {
    const { error } = await supabase
      .from('Users')
      .delete()
      .eq('user_id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error };
  }
};

// Suspend user
export const suspendUser = async (id, reason, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .update({
        account_status: 'Suspended',
        suspension_reason: reason,
        suspension_start_date: startDate,
        suspension_end_date: endDate
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { data: null, error };
  }
};

// Activate user
export const activateUser = async (id) => {
  try {
    const { data, error } = await supabase
      .from('Users')
      .update({
        account_status: 'Active',
        suspension_reason: null,
        suspension_start_date: null,
        suspension_end_date: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error activating user:', error);
    return { data: null, error };
  }
};

// ============= STUDENTS API =============

// Get all students with full details
export const getAllStudents = async () => {
  try {
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');

    if (studentsError) throw studentsError;

    if (!students || students.length === 0) {
      return { data: [], error: null };
    }

    // Get user details for each student
    const userIds = students.map(s => s.user_id).filter(Boolean);
    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('*')
      .in('user_id', userIds);

    if (usersError) throw usersError;

    // Combine student and user data
    const combined = students.map(student => {
      const user = users?.find(u => u.user_id === student.user_id);
      return {
        id: student.id, // students.id for enrollment
        user_id: student.user_id,
        roll_number: student.roll_number,
        institute_id: student.institute_id,
        course_id: student.course_id,
        level_id: student.level_id,
        programme_id: student.programme_id,
        batch_id: student.batch_id,
        class_id: student.class_id,
        name: user?.full_name || user?.username,
        email: user?.email,
        role: user?.role,
        status: user?.status
      };
    });

    return { data: combined, error: null };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { data: null, error };
  }
};

// Get student by user_id
export const getStudentByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Convert UUID back to institute_id for display
    if (data && data.institute_id) {
      const { institute_id, error: conversionError } = await getInstituteIdFromUUID(data.institute_id);
      if (!conversionError && institute_id) {
        data.institute_id = institute_id;
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student by user_id:', error);
    return { data: null, error };
  }
};

// Get student by ID (using user_id from Users table)
export const getStudentById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        Users (*),
        institutions (*),
        courses (*),
        levels (*),
        programmes (*),
        batches (*),
        classes (*)
      `)
      .eq('user_id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student:', error);
    return { data: null, error };
  }
};

// Get students by class
export const getStudentsByClass = async (classId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        Users (full_name, email, phone, account_status)
      `)
      .eq('class_id', classId)
      .order('roll_number', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching students by class:', error);
    return { data: null, error };
  }
};

// Create student with user
export const createStudent = async (userData, studentData) => {
  let createdUserId = null;
  try {
    // 0. Convert institute_id to UUID if provided
    let finalStudentData = { ...studentData };
    if (studentData.institute_id) {
      const { uuids: instituteUUID, error: conversionError } = await getInstitutionUUIDs(studentData.institute_id);
      if (conversionError) {
        throw new Error(`Failed to resolve institute ID: ${conversionError.message}`);
      }
      finalStudentData.institute_id = instituteUUID;
    }

    // 1. Create user
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([{ ...userData, role: 'Student' }])
      .select()
      .single();

    if (userError) throw userError;

    createdUserId = user.user_id;
    console.log('Created user:', user);
    console.log('User ID:', user.user_id);

    // 2. Create student record with UUID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert([{ ...finalStudentData, user_id: user.user_id }])
      .select()
      .single();

    if (studentError) {
      console.error('Error creating student record:', studentError);
      // Rollback: Delete the user record we just created
      await supabase.from('Users').delete().eq('user_id', createdUserId);
      throw new Error(`Failed to create student record: ${studentError.message}. User creation rolled back.`);
    }

    console.log('Created student:', student);

    return { data: { user, student }, error: null };
  } catch (error) {
    console.error('Error creating student:', error);
    return { data: null, error };
  }
};

// Update student (with user data)
export const updateStudent = async (userId, userData, studentData) => {
  try {
    // 0. Convert institute_id to UUID if provided
    let finalStudentData = { ...studentData };
    if (studentData.institute_id) {
      const { uuids: instituteUUID, error: conversionError } = await getInstitutionUUIDs(studentData.institute_id);
      if (conversionError) {
        throw new Error(`Failed to resolve institute ID: ${conversionError.message}`);
      }
      finalStudentData.institute_id = instituteUUID;
    }

    // 1. Update user in Users table
    const { data: updatedUser, error: userError } = await supabase
      .from('Users')
      .update(userData)
      .eq('user_id', userId)
      .select()
      .single();

    if (userError) throw userError;

    // 2. Update student record with UUID (only roll_number and institute_id)
    const { data: updatedStudent, error: studentError } = await supabase
      .from('students')
      .update(finalStudentData)
      .eq('user_id', userId)
      .select()
      .single();

    if (studentError) throw studentError;

    return { data: { user: updatedUser, student: updatedStudent }, error: null };
  } catch (error) {
    console.error('Error updating student:', error);
    return { data: null, error };
  }
};

// ============= TEACHERS API =============

// Get all teachers with subjects
export const getAllTeachers = async () => {
  try {
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*');

    if (teachersError) throw teachersError;

    if (!teachers || teachers.length === 0) {
      return { data: [], error: null };
    }

    // Get user details for each teacher
    const userIds = teachers.map(t => t.user_id).filter(Boolean);
    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('*')
      .in('user_id', userIds);

    if (usersError) throw usersError;

    // Combine teacher and user data
    const combined = teachers.map(teacher => {
      const user = users?.find(u => u.user_id === teacher.user_id);
      return {
        id: teacher.id, // teachers.id for assignment
        user_id: teacher.user_id,
        employee_id: teacher.employee_id,
        name: user?.full_name || user?.username,
        email: user?.email,
        role: user?.role,
        status: user?.status
      };
    });

    return { data: combined, error: null };
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return { data: null, error };
  }
};

// Get teacher by user_id
export const getTeacherByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching teacher by user_id:', error);
    return { data: null, error };
  }
};

// Get teacher by ID
export const getTeacherById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        *,
        users (*),
        teacher_subjects (
          subjects (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return { data: null, error };
  }
};

// Create teacher with subjects
export const createTeacher = async (userData, teacherData, subjectIds = []) => {
  let createdUserId = null;
  try {
    // 1. Create user
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([{ ...userData, role: 'Teacher' }])
      .select()
      .single();

    if (userError) throw userError;

    createdUserId = user.user_id;
    console.log('Created user:', user);
    console.log('User ID:', user.user_id);

    // 2. Create teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert([{ ...teacherData, user_id: user.user_id }])
      .select()
      .single();

    if (teacherError) {
      console.error('Error creating teacher record:', teacherError);
      // Rollback: Delete the user record we just created
      await supabase.from('Users').delete().eq('user_id', createdUserId);
      
      // Check if it's a duplicate employee_id error
      if (teacherError.code === '23505' && teacherError.message?.includes('employee_id')) {
        throw new Error('Employee ID already exists. Please use a unique Employee ID.');
      }
      throw new Error(`Failed to create teacher record: ${teacherError.message}. User creation rolled back.`);
    }

    console.log('Created teacher:', teacher);

    // 3. Link subjects
    if (subjectIds.length > 0) {
      const teacherSubjects = subjectIds.map(subjectId => ({
        teacher_id: teacher.id,
        subject_id: subjectId
      }));

      const { error: subjectError } = await supabase
        .from('teacher_subjects')
        .insert(teacherSubjects);

      if (subjectError) {
        // Rollback teacher and user
        await supabase.from('teachers').delete().eq('id', teacher.id);
        await supabase.from('Users').delete().eq('user_id', createdUserId);
        throw new Error(`Failed to link subjects: ${subjectError.message}. Creation rolled back.`);
      }
    }

    return { data: { user, teacher }, error: null };
  } catch (error) {
    console.error('Error creating teacher:', error);
    return { data: null, error };
  }
};

// Update teacher (with user data)
export const updateTeacher = async (userId, userData, teacherData) => {
  try {
    // 1. Update user in Users table
    const { data: updatedUser, error: userError } = await supabase
      .from('Users')
      .update(userData)
      .eq('user_id', userId)
      .select()
      .single();

    if (userError) throw userError;

    // 2. Update teacher record
    const { data: updatedTeacher, error: teacherError } = await supabase
      .from('teachers')
      .update(teacherData)
      .eq('user_id', userId)
      .select()
      .single();

    if (teacherError) throw teacherError;

    return { data: { user: updatedUser, teacher: updatedTeacher }, error: null };
  } catch (error) {
    console.error('Error updating teacher:', error);
    return { data: null, error };
  }
};

// Update teacher subjects
export const updateTeacherSubjects = async (teacherId, newSubjectIds) => {
  try {
    // Delete existing
    const { error: deleteError } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', teacherId);

    if (deleteError) throw deleteError;

    // Insert new
    if (newSubjectIds.length > 0) {
      const teacherSubjects = newSubjectIds.map(subjectId => ({
        teacher_id: teacherId,
        subject_id: subjectId
      }));

      const { error: insertError } = await supabase
        .from('teacher_subjects')
        .insert(teacherSubjects);

      if (insertError) throw insertError;
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating teacher subjects:', error);
    return { error };
  }
};

// ============= ADMINS API =============

// Get admin by user_id
export const getAdminByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        admin_institutions (
          institute_id
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Convert UUIDs back to institute_ids for display
    if (data && data.admin_institutions && data.admin_institutions.length > 0) {
      const uuids = data.admin_institutions.map(ai => ai.institute_id);
      
      // Fetch all institute_ids in one query
      const { data: institutions, error: instError } = await supabase
        .from('institutions')
        .select('id, institute_id')
        .in('id', uuids);

      if (!instError && institutions) {
        const uuidToInstIdMap = {};
        institutions.forEach(inst => {
          uuidToInstIdMap[inst.id] = inst.institute_id;
        });

        // Replace UUIDs with institute_ids
        data.admin_institutions = data.admin_institutions.map(ai => ({
          ...ai,
          institute_id: uuidToInstIdMap[ai.institute_id] || ai.institute_id
        }));
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching admin by user_id:', error);
    return { data: null, error };
  }
};

// Get all admins
export const getAllAdmins = async () => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        Users!admins_user_id_fkey (*),
        admin_institutions (
          *,
          institutions (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching admins:', error);
    return { data: null, error };
  }
};

// Create admin with institutions
export const createAdmin = async (userData, adminData, instituteIds = []) => {
  let createdUserId = null;
  try {
    // 0. Convert institute_ids to UUIDs
    const { uuids: instituteUUIDs, error: conversionError } = await getInstitutionUUIDs(instituteIds);
    if (conversionError) {
      throw new Error(`Failed to resolve institute IDs: ${conversionError.message}`);
    }

    // 1. Create user
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([{ ...userData, role: 'Admin' }])
      .select()
      .single();

    if (userError) throw userError;

    createdUserId = user.user_id;
    console.log('Created user:', user);
    console.log('User ID:', user.user_id);

    // 2. Create admin record
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert([{ ...adminData, user_id: user.user_id }])
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin record:', adminError);
      // Rollback: Delete the user record we just created
      await supabase.from('Users').delete().eq('user_id', createdUserId);
      
      // Check if it's a duplicate employee_id error
      if (adminError.code === '23505' && adminError.message?.includes('employee_id')) {
        throw new Error('Employee ID already exists. Please use a unique Employee ID.');
      }
      throw new Error(`Failed to create admin record: ${adminError.message}. User creation rolled back.`);
    }

    console.log('Created admin:', admin);

    // 3. Link institutions using UUIDs
    if (instituteUUIDs.length > 0) {
      const adminInstitutions = instituteUUIDs.map(uuid => ({
        admin_id: admin.id,
        institute_id: uuid  // Use UUID here
      }));

      const { error: instituteError } = await supabase
        .from('admin_institutions')
        .insert(adminInstitutions);

      if (instituteError) {
        // Rollback admin and user
        await supabase.from('admins').delete().eq('id', admin.id);
        await supabase.from('Users').delete().eq('user_id', createdUserId);
        throw new Error(`Failed to link institutions: ${instituteError.message}. Creation rolled back.`);
      }
    }

    return { data: { user, admin }, error: null };
  } catch (error) {
    console.error('Error creating admin:', error);
    return { data: null, error };
  }
};

// Update admin (with user data and institutions)
export const updateAdmin = async (userId, userData, adminData, instituteIds = []) => {
  try {
    // 0. Convert institute_ids to UUIDs
    const { uuids: instituteUUIDs, error: conversionError } = await getInstitutionUUIDs(instituteIds);
    if (conversionError) {
      throw new Error(`Failed to resolve institute IDs: ${conversionError.message}`);
    }

    // 1. Update user in Users table
    const { data: updatedUser, error: userError } = await supabase
      .from('Users')
      .update(userData)
      .eq('user_id', userId)
      .select()
      .single();

    if (userError) throw userError;

    // 2. Update admin record
    const { data: updatedAdmin, error: adminError } = await supabase
      .from('admins')
      .update(adminData)
      .eq('user_id', userId)
      .select()
      .single();

    if (adminError) throw adminError;

    // 3. Update institutions managed using UUIDs (delete old and insert new)
    if (instituteIds && instituteIds.length >= 0) {
      // Delete existing mappings
      const { error: deleteError } = await supabase
        .from('admin_institutions')
        .delete()
        .eq('admin_id', updatedAdmin.id);

      if (deleteError) throw deleteError;

      // Insert new mappings with UUIDs
      if (instituteUUIDs.length > 0) {
        const adminInstitutions = instituteUUIDs.map(uuid => ({
          admin_id: updatedAdmin.id,
          institute_id: uuid  // Use UUID here
        }));

        const { error: insertError } = await supabase
          .from('admin_institutions')
          .insert(adminInstitutions);

        if (insertError) throw insertError;
      }
    }

    return { data: { user: updatedUser, admin: updatedAdmin }, error: null };
  } catch (error) {
    console.error('Error updating admin:', error);
    return { data: null, error };
  }
};

// ============= SUPER ADMINS API =============

// Get all super admins
export const getAllSuperAdmins = async () => {
  try {
    const { data, error } = await supabase
      .from('super_admins')
      .select(`
        *,
        users (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching super admins:', error);
    return { data: null, error };
  }
};

// Get super admin by user_id
export const getSuperAdminByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching super admin by user_id:', error);
    return { data: null, error };
  }
};

// Create super admin
export const createSuperAdmin = async (userData, superAdminData) => {
  let createdUserId = null;
  try {
    // 1. Create user
    const { data: user, error: userError } = await supabase
      .from('Users')
      .insert([{ ...userData, role: 'Super Admin' }])
      .select()
      .single();

    if (userError) throw userError;

    createdUserId = user.user_id;
    console.log('Created user:', user);
    console.log('User ID:', user.user_id);

    // 2. Create super admin record with employee_id
    const { data: superAdmin, error: saError } = await supabase
      .from('super_admins')
      .insert([{ 
        user_id: user.user_id,
        employee_id: superAdminData.employee_id || null
      }])
      .select()
      .single();

    if (saError) {
      console.error('Error creating super admin record:', saError);
      // Rollback: Delete the user record we just created
      await supabase.from('Users').delete().eq('user_id', createdUserId);
      
      // Check if it's a duplicate employee_id error
      if (saError.code === '23505' && saError.message?.includes('employee_id')) {
        throw new Error('Employee ID already exists. Please use a unique Employee ID.');
      }
      throw new Error(`Failed to create super admin record: ${saError.message}. User creation rolled back.`);
    }

    console.log('Created super admin:', superAdmin);

    return { data: { user, superAdmin }, error: null };
  } catch (error) {
    console.error('Error creating super admin:', error);
    return { data: null, error };
  }
};

// Update super admin (with user data)
export const updateSuperAdmin = async (userId, userData, superAdminData) => {
  try {
    // 1. Update user in Users table
    const { data: updatedUser, error: userError } = await supabase
      .from('Users')
      .update(userData)
      .eq('user_id', userId)
      .select()
      .single();

    if (userError) throw userError;

    // 2. Update super admin record (employee_id)
    if (superAdminData && superAdminData.employee_id !== undefined) {
      const { data: updatedSuperAdmin, error: saError } = await supabase
        .from('super_admins')
        .update({ employee_id: superAdminData.employee_id })
        .eq('user_id', userId)
        .select()
        .single();

      if (saError) throw saError;

      return { data: { user: updatedUser, superAdmin: updatedSuperAdmin }, error: null };
    }

    return { data: { user: updatedUser }, error: null };
  } catch (error) {
    console.error('Error updating super admin:', error);
    return { data: null, error };
  }
};
