import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import '../../Styles/SuperAdmin/TeacherBatches.css';
import {
    FiHome, FiStar, FiLayers, FiUsers, FiClock, FiBookOpen,
    FiChevronRight, FiCheckCircle, FiAlertTriangle, FiChevronLeft, FiMail,
    FiPackage, FiUser
} from "react-icons/fi";

// Import DynamicTable and CardSlider
import CardSlider from "../Reusable/CardSlider"; 
import DynamicTable from "../Reusable/DynamicTable"; 

// =======================================================
// === 1. MOCK/PLACEHOLDER DATA FOR UI LAYOUT DEMO ===
// =======================================================
const mockInstitutions = [
    { id: "INST001", name: "Apex Commerce College", icon: FiHome },
    { id: "INST002", name: "Zenith Professional College", icon: FiHome },
    { id: "INST003", name: "Elite Commerce Hub", icon: FiHome },
    { id: "INST004", name: "Global Academy of Finance", icon: FiHome },
    { id: "INST005", name: "The Professional Institute", icon: FiHome }
];

const mockStreams = [
    { id: "CA", name: "Chartered Accountancy", icon: FiStar },
    { id: "CMA", name: "Cost and Management Accountancy", icon: FiLayers }
];

const mockCoursesAndLevels = [
    { id: "CA_FND", name: "Foundation Level", stream: "Chartered Accountancy", icon: FiBookOpen, colorIndex: 0, streamId: "CA" },
    { id: "CA_INT", name: "Intermediate Level", stream: "Chartered Accountancy", icon: FiBookOpen, colorIndex: 1, streamId: "CA" },
    { id: "CMA_FND", name: "Foundation Level", stream: "CMA", icon: FiBookOpen, colorIndex: 2, streamId: "CMA" },
    { id: "CMA_INT", name: "Intermediate Level", stream: "CMA", icon: FiBookOpen, colorIndex: 3, streamId: "CMA" },
];

const mockProgramme = [
    { id: "PKG_SP", name: "Sure pass", icon: FiPackage, colorIndex: 0, courseLevelId: "CA_FND" },
    { id: "PKG_RM", name: "Remastered pack", icon: FiPackage, colorIndex: 1, courseLevelId: "CA_FND" },
    { id: "PKG_JP", name: "Junior pack", icon: FiPackage, colorIndex: 2, courseLevelId: "CA_INT" },
    { id: "PKG_CMA1", name: "CMA Pro", icon: FiPackage, colorIndex: 3, courseLevelId: "CMA_FND" },
];

const mockBatchTypes = [
    { id: "C1", name: "Morning Batch A1", courseLevelId: "CA_FND", packageId: "PKG_SP" },
    { id: "C2", name: "Evening Batch B2", courseLevelId: "CA_FND", packageId: "PKG_SP" },
    { id: "C3", name: "Weekend P1", courseLevelId: "CA_INT", packageId: "PKG_JP" },
    { id: "C4", name: "Online Flex", courseLevelId: "CA_INT", packageId: "PKG_JP" },
    { id: "C5", name: "CMA Elite", courseLevelId: "CMA_FND", packageId: "PKG_CMA1" },
    
    { id: "C6", name: "A", courseLevelId: "CA_FND", packageId: "PKG_RM" },
    { id: "C7", name: "B", courseLevelId: "CA_INT", packageId: "PKG_JP" },
    { id: "C8", name: "C", courseLevelId: "CMA_FND", packageId: "PKG_CMA1" },
];

const mockActualClasses = [
    { id: "ACT_A", name: "A" },
    { id: "ACT_B", name: "B" },
    { id: "ACT_C", name: "C" },
];

const mockSubjects = [
    { id: "S1", name: "Accounting & Reporting", icon: FiBookOpen, colorIndex: 0 },
    { id: "S2", name: "Business Law", icon: FiLayers, colorIndex: 1 },
    { id: "S3", name: "Quantitative Techniques", icon: FiStar, colorIndex: 2 },
];
// Helper map for quick subject object lookup
const subjectIdToName = mockSubjects.reduce((acc, sub) => {
    acc[sub.id] = sub.name;
    return acc;
}, {});


