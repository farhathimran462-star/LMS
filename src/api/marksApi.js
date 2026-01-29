import { supabase } from '../config/supabaseClient';
import * as XLSX from 'xlsx';

// ============= MARKS API =============

/**
 * Calculate grade and grade point based on percentage
 */
const calculateGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', gradePoint: 10 };
  if (percentage >= 80) return { grade: 'A', gradePoint: 9 };
  if (percentage >= 70) return { grade: 'B+', gradePoint: 8 };
  if (percentage >= 60) return { grade: 'B', gradePoint: 7 };
  if (percentage >= 50) return { grade: 'C+', gradePoint: 6 };
  if (percentage >= 40) return { grade: 'C', gradePoint: 5 };
  return { grade: 'F', gradePoint: 0 };
};

/**
 * Upload marks from Excel file
 * @param {File} file - Excel file
 * @param {Object} metadata - Exam metadata (class_id, exam_type, exam_name, etc.)
 * @returns {Object} { data, error, summary }
 */
export const uploadMarksFromExcel = async (file, metadata) => {
  try {
    console.log('📊 Starting marks upload from Excel...');
    console.log('Metadata:', metadata);

    // Read Excel file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log('📋 Excel data rows:', jsonData.length);

    if (!jsonData || jsonData.length === 0) {
      throw new Error('Excel file is empty or invalid format');
    }

    // Validate metadata
    const requiredMetadata = ['class_id', 'exam_name', 'exam_date', 'academic_year', 'uploaded_by'];
    for (const field of requiredMetadata) {
      if (!metadata[field]) {
        throw new Error(`Missing required metadata: ${field}`);
      }
    }

    // Get class details for hierarchy
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('institute_id, course_id, level_id, programme_id, batch_id')
      .eq('id', metadata.class_id)
      .single();

    if (classError) throw classError;

    // Prepare marks records
    const marksRecords = [];
    const summary = {
      total: jsonData.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // Excel row number (accounting for header)

      try {
        // Validate required fields
        const rollNumber = row['Roll Number'] || row['roll_number'];
        const subjectCode = row['Subject Code'] || row['subject_code'];
        let marksObtained = row['Marks Obtained'] || row['marks_obtained'];
        const maxMarks = row['Max Marks'] || row['max_marks'];
        const passingMarks = row['Passing Marks'] || row['passing_marks'] || 40;
        const remarks = row['Remarks'] || row['remarks'] || null;

        if (!rollNumber) {
          throw new Error(`Row ${rowNum}: Roll Number is required`);
        }
        if (!subjectCode) {
          throw new Error(`Row ${rowNum}: Subject Code is required`);
        }
        if (marksObtained === undefined || marksObtained === null || marksObtained === '') {
          throw new Error(`Row ${rowNum}: Marks Obtained is required`);
        }
        if (!maxMarks) {
          throw new Error(`Row ${rowNum}: Max Marks is required`);
        }

        // Check for absent
        const isAbsent = String(marksObtained).toUpperCase() === 'AB' || 
                        String(marksObtained).toUpperCase() === 'ABSENT';
        
        if (isAbsent) {
          marksObtained = 0;
        } else {
          marksObtained = parseFloat(marksObtained);
          if (isNaN(marksObtained)) {
            throw new Error(`Row ${rowNum}: Invalid marks value`);
          }
        }

        // Validate marks range
        if (marksObtained < 0 || marksObtained > maxMarks) {
          throw new Error(`Row ${rowNum}: Marks obtained (${marksObtained}) must be between 0 and ${maxMarks}`);
        }

        // Find student by roll number and class
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('roll_number', rollNumber)
          .eq('class_id', metadata.class_id)
          .single();

        if (studentError || !studentData) {
          throw new Error(`Row ${rowNum}: Student with roll number ${rollNumber} not found in selected class`);
        }

        // Find subject by code
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('id')
          .eq('subject_code', subjectCode)
          .single();

        if (subjectError || !subjectData) {
          throw new Error(`Row ${rowNum}: Subject with code ${subjectCode} not found`);
        }

        // Calculate percentage and grade
        const percentage = (marksObtained / maxMarks) * 100;
        const { grade, gradePoint } = calculateGrade(percentage);
        const isPassed = marksObtained >= passingMarks && !isAbsent;

        // Create marks record
        const marksRecord = {
          student_id: studentData.id,
          class_id: metadata.class_id,
          subject_id: subjectData.id,
          institution_id: classData.institute_id,
          course_id: classData.course_id,
          level_id: classData.level_id,
          programme_id: classData.programme_id,
          batch_id: classData.batch_id,
          exam_name: metadata.exam_name,
          exam_date: metadata.exam_date,
          academic_year: metadata.academic_year,
          marks_obtained: marksObtained,
          max_marks: maxMarks,
          percentage: percentage,
          grade: grade,
          grade_point: gradePoint,
          passing_marks: passingMarks,
          is_passed: isPassed,
          is_absent: isAbsent,
          status: 'Draft',
          remarks: remarks,
          uploaded_by: metadata.uploaded_by,
          uploaded_date: new Date().toISOString()
        };

        marksRecords.push(marksRecord);
        summary.success++;

      } catch (error) {
        summary.failed++;
        summary.errors.push(error.message);
        console.error(`Error processing row ${rowNum}:`, error.message);
      }
    }

    // Insert marks records
    if (marksRecords.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('marks')
        .upsert(marksRecords, { 
          onConflict: 'student_id,subject_id,exam_type,exam_name,academic_year,term',
          ignoreDuplicates: false 
        })
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Marks uploaded successfully:', insertedData.length);
      return { data: insertedData, error: null, summary };
    } else {
      throw new Error('No valid marks records to insert. Check error summary.');
    }

  } catch (error) {
    console.error('Error uploading marks:', error);
    return { data: null, error, summary: null };
  }
};

