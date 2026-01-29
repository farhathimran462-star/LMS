import React, { useState, useEffect, useRef, useMemo } from "react";
import '../../Styles/SuperAdmin/Batches.css';
import DynamicForm from "../Reusable/DynamicForm";
import DynamicTable from "../Reusable/DynamicTable";
import CardSlider from "../Reusable/CardSlider";
import { FiHome, FiX } from "react-icons/fi";
import { getAllInstitutions } from '../../api/institutionsApi';
import { getCoursesByInstitution } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getProgrammesByCourseLevel } from '../../api/programmesApi';
import { createBatch, getAllBatches } from '../../api/batchesApi';
import { createClassWithRelationships, getCompleteClassesDataByBatch } from '../../api/classesApi';
import { getAllStudents, getAllTeachers } from '../../api/usersApi';

// Mock data for teachers and subjects (replace with API calls as needed)
const MOCK_TEACHERS = [
    { id: 'T001', name: 'John Doe', subjects: ['Math', 'Physics'] },
    { id: 'T002', name: 'Jane Smith', subjects: ['Chemistry', 'Biology'] },
    { id: 'T003', name: 'Mike Johnson', subjects: ['English', 'History'] },
];

const MOCK_SUBJECTS = [
    { id: 'S001', name: 'Mathematics' },
    { id: 'S002', name: 'Physics' },
    { id: 'S003', name: 'Chemistry' },
    { id: 'S004', name: 'Biology' },
    { id: 'S005', name: 'English' },
];

const MOCK_STUDENTS = [
    { label: "Alice Johnson", value: "stu_001" },
    { label: "Bob Smith", value: "stu_002" },
    { label: "Charlie Brown", value: "stu_003" },
    { label: "Diana Prince", value: "stu_004" },
    { label: "Evan Wright", value: "stu_005" },
    { label: "Fiona Gallagher", value: "stu_006" },
];

const BATCHES_COLUMN_ORDER = [
    'batch_name',
    'mode',
    'totalClasses',
    'start_time',
    'end_time',
    'location'
];

// Format Real Student Data for Display
const formatRealStudentData = (classDetail, contextData) => {
    if (!classDetail.students || classDetail.students.length === 0) {
        return [];
    }
    
    return classDetail.students.map((studentRecord, index) => {
        // studentRecord now contains data from students table + joined user data
        const user = studentRecord.student; // User data from Users table
        if (!studentRecord) return null;
        
        // Use dicebear avatar with student's user_id as seed
        const avatarSeed = studentRecord.user_id || `student_${index}`;
        
        return {
            id: studentRecord.id, // students.id
            roll: studentRecord.roll_number || `R-${String(index + 1).padStart(4, '0')}`,
            profile_name: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                        src={user?.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                        alt="profile" 
                        style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            border: '1px solid #e0e0e0',
                            backgroundColor: '#f8f9fa'
                        }}
                    />
                    <span style={{ fontWeight: 500 }}>{user?.full_name || user?.username || 'N/A'}</span>
                </div>
            ),
            name_search: user?.full_name || user?.username || 'N/A',
            institution: contextData.institution || "N/A",
            course: contextData.course || "N/A",
            level: contextData.level || "N/A",
            programme: contextData.programme || "N/A",
            batch: contextData.batch || "N/A",
            class_name: classDetail.class_name,
            email: user?.email || 'N/A',
            phone: user?.phone || user?.phone_number || 'N/A',
            gender: user?.gender || 'N/A'
        };
    }).filter(Boolean); // Remove null entries
};

const STUDENTS_COLUMN_ORDER = [
    'roll', 
    'profile_name', 
    'institution', 
    'course', 
    'level', 
    'programme', 
    'batch', 
    'class_name', 
    'email', 
    'phone', 
    'gender'
];

const STUDENTS_COLUMN_DISPLAY = {
    roll: 'Roll No',
    profile_name: 'Student Details',
    institution: 'Institution',
    course: 'Course',
    level: 'Level',
    programme: 'Programme',
    batch: 'Batch',
    class_name: 'Class',
    email: 'Email',
    phone: 'Phone',
    gender: 'Gender'
};

