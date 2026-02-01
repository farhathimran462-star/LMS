// Chart.js imports
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DynamicTable from "../Reusable/DynamicTable";
import "../../Styles/SuperAdmin/AttendanceManagement.css"; 
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

// API Imports
import { getAllMarks } from '../../api/marksApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllClasses } from '../../api/classesApi';
import { getSubjectsByLevel } from '../../api/subjectsApi';
import { getClassesByTeacher } from '../../api/classesApi';
import { getAllCourses, getCoursesByInstitution } from '../../api/coursesApi';
import { getAllLevels, getLevelsByCourse } from '../../api/levelsApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllProgrammes, getProgrammesByCourseLevel } from '../../api/programmesApi';
import { supabase } from '../../config/supabaseClient';

// Fixed columns for marks table
const FIXED_COLUMNS = ['rollno', 'name', 'course', 'level', 'programme', 'batch', 'class', 'exam_name', 'marks_obtained', 'max_marks', 'passing_mark', 'percentage'];

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
    const [programmes, setProgrammes] = useState([]);
    const [allBatches, setAllBatches] = useState([]); // full list from API
    const [batches, setBatches] = useState([]); // filtered for dropdown
    const [allClasses, setAllClasses] = useState([]); // full list from API
    const [classes, setClasses] = useState([]); // filtered for dropdown
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [reportCardData, setReportCardData] = useState(null);
    const [loadingReportCard, setLoadingReportCard] = useState(false);
    const reportCardRef = useRef(null);
    const [editingMarkId, setEditingMarkId] = useState(null);
    const [editFormData, setEditFormData] = useState({ exam_name: '', marks_obtained: '', max_marks: '', passing_mark: '' });
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    
    // --- UNIFIED FILTER STATE ---
    const [activeFilters, setActiveFilters] = useState({
        subject: '',
        unit: '',
        institution: '', // will store institution.id
        class: '',       // will store class.id
        course: '',      // will store course.id
        level: '',       // will store level.id
        programme: '',   // will store programme.id
        batch: '',       // will store batch.id
        student: ''      // will store student.id
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
                const [insData, marksData, coursesData, levelsData, batchesData, programmesData] = await Promise.all([
                    getAllInstitutions(),
                    getAllMarks({}),
                    getAllCourses(),
                    getAllLevels(),
                    getAllBatches(),
                    getAllProgrammes()
                ]);
                
                if (insData.error) throw new Error(insData.error.message);
                if (marksData.error) throw new Error(marksData.error.message);
                if (coursesData.error) {
                    console.error('Error fetching courses:', coursesData.error);
                }
                if (levelsData.error) {
                    console.error('Error fetching levels:', levelsData.error);
                }
                if (batchesData.error) {
                    console.error('Error fetching batches:', batchesData.error);
                }
                if (programmesData.error) {
                    console.error('Error fetching programmes:', programmesData.error);
                }
                
                console.log('Fetched institutions:', insData.data);
                console.log('Fetched courses:', coursesData);
                console.log('Fetched levels:', levelsData);
                console.log('Fetched batches:', batchesData);
                console.log('Fetched programmes:', programmesData);
                setInstitutions(insData.data || []);
                setMarks(marksData.data || []);
                setCourses(coursesData.data || []);
                setLevels(levelsData.data || []);
                setAllBatches(batchesData.data || []);
                setBatches(batchesData.data || []);
                const { data: allClassesData, error: allClassesError } = await getAllClasses();
                if (!allClassesError) {
                    setAllClasses(allClassesData || []);
                    setClasses(allClassesData || []);
                }
                setProgrammes(programmesData.data || []);
            } else if (isTeacher) {
                const [insData, clsData, marksData, coursesData, levelsData, batchesData, programmesData] = await Promise.all([
                    getAllInstitutions(),
                    getClassesByTeacher(currentUserId),
                    getAllMarks({}),
                    getAllCourses(),
                    getAllLevels(),
                    getAllBatches(),
                    getAllProgrammes()
                ]);
                
                if (insData.error) throw new Error(insData.error.message);
                if (clsData.error) throw new Error(clsData.error.message);
                if (marksData.error) throw new Error(marksData.error.message);
                
                console.log('Fetched institutions (teacher):', insData.data);
                setInstitutions(insData.data || []);
                setTeacherClasses(clsData.data || []);
                setMarks(marksData.data || []);
                setCourses(coursesData.data || []);
                setLevels(levelsData.data || []);
                setAllBatches(batchesData.data || []);
                setBatches(batchesData.data || []);
                const { data: allClassesData, error: allClassesError } = await getAllClasses();
                if (!allClassesError) {
                    setAllClasses(allClassesData || []);
                    setClasses(allClassesData || []);
                }
                setProgrammes(programmesData.data || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- DYNAMIC FILTER LOGIC (fetch options based on previous filter) ---
    // Courses: use getCoursesByInstitution when institution is selected, else getAllCourses
    useEffect(() => {
        const fetchCourses = async () => {
            if (activeFilters.institution && institutions.length > 0) {
                try {
                    const { data, error } = await getCoursesByInstitution(activeFilters.institution);
                    if (error) throw error;
                    setCourses(data || []);
                } catch (err) {
                    setCourses([]);
                }
            } else {
                const { data, error } = await getAllCourses();
                setCourses(data || []);
            }
        };
        fetchCourses();
    }, [activeFilters.institution, institutions]);

    // Levels: use getLevelsByCourse when course is selected, else getAllLevels
    useEffect(() => {
        const fetchLevels = async () => {
            if (activeFilters.course && courses.length > 0) {
                try {
                    const { data, error } = await getLevelsByCourse(activeFilters.course);
                    if (error) throw error;
                    setLevels(data || []);
                } catch (err) {
                    setLevels([]);
                }
            } else {
                const { data, error } = await getAllLevels();
                setLevels(data || []);
            }
        };
        fetchLevels();
    }, [activeFilters.course, courses]);

    // Programmes: use getProgrammesByCourseLevel when both course and level are selected, else getAllProgrammes
    useEffect(() => {
        const fetchProgrammes = async () => {
            if (activeFilters.course && activeFilters.level && courses.length > 0 && levels.length > 0) {
                try {
                    const { data, error } = await getProgrammesByCourseLevel(activeFilters.course, activeFilters.level);
                    if (error) throw error;
                    setProgrammes(data || []);
                } catch (err) {
                    setProgrammes([]);
                }
            } else {
                const { data, error } = await getAllProgrammes();
                setProgrammes(data || []);
            }
        };
        fetchProgrammes();
    }, [activeFilters.course, activeFilters.level, courses, levels]);

    // Batches: fetch all, filter by programme if selected (Timetable.jsx logic)
    useEffect(() => {
        getAllBatches().then(({ data, error }) => {
            if (error) {
                setBatches([]);
            } else {
                if (activeFilters.programme && programmes.length > 0) {
                    setBatches((data || []).filter(b => b.programme_id === activeFilters.programme));
                } else {
                    setBatches(data || []);
                }
            }
        });
    }, [activeFilters.programme, programmes]);

    // Classes: fetch all, filter by batch if selected (Timetable.jsx logic)
    useEffect(() => {
        if (activeFilters.batch && batches.length > 0) {
            getAllClasses().then(({ data, error }) => {
                if (error) setClasses([]);
                else {
                    setClasses((data || []).filter(c => c.batch_id === activeFilters.batch));
                }
            });
        } else {
            setClasses([]);
        }
    }, [activeFilters.batch, batches]);

    // Subjects: fetch when level is selected
    useEffect(() => {
        if (activeFilters.level && levels.length > 0) {
            // activeFilters.level now stores the level ID, not the name
            fetchSubjects(activeFilters.level);
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

    // Students: fetch when class is selected
    useEffect(() => {
        if (activeFilters.class && classes.length > 0) {
            // activeFilters.class now stores the class ID, not the name
            fetchStudents(activeFilters.class);
        } else {
            setStudents([]);
        }
    }, [activeFilters.class, classes]);

    const fetchStudents = async (classId) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    id,
                    roll_number,
                    user_id,
                    Users!inner(full_name, username)
                `)
                .eq('class_id', classId);
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
        // Reset dependent filters and clear options as in Timetable.jsx
        setActiveFilters(prev => {
            const updated = { ...prev, [column]: value };
            if (column === 'institution') {
                updated.course = '';
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
                updated.subject = '';
                updated.student = '';
                setCourses([]);
                setLevels([]);
                setProgrammes([]);
                setBatches([]);
                setClasses([]);
            } else if (column === 'course') {
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
                updated.subject = '';
                updated.student = '';
                setLevels([]);
                setProgrammes([]);
                setBatches([]);
                setClasses([]);
            } else if (column === 'level') {
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
                updated.subject = '';
                updated.student = '';
                setProgrammes([]);
                setBatches([]);
                setClasses([]);
            } else if (column === 'programme') {
                updated.batch = '';
                updated.class = '';
                updated.subject = '';
                updated.student = '';
                setBatches([]);
                setClasses([]);
            } else if (column === 'batch') {
                updated.class = '';
                updated.subject = '';
                updated.student = '';
                setClasses([]);
            } else if (column === 'class') {
                updated.subject = '';
                updated.student = '';
            } else if (column === 'subject') {
                updated.student = '';
            }
            return updated;
        });
    }, []);
    
    const handleSearchChange = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    // Handle edit mark
    const handleEditMark = useCallback((markRecord) => {
        setEditingMarkId(markRecord.id);
        setEditFormData({
            exam_name: markRecord.exam_name,
            marks_obtained: markRecord.marks_obtained,
            max_marks: markRecord.max_marks,
            passing_mark: markRecord.passing_mark
        });
    }, []);

    // Handle save edit
    const handleSaveEdit = useCallback(async (markId) => {
        try {
            setLoading(true);
            
            const examName = editFormData.exam_name?.trim();
            const marksObtained = parseFloat(editFormData.marks_obtained);
            const maxMarks = parseFloat(editFormData.max_marks);
            const passingMark = parseFloat(editFormData.passing_mark);

            if (!examName) {
                alert('Please enter exam name');
                return;
            }

            if (isNaN(marksObtained) || isNaN(maxMarks) || isNaN(passingMark)) {
                alert('Please enter valid numbers for all fields');
                return;
            }

            // Calculate new percentage and grade
            const percentageValue = (marksObtained / maxMarks) * 100;
            const percentage = marksObtained / maxMarks;
            
            let grade = 'F';
            let gradePoint = 0;
            
            if (percentageValue >= 90) { grade = 'A+'; gradePoint = 1.0; }
            else if (percentageValue >= 80) { grade = 'A'; gradePoint = 0.9; }
            else if (percentageValue >= 70) { grade = 'B+'; gradePoint = 0.8; }
            else if (percentageValue >= 60) { grade = 'B'; gradePoint = 0.7; }
            else if (percentageValue >= 50) { grade = 'C+'; gradePoint = 0.6; }
            else if (percentageValue >= 40) { grade = 'C'; gradePoint = 0.5; }

            const isPassed = marksObtained >= passingMark;

            const { error } = await supabase
                .from('marks')
                .update({
                    exam_name: examName,
                    marks_obtained: marksObtained,
                    max_marks: maxMarks,
                    passing_marks: passingMark,
                    percentage: percentage,
                    grade: grade,
                    grade_point: gradePoint,
                    is_passed: isPassed
                })
                .eq('id', markId);

            if (error) throw error;

            alert('Mark updated successfully!');
            setEditingMarkId(null);
            setEditFormData({ exam_name: '', marks_obtained: '', max_marks: '', passing_mark: '' });
            
            // Refresh data
            await fetchInitialData();
        } catch (error) {
            console.error('Error updating mark:', error);
            alert('Error updating mark: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [editFormData]);

    // Handle cancel edit
    const handleCancelEdit = useCallback(() => {
        setEditingMarkId(null);
        setEditFormData({ exam_name: '', marks_obtained: '', max_marks: '', passing_mark: '' });
    }, []);

    // Handle delete mark
    const handleDeleteMark = useCallback(async (markId) => {
        if (!window.confirm('Are you sure you want to delete this mark record?')) {
            return;
        }

        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('marks')
                .delete()
                .eq('id', markId);

            if (error) throw error;

            alert('Mark deleted successfully!');
            
            // Refresh data
            await fetchInitialData();
        } catch (error) {
            console.error('Error deleting mark:', error);
            alert('Error deleting mark: ' + error.message);
        } finally {
            setLoading(false);
        }
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
        const selectedInst = institutions.find(i => i.id === activeFilters.institution);
        const selectedCourse = courses.find(c => c.id === activeFilters.course);
        const selectedLevel = levels.find(l => l.id === activeFilters.level);
        const selectedProgramme = programmes.find(p => p.id === activeFilters.programme);
        const selectedBatch = batches.find(b => b.id === activeFilters.batch);
        const selectedClass = classes.find(cls => cls.id === activeFilters.class);
        const selectedSubject = subjects.find(s => s.id === activeFilters.subject);

        if (!selectedInst || !selectedCourse || !selectedLevel || !selectedProgramme || !selectedBatch || !selectedClass || !selectedSubject) {
            let missing = [];
            if (!selectedInst) missing.push('Institution');
            if (!selectedCourse) missing.push('Course');
            if (!selectedLevel) missing.push('Level');
            if (!selectedProgramme) missing.push('Programme');
            if (!selectedBatch) missing.push('Batch');
            if (!selectedClass) missing.push('Class');
            if (!selectedSubject) missing.push('Subject');
            alert('Could not find matching IDs for: ' + missing.join(', '));
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
                        programme_id: selectedProgramme.id,
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
        const mandatoryFilters = ['institution', 'class', 'course', 'level', 'batch', 'subject'];
        const allMandatorySelected = mandatoryFilters.every(key => activeFilters[key] !== '');
        return allMandatorySelected;
    }, [activeFilters]);

    // --- FILTER DEFINITIONS ---
    const marksFilterDefinitions = useMemo(() => {
        const defs = {};
        defs.institution = [
            { value: '', label: 'All Institute' },
            ...institutions.map(inst => ({
                value: inst.id,
                label: inst.institute_name
            }))
        ];
        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({
                value: course.id,
                label: course.course_name
            }))
        ];
        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({
                value: level.id,
                label: level.level_name
            }))
        ];
        defs.programme = [
            { value: '', label: 'All Programme' },
            ...programmes.map(prog => ({
                value: prog.id,
                label: prog.programme_name
            }))
        ];
        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({
                value: batch.id,
                label: batch.batch_name
            }))
        ];
        defs.class = [
            { value: '', label: 'All Class' },
            ...classes.map(cls => ({
                value: cls.id,
                label: cls.class_name
            }))
        ];
        defs.subject = [
            { value: '', label: 'All Subjects' },
            ...subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))
        ];
        defs.student = [
            { value: '', label: 'All Students' },
            ...students.map(student => ({
                value: student.id,
                label: `${student.roll_number} - ${student.Users?.full_name || student.Users?.username}`
            }))
        ];
        return defs;
    }, [subjects, institutions, courses, levels, programmes, batches, classes, students]);
    
    // --- DATA TRANSFORMATION ---
    const getFilteredAndMarksData = useMemo(() => {
        // Transform marks to student-centric format
        console.log('DATA TRANSFORMATION RUNNING - courses.length:', courses.length, 'marks.length:', marks.length);
        const marksRecords = [];
        
        // Use allCourses, allBatches, allClasses for table mapping to avoid empty values
        marks.forEach(mark => {
            const studentName = mark.students?.Users?.full_name || mark.students?.Users?.username || 'N/A';
            const rollNo = mark.students?.roll_number || 'N/A';
            // Use allClasses for class name
            const className = (classes && classes.length > 0 ? classes : []).find(c => c.id === mark.class_id)?.class_name || mark.classes?.class_name || 'N/A';
            // Use allCourses for course name
            const courseName = (courses && courses.length > 0 ? courses : []).find(c => c.id === mark.course_id)?.course_name || 'N/A';
            // Use allBatches for batch name
            const batchName = (batches && batches.length > 0 ? batches : []).find(b => b.id === mark.batch_id)?.batch_name || 'N/A';
            const programmeName = programmes.find(p => p.id === mark.programme_id)?.programme_name || 'N/A';
            const subjectName = mark.subjects?.subject_name || 'N/A';
            const subjectId = mark.subjects?.id || mark.subject_id || null;
            const institutionName = institutions.find(i => i.id === mark.institution_id)?.institute_name || 'N/A';
            const levelName = levels.find(l => l.id === mark.level_id)?.level_name || 'N/A';
            marksRecords.push({
                id: mark.id,
                student_id: mark.student_id,
                name: studentName,
                rollno: rollNo,
                class: className,
                class_id: mark.class_id, // for filtering
                course: courseName,
                course_id: mark.course_id, // for filtering
                batch: batchName,
                batch_id: mark.batch_id, // for filtering
                programme: programmeName,
                programme_id: mark.programme_id, // for filtering
                subject: subjectName,
                subject_id: subjectId,
                institution: institutionName,
                institution_id: mark.institution_id, // for filtering
                level: levelName,
                level_id: mark.level_id, // for filtering
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
        const standardKeys = ['institution', 'class', 'course', 'level', 'programme', 'batch', 'subject'];
        standardKeys.forEach(key => {
            if (activeFilters[key]) {
                if (key === 'institution') {
                    data = data.filter(record => String(record.institution_id) === String(activeFilters.institution));
                } else if (key === 'course') {
                    data = data.filter(record => String(record.course_id) === String(activeFilters.course));
                } else if (key === 'level') {
                    data = data.filter(record => String(record.level_id) === String(activeFilters.level));
                } else if (key === 'programme') {
                    data = data.filter(record => String(record.programme_id) === String(activeFilters.programme));
                } else if (key === 'batch') {
                    data = data.filter(record => String(record.batch_id) === String(activeFilters.batch));
                } else if (key === 'class') {
                    data = data.filter(record => String(record.class_id) === String(activeFilters.class));
                } else if (key === 'subject') {
                    data = data.filter(record => String(record.subject_id) === String(activeFilters.subject));
                } else {
                    data = data.filter(record => record[key] === activeFilters[key]);
                }
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

    }, [marks, activeFilters, searchQuery, subjects, courses, levels, batches, programmes, institutions]);

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

    // Export report card as PDF using html2canvas for accurate UI capture
    const handleExportStudentReportPDF = async () => {
        if (!activeFilters.student) {
            alert('Please select a specific student to generate report card');
            return;
        }
        try {
            const reportCardElement = reportCardRef.current;
            if (!reportCardElement) {
                alert('Report card UI not found.');
                return;
            }
            // Hide the export button before capture
            const exportBtn = reportCardElement.querySelector('button');
            if (exportBtn) exportBtn.style.visibility = 'hidden';
            // Wait for UI to update
            await new Promise(res => setTimeout(res, 100));
            const canvas = await html2canvas(reportCardElement, { scale: 2 });
            if (exportBtn) exportBtn.style.visibility = 'visible';
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            // Calculate width/height to fit A4
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 40;
            const imgHeight = canvas.height * (imgWidth / canvas.width);
            let y = 20;
            if (imgHeight > pageHeight - 40) {
                pdf.addImage(imgData, 'PNG', 20, y, imgWidth, pageHeight - 40);
            } else {
                pdf.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
            }
            pdf.save(`Report_Card_${reportCardData.rollNumber || 'Student'}.pdf`);
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
                    
                    // Actions handlers for edit/delete
                    onEditRow={handleEditMark}
                    onDeleteRow={handleDeleteMark}
                    editingRowId={editingMarkId}
                    editFormData={editFormData}
                    onEditFormChange={setEditFormData}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
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
                <div
                    ref={reportCardRef}
                    style={{
                        backgroundColor: '#fff',
                        border: '2px solid #e91e63',
                        borderRadius: '8px',
                        padding: '24px',
                        marginTop: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Header with Export Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: '#e91e63', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                            Assessment Score Card Preview
                        </h2>
                        <button
                            onClick={handleExportStudentReportPDF}
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
                    </div>

                    {/* Scorecard Header with Logo */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        marginBottom: 24
                    }}>
                        <img src={'/logo/logo.jpg'} alt="My Career Point Logo" style={{ height: 56, width: 56, objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#e91e63', margin: 0, letterSpacing: 1 }}>My Career Point</h2>
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

            
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginBottom: '20px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e91e63', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Subject</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Exam Name</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Max Marks</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Obtained Marks</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportCardData.marks.length > 0 ? (
                                    (() => {
                                        // Group marks by subject
                                        const grouped = {};
                                        reportCardData.marks.forEach(mark => {
                                            if (!grouped[mark.subject]) grouped[mark.subject] = [];
                                            grouped[mark.subject].push(mark);
                                        });
                                        const rows = [];
                                        Object.keys(grouped).forEach((subject, sIdx) => {
                                            const exams = grouped[subject];
                                            exams.forEach((mark, mIdx) => {
                                                rows.push(
                                                    <tr key={subject + '-' + mIdx} style={{ backgroundColor: (rows.length % 2 === 0) ? '#fff' : '#f8f9fa' }}>
                                                        <td style={{ padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle' }}>{mIdx === 0 ? subject : ''}</td>
                                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{mark.exam_name}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{mark.max_marks}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{mark.marks_obtained}</td>
                                                        <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>{mark.percentage}%</td>
                                                    </tr>
                                                );
                                            });
                                        });
                                        return rows;
                                    })()
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
                        border: '1px solid #cce5ff',
                        marginBottom: 32
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
                    {/* --- Graphical Representation --- */}
                    {reportCardData.marks.length > 0 && (
                        <div style={{ marginTop: 0 }}>
                            <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {/* Bar Chart for Exam Results */}
                                <div style={{ minWidth: 320, flex: 1, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#e91e63', fontWeight: 600 }}>Exam Results Overview</h4>
                                    <Bar
                                        data={{
                                            labels: reportCardData.marks.map(m => `${m.subject} - ${m.exam_name}`),
                                            datasets: [
                                                {
                                                    label: 'Obtained Marks',
                                                    data: reportCardData.marks.map(m => Number(m.marks_obtained)),
                                                    backgroundColor: '#e91e63',
                                                },
                                                {
                                                    label: 'Max Marks',
                                                    data: reportCardData.marks.map(m => Number(m.max_marks)),
                                                    backgroundColor: '#f8bbd0',
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: { position: 'top' },
                                                title: { display: false }
                                            },
                                            scales: {
                                                y: { beginAtZero: true }
                                            }
                                        }}
                                    />
                                </div>
                                {/* Attendance Circular Progress */}
                                <div style={{ minWidth: 220, flex: '0 0 220px', background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#e91e63', fontWeight: 600 }}>Attendance</h4>
                                    <Doughnut
                                        data={{
                                            labels: ['Attendance', 'Absent'],
                                            datasets: [
                                                {
                                                    data: [Number(reportCardData.attendance), 100 - Number(reportCardData.attendance)],
                                                    backgroundColor: ['#e91e63', '#f8bbd0'],
                                                    borderWidth: 1
                                                }
                                            ]
                                        }}
                                        options={{
                                            cutout: '70%',
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: { enabled: true }
                                            }
                                        }}
                                    />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 28, fontWeight: 700, color: '#e91e63' }}>{reportCardData.attendance}%</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MarksManagement;