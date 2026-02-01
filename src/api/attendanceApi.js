import { supabase } from '../config/supabaseClient';
import * as XLSX from 'xlsx';

// ============= ATTENDANCE SUMMARY API =============

/**
 * Upload attendance from Excel file with incremental updates
 * Excel Format: Roll Number | Date1 | Date2 | Date3...
 * Values: P (Present), A (Absent), H (Half Day), null/empty (Not counted)
 * 
 * @param {File} file - Excel file
 * @param {Object} metadata - { class_id, batch_id, institute_id, course_id, level_id, marked_by }
 * @returns {Object} { data, error, summary }
 */
export const uploadAttendanceFromExcel = async (file, metadata) => {
  try {
    console.log('📊 Starting attendance upload from Excel...');
    console.log('Metadata:', metadata);

    // Read Excel file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get all data including headers
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const headers = [];
    
    // Extract headers (dates) from first row
    for (let C = range.s.c; C <= range.e.c; C++) {
      const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      const cell = worksheet[address];
      headers.push(cell ? cell.v : null);
    }
    
    console.log('📋 Excel headers:', headers);
    
    // Parse data rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: headers, range: 1 });
    
    console.log('📋 Excel data rows:', jsonData.length);

    if (!jsonData || jsonData.length === 0) {
      throw new Error('Excel file is empty or invalid format');
    }

    // Validate metadata
    const requiredMetadata = ['class_id', 'batch_id', 'institute_id', 'course_id', 'level_id', 'marked_by'];
    for (const field of requiredMetadata) {
      if (!metadata[field]) {
        throw new Error(`Missing required metadata: ${field}`);
      }
    }

    const attendanceUpdates = [];
    const errors = [];
    let successCount = 0;

    // Process each student row
    for (let rowNum = 0; rowNum < jsonData.length; rowNum++) {
      try {
        const row = jsonData[rowNum];
        const rollNumber = row[headers[0]]; // First column is roll number
        
        if (!rollNumber) {
          errors.push({ row: rowNum + 2, error: 'Missing roll number' });
          continue;
        }

        // Find student by roll number
        const { data: students, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('roll_number', String(rollNumber).trim())
          .single();

        if (studentError || !students) {
          errors.push({ row: rowNum + 2, rollNumber, error: 'Student not found' });
          continue;
        }

        const studentId = students.id;

        // Count attendance from date columns (skip first column which is roll number)
        let totalDays = 0;
        let presentDays = 0;
        let absentDays = 0;
        let halfDays = 0;

        for (let i = 1; i < headers.length; i++) {
          const dateColumn = headers[i];
          const status = row[dateColumn];
          
          // Only count if status is P, A, or H (exclude null/empty)
          if (status) {
            const statusUpper = String(status).trim().toUpperCase();
            
            if (statusUpper === 'P') {
              totalDays++;
              presentDays++;
            } else if (statusUpper === 'A') {
              totalDays++;
              absentDays++;
            } else if (statusUpper === 'H') {
              totalDays++;
              halfDays++;
            }
          }
        }

        // Get existing attendance summary if exists
        const { data: existing, error: fetchError } = await supabase
          .from('attendance_summary')
          .select('*')
          .eq('student_id', studentId)
          .eq('class_id', metadata.class_id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // Prepare upsert data with INCREMENTAL updates
        const upsertData = {
          student_id: studentId,
          class_id: metadata.class_id,
          batch_id: metadata.batch_id,
          institute_id: metadata.institute_id,
          course_id: metadata.course_id,
          level_id: metadata.level_id,
          // ADD to existing values (or set if new)
          total_days: (existing?.total_days || 0) + totalDays,
          present_days: (existing?.present_days || 0) + presentDays,
          absent_days: (existing?.absent_days || 0) + absentDays,
          half_days: (existing?.half_days || 0) + halfDays,
          updated_by: metadata.marked_by
        };

        attendanceUpdates.push(upsertData);
        successCount++;

      } catch (err) {
        errors.push({ row: rowNum + 2, error: err.message });
      }
    }

    // Bulk upsert attendance summaries
    if (attendanceUpdates.length > 0) {
      const { error: upsertError } = await supabase
        .from('attendance_summary')
        .upsert(attendanceUpdates, {
          onConflict: 'student_id,class_id'
        });

      if (upsertError) {
        throw new Error(`Failed to update attendance: ${upsertError.message}`);
      }
    }

    const summary = {
      total: jsonData.length,
      success: successCount,
      failed: errors.length,
      errors: errors
    };

    console.log('✅ Attendance upload complete:', summary);

    return { data: attendanceUpdates, error: null, summary };
  } catch (error) {
    console.error('❌ Error uploading attendance:', error);
    return { data: null, error, summary: null };
  }
};

/**
 * Get all attendance summaries with filters
 * @param {Object} filters - Optional filters
 * @returns {Object} { data, error }
 */
export const getAllAttendance = async (filters = {}) => {
  try {
    let query = supabase
      .from('attendance_summary')
      .select(`
        *,
        students(id, roll_number, Users(username, full_name)),
        classes(id, class_name),
        batches(id, batch_name),
        institutions(id, institute_name),
        courses(id, course_name),
        levels(id, level_name),
        programmes(id, programme_name)
      `)
      .order('students(roll_number)', { ascending: true });

    if (filters.institution_id) query = query.eq('institute_id', filters.institution_id);
    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    if (filters.student_id) query = query.eq('student_id', filters.student_id);
    if (filters.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.level_id) query = query.eq('level_id', filters.level_id);

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return { data: null, error };
  }
};

/**
 * Get attendance summary by student
 * @param {string} studentId - Student ID
 * @returns {Object} { data, error }
 */
export const getAttendanceByStudent = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('attendance_summary')
      .select(`
        *,
        classes(id, class_name),
        batches(id, batch_name)
      `)
      .eq('student_id', studentId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return { data: null, error };
  }
};

/**
 * Delete attendance summary
 * @param {string} id - Attendance summary ID
 * @returns {Object} { data, error }
 */
export const deleteAttendanceSummary = async (id) => {
  try {
    const { data, error } = await supabase
      .from('attendance_summary')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return { data: null, error };
  }
};

/**
 * Reset attendance summary for a student in a class
 * @param {string} studentId - Student ID
 * @param {string} classId - Class ID
 * @returns {Object} { data, error }
 */
export const resetAttendanceSummary = async (studentId, classId) => {
  try {
    const { data, error } = await supabase
      .from('attendance_summary')
      .update({
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        half_days: 0,
        attendance_percentage: 0
      })
      .eq('student_id', studentId)
      .eq('class_id', classId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error resetting attendance:', error);
    return { data: null, error };
  }
};

/**
 * Get attendance summary for a student (alias for getAttendanceByStudent)
 * For backwards compatibility with StudentAttendance.jsx
 * 
 * @param {string} studentId - Student ID
 * @returns {Object} { data, error }
 */
export const getAttendanceSummary = async (studentId) => {
  return getAttendanceByStudent(studentId);
};

/**
 * Get subject-wise attendance summary (stub for new summary model)
 * Returns overall summary since new model doesn't track by subject
 * 
 * @param {string} studentId - Student ID
 * @returns {Object} { data: [], error }
 */
export const getSubjectWiseAttendanceSummary = async (studentId) => {
  try {
    // Since new model doesn't track by subject, return overall summary as single item
    const result = await getAttendanceByStudent(studentId);
    
    if (result.error) throw result.error;
    
    // Transform to array format expected by StudentAttendance component
    const summaryData = result.data ? [{
      subject_name: 'Overall',
      total_days: result.data.total_days || 0,
      present_days: result.data.present_days || 0,
      absent_days: result.data.absent_days || 0,
      half_days: result.data.half_days || 0,
      attendance_percentage: result.data.attendance_percentage || 0
    }] : [];
    
    return { data: summaryData, error: null };
  } catch (error) {
    console.error('Error getting subject-wise attendance:', error);
    return { data: [], error };
  }
};
