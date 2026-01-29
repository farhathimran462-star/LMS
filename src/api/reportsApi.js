// reportsApi.js - Analytics and Reports API Functions
import { supabase } from '../config/supabaseClient';

/**
 * Get hierarchical report data for Super Admin/Admin
 * Fetches institutions → courses → levels → batches with aggregated metrics
 * @param {Object} filters - Optional filters
 * @returns {Object} { data, error }
 */
export const getAdminReportData = async (filters = {}) => {
  try {
    // Build query - fetch marks data directly without complex joins
    let query = supabase
      .from('marks')
      .select('*');

    if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.level_id) query = query.eq('level_id', filters.level_id);
    if (filters.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);

    const { data: marksData, error: marksError } = await query;
    
    console.log('🔍 Marks Query Result:', { marksData, marksError });
    
    if (marksError) throw marksError;

    // Fetch attendance data from attendance_summary
    let attendanceQuery = supabase
      .from('attendance_summary')
      .select('*');

    if (filters.institution_id) attendanceQuery = attendanceQuery.eq('institute_id', filters.institution_id);
    if (filters.course_id) attendanceQuery = attendanceQuery.eq('course_id', filters.course_id);
    if (filters.level_id) attendanceQuery = attendanceQuery.eq('level_id', filters.level_id);
    if (filters.batch_id) attendanceQuery = attendanceQuery.eq('batch_id', filters.batch_id);

    const { data: attendanceData, error: attendanceError } = await attendanceQuery;
    
    console.log('🔍 Attendance Query Result:', { attendanceData, attendanceError });
    
    if (attendanceError) throw attendanceError;

    return { data: { marks: marksData, attendance: attendanceData }, error: null };
  } catch (error) {
    console.error('Error fetching admin report data:', error);
    return { data: null, error };
  }
};

/**
 * Get report data for a specific teacher
 * @param {string} userId - Teacher's user ID
 * @param {Object} filters - Optional filters
 * @returns {Object} { data, error }
 */
export const getTeacherReportData = async (userId, filters = {}) => {
  try {
    // First get teacher ID
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (teacherError) throw teacherError;

    // Get classes assigned to this teacher
    const { data: classAssignments, error: classError } = await supabase
      .from('class_teachers')
      .select('class_id, classes(*)')
      .eq('teacher_id', teacherData.id)
      .eq('is_active', true);

    if (classError) throw classError;

    const classIds = classAssignments.map(ca => ca.class_id);
    if (classIds.length === 0) {
      return { data: { marks: [], attendance: [] }, error: null };
    }

    // Fetch marks for teacher's classes
    let marksQuery = supabase
      .from('marks')
      .select(`
        *,
        students(id, roll_number, Users(username), class_id),
        classes(id, class_name, batch_id, institute_id, course_id, level_id),
        subjects(id, subject_code, subject_name),
        batches(id, batch_name),
        courses(id, course_name, course_id),
        levels(id, level_name),
        institutions(id, institute_id)
      `)
      .in('class_id', classIds)
      .eq('status', 'Published');

    if (filters.class_id) marksQuery = marksQuery.eq('class_id', filters.class_id);
    if (filters.academic_year) marksQuery = marksQuery.eq('academic_year', filters.academic_year);

    const { data: marksData, error: marksError } = await marksQuery;
    if (marksError) throw marksError;

    // Fetch attendance for teacher's classes
    let attendanceQuery = supabase
      .from('attendance_summary')
      .select(`
        *,
        students(id, roll_number, Users(username), class_id),
        classes(id, class_name, batch_id, institute_id),
        subjects(id, subject_code, subject_name)
      `)
      .in('class_id', classIds);

    if (filters.class_id) attendanceQuery = attendanceQuery.eq('class_id', filters.class_id);

    const { data: attendanceData, error: attendanceError } = await attendanceQuery;
    if (attendanceError) throw attendanceError;

    return { data: { marks: marksData, attendance: attendanceData, classes: classAssignments }, error: null };
  } catch (error) {
    console.error('Error fetching teacher report data:', error);
    return { data: null, error };
  }
};

/**
 * Process and aggregate report data for charts
 * @param {Array} marksData - Raw marks data
 * @param {Array} attendanceData - Raw attendance data
 * @param {string} groupBy - Grouping level: 'institution', 'course', 'batch', 'subject', 'student'
 * @param {Object} referenceData - Reference data for lookups { institutions, courses, levels, batches, subjects, students }
 * @returns {Object} Aggregated data structure
 */