const mockBatches = [
    { id: "B1", name: "FND 2025/C1/S1", status: "Active", classes: 3, teachers: 4, batchTypeId: "C1", actualClassId: "ACT_A", subjectId: "S1", students: ['ST001', 'ST002', 'ST003'] },
    { id: "B2", name: "FND 2025/C1/S2", status: "Active", classes: 2, teachers: 3, batchTypeId: "C1", actualClassId: "ACT_B", subjectId: "S2", students: ['ST004', 'ST005'] },
    { id: "B3", name: "INT 2025/C3/S3", status: "Inactive", classes: 0, teachers: 2, batchTypeId: "C3", actualClassId: "ACT_A", subjectId: "S3", students: ['ST006'] },
    { id: "B4", name: "INT 2025/C4/S1", status: "Active", classes: 5, teachers: 1, batchTypeId: "C4", actualClassId: "ACT_C", subjectId: "S1", students: ['ST001', 'ST007', 'ST008'] },
    { id: "B5", name: "FND 2025/C2/S3", status: "Active", classes: 1, teachers: 4, batchTypeId: "C2", actualClassId: "ACT_A", subjectId: "S3", students: ['ST009', 'ST010'] },
    { id: "B6", name: "FND 2025/C6/S1/A", status: "Active", classes: 1, teachers: 4, batchTypeId: "C6", actualClassId: "ACT_A", subjectId: "S1", students: ['ST009', 'ST010'] },
    { id: "B7", name: "FND 2025/C6/S2/B", status: "Active", classes: 1, teachers: 4, batchTypeId: "C6", actualClassId: "ACT_B", subjectId: "S2", students: ['ST009', 'ST010'] },
];

const mockStudents = [
    { id: "ST001", name: "Alice Johnson", gender: "Female", email: "alice@example.com", phonenumber: "9876543210", profile_image_url: "https://placehold.co/40x40/6366f1/ffffff?text=AJ" },
    { id: "ST002", name: "Bob Williams", gender: "Male", email: "bob@example.com", phonenumber: "9876543211", profile_image_url: "https://placehold.co/40x40/f97316/ffffff?text=BW" },
    { id: "ST003", name: "Charlie Brown", gender: "Male", email: "charlie@example.com", phonenumber: "9876543212", profile_image_url: "https://placehold.co/40x40/10b981/ffffff?text=CB" },
    { id: "ST004", name: "Diana Prince", gender: "Female", email: "diana@example.com", phonenumber: "9876543213", profile_image_url: "https://placehold.co/40x40/ef4444/ffffff?text=DP" },
    { id: "ST005", name: "Ethan Hunt", gender: "Male", email: "ethan@example.com", phonenumber: "9876543214", profile_image_url: "https://placehold.co/40x40/3b82f6/ffffff?text=EH" },
    { id: "ST006", name: "Fiona Glenn", gender: "Female", email: "fiona@example.com", phonenumber: "9876543215", profile_image_url: "https://placehold.co/40x40/8b5cf6/ffffff?text=FG" },
    { id: "ST007", name: "George King", gender: "Male", email: "george@example.com", phonenumber: "9876543216", profile_image_url: "https://placehold.co/40x40/06b6d4/ffffff?text=GK" },
    { id: "ST008", name: "Hannah Lee", gender: "Female", email: "hannah@example.com", phonenumber: "9876543217", profile_image_url: "https://placehold.co/40x40/fb923c/ffffff?text=HL" },
    { id: "ST009", name: "Ivan Petrov", gender: "Male", email: "ivan@example.com", phonenumber: "9876543218", profile_image_url: "https://placehold.co/40x40/facc15/ffffff?text=IP" },
    { id: "ST010", name: "Jasmine Kaur", gender: "Female", email: "jasmine@example.com", phonenumber: "9876543219", profile_image_url: "https://placehold.co/40x40/a3e635/ffffff?text=JK" },
];

// Helper to look up student data by ID
const studentIdToObj = mockStudents.reduce((acc, student) => {
    acc[student.id] = student;
    return acc;
}, {});