const Batches = ({ userRole }) => {
    // Refs for scrolling
    const coursesRef = useRef(null);
    const levelsRef = useRef(null);
    const programmesRef = useRef(null);
    const batchesListRef = useRef(null);
    const classDetailsRef = useRef(null);

    // Institution, Course, Level, Programme States
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedProgramme, setSelectedProgramme] = useState(null);

    // Batch and Class States
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [tableSearchTerm, setTableSearchTerm] = useState('');

    // Students and Teachers from DB
    const [allStudents, setAllStudents] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);

    // Search terms
    const [instSearchTerm, setInstSearchTerm] = useState("");
    const [courseSearchTerm, setCourseSearchTerm] = useState("");

    // Form States
    const [formModalState, setFormModalState] = useState({ 
        isOpen: false, 
        mode: 'creation', 
        data: null,
        fieldsConfig: [] 
    });

    const [classFormModalState, setClassFormModalState] = useState({
        isOpen: false,
        mode: 'creation',
        data: null
    });

    const [addInstitutionOpen, setAddInstitutionOpen] = useState(false);
    const [newInstitutionName, setNewInstitutionName] = useState("");
    const [loading, setLoading] = useState(false);

    // --- FETCH DB DATA ---
    useEffect(() => {
        getAllInstitutions().then(({ data }) => setInstitutions(data || []));
        
        // Fetch students and teachers with their table IDs
        getAllStudents().then(({ data }) => setAllStudents(data || []));
        getAllTeachers().then(({ data }) => setAllTeachers(data || []));
    }, []);

    useEffect(() => {
        if (selectedInstitution) {
            // Fetch courses for the selected institution from junction table
            getCoursesByInstitution(selectedInstitution).then(({ data }) => setCourses(data || []));
        } else {
            setCourses([]);
        }
    }, [selectedInstitution]);

    useEffect(() => {
        if (selectedCourse) {
            console.log('Fetching levels for course:', selectedCourse);
            getLevelsByCourse(selectedCourse).then(({ data, error }) => {
                console.log('Levels response:', { data, error });
                setLevels(data || []);
            });
        } else {
            setLevels([]);
        }
    }, [selectedCourse]);

    useEffect(() => {
        if (selectedCourse && selectedLevel) {
            console.log('Fetching programmes for course:', selectedCourse, 'and level:', selectedLevel);
            getProgrammesByCourseLevel(selectedCourse, selectedLevel).then(({ data }) => setProgrammes(data || []));
        }
    }, [selectedCourse, selectedLevel]);

    // --- FETCH BATCHES AND CLASSES ---
    useEffect(() => {
        if (selectedInstitution && selectedCourse && selectedLevel && selectedProgramme) {
            getAllBatches().then(async ({ data }) => {
                const filtered = (data || []).filter(b =>
                    b.institute_id === selectedInstitution &&
                    b.course_id === selectedCourse &&
                    b.level_id === selectedLevel &&
                    b.programme_id === selectedProgramme
                );
                
                // Fetch classes for each batch from database
                const batchesWithClasses = await Promise.all(
                    filtered.map(async (batch) => {
                        console.log('Fetching classes for batch:', batch.id);
                        const { data: classesData } = await getCompleteClassesDataByBatch(batch.id);
                        const classes = (classesData || []).map(cls => ({
                            class_id: cls.id,
                            class_name: cls.class_name,
                            description: cls.description,
                            students_ids: cls.students?.map(s => s.id) || [], // students.id
                            students: cls.students || [], // Store full student objects
                            totalStudents: cls.totalStudents || 0,
                            teachersIds: cls.teachers?.map(t => t.teacher_id) || [], // teachers.id from class_teachers
                            teachers: cls.teachers || [], // Store full teacher objects
                            subjectsIds: cls.subjects?.map(s => s.id) || [],
                            subjects: cls.subjects || [] // Store full subject objects
                        }));
                        
                        return {
                            ...batch,
                            id: batch.id,
                            classes: classes,
                            totalClasses: classes.length
                        };
                    })
                );
                
                setBatches(batchesWithClasses);
            });
        } else {
            setBatches([]);
        }
    }, [selectedInstitution, selectedCourse, selectedLevel, selectedProgramme]);

    // Derived data
    const institutionMap = useMemo(() => 
        new Map(institutions.map(i => [
            i.id || i.institution_id,
            i.institution_name || i.institute_name || i.name || i.institution_id
        ])), 
        [institutions]
    );

    // Institutions with images for CardSlider
    const institutionsForSlider = useMemo(() => {
        return new Map(institutions.map(inst => [
            inst.id || inst.institution_id,
            {
                name: inst.institution_name || inst.institute_name || inst.name || inst.institution_id,
                image: inst.photo || inst.profilePhoto || ''
            }
        ]));
    }, [institutions]);

    const courseMap = useMemo(() => 
        new Map(courses.map(c => [c.id, c.course_name])), 
        [courses]
    );

    const levelMap = useMemo(() => 
        new Map(levels.map(l => [l.id, l.level_name])), 
        [levels]
    );

    const programmeMap = useMemo(() => 
        new Map(programmes.map(p => [p.id, p.programme_name])), 
        [programmes]
    );

    const classMap = useMemo(() => {
        if (selectedBatch) {
            return new Map(selectedBatch.classes.map(c => [c.class_id, c.class_name]));
        }
        return new Map();
    }, [selectedBatch]);

    // Student and Teacher Options for class form from DB
    const studentOptions = useMemo(() => {
        console.log('Student options from DB:', allStudents.length, 'students');
        if (allStudents.length === 0) {
            return [{ label: 'No students available - Create students in User Management first', value: '', disabled: true }];
        }
        return allStudents.map(s => ({
            label: `${s.name || s.email || 'Student'} - ${s.roll_number || 'No Roll'}`,
            value: s.id // students.id, not user_id
        }));
    }, [allStudents]);

    const teacherOptions = useMemo(() => {
        console.log('Teacher options from DB:', allTeachers.length, 'teachers');
        if (allTeachers.length === 0) {
            return [{ label: 'No teachers available - Create teachers in User Management first', value: '', disabled: true }];
        }
        return allTeachers.map(t => ({
            label: `${t.name || t.email || 'Teacher'} - ${t.employee_id || 'No ID'}`,
            value: t.id // teachers.id, not user_id
        }));
    }, [allTeachers]);

    // Scroll Effects
    const scrollToRef = (ref) => {
        if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    useEffect(() => { window.scrollTo(0, 0); }, []);
    useEffect(() => { if (selectedInstitution) scrollToRef(coursesRef); }, [selectedInstitution]);
    useEffect(() => { if (selectedCourse) scrollToRef(levelsRef); }, [selectedCourse]);
    useEffect(() => { if (selectedLevel) scrollToRef(programmesRef); }, [selectedLevel]);
    useEffect(() => { if (selectedProgramme) setTimeout(() => scrollToRef(batchesListRef), 100); }, [selectedProgramme]);
    useEffect(() => { if (selectedBatch || selectedClass) setTimeout(() => scrollToRef(classDetailsRef), 100); }, [selectedBatch, selectedClass]);

    // --- BATCH FORM CONFIG ---
    const getBatchFormConfig = () => {
        return [
            {
                name: 'institution',
                label: 'Institution',
                type: 'text-enter',
                readOnly: true,
                fullWidth: true,
                hintText: "Selected from dashboard"
            },
            {
                name: 'course',
                label: 'Course',
                type: 'text-enter',
                readOnly: true,
                hintText: "Selected from dashboard"
            },
            {
                name: 'level',
                label: 'Level',
                type: 'text-enter',
                readOnly: true,
                hintText: "Selected from dashboard"
            },
            {
                name: 'programme',
                label: 'Programme',
                type: 'text-enter',
                readOnly: true,
                fullWidth: true,
                hintText: "Selected from dashboard"
            },
            { 
                name: 'batch_name', 
                label: 'Batch Name', 
                type: 'text-enter', 
                required: true, 
                fullWidth: true 
            },
            { 
                name: 'description', 
                label: 'Description', 
                type: 'text-enter', 
                required: false, 
                fullWidth: true,
            },
            { 
                name: 'start_time', 
                label: 'Start Time', 
                type: 'time-start',
                required: true
            },
            { 
                name: 'end_time', 
                label: 'End Time', 
                type: 'time-end',
                required: true
            },
            {
                name: 'mode',
                label: 'Mode',
                type: 'single-select',
                options: [
                    { label: 'Offline', value: 'Offline' },
                    { label: 'Hybrid', value: 'Hybrid' },
                    { label: 'Online', value: 'Online' },
                ],
                required: true
            },
            { 
                name: 'location', 
                label: 'Location', 
                type: 'text-enter', 
                fullWidth: true 
            },
            { 
                name: 'notes', 
                label: 'Notes', 
                type: 'text-enter', 
                fullWidth: true 
            }
        ];
    };

    // --- CLASS FORM CONFIG ---
    const getClassFormConfig = (studentOptions, teacherOptions) => {
        return [
            { name: 'institution', label: 'Institution', type: 'text-enter', readOnly: true, fullWidth: true },
            { name: 'course', label: 'Course', type: 'text-enter', readOnly: true },
            { name: 'level', label: 'Level', type: 'text-enter', readOnly: true },
            { name: 'programme', label: 'Programme', type: 'text-enter', readOnly: true, fullWidth: true },
            { name: 'batch', label: 'Batch Name', type: 'text-enter', readOnly: true, fullWidth: true },
            { 
                name: 'class_name', 
                label: 'Class Name', 
                type: 'text-enter', 
                required: true, 
                fullWidth: true 
            },
            { 
                name: 'description', 
                label: 'Description', 
                type: 'text-enter', 
                fullWidth: true,
                hintText: "Topic details or special instructions"
            },
            {
                name: 'teachers',
                label: 'Assign Class Teachers',
                type: 'multi-select',
                options: teacherOptions, 
                fullWidth: true,
                required: false,
                placeholder: "Select teachers for this class"
            },
            {
                name: 'students',
                label: 'Add Students',
                type: 'multi-select',
                options: studentOptions,
                fullWidth: true,
                required: false,
                placeholder: "Select students to add to this class"
            }
        ];
    };

    // --- HANDLERS ---
    const handleInstitutionSelect = (instId) => {
        setSelectedInstitution(instId);
        setSelectedCourse(null);
        setSelectedLevel(null);
        setSelectedProgramme(null);
        setBatches([]);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleCourseSelect = (courseId) => {
        setSelectedCourse(courseId);
        setSelectedLevel(null);
        setSelectedProgramme(null);
        setBatches([]);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleLevelSelect = (levelId) => {
        setSelectedLevel(levelId);
        setSelectedProgramme(null);
        setBatches([]);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleProgrammeSelect = (programmeId) => {
        setSelectedProgramme(programmeId);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleRowSelect = (batchId) => {
        const batch = batches.find(b => b.id === batchId || b.batch_id === batchId);
        if (selectedBatch?.id === batchId || selectedBatch?.batch_id === batchId) {
            setSelectedBatch(null);
            setSelectedClass(null);
        } else if (batch) {
            setSelectedBatch(batch);
            setSelectedClass(null);
        }
    };

    const handleClassSelect = (classId) => {
        const selectedClassDetail = selectedBatch?.classes.find(c => c.class_id === classId);
        if (selectedClass?.class_id === classId) {
            setSelectedClass(null);
        } else {
            setSelectedClass(selectedClassDetail);
        }
    };

    const handleNewInstitutionSubmit = (e) => {
        e.preventDefault();
        setAddInstitutionOpen(false);
        setNewInstitutionName("");
    };

    const handleEditClick = (batchRow) => {
        setFormModalState({
            isOpen: true,
            mode: 'edition',
            fieldsConfig: getBatchFormConfig(),
            data: {
                ...batchRow,
                institution: institutionMap.get(selectedInstitution),
                course: courseMap.get(selectedCourse),
                level: levelMap.get(selectedLevel),
                programme: programmeMap.get(selectedProgramme),
            }
        });
    };

    const handleAddClick = () => {
        setFormModalState({
            isOpen: true,
            mode: 'creation',
            fieldsConfig: getBatchFormConfig(),
            data: {
                institution: institutionMap.get(selectedInstitution),
                course: courseMap.get(selectedCourse),
                level: levelMap.get(selectedLevel),
                programme: programmeMap.get(selectedProgramme),
                batch_name: "",
                description: "",
                start_time: "09:00 AM",
                end_time: "01:00 PM",
                mode: "Hybrid",
                location: "",
                notes: ""
            }
        });
    };
    const handleBatchSubmit = async (formData, mode) => {
        setLoading(true);
        try {
            const batchData = {
                batch_name: formData.batch_name,
                description: formData.description,
                start_time: formData.start_time,
                end_time: formData.end_time,
                mode: formData.mode,
                location: formData.location,
                notes: formData.notes,
                institute_id: selectedInstitution,
                course_id: selectedCourse,
                level_id: selectedLevel,
                programme_id: selectedProgramme
            };

            if (mode === 'edition') {
                // Update existing batch (add update API call when available)
                setBatches(prevBatches => 
                    prevBatches.map(b => 
                        (b.id === formData.id || b.batch_id === formData.id) 
                            ? { ...b, ...batchData }
                            : b
                    )
                );
                alert('Batch updated successfully!');
            } else {
                const { data, error } = await createBatch(batchData);
                if (error) throw error;
                
                // Add new batch to list
                const newBatch = {
                    ...batchData,
                    id: data?.id || `batch_${Date.now()}`,
                    batch_id: data?.id || `batch_${Date.now()}`,
                    classes: [],
                    totalClasses: 0
                };
                setBatches(prev => [...prev, newBatch]);
                alert('Batch created successfully!');
            }
            
            setFormModalState({ isOpen: false, mode: 'creation', data: null, fieldsConfig: [] });
        } catch (error) {
            alert('Error with batch: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClassClick = () => {
        setClassFormModalState({
            isOpen: true,
            mode: 'creation',
            data: {
                institution: institutionMap.get(selectedInstitution),
                course: courseMap.get(selectedCourse),
                level: levelMap.get(selectedLevel),
                programme: programmeMap.get(selectedProgramme),
                batch: selectedBatch?.batch_name,
                class_name: "",
                description: "",
                students: [],
                teachers: []
            }
        });
    };

    const handleClassFormSubmit = async (formData) => {
        if (!selectedBatch) return;

        setLoading(true);
        try {
            // Validate selected teachers exist
            if (formData.teachers && formData.teachers.length > 0) {
                const invalidTeachers = formData.teachers.filter(teacherId => 
                    !allTeachers.some(t => t.id === teacherId)
                );
                if (invalidTeachers.length > 0) {
                    throw new Error(`Invalid teacher IDs: ${invalidTeachers.join(', ')}. Please create teachers first in User Management.`);
                }
            }

            // Validate selected students exist
            if (formData.students && formData.students.length > 0) {
                const invalidStudents = formData.students.filter(studentId => 
                    !allStudents.some(s => s.id === studentId)
                );
                if (invalidStudents.length > 0) {
                    throw new Error(`Invalid student IDs: ${invalidStudents.join(', ')}. Please create students first in User Management.`);
                }
            }

            // Prepare teacher assignments with roles (formData.teachers contains teachers.id values)
            const teacherAssignments = (formData.teachers || []).map((teacherId, index) => ({
                teacherId: teacherId, // This is teachers.id
                role: index === 0 ? 'primary' : 'assistant'
            }));

            console.log('All teachers in DB:', allTeachers.map(t => ({ id: t.id, name: t.name })));
            console.log('Selected teacher IDs:', formData.teachers);
            console.log('Teacher assignments:', teacherAssignments);

            const classData = {
                class_name: formData.class_name,
                description: formData.description,
                institute_id: selectedInstitution,
                course_id: selectedCourse,
                level_id: selectedLevel,
                programme_id: selectedProgramme,
                batch_id: selectedBatch.id,
                student_ids: formData.students || [], // This should be students.id array
                teacher_assignments: teacherAssignments
            };

            console.log('Submitting class data:', classData);

            // Create class in database with relationships
            const { data: newClass, error } = await createClassWithRelationships(classData);
            if (error) throw error;

            // Transform the created class to match UI format
            const formattedClass = {
                class_id: newClass.id,
                class_name: newClass.class_name,
                description: newClass.description,
                students_ids: newClass.students?.map(s => s.id) || [],
                students: newClass.students || [],
                totalStudents: newClass.totalStudents || 0,
                teachersIds: newClass.teachers?.map(t => t.teacher_id) || [],
                teachers: newClass.teachers || [],
                subjectsIds: newClass.subjects?.map(s => s.id) || [],
                subjects: newClass.subjects || []
            };

            // Update local state with new class
            setBatches(prevBatches => {
                return prevBatches.map(b => {
                    if (b.id === selectedBatch.id) {
                        const updatedClasses = [...(b.classes || []), formattedClass];
                        const updatedBatch = {
                            ...b,
                            classes: updatedClasses,
                            totalClasses: updatedClasses.length
                        };
                        setSelectedBatch(updatedBatch);
                        return updatedBatch;
                    }
                    return b;
                });
            });

            alert('Class created successfully!');
            setClassFormModalState({ isOpen: false, mode: 'creation', data: null });
        } catch (error) {
            console.error('Error creating class:', error);
            alert('Error creating class: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchDelete = (batchRow) => {
        if (window.confirm('Are you sure you want to delete this batch?')) {
            setBatches(prevBatches => prevBatches.filter(b => 
                b.id !== batchRow.id && b.batch_id !== batchRow.id
            ));
            if (selectedBatch?.id === batchRow.id || selectedBatch?.batch_id === batchRow.id) {
                setSelectedBatch(null);
                setSelectedClass(null);
            }
        }
    };

    const handleTableSearchChange = (query) => {
        setTableSearchTerm(query);
    };

    const filteredBatches = useMemo(() => {
        if (!tableSearchTerm) return batches;
        const query = tableSearchTerm.toLowerCase();
        return batches.filter(batch => {
            return (
                batch.batch_name?.toLowerCase().includes(query) ||
                batch.location?.toLowerCase().includes(query) ||
                batch.mode?.toLowerCase().includes(query)
            );
        });
    }, [batches, tableSearchTerm]);

    const batchColumnDisplayNameMap = useMemo(() => ({
        batch_name: 'Batch Name',
        mode: 'Mode',
        totalClasses: 'Classes',
        start_time: 'Start Time',
        end_time: 'End Time',
        location: 'Location',
    }), []);

    // --- RENDER FUNCTIONS ---
    const renderBatchesList = () => selectedProgramme && (
        <div ref={batchesListRef}>
            <DynamicTable
                data={filteredBatches}
                columnOrder={BATCHES_COLUMN_ORDER}
                columnDisplayNameMap={batchColumnDisplayNameMap}
                customDescription={"** Select Batches row to view CLASSES **"}
                title="Batches"
                onEdit={handleEditClick}
                userRole={userRole}
                onDelete={handleBatchDelete}
                onAddNew={handleAddClick}
                onSearch={handleTableSearchChange}
                onRowClick={handleRowSelect}
                selectedRowId={selectedBatch?.id || selectedBatch?.batch_id}
                onRowClickable={true}
            />
        </div>
    );

    const renderClassDetails = () => selectedBatch && (
        <div ref={classDetailsRef}>
            <CardSlider
                institutes={classMap}
                title={`Classes`}
                icon_title="Classes"
                fromTabOf="Classes"
                onSelectInstitute={handleClassSelect}
                activeId={selectedClass?.class_id}
                showSearch={false}
                onAddButtonClick={handleAddClassClick}
            />
            
            {selectedClass && (
                <div style={{ marginTop: '20px' }}>
                    <DynamicTable
                        data={formatRealStudentData(selectedClass, {
                            institution: institutionMap.get(selectedInstitution),
                            course: courseMap.get(selectedCourse),
                            level: levelMap.get(selectedLevel),
                            programme: programmeMap.get(selectedProgramme),
                            batch: selectedBatch.batch_name
                        })}
                        columnOrder={STUDENTS_COLUMN_ORDER}
                        columnDisplayNameMap={STUDENTS_COLUMN_DISPLAY}
                        title={`Student Details - ${selectedClass.class_name}`}
                        onSearch={null}
                        onAddNew={null}
                        userRole={'teacher'}
                    />
                </div>
            )}
        </div>
    );

    // --- RENDER ---
    return (
        <div className="batches-wrapper">
            <h1 className="batch_title">Batch Management</h1>
            
            {/* Institute Selection */}
            <CardSlider
                institutes={institutionsForSlider}
                title="Institutions"
                icon_title="Institutions"
                onSelectInstitute={handleInstitutionSelect}
                fromTabOf="Batches"
                activeId={selectedInstitution}
                searchTerm={instSearchTerm}
                onSearchChange={setInstSearchTerm}
                onAddButtonClick={() => setAddInstitutionOpen(true)}
            />
            
            {/* Course Selection */}
            {selectedInstitution && (
                <div ref={coursesRef}>
                    <CardSlider
                        institutes={courseMap}
                        title="Courses"
                        icon_title="Courses"
                        fromTabOf="Batches"
                        onSelectInstitute={handleCourseSelect}
                        activeId={selectedCourse}
                        searchTerm={courseSearchTerm}
                        onSearchChange={setCourseSearchTerm}
                    />
                </div>
            )}
            
            {/* Level Selection */}
            {selectedCourse && (
                <div ref={levelsRef}>
                    <CardSlider
                        institutes={levelMap}
                        title="Levels"
                        icon_title="Levels"
                        fromTabOf="Batches"
                        onSelectInstitute={handleLevelSelect}
                        activeId={selectedLevel}
                    />
                </div>
            )}
            
            {/* Programme Selection */}
            {selectedLevel && (
                <div ref={programmesRef}>
                    <CardSlider
                        institutes={programmeMap}
                        title="Programmes"
                        icon_title="Programmes"
                        fromTabOf="Batches"
                        onSelectInstitute={handleProgrammeSelect}
                        activeId={selectedProgramme}
                    />
                </div>
            )}

            {/* Batches List */}
            {renderBatchesList()}
            
            {/* Class Details with Students */}
            {renderClassDetails()}

            {/* Add Institution Modal */}
            {addInstitutionOpen && (
                <div className="batch_modal batch_add-institution-modal">
                    <div className="batch_modal-content">
                        <div className="batch_modal-header">
                            <h3><FiHome /> Add New Institution</h3>
                            <FiX onClick={() => setAddInstitutionOpen(false)} className="batch_close-modal" />
                        </div>
                        <form onSubmit={handleNewInstitutionSubmit}>
                            <label htmlFor="instName">Institution Name <span className="required">*</span></label>
                            <input
                                id="instName"
                                name="instName"
                                type="text"
                                placeholder="e.g., Oxford High School"
                                value={newInstitutionName}
                                onChange={(e) => setNewInstitutionName(e.target.value)}
                                required
                            />
                            <div className="batch_modal-actions">
                                <button type="button" className="batch_btn-secondary" onClick={() => setAddInstitutionOpen(false)}>Cancel</button>
                                <button type="submit" className="batch_btn-primary">Add Institution</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Form Modal */}
            {formModalState.isOpen && (
                <DynamicForm
                    isOpen={formModalState.isOpen}
                    mode={formModalState.mode}
                    fieldsConfig={formModalState.fieldsConfig}
                    initialData={formModalState.data}
                    onClose={() => setFormModalState(prev => ({ ...prev, isOpen: false }))}
                    onSubmit={handleBatchSubmit}
                />
            )}

            {/* Class Form Modal */}
            {classFormModalState.isOpen && (
                <DynamicForm
                    isOpen={classFormModalState.isOpen}
                    mode={classFormModalState.mode}
                    fieldsConfig={getClassFormConfig(studentOptions, teacherOptions)}
                    initialData={classFormModalState.data}
                    onClose={() => setClassFormModalState(prev => ({ ...prev, isOpen: false }))}
                    onSubmit={handleClassFormSubmit}
                />
            )}

            {loading && <div>Loading...</div>}
        </div>
    );
};

export default Batches;