export const processReportData = (marksData = [], attendanceData = [], groupBy = 'institution', referenceData = {}) => {
  const { institutions = [], courses = [], levels = [], batches = [], classes = [], subjects = [], students = [] } = referenceData;
  const grouped = {};

  console.log('🔍 processReportData - marks count:', marksData.length);
  console.log('🔍 processReportData - groupBy:', groupBy);

  // Process marks data
  marksData.forEach(mark => {
    let key;
    let name;

    switch (groupBy) {
      case 'institution':
        key = mark.institution_id;
        const inst = institutions.find(i => i.id === key);
        name = inst?.institute_name || 'Unknown';
        break;
      case 'course':
        key = mark.course_id;
        const course = courses.find(c => c.id === key);
        name = course?.course_name || 'Unknown';
        break;
      case 'level':
        key = mark.level_id;
        const level = levels.find(l => l.id === key);
        name = level?.level_name || 'Unknown';
        break;
      case 'batch':
        key = mark.batch_id;
        const batch = batches.find(b => b.id === key);
        name = batch?.batch_name || 'Unknown';
        break;
      case 'class':
        key = mark.class_id;
        const cls = classes.find(c => c.id === key);
        name = cls?.class_name || 'Unknown';
        break;
      case 'subject':
        key = mark.subject_id;
        const subject = subjects.find(s => s.id === key);
        name = subject?.subject_name || 'Unknown';
        break;
      case 'student':
        key = mark.student_id;
        const student = students.find(s => s.id === key);
        name = student?.name || student?.username || 'Unknown';
        break;
      default:
        key = 'all';
        name = 'All Data';
    }

    if (!key) return;

    if (!grouped[key]) {
      grouped[key] = {
        id: key,
        name: name,
        totalMarks: 0,
        marksCount: 0,
        totalMaxMarks: 0,
        passedCount: 0,
        failedCount: 0,
        absentCount: 0,
        students: new Set(),
        subjects: new Set(),
        batches: new Set(),
        attendanceRecords: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalHalfDays: 0,
      };
    }

    // Aggregate marks - use percentage field directly
    grouped[key].totalMarks += mark.marks_obtained || 0;
    grouped[key].totalMaxMarks += mark.max_marks || 0;
    grouped[key].marksCount++;
    
    // Determine pass/fail based on marks obtained (>= 40 marks is pass)
    const marksObtained = mark.marks_obtained || 0;
    console.log('🔍 Mark data:', { marksObtained, max_marks: mark.max_marks, percentage: mark.percentage });
    
    if (marksObtained >= 40) {
      grouped[key].passedCount++;
      console.log('✅ PASSED:', marksObtained);
    } else {
      grouped[key].failedCount++;
      console.log('❌ FAILED:', marksObtained);
    }

    grouped[key].students.add(mark.student_id);
    grouped[key].subjects.add(mark.subject_id);
    grouped[key].batches.add(mark.batch_id);
  });

  console.log('🔍 After processing marks, grouped keys:', Object.keys(grouped));
  console.log('🔍 Grouped data structure:', grouped);

  // Process attendance_summary data
  console.log('🔍 Processing attendance_summary data, count:', attendanceData.length);
  attendanceData.forEach(record => {
    let key;
    let name;

    switch (groupBy) {
      case 'institution':
        key = record.institute_id;
        const inst = institutions.find(i => i.id === key);
        name = inst?.institute_name || 'Unknown';
        break;
      case 'course':
        key = record.course_id;
        const course = courses.find(c => c.id === key);
        name = course?.course_name || 'Unknown';
        break;
      case 'level':
        key = record.level_id;
        const level = levels.find(l => l.id === key);
        name = level?.level_name || 'Unknown';
        break;
      case 'batch':
        key = record.batch_id;
        const batch = batches.find(b => b.id === key);
        name = batch?.batch_name || 'Unknown';
        break;
      case 'class':
        key = record.class_id;
        const cls = classes.find(c => c.id === key);
        name = cls?.class_name || 'Unknown';
        break;
      case 'subject':
        key = record.subject_id;
        const subject = subjects.find(s => s.id === key);
        name = subject?.subject_name || 'Unknown';
        break;
      case 'student':
        key = record.student_id;
        const student = students.find(s => s.id === key);
        name = student?.name || student?.username || 'Unknown';
        break;
      default:
        key = 'all';
        name = 'All Data';
    }

    console.log('🔍 Attendance record:', { 
      key, 
      groupBy, 
      institute_id: record.institute_id,
      total_days: record.total_days, 
      present_days: record.present_days,
      grouped_key_exists: !!grouped[key]
    });

    if (!key) return;

    // Initialize grouped entry if it doesn't exist (for attendance-only data)
    if (!grouped[key]) {
      console.log('✨ Creating new grouped entry for attendance data:', key);
      grouped[key] = {
        id: key,
        name: name,
        totalMarks: 0,
        marksCount: 0,
        totalMaxMarks: 0,
        passedCount: 0,
        failedCount: 0,
        absentCount: 0,
        students: new Set(),
        subjects: new Set(),
        batches: new Set(),
        attendanceRecords: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalHalfDays: 0,
      };
    }

    // attendance_summary has: total_days, present_days, absent_days, half_days, attendance_percentage
    grouped[key].attendanceRecords += record.total_days || 0;
    grouped[key].totalPresent += record.present_days || 0;
    grouped[key].totalAbsent += record.absent_days || 0;
    grouped[key].totalHalfDays += record.half_days || 0;
    
    // Track students, subjects, batches from attendance too
    if (record.student_id) grouped[key].students.add(record.student_id);
    if (record.subject_id) grouped[key].subjects.add(record.subject_id);
    if (record.batch_id) grouped[key].batches.add(record.batch_id);
    
    console.log('✅ Updated grouped[' + key + '] attendance:', {
      attendanceRecords: grouped[key].attendanceRecords,
      totalPresent: grouped[key].totalPresent
    });
  });

  // Calculate final metrics
  const result = Object.values(grouped).map(item => ({
    id: item.id,
    name: item.name,
    avgMarks: item.marksCount > 0 ? Math.round(item.totalMarks / item.marksCount) : 0,
    maxMarks: item.marksCount > 0 ? Math.round(item.totalMaxMarks / item.marksCount) : 0,
    percentage: item.totalMaxMarks > 0 ? Math.round((item.totalMarks / item.totalMaxMarks) * 100) : 0,
    passRate: (item.passedCount + item.failedCount) > 0 
      ? Math.round((item.passedCount / (item.passedCount + item.failedCount)) * 100) 
      : 0,
    passedCount: item.passedCount,
    failedCount: item.failedCount,
    absentCount: item.absentCount,
    attendanceRate: item.attendanceRecords > 0 
      ? Math.round((item.totalPresent / item.attendanceRecords) * 100) 
      : 0,
    totalStudents: item.students.size,
    totalSubjects: item.subjects.size,
    totalBatches: item.batches.size,
  }));

  console.log('🔍 processReportData - result:', result);

  console.log('🔍 processReportData - result:', result);

  return result;
};