/**
 * Get all marks with optional filters
 * @param {Object} filters - Filter options
 * @returns {Object} { data, error }
 */
export const getAllMarks = async (filters = {}) => {
  try {
    let query = supabase
      .from('marks')
      .select(`
        *,
        students(id, roll_number, Users(full_name, email)),
        classes(id, class_name),
        subjects(id, subject_code, subject_name),
        institutions(id, institute_name)
      `)
      .order('exam_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    if (filters.subject_id) query = query.eq('subject_id', filters.subject_id);
    if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters.exam_type) query = query.eq('exam_type', filters.exam_type);
    if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
    if (filters.term) query = query.eq('term', filters.term);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.uploaded_by) query = query.eq('uploaded_by', filters.uploaded_by);

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching marks:', error);
    return { data: null, error };
  }
};

/**
 * Get marks by student ID
 * @param {string} studentId - Student ID
 * @param {Object} filters - Additional filters
 * @returns {Object} { data, error }
 */
export const getMarksByStudent = async (studentId, filters = {}) => {
  try {
    console.log('📊 getMarksByStudent called with:', { studentId, filters });
    
    let query = supabase
      .from('marks')
      .select(`
        *,
        subjects(id, subject_code, subject_name),
        classes(id, class_name)
      `)
      .eq('student_id', studentId)
      .order('exam_date', { ascending: false });

    if (filters.academic_year) query = query.eq('academic_year', filters.academic_year);
    if (filters.term) query = query.eq('term', filters.term);

    const { data, error } = await query;

    console.log('📊 getMarksByStudent result:', {
      dataCount: data?.length || 0,
      error: error,
      sample: data?.[0]
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching student marks:', error);
    return { data: null, error };
  }
};

/**
 * Update mark status (Draft -> Published)
 * @param {Array} ids - Array of mark IDs
 * @param {string} status - New status
 * @param {string} approvedBy - User ID of approver
 * @returns {Object} { data, error }
 */
export const updateMarkStatus = async (ids, status, approvedBy) => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'Published') {
      updateData.approved_by = approvedBy;
      updateData.approved_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('marks')
      .update(updateData)
      .in('id', ids)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating mark status:', error);
    return { data: null, error };
  }
};

/**
 * Delete marks (only draft)
 * @param {Array} ids - Array of mark IDs
 * @returns {Object} { error }
 */
export const deleteMarks = async (ids) => {
  try {
    const { error } = await supabase
      .from('marks')
      .delete()
      .in('id', ids)
      .eq('status', 'Draft');

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting marks:', error);
    return { error };
  }
};

/**
 * Download marks template Excel file
 * @returns {void}
 */
export const downloadMarksTemplate = () => {
  const template = [
    {
      'Roll Number': 'CS2024001',
      'Student Name': 'John Doe (Reference Only)',
      'Subject Code': 'CS101',
      'Subject Name': 'Data Structures (Reference Only)',
      'Marks Obtained': '85',
      'Max Marks': '100',
      'Passing Marks': '40',
      'Remarks': 'Good performance'
    },
    {
      'Roll Number': 'CS2024002',
      'Student Name': 'Jane Smith (Reference Only)',
      'Subject Code': 'CS101',
      'Subject Name': 'Data Structures (Reference Only)',
      'Marks Obtained': 'AB',
      'Max Marks': '100',
      'Passing Marks': '40',
      'Remarks': 'Absent'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Marks Data');

  // Add instructions sheet
  const instructions = [
    ['MARKS UPLOAD TEMPLATE - INSTRUCTIONS'],
    [''],
    ['1. Fill all required fields marked with * in column headers'],
    ['2. Roll Number must match existing student records in the selected class'],
    ['3. Subject Code must match existing subject codes'],
    ['4. Marks Obtained cannot exceed Max Marks'],
    ['5. For absent students, enter "AB" or "Absent" in Marks Obtained column'],
    ['6. Passing Marks should be consistent for all students in the same exam'],
    ['7. Student Name and Subject Name columns are for reference only'],
    [''],
    ['Save this file and upload through the Marks Upload interface.']
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  XLSX.writeFile(wb, 'marks_upload_template.xlsx');
};

/**
 * Export marks to Excel
 * @param {Array} marks - Marks data
 * @param {string} filename - Output filename
 * @returns {void}
 */
export const exportMarksToExcel = (marks, filename = 'marks_export.xlsx') => {
  const exportData = marks.map(mark => ({
    'Roll Number': mark.students?.roll_number || '-',
    'Student Name': mark.students?.Users?.full_name || '-',
    'Class': mark.classes?.class_name || '-',
    'Subject Code': mark.subjects?.subject_code || '-',
    'Subject Name': mark.subjects?.subject_name || '-',
    'Exam Type': mark.exam_type,
    'Exam Name': mark.exam_name,
    'Exam Date': mark.exam_date,
    'Marks Obtained': mark.marks_obtained,
    'Max Marks': mark.max_marks,
    'Percentage': mark.percentage?.toFixed(2),
    'Grade': mark.grade,
    'Grade Point': mark.grade_point,
    'Status': mark.is_passed ? 'Pass' : 'Fail',
    'Remarks': mark.remarks || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Marks');
  XLSX.writeFile(wb, filename);
};

export default {
  uploadMarksFromExcel,
  getAllMarks,
  getMarksByStudent,
  updateMarkStatus,
  deleteMarks,
  downloadMarksTemplate,
  exportMarksToExcel
};
