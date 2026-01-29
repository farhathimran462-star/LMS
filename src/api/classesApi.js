import { supabase } from '../config/supabaseClient';

// =====================================================
// CLASS CRUD OPERATIONS
// =====================================================

/**
 * Get all classes
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getAllClasses = async () => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching all classes:', error);
        return { data: null, error };
    }
};

/**
 * Get classes by batch ID
 * @param {string} batchId - UUID of the batch
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getClassesByBatch = async (batchId) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('batch_id', batchId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching classes by batch:', error);
        return { data: null, error };
    }
};

/**
 * Get a single class by ID
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const getClassById = async (classId) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('id', classId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching class by ID:', error);
        return { data: null, error };
    }
};

/**
 * Create a new class
 * @param {Object} classData - Class data {class_name, description, institute_id, course_id, level_id, programme_id, batch_id}
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const createClass = async (classData) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .insert([{
                class_name: classData.class_name,
                description: classData.description || null,
                institute_id: classData.institute_id,
                course_id: classData.course_id,
                level_id: classData.level_id,
                programme_id: classData.programme_id,
                batch_id: classData.batch_id,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating class:', error);
        return { data: null, error };
    }
};

/**
 * Update an existing class
 * @param {string} classId - UUID of the class
 * @param {Object} updates - Fields to update {class_name, description, is_active}
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const updateClass = async (classId, updates) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', classId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating class:', error);
        return { data: null, error };
    }
};

/**
 * Delete a class (soft delete by setting is_active to false)
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const deleteClass = async (classId) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .update({ is_active: false })
            .eq('id', classId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error deleting class:', error);
        return { data: null, error };
    }
};

/**
 * Permanently delete a class (hard delete)
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const permanentlyDeleteClass = async (classId) => {
    try {
        const { data, error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error permanently deleting class:', error);
        return { data: null, error };
    }
};

// =====================================================
// CLASS-STUDENT RELATIONSHIP OPERATIONS
// =====================================================

/**
 * Get all students in a class
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getStudentsByClass = async (classId) => {
    try {
        // Query students table directly where class_id matches
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', classId);

        if (studentsError) throw studentsError;
        if (!students || students.length === 0) {
            return { data: [], error: null };
        }

        // Get user details for each student
        const userIds = students.map(s => s.user_id).filter(Boolean);
        if (userIds.length === 0) {
            return { data: students.map(s => ({ ...s, user: null })), error: null };
        }

        const { data: users, error: usersError } = await supabase
            .from('Users')
            .select('*')
            .in('user_id', userIds);

        if (usersError) throw usersError;

        // Combine student data with user data
        const transformedData = students.map(student => {
            const user = users?.find(u => u.user_id === student.user_id);
            return {
                ...student,
                student: user || null
            };
        });

        return { data: transformedData, error: null };
    } catch (error) {
        console.error('Error fetching students by class:', error);
        return { data: null, error };
    }
};

/**
 * Get all classes for a student
 * @param {string} studentId - UUID of the student
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getClassesByStudent = async (studentId) => {
    try {
        const { data, error } = await supabase
            .from('class_students')
            .select(`
                *,
                class:classes(*)
            `)
            .eq('student_id', studentId)
            .eq('is_active', true);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching classes by student:', error);
        return { data: null, error };
    }
};

/**
 * Enroll a student in a class
 * @param {string} classId - UUID of the class
 * @param {string} studentId - UUID of the student
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const enrollStudent = async (classId, studentId) => {
    try {
        const { data, error } = await supabase
            .from('class_students')
            .insert([{
                class_id: classId,
                student_id: studentId,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error enrolling student:', error);
        return { data: null, error };
    }
};

/**
 * Enroll multiple students in a class
 * @param {string} classId - UUID of the class
 * @param {Array<string>} studentIds - Array of student IDs from students table
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const enrollMultipleStudents = async (classId, studentIds) => {
    try {
        // Update students table to set class_id for each student
        const { data, error } = await supabase
            .from('students')
            .update({ class_id: classId })
            .in('id', studentIds)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error enrolling multiple students:', error);
        return { data: null, error };
    }
};

/**
 * Remove a student from a class (soft delete)
 * @param {string} classId - UUID of the class
 * @param {string} studentId - UUID of the student
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const unenrollStudent = async (classId, studentId) => {
    try {
        const { data, error } = await supabase
            .from('class_students')
            .update({ is_active: false })
            .eq('class_id', classId)
            .eq('student_id', studentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error unenrolling student:', error);
        return { data: null, error };
    }
};

/**
 * Permanently remove a student from a class (hard delete)
 * @param {string} classId - UUID of the class
 * @param {string} studentId - UUID of the student
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const permanentlyUnenrollStudent = async (classId, studentId) => {
    try {
        const { data, error } = await supabase
            .from('class_students')
            .delete()
            .eq('class_id', classId)
            .eq('student_id', studentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error permanently unenrolling student:', error);
        return { data: null, error };
    }
};

// =====================================================
// CLASS-TEACHER RELATIONSHIP OPERATIONS
// =====================================================

/**
 * Get all teachers for a class
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getTeachersByClass = async (classId) => {
    try {
        // First get the assignment records from class_teachers (references teachers.id)
        const { data: assignments, error: assignError } = await supabase
            .from('class_teachers')
            .select('*')
            .eq('class_id', classId)
            .eq('is_active', true);

        if (assignError) throw assignError;
        if (!assignments || assignments.length === 0) {
            return { data: [], error: null };
        }

        // Get teacher records from teachers table
        const teacherIds = assignments.map(a => a.teacher_id);
        const { data: teachers, error: teachersError } = await supabase
            .from('teachers')
            .select('*')
            .in('id', teacherIds);

        if (teachersError) throw teachersError;

        // Get user details for each teacher
        const userIds = teachers?.map(t => t.user_id).filter(Boolean) || [];
        let users = [];
        if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
                .from('Users')
                .select('*')
                .in('user_id', userIds);
            if (usersError) throw usersError;
            users = usersData || [];
        }

        // Combine assignment data with teacher and user data
        const transformedData = assignments.map(assignment => {
            const teacher = teachers?.find(t => t.id === assignment.teacher_id);
            const user = teacher ? users?.find(u => u.user_id === teacher.user_id) : null;
            return {
                ...assignment,
                teacher: user || null,
                teacher_id: teacher?.id,
                employee_id: teacher?.employee_id
            };
        });

        return { data: transformedData, error: null };
    } catch (error) {
        console.error('Error fetching teachers by class:', error);
        return { data: null, error };
    }
};

/**
 * Get all classes for a teacher
 * @param {string} teacherId - UUID of the teacher (user_id)
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getClassesByTeacher = async (teacherId) => {
    try {
        // First get teacher record by user_id
        const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', teacherId);

        if (teacherError) {
            console.error('Error querying teacher:', teacherError);
            return { data: [], error: null };
        }

        if (!teacherData || teacherData.length === 0) {
            console.log('No teacher found for user_id:', teacherId);
            return { data: [], error: null };
        }

        const teacher = teacherData[0];

        // Then get classes assigned to this teacher
        const { data, error } = await supabase
            .from('class_teachers')
            .select(`
                classes (*)
            `)
            .eq('teacher_id', teacher.id)
            .eq('is_active', true);

        if (error) throw error;
        
        // Extract classes from nested structure
        const classes = data?.map(item => item.classes).filter(Boolean) || [];
        return { data: classes, error: null };
    } catch (error) {
        console.error('Error fetching classes by teacher:', error);
        return { data: null, error };
    }
};

/**
 * Assign a teacher to a class
 * @param {string} classId - UUID of the class
 * @param {string} teacherId - UUID of the teacher
 * @param {string} role - Role of the teacher (default: 'primary')
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const assignTeacher = async (classId, teacherId, role = 'primary') => {
    try {
        const { data, error } = await supabase
            .from('class_teachers')
            .insert([{
                class_id: classId,
                teacher_id: teacherId,
                role: role,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error assigning teacher:', error);
        return { data: null, error };
    }
};

/**
 * Assign multiple teachers to a class
 * @param {string} classId - UUID of the class
 * @param {Array<{teacherId: string, role: string}>} teachers - Array of teacher assignments (teacherId is teachers.id)
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const assignMultipleTeachers = async (classId, teachers) => {
    try {
        const assignments = teachers.map(teacher => ({
            class_id: classId,
            teacher_id: teacher.teacherId || teacher.teacher_id, // This should be teachers.id, not user_id
            role: teacher.role || 'primary',
            is_active: true
        }));

        const { data, error } = await supabase
            .from('class_teachers')
            .insert(assignments)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error assigning multiple teachers:', error);
        return { data: null, error };
    }
};

/**
 * Remove a teacher from a class (soft delete)
 * @param {string} classId - UUID of the class
 * @param {string} teacherId - UUID of the teacher
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const unassignTeacher = async (classId, teacherId) => {
    try {
        const { data, error } = await supabase
            .from('class_teachers')
            .update({ is_active: false })
            .eq('class_id', classId)
            .eq('teacher_id', teacherId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error unassigning teacher:', error);
        return { data: null, error };
    }
};

/**
 * Update teacher role in a class
 * @param {string} classId - UUID of the class
 * @param {string} teacherId - UUID of the teacher
 * @param {string} newRole - New role for the teacher
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const updateTeacherRole = async (classId, teacherId, newRole) => {
    try {
        const { data, error } = await supabase
            .from('class_teachers')
            .update({ role: newRole })
            .eq('class_id', classId)
            .eq('teacher_id', teacherId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating teacher role:', error);
        return { data: null, error };
    }
};

// =====================================================
// SUBJECTS FOR CLASS (VIA PROGRAMME)
// =====================================================

/**
 * Get all subjects for a class through the programme relationship
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getSubjectsByClass = async (classId) => {
    try {
        // First get the class and its batch
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('batch_id')
            .eq('id', classId)
            .single();

        if (classError) throw classError;

        // Then get the batch and its programme
        const { data: batchData, error: batchError } = await supabase
            .from('batches')
            .select('programme_id')
            .eq('id', classData.batch_id)
            .single();

        if (batchError) throw batchError;

        // Finally get the subjects through programme_subjects
        const { data, error } = await supabase
            .from('programme_subjects')
            .select(`
                *,
                subject:subjects(*)
            `)
            .eq('programme_id', batchData.programme_id)
            .eq('is_active', true);

        if (error) throw error;
        return { data: data.map(ps => ps.subject), error: null };
    } catch (error) {
        console.error('Error fetching subjects by class:', error);
        return { data: null, error };
    }
};

// =====================================================
// COMPLETE CLASS DATA WITH RELATIONSHIPS
// =====================================================

/**
 * Get complete class data including students, teachers, and subjects
 * @param {string} classId - UUID of the class
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const getCompleteClassData = async (classId) => {
    try {
        // Get class details
        const { data: classData, error: classError } = await getClassById(classId);
        if (classError) throw classError;

        // Get students
        const { data: students, error: studentsError } = await getStudentsByClass(classId);
        if (studentsError) throw studentsError;

        // Get teachers
        const { data: teachers, error: teachersError } = await getTeachersByClass(classId);
        if (teachersError) throw teachersError;

        // Get subjects
        const { data: subjects, error: subjectsError } = await getSubjectsByClass(classId);
        if (subjectsError) throw subjectsError;

        const completeData = {
            ...classData,
            students: students || [],
            teachers: teachers || [],
            subjects: subjects || [],
            totalStudents: students?.length || 0,
            totalTeachers: teachers?.length || 0,
            totalSubjects: subjects?.length || 0
        };

        return { data: completeData, error: null };
    } catch (error) {
        console.error('Error fetching complete class data:', error);
        return { data: null, error };
    }
};

/**
 * Get complete data for all classes in a batch
 * @param {string} batchId - UUID of the batch
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getCompleteClassesDataByBatch = async (batchId) => {
    try {
        const { data: classes, error: classesError } = await getClassesByBatch(batchId);
        if (classesError) throw classesError;
        
        if (!classes || classes.length === 0) {
            return { data: [], error: null };
        }

        const completeClassesData = await Promise.all(
            classes.map(async (classItem) => {
                const { data: completeData, error } = await getCompleteClassData(classItem.id);
                if (error) {
                    console.error(`Error fetching data for class ${classItem.id}:`, error);
                    return null;
                }
                return completeData;
            })
        );

        // Filter out null values from failed fetches
        const validData = completeClassesData.filter(data => data !== null);
        return { data: validData, error: null };
    } catch (error) {
        console.error('Error fetching complete classes data by batch:', error);
        return { data: [], error };
    }
};

/**
 * Create a class with students and teachers in a single transaction
 * @param {Object} classData - Class data {class_name, description, batch_id, student_ids, teacher_assignments}
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const createClassWithRelationships = async (classData) => {
    try {
        console.log('Creating class with data:', classData);
        
        // Create the class first
        const { data: newClass, error: classError } = await createClass({
            class_name: classData.class_name,
            description: classData.description,
            institute_id: classData.institute_id,
            course_id: classData.course_id,
            level_id: classData.level_id,
            programme_id: classData.programme_id,
            batch_id: classData.batch_id
        });

        if (classError) {
            console.error('Error creating class:', classError);
            throw classError;
        }
        console.log('Class created successfully:', newClass);

        // Enroll students if provided
        if (classData.student_ids && classData.student_ids.length > 0) {
            console.log('Enrolling students:', classData.student_ids);
            const { data: enrolledStudents, error: studentsError } = await enrollMultipleStudents(
                newClass.id,
                classData.student_ids
            );
            if (studentsError) {
                console.error('Error enrolling students:', studentsError);
                throw studentsError;
            }
            console.log('Students enrolled successfully:', enrolledStudents);
        } else {
            console.log('No students to enroll');
        }

        // Assign teachers if provided
        if (classData.teacher_assignments && classData.teacher_assignments.length > 0) {
            console.log('Assigning teachers:', classData.teacher_assignments);
            const { data: assignedTeachers, error: teachersError } = await assignMultipleTeachers(
                newClass.id,
                classData.teacher_assignments
            );
            if (teachersError) {
                console.error('Error assigning teachers:', teachersError);
                throw teachersError;
            }
            console.log('Teachers assigned successfully:', assignedTeachers);
        } else {
            console.log('No teachers to assign');
        }

        // Return complete class data
        console.log('Fetching complete class data for:', newClass.id);
        const completeData = await getCompleteClassData(newClass.id);
        console.log('Complete class data:', completeData);
        return completeData;
    } catch (error) {
        console.error('Error creating class with relationships:', error);
        return { data: null, error };
    }
};