/**
 * Get student-specific report data
 * @param {string} studentId - Student ID
 * @returns {Object} { data, error }
 */
export const getStudentReportData = async (studentId) => {
  try {
    // Fetch marks
    const { data: marksData, error: marksError } = await supabase
      .from('marks')
      .select(`
        *,
        subjects(id, subject_code, subject_name),
        classes(class_name)
      `)
      .eq('student_id', studentId)
      .eq('status', 'Published')
      .order('exam_date', { ascending: false });

    if (marksError) throw marksError;

    // Fetch attendance
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance_summary')
      .select(`
        *,
        subjects(id, subject_code, subject_name)
      `)
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false });

    if (attendanceError) throw attendanceError;

    return { data: { marks: marksData, attendance: attendanceData }, error: null };
  } catch (error) {
    console.error('Error fetching student report data:', error);
    return { data: null, error };
  }
};

/**
 * Get summary statistics
 * @param {Object} filters - Filter parameters
 * @returns {Object} { data, error }
 */
export const getReportSummary = async (filters = {}) => {
  try {
    let marksQuery = supabase
      .from('marks')
      .select('id, is_passed, is_absent, marks_obtained, max_marks', { count: 'exact' })
      .eq('status', 'Published');

    let attendanceQuery = supabase
      .from('attendance_summary')
      .select('id, status', { count: 'exact' });

    // Apply filters
    if (filters.institution_id) {
      marksQuery = marksQuery.eq('institution_id', filters.institution_id);
      attendanceQuery = attendanceQuery.eq('institute_id', filters.institution_id);
    }
    if (filters.class_id) {
      marksQuery = marksQuery.eq('class_id', filters.class_id);
      attendanceQuery = attendanceQuery.eq('class_id', filters.class_id);
    }
    if (filters.batch_id) {
      marksQuery = marksQuery.eq('batch_id', filters.batch_id);
      attendanceQuery = attendanceQuery.eq('batch_id', filters.batch_id);
    }

    const [marksResult, attendanceResult] = await Promise.all([
      marksQuery,
      attendanceQuery
    ]);

    if (marksResult.error) throw marksResult.error;
    if (attendanceResult.error) throw attendanceResult.error;

    // Calculate summary
    const totalMarksRecords = marksResult.data?.length || 0;
    const passedCount = marksResult.data?.filter(m => m.is_passed && !m.is_absent).length || 0;
    const failedCount = marksResult.data?.filter(m => !m.is_passed && !m.is_absent).length || 0;
    const totalMarks = marksResult.data?.reduce((sum, m) => sum + (m.marks_obtained || 0), 0) || 0;
    const totalMaxMarks = marksResult.data?.reduce((sum, m) => sum + (m.max_marks || 0), 0) || 0;

    const totalAttendanceRecords = attendanceResult.data?.length || 0;
    const presentCount = attendanceResult.data?.filter(a => a.status === 'Present' || a.status === 'Late').length || 0;

    return {
      data: {
        totalMarksRecords,
        passedCount,
        failedCount,
        passRate: (passedCount + failedCount) > 0 ? Math.round((passedCount / (passedCount + failedCount)) * 100) : 0,
        avgMarks: totalMarksRecords > 0 ? Math.round(totalMarks / totalMarksRecords) : 0,
        avgPercentage: totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0,
        totalAttendanceRecords,
        presentCount,
        attendanceRate: totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching report summary:', error);
    return { data: null, error };
  }
};