// --- DynamicTable Configuration for Students ---
const STUDENT_COLUMN_ORDER = [
    'profile_url', // Rendered as JSX component
    'name',
    'id',
    'gender',
    'email',
    'phonenumber', // ADDED PHONENUMBER
];

const STUDENT_DISPLAY_NAMES = {
    profile_url: 'Profile',
    name: 'Name',
    id: 'Student ID',
    gender: 'Gender',
    email: 'Email',
    phonenumber: 'Phone Number', // ADDED PHONENUMBER
};

// --- DynamicTable Configuration for Batches (New Step 7) ---
const BATCHES_COLUMN_ORDER = [
    'name',
    'status',
    'subjectName', // Derived field
    'classes',
    'teachers',
];

const BATCHES_DISPLAY_NAMES = {
    name: 'Batch Name',
    status: 'Status',
    subjectName: 'Subject',
    classes: 'Total Classes',
    teachers: 'Teachers Count',
};


// =======================================================
// === 2. UTILITY COMPONENTS (Only needed helper is the custom cell renderer) ===
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
// === 3. MAIN TEACHER BATCHES COMPONENT ===
// =======================================================

const TeacherBatches = () => {
    // --- State for Selection Flow ---
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [selectedStream, setSelectedStream] = useState(null);
    const [selectedCourseLevel, setSelectedCourseLevel] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null); // Batch Type (C1, C2, etc.)
    const [selectedActualClass, setSelectedActualClass] = useState(null); // Actual Class (A, B, C)
    const [selectedBatch, setSelectedBatch] = useState(null); // The final selected batch object
    const [tableSearchTerm, setTableSearchTerm] = useState('');


    // --- Filtering Logic for Batch Data (Moved up for auto-selection logic) ---
    const getFilteredBatches = useCallback((batchType, actualClass) => {
        if (!batchType || !actualClass) return [];

        return mockBatches
            .filter(batch => 
                batch.batchTypeId === batchType.id && 
                batch.actualClassId === actualClass.id
            )
            .map(batch => ({
                ...batch,
                // Add the derived field needed for the table
                subjectName: subjectIdToName[batch.subjectId] || 'Unknown Subject',
            }));
    }, []);

    // --- Filtering Logic for CardSlider Data Generation ---
    const filteredLevels = useMemo(() => selectedStream
        ? mockCoursesAndLevels.filter(level => level.streamId === selectedStream.id)
        : mockCoursesAndLevels, [selectedStream]);

    const filteredProgramme = useMemo(() => selectedCourseLevel
        ? mockProgramme.filter(pkg => pkg.courseLevelId === selectedCourseLevel.id)
        : mockProgramme, [selectedCourseLevel]);

    const filteredBatchTypes = useMemo(() => selectedPackage 
        ? mockBatchTypes.filter(c => c.packageId === selectedPackage.id)
        : mockBatchTypes, [selectedPackage]);
    
    // --- Data Mapping for CardSlider ---
    const institutionMap = useMemo(() => new Map(mockInstitutions.map(inst => [inst.id, inst.name])), []);
    const streamMap = useMemo(() => new Map(mockStreams.map(stream => [stream.id, stream.name])), []);
    const levelMap = useMemo(() => new Map(filteredLevels.map(level => [level.id, level.name])), [filteredLevels]);
    const packageMap = useMemo(() => new Map(filteredProgramme.map(pkg => [pkg.id, pkg.name])), [filteredProgramme]);
    const batchTypeMap = useMemo(() => new Map(filteredBatchTypes.map(bType => [bType.id, bType.name])), [filteredBatchTypes]);
    const actualClassMap = useMemo(() => new Map(mockActualClasses.map(aClass => [aClass.id, aClass.name])), []);
    
    
    // --- Filtering and Preparing Data for DynamicTable (Batches - NOT DISPLAYED) ---
    const filteredBatches = useMemo(() => {
        const batches = getFilteredBatches(selectedClass, selectedActualClass);

        const query = tableSearchTerm.toLowerCase();
        if (!query) return batches;
        
        return batches.filter(batch => {
            return (
                batch.name.toLowerCase().includes(query) ||
                batch.status.toLowerCase().includes(query) ||
                batch.subjectName.toLowerCase().includes(query)
            );
        });
    }, [selectedClass, selectedActualClass, tableSearchTerm, getFilteredBatches]);

    
    // --- Handler Functions ---
    
    // Function to clear states based on dependency
    const clearDownstream = (clearActualClass = true, clearBatch = true) => {
        if (clearActualClass) setSelectedActualClass(null);
        if (clearBatch) setSelectedBatch(null);
        setTableSearchTerm(''); // Clear search on step change
    };

    const handleSelectInstitution = (instId) => {
        const inst = mockInstitutions.find(i => i.id === instId);
        const newInstitution = (inst?.id === selectedInstitution?.id) ? null : inst;
        setSelectedInstitution(newInstitution);
        
        setSelectedStream(null);
        setSelectedCourseLevel(null);
        setSelectedPackage(null); 
        setSelectedClass(null);
        clearDownstream();
    };
    
    const handleSelectStream = (streamId) => {
        const stream = mockStreams.find(s => s.id === streamId);
        const newStream = stream?.id === selectedStream?.id ? null : stream;
        setSelectedStream(newStream);
        
        setSelectedCourseLevel(null);
        setSelectedPackage(null); 
        setSelectedClass(null);
        clearDownstream();
    };
    
    const handleSelectLevel = (levelId) => {
        const level = mockCoursesAndLevels.find(l => l.id === levelId);
        const newLevel = level?.id === selectedCourseLevel?.id ? null : level;
        setSelectedCourseLevel(newLevel);
        
        setSelectedPackage(null); 
        setSelectedClass(null);
        clearDownstream();
    };
    
    const handleSelectPackage = (pkgId) => {
        const pkg = mockProgramme.find(p => p.id === pkgId);
        const newPackage = pkg?.id === selectedPackage?.id ? null : pkg;
        setSelectedPackage(newPackage);
        
        setSelectedClass(null);
        clearDownstream();
    };

    // Handler for Step 5: Select Batch Type
    const handleSelectClass = (batchTypeId) => {
        const batchTypeItem = mockBatchTypes.find(b => b.id === batchTypeId);
        const newBatchType = batchTypeItem?.id === selectedClass?.id ? null : batchTypeItem;
        setSelectedClass(newBatchType);
        
        // Clear downstream dependencies (Step 6 and Batch Table)
        clearDownstream();
    };

    // Handler for Step 6: Select Class (A, B, C) - AUTO-SELECTS FIRST BATCH
    const handleSelectActualClass = (actualClassId) => {
        const actualClassItem = mockActualClasses.find(a => a.id === actualClassId);
        const newActualClass = actualClassItem?.id === selectedActualClass?.id ? null : actualClassItem;
        setSelectedActualClass(newActualClass);

        // Auto-select the first batch or clear selection
        if (newActualClass && selectedClass) {
            const batches = getFilteredBatches(selectedClass, newActualClass);
            // Automatically select the first batch to move to the student view
            setSelectedBatch(batches.length > 0 ? batches[0] : null);
        } else {
            setSelectedBatch(null);
        }
        
        setTableSearchTerm(''); // Clear search on step change
    };
    
    // --- Preparing Data for DynamicTable (Students - Step 8) ---
    const studentDataForTable = useMemo(() => {
        if (!selectedBatch) return [];
        
        // 1. Get student IDs for the selected batch
        const studentIds = selectedBatch.students || [];
        
        // 2. Map IDs to full student objects
        const fullStudents = studentIds.map(id => studentIdToObj[id]).filter(s => s);
        
        // 3. Apply search filter
        const query = tableSearchTerm.toLowerCase();
        
        return fullStudents
            .filter(student => 
                student.name.toLowerCase().includes(query) ||
                student.id.toLowerCase().includes(query) ||
                student.email.toLowerCase().includes(query) ||
                student.phonenumber.toLowerCase().includes(query) // Include phone number in search
            )
            .map(student => ({
                // Flatten and restructure for DynamicTable
                id: student.id,
                name: student.name,
                gender: student.gender,
                email: student.email,
                phonenumber: student.phonenumber, // ADDED PHONENUMBER
                // Inject the JSX component for profile picture rendering
                profile_url: <StudentProfileCellRenderer 
                    value={student.profile_image_url} 
                    studentName={student.name}
                />
            }));
    }, [selectedBatch, tableSearchTerm]);

    // --- UI Render Components ---
    const renderBreadcrumbs = () => {
        const parts = [
            { label: "Institution", data: selectedInstitution, reset: () => handleSelectInstitution(selectedInstitution?.id) },
            { label: "Stream", data: selectedStream, reset: () => handleSelectStream(selectedStream?.id) },
            { label: "Level", data: selectedCourseLevel, reset: () => handleSelectLevel(selectedCourseLevel?.id) },
            { label: "Package", data: selectedPackage, reset: () => handleSelectPackage(selectedPackage?.id) }, 
            { label: "Batch Type", data: selectedClass, reset: () => handleSelectClass(selectedClass?.id) },
            { label: "Class", data: selectedActualClass, reset: () => handleSelectActualClass(selectedActualClass?.id) }, 
            // Display the final batch name in the breadcrumb
            { label: "Batch", data: selectedBatch, reset: () => setSelectedBatch(null) },
        ].filter(part => part.data || (part.label !== "Batch" && part.data === null)); 

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
                            {/* Logic to show the selected data name or the 'Select X' prompt */}
                            {part.data ? (part.label === "Batch" ? part.data.name : part.data.name) : `Select ${part.label}`}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        );
    };


    return (
        <div className="tb_wrapper">
            <h1 className="tb_title">Teacher Batches Overview</h1>

            {renderBreadcrumbs()}

            {/* STEP 1: Select Institution */}
            <CardSlider
                institutes={institutionMap}
                title='Institutions'
                icon_title="Institutions" 
                onSelectInstitute={handleSelectInstitution}
                fromTabOf="TeacherBatches" 
                activeId={selectedInstitution?.id}
                showSearch={false} 
            />
            
            {/* STEP 2: Select Stream */}
            {selectedInstitution && (
                <CardSlider
                    institutes={streamMap}
                    title='Courses'
                    icon_title="Courses"
                    onSelectInstitute={handleSelectStream}
                    fromTabOf="TeacherBatches"
                    activeId={selectedStream?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 3: Select Course Level */}
            {selectedStream && (
                <CardSlider
                    institutes={levelMap}
                    title='Levels'
                    icon_title="Levels"
                    onSelectInstitute={handleSelectLevel}
                    fromTabOf="TeacherBatches"
                    activeId={selectedCourseLevel?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 4: Select Package */}
            {selectedCourseLevel && (
                <CardSlider
                    institutes={packageMap}
                    title='Programme'
                    icon_title="Programme"
                    onSelectInstitute={handleSelectPackage}
                    fromTabOf="TeacherBatches"
                    activeId={selectedPackage?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 5: Select Batch Type */}
            {selectedPackage && ( 
                <CardSlider
                    institutes={batchTypeMap}
                    title='Batches'
                    icon_title="Batches"
                    onSelectInstitute={handleSelectClass}
                    fromTabOf="TeacherBatches"
                    activeId={selectedClass?.id}
                    showSearch={false}
                />
            )}

            {/* STEP 6: Select Class (A, B, C) */}
            {selectedClass && ( 
                <CardSlider
                    institutes={actualClassMap}
                    title='Classes'
                    icon_title="Classes"
                    onSelectInstitute={handleSelectActualClass}
                    fromTabOf="TeacherBatches"
                    activeId={selectedActualClass?.id}
                    showSearch={false}
                />
            )}

            {selectedBatch && (
                    <DynamicTable
                        data={studentDataForTable}
                        columnOrder={STUDENT_COLUMN_ORDER}
                        columnDisplayNameMap={STUDENT_DISPLAY_NAMES}
                        title={`Students (${studentDataForTable.length})`}
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

export default TeacherBatches;