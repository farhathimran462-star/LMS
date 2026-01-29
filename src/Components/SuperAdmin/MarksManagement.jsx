import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DynamicTable from "../Reusable/DynamicTable";
import "../../Styles/SuperAdmin/AttendanceManagement.css"; 
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

// API Imports
import { getAllMarks } from '../../api/marksApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllClasses } from '../../api/classesApi';
import { getSubjectsByLevel } from '../../api/subjectsApi';
import { getClassesByTeacher } from '../../api/classesApi';
import { getCoursesByInstitution } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getAllBatches } from '../../api/batchesApi';
import { supabase } from '../../config/supabaseClient';

// Fixed columns for marks table
const FIXED_COLUMNS = ['rollno', 'name', 'course', 'batch', 'exam_name', 'marks_obtained', 'max_marks', 'passing_mark', 'percentage', 'grade'];

const MarksManagement = ({ userRole }) => {
    // User info from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;
    
    // Role detection
    const isSuperAdmin = userRole?.toLowerCase().trim() == 'super admin';
    const isAdmin = userRole?.toLowerCase().trim() == 'admin';
    const isTeacher = userRole?.toLowerCase().trim() == 'teacher';

    // State
    const [marks, setMarks] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportCardData, setReportCardData] = useState(null);
    const [loadingReportCard, setLoadingReportCard] = useState(false);
    const [isReportExportOpen, setIsReportExportOpen] = useState(false);
    const reportExportMenuRef = useRef(null);
    
    // --- UNIFIED FILTER STATE ---
    const [activeFilters, setActiveFilters] = useState({
        subject: '',
        unit: '',
        institution: '',
        class: '',
        course: '',
        level: '',
        batch: '',
        student: ''
    });

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            if (isSuperAdmin || isAdmin) {
                const [insData, marksData] = await Promise.all([
                    getAllInstitutions(),
                    getAllMarks({})
                ]);
                
                if (insData.error) throw new Error(insData.error.message);
                if (marksData.error) throw new Error(marksData.error.message);
                
                console.log('Fetched institutions:', insData.data);
                setInstitutions(insData.data || []);
                setMarks(marksData.data || []);
            } else if (isTeacher) {
                const [insData, clsData, marksData] = await Promise.all([
                    getAllInstitutions(),
                    getClassesByTeacher(currentUserId),
                    getAllMarks({})
                ]);
                
                if (insData.error) throw new Error(insData.error.message);
                if (clsData.error) throw new Error(clsData.error.message);
                if (marksData.error) throw new Error(marksData.error.message);
                
                console.log('Fetched institutions (teacher):', insData.data);
                setInstitutions(insData.data || []);
                setTeacherClasses(clsData.data || []);
                setMarks(marksData.data || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch courses when institution is selected
    useEffect(() => {
        if (activeFilters.institution && institutions.length > 0) {
            const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
            if (selectedInst) {
                fetchCourses(selectedInst.id);
            }
        } else {
            setCourses([]);
        }
    }, [activeFilters.institution, institutions]);

    const fetchCourses = async (institutionId) => {
        try {
            const { data, error } = await getCoursesByInstitution(institutionId);
            if (error) throw error;
            setCourses(data || []);
        } catch (err) {
            console.error('Error fetching courses:', err.message);
            setCourses([]);
        }
    };

    // Fetch levels when course is selected
    useEffect(() => {
        if (activeFilters.course && courses.length > 0) {
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            if (selectedCourse) {
                fetchLevels(selectedCourse.id);
            }
        } else {
            setLevels([]);
        }
    }, [activeFilters.course, courses]);

    const fetchLevels = async (courseId) => {
        try {
            const { data, error } = await getLevelsByCourse(courseId);
            if (error) throw error;
            setLevels(data || []);
        } catch (err) {
            console.error('Error fetching levels:', err.message);
            setLevels([]);
        }
    };

    // Fetch subjects when level is selected
    useEffect(() => {
        if (activeFilters.level && levels.length > 0) {
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            if (selectedLevel) {
                fetchSubjects(selectedLevel.id);
            }
        } else {
            setSubjects([]);
        }
    }, [activeFilters.level, levels]);

    const fetchSubjects = async (levelId) => {
        try {
            const { data, error } = await getSubjectsByLevel(levelId);
            if (error) throw error;
            setSubjects(data || []);
        } catch (err) {
            console.error('Error fetching subjects:', err.message);
            setSubjects([]);
        }
    };

    // Fetch batches when level is selected
    useEffect(() => {
        if (activeFilters.level) {
            fetchBatches();
        } else {
            setBatches([]);
        }
    }, [activeFilters.level]);

    const fetchBatches = async () => {
        try {
            const { data, error } = await getAllBatches();
            if (error) throw error;
            
            // Filter batches by selected institution, course, and level
            const selectedInst = institutions.find(i => i.institution_name === activeFilters.institution);
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            
            const filtered = (data || []).filter(b => 
                (!selectedInst || b.institute_id === selectedInst.id) &&
                (!selectedCourse || b.course_id === selectedCourse.id) &&
                (!selectedLevel || b.level_id === selectedLevel.id)
            );
            
            setBatches(filtered);
        } catch (err) {
            console.error('Error fetching batches:', err.message);
            setBatches([]);
        }
    };

    // Fetch classes when batch is selected
    useEffect(() => {
        if (activeFilters.batch) {
            fetchClasses();
        } else {
            setClasses([]);
        }
    }, [activeFilters.batch]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await getAllClasses();
            if (error) throw error;
            
            // Filter classes by selected batch
            const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
            
            const filtered = (data || []).filter(c => 
                !selectedBatch || c.batch_id === selectedBatch.id
            );
            
            setClasses(filtered);
        } catch (err) {
            console.error('Error fetching classes:', err.message);
            setClasses([]);
        }
    };

    // Fetch students when class is selected
    useEffect(() => {
        if (activeFilters.class) {
            fetchStudents();
        } else {
            setStudents([]);
        }
    }, [activeFilters.class]);

    const fetchStudents = async () => {
        try {
            const selectedClass = classes.find(c => c.class_name === activeFilters.class);
            if (!selectedClass) return;

            const { data, error } = await supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    user_id,
                    Users!inner(full_name, username)
                `)
                .eq('class_id', selectedClass.id);
            
            if (error) throw error;
            setStudents(data || []);
        } catch (err) {
            console.error('Error fetching students:', err.message);
            setStudents([]);
        }
    };

    // --- COLUMN ORDER LOGIC ---
    const MARKS_COLUMN_ORDER = useMemo(() => {
        return FIXED_COLUMNS;
    }, []);

    // --- FILTER CHANGE HANDLER ---
    const handleFilterChange = useCallback((column, value) => {
        if (column === 'subject' && value === '') {
            const firstSubject = subjects[0]?.subject_name || '';
            setActiveFilters(prev => ({ ...prev, [column]: firstSubject }));
            return;
        }
        
        // Reset dependent filters when parent filter changes
        setActiveFilters(prev => {
            const newFilters = { ...prev, [column]: value };
            
            if (column === 'institution') {
                newFilters.course = '';
                newFilters.level = '';
                newFilters.subject = '';
                newFilters.batch = '';
                newFilters.class = '';
                newFilters.student = '';
            } else if (column === 'course') {
                newFilters.level = '';
                newFilters.subject = '';
                newFilters.batch = '';
                newFilters.class = '';
                newFilters.student = '';
            } else if (column === 'level') {
                newFilters.subject = '';
                newFilters.batch = '';
                newFilters.class = '';
                newFilters.student = '';
            } else if (column === 'batch') {
                newFilters.class = '';
                newFilters.student = '';
            } else if (column === 'class') {
                newFilters.student = '';
            }
            
            return newFilters;
        });
    }, [subjects]);
    
    const handleSearchChange = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    // Handle data import from Excel
    const handleDataImport = async (importedData) => {
        console.log('Imported data:', importedData);
        
        if (!importedData || importedData.length === 0) {
            alert('No data found in the uploaded file');
            return;
        }

        // Validate required filters are selected
        if (!activeFilters.institution || !activeFilters.course || !activeFilters.level || 
            !activeFilters.batch || !activeFilters.class || !activeFilters.subject) {
            alert('Please select all filters (Institution, Course, Level, Batch, Class, Subject) before importing');
            return;
        }

        // Get IDs from selected filters
        const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
        const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
        const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
        const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
        const selectedClass = classes.find(cls => cls.class_name === activeFilters.class);
        const selectedSubject = subjects.find(s => s.subject_name === activeFilters.subject);

        if (!selectedInst || !selectedCourse || !selectedLevel || !selectedBatch || !selectedClass || !selectedSubject) {
            alert('Could not find matching IDs for selected filters');
            return;
        }

        try {
            setLoading(true);
            
            // Process each row
            let successCount = 0;
            let errorCount = 0;
            const errors = [];
            const marksToInsert = [];

            for (const row of importedData) {
                try {
                    const rollNumber = row.rollnumber || row.rollNumber || row.roll_number;
                    const examName = row.exam_name || row.examName || row['exam name'];
                    const marksObtained = parseFloat(row.marks_obtained);
                    const maxMarks = parseFloat(row.max_marks);
                    const passingMark = parseFloat(row.passing_mark);
                    
                    if (!rollNumber) {
                        errors.push(`Row ${importedData.indexOf(row) + 1}: Missing roll number`);
                        errorCount++;
                        continue;
                    }

                    if (isNaN(marksObtained) || isNaN(maxMarks) || isNaN(passingMark)) {
                        errors.push(`Row ${importedData.indexOf(row) + 1}: Invalid marks data`);
                        errorCount++;
                        continue;
                    }

                    // Lookup student by roll number and class
                    const { data: studentData, error: studentError } = await supabase
                        .from('students')
                        .select('id')
                        .eq('roll_number', rollNumber)
                        .eq('class_id', selectedClass.id)
                        .single();

                    if (studentError || !studentData) {
                        errors.push(`Row ${importedData.indexOf(row) + 1}: Student with roll number ${rollNumber} not found in selected class`);
                        errorCount++;
                        continue;
                    }

                    // Calculate percentage as decimal (0-1)
                    const percentageValue = (marksObtained / maxMarks) * 100;
                    const percentage = marksObtained / maxMarks; // Store as decimal (0-1)
                    
                    let grade = 'F';
                    let gradePoint = 0;
                    
                    if (percentageValue >= 90) { grade = 'A+'; gradePoint = 1.0; }
                    else if (percentageValue >= 80) { grade = 'A'; gradePoint = 0.9; }
                    else if (percentageValue >= 70) { grade = 'B+'; gradePoint = 0.8; }
                    else if (percentageValue >= 60) { grade = 'B'; gradePoint = 0.7; }
                    else if (percentageValue >= 50) { grade = 'C+'; gradePoint = 0.6; }
                    else if (percentageValue >= 40) { grade = 'C'; gradePoint = 0.5; }

                    const isPassed = marksObtained >= passingMark;

                    const markData = {
                        student_id: studentData.id,
                        class_id: selectedClass.id,
                        subject_id: selectedSubject.id,
                        institution_id: selectedInst.id,
                        course_id: selectedCourse.id,
                        level_id: selectedLevel.id,
                        batch_id: selectedBatch.id,
                        exam_type: 'Regular',
                        exam_name: examName || 'Exam',
                        exam_date: new Date().toISOString().split('T')[0],
                        marks_obtained: marksObtained,
                        max_marks: maxMarks,
                        percentage: percentage,
                        grade: grade,
                        grade_point: gradePoint,
                        passing_marks: passingMark,
                        is_passed: isPassed,
                        is_absent: false
                    };
                    
                    marksToInsert.push(markData);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`Row ${importedData.indexOf(row) + 1}: ${error.message}`);
                }
            }

            // Insert all marks at once
            if (marksToInsert.length > 0) {
                const { data: insertedData, error: insertError } = await supabase
                    .from('marks')
                    .insert(marksToInsert)
                    .select();

                if (insertError) {
                    console.error('Database insert error:', insertError);
                    alert('Error inserting marks into database: ' + insertError.message);
                    setLoading(false);
                    return;
                }

                console.log('Successfully inserted marks:', insertedData);
                
                // Refresh marks data
                await fetchInitialData();
            }

            if (errors.length > 0) {
                console.error('Import errors:', errors);
                alert(`Import completed with some issues.\nSuccessfully processed: ${successCount} student(s)\nInserted marks: ${marksToInsert.length}\nErrors: ${errorCount}\n\nCheck console for details.`);
            } else {
                alert(`Successfully imported marks for ${successCount} student(s)!\nTotal marks inserted: ${marksToInsert.length}`);
            }
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Excel format download
    const handleDownloadExcelFormat = () => {
        // Create a template with rollnumber, exam_name, marks_obtained, max_marks, passing_mark
        const templateData = [
            {
                rollnumber: '1001',
                exam_name: 'Mid Term',
                marks_obtained: '85',
                max_marks: '100',
                passing_mark: '40'
            },
            {
                rollnumber: '1002',
                exam_name: 'Mid Term',
                marks_obtained: '78',
                max_marks: '100',
                passing_mark: '40'
            }
        ];
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(templateData);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        
        // Generate file and download
        XLSX.writeFile(wb, 'marks_upload_template.xlsx');
    };

    // --- IMPORT VISIBILITY LOGIC ---
    const showImport = useMemo(() => {
        const mandatoryFilters = ['institution', 'class', 'course', 'level', 'batch'];
        const allMandatorySelected = mandatoryFilters.every(key => activeFilters[key] !== '');
        return allMandatorySelected;
    }, [activeFilters]);

    // --- FILTER DEFINITIONS ---
    const marksFilterDefinitions = useMemo(() => {
        console.log('Creating filter definitions...');
        console.log('Institutions:', institutions);
        console.log('Institutions length:', institutions.length);
        
        const defs = {};

        // 1. INSTITUTION - Show all institutions
        defs.institution = [
            { value: '', label: 'All Institute' },
            ...institutions.map(inst => {
                console.log('Mapping institution:', inst);
                return { 
                    value: inst.institute_name, 
                    label: inst.institute_name 
                };
            })
        ];

        console.log('Institution filter options:', defs.institution);

        // 2. COURSE - Show courses for selected institution
        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({ 
                value: course.course_name, 
                label: course.course_name 
            }))
        ];

        // 3. LEVEL - Show levels for selected course
        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({ 
                value: level.level_name, 
                label: level.level_name 
            }))
        ];

        // 4. SUBJECT - Show subjects for selected level
        defs.subject = [
            { value: '', label: 'All Subjects' },
            ...subjects.map(s => ({ value: s.subject_name, label: `${s.subject_code} - ${s.subject_name}` }))
        ];

        // 5. BATCH - Show batches for selected level
        // 5. BATCH - Show batches for selected level
        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({ 
                value: batch.batch_name, 
                label: batch.batch_name 
            }))
        ];

        // 6. CLASS - Show classes for selected batch
        defs.class = [
            { value: '', label: 'All Class' },
            ...classes.map(cls => ({ 
                value: cls.class_name, 
                label: cls.class_name 
            }))
        ];

        // 7. STUDENT - Show students for selected class
        defs.student = [
            { value: '', label: 'All Students' },
            ...students.map(student => ({
                value: student.id,
                label: `${student.roll_number} - ${student.Users?.full_name || student.Users?.username}`
            }))
        ];
        
        return defs;
    }, [subjects, institutions, courses, levels, batches, classes, students]);
    
    // --- DATA TRANSFORMATION ---
    const getFilteredAndMarksData = useMemo(() => {
        // Transform marks to student-centric format
        const marksRecords = [];
        
        marks.forEach(mark => {
            const studentName = mark.students?.Users?.full_name || mark.students?.Users?.username || 'N/A';
            const rollNo = mark.students?.roll_number || 'N/A';
            const className = mark.classes?.class_name || 'N/A';
            const courseName = courses.find(c => c.id === mark.course_id)?.course_name || 'N/A';
            const batchName = batches.find(b => b.id === mark.batch_id)?.batch_name || 'N/A';
            const subjectName = mark.subjects?.subject_name || 'N/A';
            const institutionName = institutions.find(i => i.id === mark.institution_id)?.institute_name || 'N/A';
            const levelName = levels.find(l => l.id === mark.level_id)?.level_name || 'N/A';
            
            marksRecords.push({
                id: mark.id,
                student_id: mark.student_id,
                name: studentName,
                rollno: rollNo,
                class: className,
                course: courseName,
                batch: batchName,
                subject: subjectName,
                institution: institutionName,
                level: levelName,
                exam_name: mark.exam_name || 'N/A',
                marks_obtained: mark.marks_obtained || 0,
                max_marks: mark.max_marks || 0,
                passing_mark: mark.passing_marks || 0,
                percentage: mark.percentage ? `${(mark.percentage * 100).toFixed(2)}%` : '0%',
                grade: mark.grade || 'N/A'
            });
        });
        
        let data = marksRecords;

        // Apply filters
        const standardKeys = ['institution', 'class', 'course', 'level', 'batch', 'subject'];
        standardKeys.forEach(key => {
            if (activeFilters[key]) {
                data = data.filter(record => record[key] === activeFilters[key]);
            }
        });

        // Apply student filter
        if (activeFilters.student) {
            data = data.filter(record => record.student_id === activeFilters.student);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(record => 
                record.name.toLowerCase().includes(query) || String(record.rollno).includes(query)
            );
        }
        
        return data;

    }, [marks, activeFilters, searchQuery, subjects, courses, levels, batches, institutions]);

    // Fetch report card data when student is selected
    useEffect(() => {
        if (activeFilters.student) {
            fetchReportCardData();
        } else {
            setReportCardData(null);
        }
    }, [activeFilters.student]);

    const fetchReportCardData = async () => {
        setLoadingReportCard(true);
        try {
            // Get full student details
            const { data: studentDetails, error: studentError } = await supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    Users!inner(full_name, username)
                `)
                .eq('id', activeFilters.student)
                .single();

            if (studentError || !studentDetails) {
                console.error(studentError);
                return;
            }

            // Get ALL marks for this student
            const { data: allStudentMarks, error: marksError } = await supabase
                .from('marks')
                .select(`
                    *,
                    subjects(subject_name),
                    programmes:programme_id(programme_name)
                `)
                .eq('student_id', activeFilters.student);

            if (marksError) {
                console.error(marksError);
                return;
            }

            const selectedCourse = courses.find(c => c.id === activeFilters.course);
            const programmeName = allStudentMarks?.[0]?.programmes?.programme_name || activeFilters.level || 'N/A';

            // Get attendance data - query without class_id to get overall attendance
            let attendancePercentage = 0;
            const { data: attendanceData } = await supabase
                .from('attendance_summary')
                .select('attendance_percentage')
                .eq('student_id', activeFilters.student)
                .limit(1);

            // Use the first available attendance record or 0
            attendancePercentage = attendanceData?.[0]?.attendance_percentage || 0;

            // Transform marks data
            const marksData = allStudentMarks?.map(mark => ({
                exam_name: mark.exam_name || 'N/A',
                subject: mark.subjects?.subject_name || 'N/A',
                max_marks: mark.max_marks || 0,
                marks_obtained: mark.marks_obtained || 0,
                percentage: mark.percentage ? (mark.percentage * 100).toFixed(2) : '0'
            })) || [];

            setReportCardData({
                studentName: studentDetails.Users?.full_name || studentDetails.Users?.username || 'N/A',
                rollNumber: studentDetails.roll_number || 'N/A',
                courseName: selectedCourse?.course_name || 'N/A',
                programmeName: programmeName,
                attendance: attendancePercentage.toFixed(2),
                marks: marksData
            });

        } catch (err) {
            console.error('Error fetching report card data:', err);
        } finally {
            setLoadingReportCard(false);
        }
    };

    // Export individual student report card
    const handleExportStudentReport = async () => {
        if (!activeFilters.student) {
            alert('Please select a specific student to generate report card');
            return;
        }
        
        try {
            // Get full student details with roll_number
            const { data: studentDetails, error: studentError } = await supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    Users!inner(full_name, username)
                `)
                .eq('id', activeFilters.student)
                .single();

            if (studentError || !studentDetails) {
                alert('Error fetching student details');
                console.error(studentError);
                return;
            }

            console.log('Student details:', studentDetails);
            console.log('Roll number:', studentDetails.roll_number);
            
            // Get ALL marks for this student from database (not from state)
            const { data: allStudentMarks, error: marksError } = await supabase
                .from('marks')
                .select(`
                    *,
                    subjects(subject_name),
                    programmes:programme_id(programme_name)
                `)
                .eq('student_id', activeFilters.student);

            if (marksError) {
                alert('Error fetching marks data');
                console.error(marksError);
                return;
            }

            if (!allStudentMarks || allStudentMarks.length === 0) {
                alert('No marks data found for selected student');
                return;
            }

            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const selectedClass = classes.find(c => c.class_name === activeFilters.class);
            
            // Get programme name from first mark record
            const programmeName = allStudentMarks[0]?.programmes?.programme_name || activeFilters.level || 'N/A';
            
            // Get attendance data
            const { data: attendanceData } = await supabase
                .from('attendance_summary')
                .select('attendance_percentage')
                .eq('student_id', activeFilters.student)
                .eq('class_id', selectedClass?.id)
                .single();

            const attendancePercentage = attendanceData?.attendance_percentage || 0;

            // Transform all marks data for this student
            const studentMarksData = allStudentMarks.map(mark => ({
                exam_name: mark.exam_name || 'N/A',
                subject: mark.subjects?.subject_name || 'N/A',
                max_marks: mark.max_marks || 0,
                marks_obtained: mark.marks_obtained || 0,
                percentage: mark.percentage ? `${(mark.percentage * 100).toFixed(2)}%` : '0%'
            }));

            console.log('Transformed marks data:', studentMarksData);

            // Prepare data for export
            const wb = XLSX.utils.book_new();
            
            // Title rows
            const titleData = [
                [`Assessment Score Card - ${selectedCourse?.course_name || 'N/A'} - ${programmeName}`],
                [],
                ['Name:', studentDetails.Users?.full_name || studentDetails.Users?.username || 'N/A'],
                ['Attendance:', `${attendancePercentage.toFixed(2)}%`],
                [],
                ['Exam Name', 'Subject', 'Max Marks', 'Obtained Marks', 'Percentage']
            ];

            // Add marks data
            studentMarksData.forEach(record => {
                titleData.push([
                    record.exam_name,
                    record.subject,
                    record.max_marks,
                    record.marks_obtained,
                    record.percentage
                ]);
            });

            // Add footer with interpretation
            titleData.push(
                [],
                [],
                ['General Interpretation based on percentage'],
                [],
                ['*90% and above - Excellent', '*60%-74% - Average'],
                ['*75%-89% - Good', '*Below 60% - Requires improvement']
            );

            const ws = XLSX.utils.aoa_to_sheet(titleData);
            
            // Styling
            ws['!cols'] = [
                { wch: 20 },
                { wch: 30 },
                { wch: 15 },
                { wch: 18 },
                { wch: 15 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Report Card');
            
            // Use the actual roll_number from database
            const fileName = `Report_Card_${studentDetails.roll_number || 'Student'}.xlsx`;
            console.log('Saving file as:', fileName);
            XLSX.writeFile(wb, fileName);
            
        } catch (err) {
            console.error('Error exporting report card:', err);
            alert('Error generating report card. Please try again.');
        }
    };

    // Export individual student report card as PDF
    const handleExportStudentReportPDF = async () => {
        if (!activeFilters.student) {
            alert('Please select a specific student to generate report card');
            return;
        }
        
        try {
            const { data: studentDetails, error: studentError } = await supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    Users!inner(full_name, username)
                `)
                .eq('id', activeFilters.student)
                .single();

            if (studentError || !studentDetails) {
                alert('Error fetching student details');
                console.error(studentError);
                return;
            }
            
            const { data: allStudentMarks, error: marksError } = await supabase
                .from('marks')
                .select(`
                    *,
                    subjects(subject_name),
                    programmes:programme_id(programme_name)
                `)
                .eq('student_id', activeFilters.student);

            if (marksError || !allStudentMarks || allStudentMarks.length === 0) {
                alert('No marks data found for selected student');
                return;
            }

            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const programmeName = allStudentMarks[0]?.programmes?.programme_name || activeFilters.level || 'N/A';
            
            // Get attendance data
            let attendancePercentage = 0;
            const { data: attendanceData } = await supabase
                .from('attendance_summary')
                .select('attendance_percentage')
                .eq('student_id', activeFilters.student)
                .limit(1);
            attendancePercentage = attendanceData?.[0]?.attendance_percentage || 0;

            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Assessment Score Card', 105, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text(`${selectedCourse?.course_name || 'N/A'} - ${programmeName}`, 105, 28, { align: 'center' });
            
            // Student Details
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Name: ${studentDetails.Users?.full_name || studentDetails.Users?.username || 'N/A'}`, 14, 40);
            doc.text(`Roll Number: ${studentDetails.roll_number || 'N/A'}`, 14, 48);
            doc.text(`Attendance: ${attendancePercentage.toFixed(2)}%`, 14, 56);
            
            // Marks Table
            const tableData = allStudentMarks.map(mark => [
                mark.exam_name || 'N/A',
                mark.subjects?.subject_name || 'N/A',
                mark.max_marks || 0,
                mark.marks_obtained || 0,
                mark.percentage ? `${(mark.percentage * 100).toFixed(2)}%` : '0%'
            ]);
            
            autoTable(doc, {
                head: [['Exam Name', 'Subject', 'Max Marks', 'Obtained Marks', 'Percentage']],
                body: tableData,
                startY: 65,
                theme: 'grid',
                headStyles: { fillColor: [233, 30, 99], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
            });
            
            // Grade Interpretation
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('General Interpretation based on percentage:', 14, finalY);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.text('* 90% and above - Excellent', 14, finalY + 8);
            doc.text('* 75%-89% - Good', 14, finalY + 15);
            doc.text('* 60%-74% - Average', 14, finalY + 22);
            doc.text('* Below 60% - Requires improvement', 14, finalY + 29);
            
            doc.save(`Report_Card_${studentDetails.roll_number || 'Student'}.pdf`);
            
        } catch (err) {
            console.error('Error exporting PDF report card:', err);
            alert('Error generating PDF report card. Please try again.');
        }
    };

    // Close export dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (reportExportMenuRef.current && !reportExportMenuRef.current.contains(event.target)) {
                setIsReportExportOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="atm_wrapper">         
            <div className='title-and-export-row' style={{ marginBottom: '10px' }}>
                <h1 className="atm_section-title">Marks Management</h1>
            </div>

            <div className="attendance-table-container"> 
                <DynamicTable
                    data={getFilteredAndMarksData}
                    customDescription="** For uploading marks you have to select all the filters appropriately **"
                    columnOrder={MARKS_COLUMN_ORDER} 
                    title={`${activeFilters.subject || 'Subject'} Marks`} 
                    filterDefinitions={marksFilterDefinitions}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    columnVisibilityDefinition={true}
                    onSearch={handleSearchChange}
                    searchQuery={searchQuery}
                    onCustomExport={activeFilters.student ? handleExportStudentReport : null}
                    onAddNew={activeFilters.student ? null : () => {
                        alert(`Exporting Marks for ${activeFilters.subject || 'Selected Subject'}`);
                    }} 
                    add_new_button_label={activeFilters.student ? 'Export Report Card' : 'Export Marks'} 
                    onExcelFormat={handleDownloadExcelFormat}
                    
                    // Logic: If 'showImport' is true, we pass the function (showing the button).
                    // If 'showImport' is false, we pass undefined (hiding the button).
                    onDataImported={showImport ? handleDataImport : undefined}
                />
            </div>

            {/* Report Card Preview - Below Table */}
            {loadingReportCard && (
                <div style={{
                    backgroundColor: '#fff',
                    border: '2px solid #e91e63',
                    borderRadius: '8px',
                    padding: '40px',
                    marginTop: '20px',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    Loading report card preview...
                </div>
            )}

            {reportCardData && (
                <div style={{
                    backgroundColor: '#fff',
                    border: '2px solid #e91e63',
                    borderRadius: '8px',
                    padding: '24px',
                    marginTop: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    {/* Header with Export Dropdown */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: '#e91e63', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                            Assessment Score Card Preview
                        </h2>
                        
                        {/* Export Dropdown */}
                        <div ref={reportExportMenuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsReportExportOpen(!isReportExportOpen)}
                                style={{
                                    backgroundColor: '#e91e63',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#c2185b'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#e91e63'}
                            >
                                <Download size={18} /> Export Report Card
                            </button>
                            
                            {isReportExportOpen && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    marginTop: '4px',
                                    backgroundColor: 'white',
                                    border: '2px solid #e91e63',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    minWidth: '180px',
                                    zIndex: 1000,
                                    overflow: 'hidden'
                                }}>
                                    <div
                                        onClick={() => {
                                            handleExportStudentReport();
                                            setIsReportExportOpen(false);
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'background-color 0.2s',
                                            borderBottom: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                    >
                                        📊 Export as Excel
                                    </div>
                                    <div
                                        onClick={() => {
                                            handleExportStudentReportPDF();
                                            setIsReportExportOpen(false);
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                    >
                                        📄 Export as PDF
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: '0 0 5px 0' }}>
                            Assessment Score Card - {reportCardData.courseName} - {reportCardData.programmeName}
                        </h3>
                    </div>

                    {/* Student Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        marginBottom: '20px'
                    }}>
                        <div>
                            <strong style={{ color: '#666' }}>Name:</strong>
                            <span style={{ marginLeft: '8px', color: '#333' }}>{reportCardData.studentName}</span>
                        </div>
                        <div>
                            <strong style={{ color: '#666' }}>Roll Number:</strong>
                            <span style={{ marginLeft: '8px', color: '#333' }}>{reportCardData.rollNumber}</span>
                        </div>
                        <div>
                            <strong style={{ color: '#666' }}>Attendance:</strong>
                            <span style={{ marginLeft: '8px', color: '#333' }}>{reportCardData.attendance}%</span>
                        </div>
                    </div>

                    {/* Marks Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginBottom: '20px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e91e63', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Exam Name</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Subject</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Max Marks</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Obtained Marks</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportCardData.marks.length > 0 ? (
                                    reportCardData.marks.map((mark, index) => (
                                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{mark.exam_name}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{mark.subject}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{mark.max_marks}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{mark.marks_obtained}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{mark.percentage}%</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                            No marks data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Grade Interpretation */}
                    <div style={{
                        backgroundColor: '#f0f8ff',
                        padding: '16px',
                        borderRadius: '6px',
                        border: '1px solid #cce5ff'
                    }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginTop: 0, marginBottom: '10px' }}>
                            General Interpretation based on percentage
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#555' }}>
                            <div>⭐ 90% and above - Excellent</div>
                            <div>📊 60%-74% - Average</div>
                            <div>✅ 75%-89% - Good</div>
                            <div>📝 Below 60% - Requires improvement</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarksManagement;