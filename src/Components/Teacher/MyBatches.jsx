import React, { useState, useEffect, useMemo } from "react";
import '../../Styles/SuperAdmin/TeacherBatches.css';
import {
    FiHome, FiStar, FiLayers, FiUsers, FiClock, FiBookOpen,
    FiChevronRight, FiCheckCircle, FiAlertTriangle, FiChevronLeft, FiMail,
    FiPackage, FiUser
} from "react-icons/fi";

// Import DynamicTable and CardSlider
import CardSlider from "../Reusable/CardSlider"; 
import DynamicTable from "../Reusable/DynamicTable"; 
import { supabase } from '../../config/supabaseClient';

// =======================================================
// === 1. TABLE CONFIGURATION ===
// =======================================================

// --- DynamicTable Configuration for Students ---
const STUDENT_COLUMN_ORDER = [
    'profile_url',
    'name',
    'id',
    'gender',
    'email',
    'phonenumber',
];

const STUDENT_DISPLAY_NAMES = {
    profile_url: 'Profile',
    name: 'Name',
    id: 'Student ID',
    gender: 'Gender',
    email: 'Email',
    phonenumber: 'Phone Number',
};

// =======================================================
// === 2. UTILITY COMPONENTS ===
// =======================================================

/**
 * Custom function to handle rendering the profile picture cell.
 */
const StudentProfileCellRenderer = ({ value, studentName }) => {
    const nameInitial = studentName ? studentName[0] : '?';
    return (
        <div className="tb_profile-cell">
            <img 
                src={value} 
                alt={nameInitial} 
                className="tb_profile-img"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/40x40/cccccc/000000?text=?" }}
            />
        </div>
    );
};


// =======================================================
// === 3. MAIN MY BATCHES COMPONENT ===
// =======================================================

