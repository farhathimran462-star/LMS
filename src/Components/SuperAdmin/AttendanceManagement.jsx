import React, { useState, useMemo, useCallback, useEffect } from 'react';
import "../../Styles/SuperAdmin/AttendanceManagement.css";
import DynamicTable from "../Reusable/DynamicTable";
import * as XLSX from 'xlsx';

// API Imports
import { getAllAttendance } from '../../api/attendanceApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllClasses, getClassesByTeacher } from '../../api/classesApi';
import { getCoursesByInstitution } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getProgrammesByCourseLevel } from '../../api/programmesApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllTeachers, getAllAdmins } from '../../api/usersApi';
import { supabase } from '../../config/supabaseClient'; 

// --- COLUMN DEFINITIONS ---
const ATTENDANCE_COLUMNS = ['rollno', 'name', 'course', 'level', 'programme', 'batch', 'class', 'total_days', 'present_days', 'half_days', 'absent_days', 'attendance_percentage'];
const DISPLAY_AT_FIXED_RIGHT = ['actions'];

const AttendanceManagement = ({ userRole }) => {

    console.log("User Role in AttendanceManagement:", userRole);
    
    // Get current user data
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || localStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;
    
    // Role flags
    const isTeacherRole = (userRole || '').toString().toLowerCase().trim() === 'teacher';
    const isAdminRole = (userRole || '').toString().toLowerCase().trim() === 'admin';
    const isSuperAdminRole = (userRole || '').toString().toLowerCase().trim() === 'super admin';
    
    // 1. DATA STATE
    const [attendanceData, setAttendanceData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingAttendanceId, setEditingAttendanceId] = useState(null);
    const [editFormData, setEditFormData] = useState({ total_days: '', present_days: '', half_days: '', absent_days: '' });
    
    // Role-specific states
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [adminInstitutions, setAdminInstitutions] = useState([]);
    
    // API Data States
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [allBatches, setAllBatches] = useState([]); // all batches from API
    const [batches, setBatches] = useState([]); // filtered batches for dropdown
    const [classes, setClasses] = useState([]);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // FILTER STATE
    const [activeFilters, setActiveFilters] = useState({
        institution: '', // will store institution.id
        course: '',      // will store course.id
        level: '',       // will store level.id
        programme: '',   // will store programme.id
        batch: '',       // will store batch.id
        class: ''        // will store class.id
    });

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Fetch teachers and admins data for role-based filtering
            const [insData, attData, teachersData, adminsData] = await Promise.all([
                getAllInstitutions(),
                getAllAttendance({}),
                isTeacherRole ? getAllTeachers() : Promise.resolve({ data: [] }),
                isAdminRole ? getAllAdmins() : Promise.resolve({ data: [] })
            ]);
            
            console.log('Institutions data:', insData);
            console.log('Attendance data:', attData);
            
            if (insData.error) throw new Error(insData.error.message);
            if (attData.error) throw new Error(attData.error.message);
            
            setInstitutions(insData.data || []);
            
            // Handle teacher-specific data
            if (isTeacherRole && teachersData.data) {
                const teacher = teachersData.data.find(t => t.user_id === currentUserId);
                if (teacher) {
                    const { data: assignedClasses } = await getClassesByTeacher(currentUserId);
                    setTeacherClasses(assignedClasses || []);
                    console.log('✅ Teacher assigned classes:', assignedClasses);
                    
                    // Filter attendance by teacher's classes
                    const teacherClassIds = (assignedClasses || []).map(c => c.id);
                    const filteredAtt = (attData.data || []).filter(att => 
                        teacherClassIds.includes(att.class_id)
                    );
                    setAttendanceData(filteredAtt);
                    console.log('✅ Filtered attendance for teacher:', filteredAtt);
                } else {
                    setAttendanceData([]);
                }
            }
            // Handle admin-specific data
            else if (isAdminRole && adminsData.data) {
                const admin = adminsData.data.find(a => a.user_id === currentUserId);
                if (admin && admin.admin_institutions) {
                    const adminInstIds = admin.admin_institutions.map(ai => 
                        ai.institute_id || ai.institutions?.id
                    ).filter(Boolean);
                    setAdminInstitutions(adminInstIds);
                    console.log('✅ Admin institutions:', adminInstIds);
                    
                    // Filter attendance by admin's institutions
                    const filteredAtt = (attData.data || []).filter(att => 
                        adminInstIds.includes(att.institute_id)
                    );
                    setAttendanceData(filteredAtt);
                    console.log('✅ Filtered attendance for admin:', filteredAtt);
                } else {
                    setAttendanceData([]);
                }
            }
            // Super admin sees all
            else {
                setAttendanceData(attData.data || []);
            }
            
            console.log('Institutions set:', insData.data);
        } catch (err) {
            console.error('Error fetching data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch courses when institution is selected
    useEffect(() => {
        if (activeFilters.institution && institutions.length > 0) {
            getCoursesByInstitution(activeFilters.institution).then(({ data, error }) => {
                if (error) setCourses([]);
                else setCourses(data || []);
            });
        } else {
            setCourses([]);
        }
    }, [activeFilters.institution, institutions]);

    // Fetch levels when course is selected
    useEffect(() => {
        if (activeFilters.course && courses.length > 0) {
            getLevelsByCourse(activeFilters.course).then(({ data, error }) => {
                if (error) setLevels([]);
                else setLevels(data || []);
            });
        } else {
            setLevels([]);
        }
    }, [activeFilters.course, courses]);

    // Fetch programmes when level is selected
    useEffect(() => {
        if (activeFilters.level && activeFilters.course && levels.length > 0 && courses.length > 0) {
            getProgrammesByCourseLevel(activeFilters.course, activeFilters.level).then(({ data, error }) => {
                if (error) setProgrammes([]);
                else setProgrammes(data || []);
            });
        } else {
            setProgrammes([]);
        }
    }, [activeFilters.level, activeFilters.course, levels, courses]);

    // Fetch batches when programme is selected
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

    // Fetch classes when batch is selected
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

    // Column display names
    const columnDisplayNameMap = useMemo(() => ({
        rollno: 'Roll No',
        name: 'Student Name',
        total_days: 'Total Days',
        present_days: 'Present',
        half_days: 'Half Day',
        absent_days: 'Absent',
        attendance_percentage: 'Attendance %'
    }), []);

    // --- FILTER DEFINITIONS ---
    const attendanceFilterDefinitions = useMemo(() => {
        const defs = {};

        // 1. INSTITUTION
        defs.institution = [
            { value: '', label: 'All Institution' },
            ...institutions.map(inst => ({ 
                value: inst.id, 
                label: inst.institute_name 
            }))
        ];

        // 2. COURSE
        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({ 
                value: course.id, 
                label: course.course_name 
            }))
        ];

        // 3. LEVEL
        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({ 
                value: level.id, 
                label: level.level_name 
            }))
        ];

        // 4. PROGRAMME
        defs.programme = [
            { value: '', label: 'All Programme' },
            ...programmes.map(prog => ({ 
                value: prog.id, 
                label: prog.programme_name 
            }))
        ];

        // 5. BATCH
        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({ 
                value: batch.id, 
                label: batch.batch_name 
            }))
        ];

        // 6. CLASS
        defs.class = [
            { value: '', label: 'All Class' },
            ...classes.map(cls => ({ 
                value: cls.id, 
                label: cls.class_name 
            }))
        ];
        
        return defs;
    }, [institutions, courses, levels, programmes, batches, classes]);

    // --- CHECK IF ALL REQUIRED FILTERS ARE SELECTED ---
    const areAllFiltersSelected = useMemo(() => {
        const requiredKeys = ['institution', 'course', 'level', 'programme', 'batch', 'class'];
        
        return requiredKeys.every(key => {
            const val = activeFilters[key];
            return val && val !== '';
        });
    }, [activeFilters]);

    // --- HANDLERS ---
    const handleFilterChange = useCallback((key, value) => {
        setActiveFilters(prev => {
            const updated = { ...prev, [key]: value };
            if (key === 'institution') {
                updated.course = '';
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
            } else if (key === 'course') {
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
            } else if (key === 'level') {
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
            } else if (key === 'programme') {
                updated.batch = '';
                updated.class = '';
            } else if (key === 'batch') {
                updated.class = '';
            }
            return updated;
        });
    }, []);
    
    const handleSearchChange = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    // --- FORM HANDLERS ---

    const handleDataImport = async (importedData) => {
        console.log('Imported attendance data:', importedData);
        
        if (!importedData || importedData.length === 0) {
            alert('No data found in the uploaded file');
            return;
        }

        // Validate required filters are selected
        if (!areAllFiltersSelected) {
            alert('Please select all filters (Institution, Course, Level, Batch, Class) before importing');
            return;
        }

        // Get objects by ID from selected filters
        const selectedClass = classes.find(c => c.id === activeFilters.class);
        const selectedBatch = batches.find(b => b.id === activeFilters.batch);
        const selectedInstitution = institutions.find(i => i.id === activeFilters.institution);
        const selectedCourse = courses.find(c => c.id === activeFilters.course);
        const selectedLevel = levels.find(l => l.id === activeFilters.level);
        const selectedProgramme = programmes.find(p => p.id === activeFilters.programme);

        if (!selectedClass || !selectedBatch || !selectedInstitution || !selectedCourse || !selectedLevel || !selectedProgramme) {
            alert('Could not find matching IDs for selected filters');
            return;
        }

        // Get current user ID from session
        const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const currentUserId = currentUserData.user_id || null;

        const metadata = {
            class_id: selectedClass.id,
            batch_id: selectedBatch.id,
            institute_id: selectedInstitution.id,
            course_id: selectedCourse.id,
            level_id: selectedLevel.id,
            programme_id: selectedProgramme.id,
            marked_by: currentUserId
        };

        try {
            setLoading(true);
            
            // Import supabase and uploadAttendanceFromExcel
            const { supabase } = await import('../../config/supabaseClient');
            
            // Process attendance data directly from imported JSON
            // Format expected: [{ 'Roll Number': '00001', '2024-01-01': 'P', '2024-01-02': 'A', ... }]
            
            let successCount = 0;
            let failedCount = 0;
            const errors = [];

            for (const row of importedData) {
                try {
                    // Extract roll number (first column)
                    const rollNumber = row['Roll Number'] || row.rollnumber || row['roll_number'];
                    
                    if (!rollNumber) {
                        errors.push(`Row ${importedData.indexOf(row) + 1}: Missing roll number`);
                        failedCount++;
                        continue;
                    }

                    console.log(`Processing roll number: "${rollNumber}" for class_id: ${selectedClass.id}`);

                    // Find student by roll number - removed class_id filter to find student first
                    const { data: studentData, error: studentError } = await supabase
                        .from('students')
                        .select('id, roll_number, class_id')
                        .eq('roll_number', rollNumber)
                        .single();

                    if (studentError || !studentData) {
                        console.error(`Student lookup failed for "${rollNumber}":`, studentError);
                        errors.push(`Row ${importedData.indexOf(row) + 1}: Roll number "${rollNumber}" not found in database`);
                        failedCount++;
                        continue;
                    }

                    // Verify student belongs to the selected class
                    if (studentData.class_id !== selectedClass.id) {
                        // Find the class name this student actually belongs to
                        const { data: actualClass } = await supabase
                            .from('classes')
                            .select('class_name')
                            .eq('id', studentData.class_id)
                            .single();
                        
                        const actualClassName = actualClass?.class_name || 'Unknown';
                        errors.push(`Row ${importedData.indexOf(row) + 1}: Roll number "${rollNumber}" belongs to class "${actualClassName}", not "${activeFilters.class}"`);
                        failedCount++;
                        continue;
                    }

                    console.log(`Found student:`, studentData);

                    // Parse attendance dates (all columns except 'Roll Number')
                    let totalDays = 0;
                    let presentDays = 0;
                    let absentDays = 0;
                    let halfDays = 0;

                    for (const [key, value] of Object.entries(row)) {
                        // Skip Roll Number column
                        if (key.toLowerCase().includes('roll')) continue;
                        
                        // Skip empty/null values
                        if (!value || value === '') continue;

                        const status = String(value).toUpperCase();
                        
                        if (status === 'P') {
                            totalDays++;
                            presentDays++;
                        } else if (status === 'A') {
                            totalDays++;
                            absentDays++;
                        } else if (status === 'H') {
                            totalDays++;
                            halfDays++;
                        }
                    }

                    // Fetch existing attendance summary
                    const { data: existing, error: fetchError } = await supabase
                        .from('attendance_summary')
                        .select('*')
                        .eq('student_id', studentData.id)
                        .eq('class_id', selectedClass.id)
                        .maybeSingle();

                    const newTotalDays = (existing?.total_days || 0) + totalDays;
                    const newPresentDays = (existing?.present_days || 0) + presentDays;
                    const newHalfDays = (existing?.half_days || 0) + halfDays;
                    
                    // Calculate percentage: ((present + half*0.5) / total) * 100
                    const attendancePercentage = newTotalDays > 0 
                        ? ((newPresentDays + newHalfDays * 0.5) / newTotalDays) * 100 
                        : 0;

                    const attendanceRecord = {
                        student_id: studentData.id,
                        class_id: selectedClass.id,
                        batch_id: selectedBatch.id,
                        institute_id: selectedInstitution.id,
                        course_id: selectedCourse.id,
                        level_id: selectedLevel.id,
                        programme_id: selectedProgramme.id,
                        total_days: newTotalDays,
                        present_days: newPresentDays,
                        absent_days: (existing?.absent_days || 0) + absentDays,
                        half_days: newHalfDays,
                        attendance_percentage: parseFloat(attendancePercentage.toFixed(2)),
                        marked_by: metadata.marked_by
                    };

                    let upsertError;
                    
                    if (existing) {
                        // Update existing record
                        const { error } = await supabase
                            .from('attendance_summary')
                            .update(attendanceRecord)
                            .eq('id', existing.id);
                        upsertError = error;
                    } else {
                        // Insert new record
                        const { error } = await supabase
                            .from('attendance_summary')
                            .insert(attendanceRecord);
                        upsertError = error;
                    }

                    if (upsertError) {
                        errors.push(`Row ${importedData.indexOf(row) + 1}: ${upsertError.message}`);
                        failedCount++;
                    } else {
                        successCount++;
                    }

                } catch (error) {
                    errors.push(`Row ${importedData.indexOf(row) + 1}: ${error.message}`);
                    failedCount++;
                }
            }

            setLoading(false);

            if (errors.length > 0) {
                console.error('Import errors:', errors);
                
                // Show detailed error message
                const errorSummary = errors.slice(0, 5).join('\n');
                const remainingErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : '';
                alert(`Import completed with errors!\n\nSuccess: ${successCount}\nFailed: ${failedCount}\n\nFirst errors:\n${errorSummary}${remainingErrors}\n\nCheck console for full error list.`);
            } else {
                alert(`Import completed successfully!\nSuccess: ${successCount}`);
            }
            
            fetchInitialData(); // Refresh data

        } catch (error) {
            setLoading(false);
            alert(`Upload failed: ${error.message}`);
            console.error('Upload error:', error);
        }
    };

    // Handle Excel format download
    const handleDownloadExcelFormat = () => {
        // Create a template with Roll Number and sample date columns
        // Format: Roll Number | 2024-01-01 | 2024-01-02 | 2024-01-03
        // Values: P (Present), A (Absent), H (Half Day), or blank
        const templateData = [
            {
                'Roll Number': '00001',
                '2024-01-01': 'P',
                '2024-01-02': 'P',
                '2024-01-03': 'A',
                '2024-01-04': 'H',
                '2024-01-05': ''
            },
            {
                'Roll Number': '00002',
                '2024-01-01': 'P',
                '2024-01-02': 'A',
                '2024-01-03': 'P',
                '2024-01-04': 'P',
                '2024-01-05': 'H'
            },
            {
                'Roll Number': '00003',
                '2024-01-01': 'H',
                '2024-01-02': 'P',
                '2024-01-03': 'P',
                '2024-01-04': '',
                '2024-01-05': 'A'
            }
        ];
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(templateData);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance Template');
        
        // Generate file and download
        XLSX.writeFile(wb, 'attendance_upload_template.xlsx');
    };

    // Process Data for Table Display
    const getFilteredAttendanceData = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) return [];

        // First, filter by active filters (using IDs)
        let filtered = attendanceData;

        if (activeFilters.institution) {
            filtered = filtered.filter(record =>
                record.institutions?.id === activeFilters.institution
            );
        }

        if (activeFilters.course) {
            filtered = filtered.filter(record =>
                record.courses?.id === activeFilters.course
            );
        }

        if (activeFilters.level) {
            filtered = filtered.filter(record =>
                record.levels?.id === activeFilters.level
            );
        }

        if (activeFilters.programme) {
            filtered = filtered.filter(record =>
                record.programmes?.id === activeFilters.programme
            );
        }

        if (activeFilters.batch) {
            filtered = filtered.filter(record =>
                record.batches?.id === activeFilters.batch
            );
        }

        if (activeFilters.class) {
            filtered = filtered.filter(record =>
                record.classes?.id === activeFilters.class
            );
        }

        // Map to display format
        let data = filtered.map(record => ({
            id: record.id,
            rollno: record.students?.roll_number || 'N/A',
            name: record.students?.Users?.full_name || record.students?.Users?.username || 'Unknown',
            course: record.courses?.course_name || 'N/A',
            level: record.levels?.level_name || 'N/A',
            programme: record.programmes?.programme_name || 'N/A',
            batch: record.batches?.batch_name || 'N/A',
            class: record.classes?.class_name || 'N/A',
            total_days: record.total_days || 0,
            present_days: record.present_days || 0,
            half_days: record.half_days || 0,
            absent_days: record.absent_days || 0,
            attendance_percentage: record.attendance_percentage ? `${parseFloat(record.attendance_percentage).toFixed(2)}%` : '0%'
        }));

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(student =>
                student.name.toLowerCase().includes(query) ||
                String(student.rollno).toLowerCase().includes(query)
            );
        }

        // Print filtered data for debugging
        console.log('[AttendanceManagement] Filtered data for filters:', activeFilters, data);

        return data;
    }, [attendanceData, searchQuery, activeFilters]);

    // Handle edit attendance
    const handleEditAttendance = useCallback((attendanceRecord) => {
        setEditingAttendanceId(attendanceRecord.id);
        setEditFormData({
            total_days: attendanceRecord.total_days,
            present_days: attendanceRecord.present_days,
            half_days: attendanceRecord.half_days,
            absent_days: attendanceRecord.absent_days
        });
    }, []);

    // Handle save edit
    const handleSaveEdit = useCallback(async (attendanceId) => {
        try {
            setLoading(true);
            
            const totalDays = parseInt(editFormData.total_days);
            const presentDays = parseInt(editFormData.present_days);
            const halfDays = parseInt(editFormData.half_days);
            const absentDays = parseInt(editFormData.absent_days);

            if (isNaN(totalDays) || isNaN(presentDays) || isNaN(halfDays) || isNaN(absentDays)) {
                alert('Please enter valid numbers for all fields');
                return;
            }

            if (totalDays < 0 || presentDays < 0 || halfDays < 0 || absentDays < 0) {
                alert('Values cannot be negative');
                return;
            }

            // Calculate attendance percentage: ((present + half*0.5) / total) * 100
            const attendancePercentage = totalDays > 0 
                ? ((presentDays + halfDays * 0.5) / totalDays) * 100 
                : 0;

            const { error } = await supabase
                .from('attendance_summary')
                .update({
                    total_days: totalDays,
                    present_days: presentDays,
                    half_days: halfDays,
                    absent_days: absentDays,
                    attendance_percentage: parseFloat(attendancePercentage.toFixed(2))
                })
                .eq('id', attendanceId);

            if (error) throw error;

            alert('Attendance updated successfully!');
            setEditingAttendanceId(null);
            setEditFormData({ total_days: '', present_days: '', half_days: '', absent_days: '' });
            
            // Refresh data
            await fetchInitialData();
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Error updating attendance: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, [editFormData]);

    // Handle cancel edit
    const handleCancelEdit = useCallback(() => {
        setEditingAttendanceId(null);
        setEditFormData({ total_days: '', present_days: '', half_days: '', absent_days: '' });
    }, []);

    // Handle delete attendance
    const handleDeleteAttendance = useCallback(async (attendanceId) => {
        if (!window.confirm('Are you sure you want to delete this attendance record?')) {
            return;
        }

        try {
            setLoading(true);
            
            const { error } = await supabase
                .from('attendance_summary')
                .delete()
                .eq('id', attendanceId);

            if (error) throw error;

            alert('Attendance record deleted successfully!');
            
            // Refresh data
            await fetchInitialData();
        } catch (error) {
            console.error('Error deleting attendance:', error);
            alert('Error deleting attendance: ' + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    console.log('🎨 Rendering DynamicTable with filters:', attendanceFilterDefinitions);
    console.log('🎨 Active filters:', activeFilters);
    console.log('🎨 Has onFilterChange:', !!handleFilterChange);

    return (
        <div className="atm_wrapper"> 
            <div className='title-and-export-row'>
                <h1 className="atm_section-title">Student Attendance Management</h1>
            </div>

            <div className="attendance-table-container"> 
                <DynamicTable
                    data={getFilteredAttendanceData}
                    columnOrder={ATTENDANCE_COLUMNS} 
                    columnDisplayNameMap={columnDisplayNameMap} 
                    title='Attendance Summary' 
                    userRole={userRole}
                    
                    displayAtFixed={DISPLAY_AT_FIXED_RIGHT} 
                    onExcelFormat={handleDownloadExcelFormat}
                    customDescription={"** Upload Excel file with attendance data to update student records **"}
                    filterDefinitions={attendanceFilterDefinitions}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearchChange}
                    searchQuery={searchQuery}
                    
                    // Conditionally pass onDataImported only if ALL specific filters are selected
                    onDataImported={areAllFiltersSelected ? handleDataImport : undefined}
                    
                    // Actions handlers for edit/delete
                    onEditRow={handleEditAttendance}
                    onDeleteRow={handleDeleteAttendance}
                    editingRowId={editingAttendanceId}
                    editFormData={editFormData}
                    onEditFormChange={setEditFormData}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                />
            </div>
        </div>
    );
};

export default AttendanceManagement;