const MyBatches = () => {
    // --- State for Data ---
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [teacherClasses, setTeacherClasses] = useState([]);
    
    // --- State for Selection Flow ---
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedProgramme, setSelectedProgramme] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [tableSearchTerm, setTableSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // --- Fetch Initial Data on Mount ---
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Get current user ID from session
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            const userId = userData?.user_id;

            if (!userId) {
                console.error('User ID not found');
                setLoading(false);
                return;
            }

            console.log('✅ Fetching data for user:', userId);

            // First, get the teacher's ID from the teachers table
            const { data: teacherData, error: teacherError } = await supabase
                .from('teachers')
                .select('id, employee_id')
                .eq('user_id', userId)
                .single();

            if (teacherError || !teacherData) {
                console.error('Teacher record not found:', teacherError);
                setLoading(false);
                return;
            }

            const teacherId = teacherData.id;
            console.log('✅ Teacher ID:', teacherId, 'Employee ID:', teacherData.employee_id);

            // Fetch teacher's assigned classes
            const { data: classTeachersData, error: ctError } = await supabase
                .from('class_teachers')
                .select('class_id')
                .eq('teacher_id', teacherId)
                .eq('is_active', true);

            if (ctError) throw ctError;

            const teacherClassIds = classTeachersData?.map(ct => ct.class_id) || [];
            setTeacherClasses(teacherClassIds);
            console.log('✅ Teacher assigned class IDs:', teacherClassIds);

            if (teacherClassIds.length === 0) {
                console.log('No classes assigned to teacher');
                setLoading(false);
                return;
            }

            // Fetch classes data with relationships
            const { data: classesData, error: classError } = await supabase
                .from('classes')
                .select(`
                    *, 
                    batches(
                        *, 
                        institutions(*), 
                        courses(*), 
                        levels(*), 
                        programmes(
                            *,
                            programme_subjects(
                                subjects(*)
                            )
                        )
                    )
                `)
                .in('id', teacherClassIds);

            if (classError) throw classError;

            setClasses(classesData || []);
            console.log('✅ Fetched classes:', classesData);

            // Extract unique institutions and batches from assigned classes
            const uniqueInstitutions = new Map();
            const uniqueBatches = new Map();

            classesData?.forEach(cls => {
                const batch = cls.batches;
                if (batch) {
                    // Add institution
                    if (batch.institutions) {
                        uniqueInstitutions.set(batch.institutions.id, batch.institutions);
                    }
                    // Add batch
                    if (!uniqueBatches.has(batch.id)) {
                        uniqueBatches.set(batch.id, {
                            ...batch,
                            assignedClasses: []
                        });
                    }
                    uniqueBatches.get(batch.id).assignedClasses.push(cls);
                }
            });

            setInstitutions(Array.from(uniqueInstitutions.values()));
            setBatches(Array.from(uniqueBatches.values()));

            console.log('✅ Unique Institutions:', Array.from(uniqueInstitutions.values()));
            console.log('✅ Unique Batches:', Array.from(uniqueBatches.values()));

            // Extract unique courses, levels, programmes
            const uniqueCourses = new Map();
            const uniqueLevels = new Map();
            const uniqueProgrammes = new Map();

            Array.from(uniqueBatches.values()).forEach(batch => {
                if (batch.courses) uniqueCourses.set(batch.courses.id, batch.courses);
                if (batch.levels) uniqueLevels.set(batch.levels.id, batch.levels);
                if (batch.programmes) uniqueProgrammes.set(batch.programmes.id, batch.programmes);
            });

            setCourses(Array.from(uniqueCourses.values()));
            setLevels(Array.from(uniqueLevels.values()));
            setProgrammes(Array.from(uniqueProgrammes.values()));

        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch students for selected class ---
    useEffect(() => {
        if (selectedClass) {
            fetchStudentsForClass(selectedClass.id);
        }
    }, [selectedClass]);

    const fetchStudentsForClass = async (classId) => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    *,
                    Users(user_id, full_name, email, phone)
                `)
                .eq('class_id', classId);

            if (error) throw error;
            
            // Flatten the data structure
            const flattenedStudents = data?.map(student => ({
                ...student,
                full_name: student.Users?.full_name || 'N/A',
                email: student.Users?.email || 'N/A',
                phonenumber: student.Users?.phone || 'N/A',
                student_id: student.roll_number || student.id
            })) || [];
            
            setStudents(flattenedStudents);
            console.log('✅ Fetched students for class:', flattenedStudents);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    // --- Filtering Logic ---
    const filteredCourses = useMemo(() => {
        if (!selectedInstitution) return courses;
        return courses.filter(course => 
            batches.some(b => 
                b.institutions?.id === selectedInstitution.id && 
                b.courses?.id === course.id
            )
        );
    }, [selectedInstitution, courses, batches]);

    const filteredLevels = useMemo(() => {
        if (!selectedCourse) return levels;
        return levels.filter(level => 
            batches.some(b => 
                b.courses?.id === selectedCourse.id && 
                b.levels?.id === level.id &&
                (!selectedInstitution || b.institutions?.id === selectedInstitution.id)
            )
        );
    }, [selectedCourse, levels, batches, selectedInstitution]);

    const filteredProgrammes = useMemo(() => {
        if (!selectedLevel) return programmes;
        return programmes.filter(prog => 
            batches.some(b => 
                b.levels?.id === selectedLevel.id && 
                b.programmes?.id === prog.id &&
                (!selectedCourse || b.courses?.id === selectedCourse.id) &&
                (!selectedInstitution || b.institutions?.id === selectedInstitution.id)
            )
        );
    }, [selectedLevel, programmes, batches, selectedCourse, selectedInstitution]);

    const filteredBatches = useMemo(() => {
        if (!selectedProgramme) return [];
        return batches.filter(b => 
            b.programmes?.id === selectedProgramme.id &&
            (!selectedLevel || b.levels?.id === selectedLevel.id) &&
            (!selectedCourse || b.courses?.id === selectedCourse.id) &&
            (!selectedInstitution || b.institutions?.id === selectedInstitution.id)
        );
    }, [selectedProgramme, batches, selectedLevel, selectedCourse, selectedInstitution]);

    const filteredClasses = useMemo(() => {
        if (!selectedBatch) return [];
        return classes.filter(cls => cls.batches?.id === selectedBatch.id);
    }, [selectedBatch, classes]);

    // --- Data Mapping for CardSlider ---
    const institutionMap = useMemo(() => 
        new Map(institutions.map(inst => [inst.id, inst.institute_name])), 
        [institutions]
    );
    
    const courseMap = useMemo(() => 
        new Map(filteredCourses.map(course => [course.id, course.course_name])), 
        [filteredCourses]
    );
    
    const levelMap = useMemo(() => 
        new Map(filteredLevels.map(level => [level.id, level.level_name])), 
        [filteredLevels]
    );
    
    const programmeMap = useMemo(() => 
        new Map(filteredProgrammes.map(prog => [prog.id, prog.programme_name])), 
        [filteredProgrammes]
    );
    
    const batchMap = useMemo(() => 
        new Map(filteredBatches.map(batch => [batch.id, batch.batch_name])), 
        [filteredBatches]
    );
    
    const classMap = useMemo(() => 
        new Map(filteredClasses.map(cls => [cls.id, cls.class_name])), 
        [filteredClasses]
    );

    // --- Handler Functions ---
    const handleSelectInstitution = (instId) => {
        const inst = institutions.find(i => i.id === instId);
        const newInstitution = (inst?.id === selectedInstitution?.id) ? null : inst;
        setSelectedInstitution(newInstitution);
        setSelectedCourse(null);
        setSelectedLevel(null);
        setSelectedProgramme(null);
        setSelectedBatch(null);
        setSelectedClass(null);
        setTableSearchTerm('');
    };
    
    const handleSelectCourse = (courseId) => {
        const course = courses.find(c => c.id === courseId);
        const newCourse = course?.id === selectedCourse?.id ? null : course;
        setSelectedCourse(newCourse);
        setSelectedLevel(null);
        setSelectedProgramme(null);
        setSelectedBatch(null);
        setSelectedClass(null);
        setTableSearchTerm('');
    };
    
    const handleSelectLevel = (levelId) => {
        const level = levels.find(l => l.id === levelId);
        const newLevel = level?.id === selectedLevel?.id ? null : level;
        setSelectedLevel(newLevel);
        setSelectedProgramme(null);
        setSelectedBatch(null);
        setSelectedClass(null);
        setTableSearchTerm('');
    };
    
    const handleSelectProgramme = (progId) => {
        const prog = programmes.find(p => p.id === progId);
        const newProg = prog?.id === selectedProgramme?.id ? null : prog;
        setSelectedProgramme(newProg);
        setSelectedBatch(null);
        setSelectedClass(null);
        setTableSearchTerm('');
    };

    const handleSelectBatch = (batchId) => {
        const batch = batches.find(b => b.id === batchId);
        const newBatch = batch?.id === selectedBatch?.id ? null : batch;
        setSelectedBatch(newBatch);
        setSelectedClass(null);
        setTableSearchTerm('');
    };

    const handleSelectClass = (classId) => {
        const cls = classes.find(c => c.id === classId);
        const newClass = cls?.id === selectedClass?.id ? null : cls;
        setSelectedClass(newClass);
        setTableSearchTerm('');
    };
    
    // --- Preparing Data for DynamicTable (Students) ---
    const studentDataForTable = useMemo(() => {
        if (!selectedClass) return [];
        
        const query = tableSearchTerm.toLowerCase();
        
        return students
            .filter(student => 
                student.full_name?.toLowerCase().includes(query) ||
                student.student_id?.toLowerCase().includes(query) ||
                student.email?.toLowerCase().includes(query) ||
                student.phonenumber?.toLowerCase().includes(query)
            )
            .map(student => ({
                id: student.student_id || student.id,
                name: student.full_name || 'N/A',
                gender: student.gender || 'N/A',
                email: student.email || 'N/A',
                phonenumber: student.phonenumber || 'N/A',
                profile_url: <StudentProfileCellRenderer 
                    value={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'User')}&size=40&background=random`}
                    studentName={student.full_name}
                />
            }));
    }, [selectedClass, tableSearchTerm, students]);

    // --- UI Render Components ---
    const renderBreadcrumbs = () => {
        const parts = [
            { label: "Institution", data: selectedInstitution, reset: () => handleSelectInstitution(selectedInstitution?.id) },
            { label: "Course", data: selectedCourse, reset: () => handleSelectCourse(selectedCourse?.id) },
            { label: "Level", data: selectedLevel, reset: () => handleSelectLevel(selectedLevel?.id) },
            { label: "Programme", data: selectedProgramme, reset: () => handleSelectProgramme(selectedProgramme?.id) },
            { label: "Batch", data: selectedBatch, reset: () => handleSelectBatch(selectedBatch?.id) },
            { label: "Class", data: selectedClass, reset: () => handleSelectClass(selectedClass?.id) },
        ].filter(part => part.data || (part.label !== "Class" && part.data === null));

        return (
            <div className="tb_breadcrumbs">
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <FiChevronRight className="tb_breadcrumb-separator" />}
                        <span
                            className={`tb_breadcrumb-item ${part.data ? 'tb_active' : ''}`}
                            onClick={part.data ? part.reset : null}
                            title={part.data ? `Click to go back to selecting ${part.label}` : part.label}
                        >
                            {part.data ? (part.data.institute_name || part.data.course_name || part.data.level_name || part.data.programme_name || part.data.batch_name || part.data.class_name) : `Select ${part.label}`}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="tb_wrapper">
                <h1 className="tb_title">My Batches</h1>
                <div className="tb_loading">Loading your assigned classes...</div>
            </div>
        );
    }

    if (teacherClasses.length === 0) {
        return (
            <div className="tb_wrapper">
                <h1 className="tb_title">My Batches</h1>
                <div className="tb_no-data">
                    <FiLayers size={64} style={{ color: '#ccc', marginBottom: '20px' }} />
                    <p>You have not been assigned to any classes yet.</p>
                    <p>Please contact your administrator for class assignments.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tb_wrapper">
            <h1 className="tb_title">My Batches</h1>

            {renderBreadcrumbs()}

            {/* STEP 1: Select Institution */}
            <CardSlider
                institutes={institutionMap}
                title='Institutions'
                icon_title="Institutions" 
                onSelectInstitute={handleSelectInstitution}
                fromTabOf="MyBatches" 
                activeId={selectedInstitution?.id}
                showSearch={false} 
            />
            
            {/* STEP 2: Select Course */}
            {selectedInstitution && (
                <CardSlider
                    institutes={courseMap}
                    title='Courses'
                    icon_title="Courses"
                    onSelectInstitute={handleSelectCourse}
                    fromTabOf="MyBatches"
                    activeId={selectedCourse?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 3: Select Level */}
            {selectedCourse && (
                <CardSlider
                    institutes={levelMap}
                    title='Levels'
                    icon_title="Levels"
                    onSelectInstitute={handleSelectLevel}
                    fromTabOf="MyBatches"
                    activeId={selectedLevel?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 4: Select Programme */}
            {selectedLevel && (
                <CardSlider
                    institutes={programmeMap}
                    title='Programme'
                    icon_title="Programme"
                    onSelectInstitute={handleSelectProgramme}
                    fromTabOf="MyBatches"
                    activeId={selectedProgramme?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 5: Select Batch */}
            {selectedProgramme && (
                <CardSlider
                    institutes={batchMap}
                    title='Batches'
                    icon_title="Batches"
                    onSelectInstitute={handleSelectBatch}
                    fromTabOf="MyBatches"
                    activeId={selectedBatch?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 6: Select Class */}
            {selectedBatch && (
                <CardSlider
                    institutes={classMap}
                    title='Classes'
                    icon_title="Classes"
                    onSelectInstitute={handleSelectClass}
                    fromTabOf="MyBatches"
                    activeId={selectedClass?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 7: Display Students Table */}
            {selectedClass && (
                <DynamicTable
                    data={studentDataForTable}
                    columnOrder={STUDENT_COLUMN_ORDER}
                    columnDisplayNameMap={STUDENT_DISPLAY_NAMES}
                    title={`Students in ${selectedClass.class_name} (${studentDataForTable.length})`}
                    onSearch={setTableSearchTerm}
                    onRowClickable={false} 
                    onEdit={null} 
                    onDelete={null}
                    onAddNew={null}
                />
            )}

        </div>
    );
};

export default MyBatches;
