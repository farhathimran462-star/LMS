import "../../../Styles/SuperAdmin/Assignment.css";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
    FiSearch, FiX, FiBookOpen, FiZap, FiCalendar, FiArrowLeft, FiArrowRight, 
    FiCheckCircle, FiGrid, FiList, FiClock, FiFileText, FiDownload, 
    FiUpload, FiEdit, FiTrash2, FiMaximize2, FiLayers, FiCheckSquare, 
    FiAlertCircle, FiPlus, FiSave, FiUploadCloud, FiPaperclip, FiEye,
    FiExternalLink // <--- ADDED THIS IMPORT
} from "react-icons/fi";
import DynamicTable from "../../Reusable/DynamicTable"; 
import CardSlider from "../../Reusable/CardSlider"; 
import { Edit, Trash2, Maximize2, Download, CheckCircle, XOctagon } from 'lucide-react'; 

// ... [KEEP ALL YOUR DUMMY DATA AND HELPER FUNCTIONS EXACTLY AS THEY ARE] ...
// (Omitting Dummy Data section for brevity, assume it exists exactly as in your upload)

const DUMMY_BATCHES = [
    { id: 101, courseName: "CA Foundation - Apr 2025 Regular", batchPrefix: "CAF-Apr25R", stream: "CA", level: "Foundation", enrollment: 450, status: "Active" },
    { id: 103, courseName: "CA Intermediate - Apr 2025 Group 1", batchPrefix: "CAI-Apr25G1", stream: "CA", level: "Intermediate", enrollment: 620, status: "Active" },
    { id: 201, courseName: "CMA Foundation - Apr 2025 Batch A", batchPrefix: "CMF-Apr25A", stream: "CMA", level: "Foundation", enrollment: 120, status: "Active" },
];

const COURSE_SUBJECTS = {
    "CA": {
        "Foundation": [
            { id: 1, code: "CFA01", name: "Principles and Practice of Accounting" },
            { id: 2, code: "CFL02", name: "Business Laws and Business Correspondence and Reporting" },
        ],
        "Intermediate": [
            { id: 5, code: "CIA05", name: "Accounting" },
        ],
    },
    "CMA": {
        "Foundation": [
            { id: 13, code: "CMF13", name: "Fundamentals of Business Laws and Ethics" },
        ],
        "Intermediate": [
            { id: 19, code: "CMI19", name: "Corporate Laws & Compliance" },
        ],
    }
};

const DUMMY_Programme = [
    { id: 'super', name: "Super Pass" },
    { id: 'junior', name: "Junior Level" },
    { id: 'remaster', name: "Remastered Pack" },
];

const ALL_SUBJECTS_FLAT = Object.values(COURSE_SUBJECTS).flatMap(levels => 
    Object.values(levels).flat()
);
const SUBJECT_MAP = new Map(ALL_SUBJECTS_FLAT.map(sub => [sub.id, sub]));

const MATERIALS_TYPE_DATA = new Map([
    ['MAT_ID001', 'MCP-Notes'], 
    ['MAT_ID002', 'MCP-Materials'],
    ['MAT_ID003', 'Class-Notes'],
    ['MAT_ID004', 'Tasks'],
]);

const DUMMY_MCP_RESOURCES = [
    { 
        id: "RES_001", type: "MAT_ID001", title: "Accounting Standards Summary", 
        subjectId: 1, stream: "CA", level: "Foundation", packageId: 'super', 
        fileName: "AS_Summary_2025.pdf", fileSize: "1.2 MB"
    },
    { 
        id: "RES_002", type: "MAT_ID001", title: "Business Law Case Studies Vol 1", 
        subjectId: 2, stream: "CA", level: "Foundation", packageId: 'junior', 
        fileName: "Law_Cases_V1.pdf", fileSize: "2.5 MB"
    },
    { 
        id: "RES_003", type: "MAT_ID002", title: "Corporate Compliance Handbook", 
        subjectId: 19, stream: "CMA", level: "Intermediate", packageId: 'remaster', 
        fileName: "Compliance_Hand_2025.docx", fileSize: "800 KB"
    },
    { 
        id: "RES_004", type: "MAT_ID002", title: "Cost Accounting Formulas Sheet", 
        subjectId: 5, stream: "CA", level: "Intermediate", packageId: 'super', 
        fileName: "Costing_Formulas.pdf", fileSize: "500 KB"
    },
];

let DUMMY_ASSIGNMENTS = [
    { 
        id: 1, subjectId: 1, assignmentNo: 1, title: "Partnership Accounts Fundamentals", maxMarks: 50, 
        submitDate: "2025-04-25", submissionType: "Online", stream: "CA", level: "Foundation", batchId: 101, packageId: 'super', institute: 'ICAI',
        status: 'Approved' 
    },
    { 
        id: 2, subjectId: 5, assignmentNo: 1, title: "Consolidated Financial Statements", maxMarks: 75, 
        submitDate: "2025-04-10", submissionType: "Offline", stream: "CA", level: "Intermediate", batchId: 103, packageId: 'junior', institute: 'ICAI',
        status: 'Pending' 
    },
    { 
        id: 3, subjectId: 13, assignmentNo: 1, title: "Fundamentals of Business Laws", maxMarks: 40, 
        submitDate: "2025-05-15", submissionType: "Offline", stream: "CMA", level: "Foundation", batchId: 201, packageId: 'remaster', institute: 'ICMAI',
        status: 'Rejected' 
    },
];

const STUDENT_SUBMISSION_DATA = [
    { id: 9001, rollno: 101, name: "Aman Sharma", assignmentId: 1, file: "Aman_A1_Acc_Final.pdf", marks: 45, submittedDate: "2025-04-25", validated: true, approvalStatus: "Approved", approvedDate: "2025-04-26", fileSizeKB: 520 },
    // ... rest of student data
];

const getBatchPrefix = (batchId) => DUMMY_BATCHES.find(b => b.id === batchId)?.batchPrefix || `BCH-${batchId}`;
const getSubjectName = (subjectId) => SUBJECT_MAP.get(subjectId)?.name || `Subject ID ${subjectId}`;
const formatFileSize = (kb) => {
    if (!kb) return '0 KB';
    if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${kb} KB`;
};

const generateOptionsForAssignmentColumn = (data, columnName) => {
   const uniqueValues = Array.from(new Set(data.map(item => item[columnName]).filter(Boolean)));
    
    let displayValues = uniqueValues;

    if (columnName === 'batchId') {
        displayValues = uniqueValues.map(id => DUMMY_BATCHES.find(b => b.id === id)?.courseName || `Batch ID ${id}`);
    } else if (columnName === 'subjectId') {
        displayValues = uniqueValues.map(id => SUBJECT_MAP.get(id)?.name || `Subject ID ${id}`);
    } else if (columnName === 'packageId') {
        displayValues = uniqueValues.map(id => DUMMY_Programme.find(p => p.id === id)?.name || `Package ID ${id}`);
    }

    const options = displayValues
        .sort((a, b) => a.localeCompare(b))
        .map(value => ({
            value: value,
            label: value 
        }));

    if (columnName === 'institute') {
        return [{ value: '', label: 'All Institutes' }, ...options];
    }
    
    return [{ value: '', label: `All ${columnName.replace('Id', '').charAt(0).toUpperCase() + columnName.replace('Id', '').slice(1)}` }, ...options];
};

const formatDate = (dateString, forInput = false) => {
    if (!dateString) return '';
    if (forInput) return dateString;
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const getSubjectDetails = (stream, level, subjectId) => {
    return SUBJECT_MAP.get(subjectId) || {};
}

const handleFileAction = (assignment, actionType) => {
    const assignmentMeta = assignment.fullData || assignment; 
    alert(`${actionType === 'view' ? 'Viewing' : 'Downloading'} file for: ${assignmentMeta.title}`);
};

// ... [SubmissionTrackerTable COMPONENT REMAINS UNCHANGED] ...
const SubmissionTrackerTable = ({ assignment, submissions, userRole, onClose }) => {
    // ... (Keep existing code for SubmissionTrackerTable)
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({ status: '' }); 

    const filteredSubmissions = useMemo(() => {
        let data = submissions.filter(sub => sub.assignmentId === assignment.id);
        if (activeFilters.status) {
            data = data.filter(sub => sub.approvalStatus === activeFilters.status);
        }
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            data = data.filter(sub => 
                sub.name.toLowerCase().includes(searchLower) ||
                String(sub.rollno).includes(searchLower)
            );
        }
        return data.map(sub => ({
            id: sub.id, rollno: sub.rollno, name: sub.name, file: sub.file,
            fileSizeKB: sub.fileSizeKB, submittedDate: sub.submittedDate ? formatDate(sub.submittedDate) : 'N/A',
            status: sub.approvalStatus, marks: sub.marks, maxMarks: assignment.maxMarks,
            approved_status: sub.approvalStatus, fullData: sub 
        }));
    }, [assignment.id, assignment.maxMarks, submissions, searchTerm, activeFilters]);

    const handleApprovalAction = (submissionId, newStatus) => {
        alert(`Simulating: Submission ID ${submissionId} status changed to ${newStatus}.`);
    };
    
    const handleGradeAction = (submission) => {
        alert(`Grading submission for ${submission.name}`);
    };

    const SUBMISSION_COLUMN_ORDER = ['rollno', 'name', 'file', 'submittedDate', 'status', 'marks'];
    const columnDisplayNameMap = {
        rollno: 'Roll No', name: 'Student Name', file: 'File (Size)',
        submittedDate: 'Submitted On', status: 'Approval Status', marks: 'Score',
    };
    
    const customFormatCellData = useCallback((key, value, row) => {
        if (key === 'status') {
            let statusClass = 'DT_pill-pending';
            if (value === 'Approved') statusClass = 'DT_pill-completed';
            if (value === 'Rejected') statusClass = 'DT_pill-rejected';
            return <span className={`DT_pill ${statusClass}`}>{value}</span>;
        }
        if (key === 'marks') {
             if (value === null || row.status === 'Pending' || row.status === 'Rejected') return 'N/A';
            return `${value} / ${row.maxMarks}`;
        }
        if (key === 'file') {
            return (
                <div className={`am_file-cell`}>
                    <FiPaperclip className="text-info" />
                    <span className="am_file-cell-text">{row.file}</span>
                    <span style={{ fontSize: '0.8em', color: 'var(--color-gray-600)', marginLeft: '8px' }}>
                        ({formatFileSize(row.fileSizeKB)})
                    </span>
                </div>
            );
        }
        return value;
    }, []);
    
    const customActionsRenderer = useCallback((row) => {
        const isApproved = row.status === 'Approved';
        const hasMarks = row.marks !== null;
        if (userRole === 'Student') {
            return <span className={`DT_pill ${isApproved ? 'DT_pill-completed' : 'DT_pill-pending'}`}>{row.status}</span>;
        }
        return (
            <div className="DT_action-btn-container am_submission-action-cell">
                {isApproved && (
                    <button className={`DT_action-btn ${hasMarks ? 'DT_edit-btn' : 'btn-primary'}`}
                        onClick={(e) => { e.stopPropagation(); handleGradeAction(row.fullData); }}>
                        {hasMarks ? <Edit size={16} /> : <FiCheckCircle size={16} />} 
                    </button>
                )}
                <button className="DT_action-btn" onClick={(e) => { e.stopPropagation(); alert('Downloading...'); }}>
                    <FiDownload size={16} />
                </button>
            </div>
        );
    }, [userRole]);
    
    return (
            <DynamicTable
                data={filteredSubmissions}
                columnOrder={SUBMISSION_COLUMN_ORDER}
                columnDisplayNameMap={columnDisplayNameMap}
                title='Submissions'
                customDescription={`View and manage student submissions.`}
                onRowClickable={false}
                filterDefinitions={{ status: [{ value: '', label: 'All Statuses' }, { value: 'Approved', label: 'Approved' }] }}
                activeFilters={activeFilters}
                onFilterChange={(c, v) => setActiveFilters({ [c]: v })}
                onStatusChange={handleApprovalAction}
                formatCellData={customFormatCellData}
                customActionsRenderer={customActionsRenderer} 
                onSearch={setSearchTerm}
                searchQuery={searchTerm}
            />
    );
};


// --- MAIN ASSIGNMENT DISPLAY (UPDATED) ---
const AssignmentDisplay = ({ 
    assignments, 
    userRole,
    onAddAssignment, 
    onEditAssignment, 
    onDeleteAssignment,
    viewingSubmissionFor, 
    onViewSubmissions,
    selectedMaterialType
}) => {
    
    const [activeFilters, setActiveFilters] = useState({
        stream: '', level: '', batchId: '', subjectId: '', status: '', submissionType: ''
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null); 
    
    const isResourceView = selectedMaterialType === 'MAT_ID001' || selectedMaterialType === 'MAT_ID002';

    useEffect(() => {
        setSelectedAssignmentId(viewingSubmissionFor ? viewingSubmissionFor.id : null);
    }, [viewingSubmissionFor]);

    const getBatchName = (batchId) => DUMMY_BATCHES.find(b => b.id === batchId)?.courseName;
    const getPackageName = (packageId) => DUMMY_Programme.find(p => p.id === packageId)?.name;

    const sourceData = isResourceView ? DUMMY_MCP_RESOURCES.filter(r => r.type === selectedMaterialType) : assignments;

    const filterDefinitions = useMemo(() => {
        return {
            institute: generateOptionsForAssignmentColumn(sourceData, 'institute'),
            stream: generateOptionsForAssignmentColumn(sourceData, 'stream'),
            level: generateOptionsForAssignmentColumn(sourceData, 'level'),
            packageId: generateOptionsForAssignmentColumn(sourceData, 'packageId'),
            batchId: generateOptionsForAssignmentColumn(sourceData, 'batchId'),
            subjectId: generateOptionsForAssignmentColumn(sourceData, 'subjectId'),
            ...(!isResourceView && {
                status: [
                    { value: '', label: 'All Statuses' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Rejected', label: 'Rejected' }
                ],
                submissionType: [
                    { value: '', label: 'All Types' },
                    { value: 'Online', label: 'Online' },
                    { value: 'Offline', label: 'Offline' }
                ]
            })
        };
    }, [sourceData, isResourceView]);

    const filteredData = useMemo(() => {
        let data = sourceData;
        const currentFilters = activeFilters;
        const searchTermLower = searchTerm.toLowerCase();

        data = data.filter(item => {
            const batchName = item.batchId ? getBatchName(item.batchId) : '';
            const subjectName = getSubjectName(item.subjectId);
            const packageName = getPackageName(item.packageId);

            const matchesSearch = item.title.toLowerCase().includes(searchTermLower) ||
                                  subjectName.toLowerCase().includes(searchTermLower) ||
                                  (item.assignmentNo && String(item.assignmentNo).includes(searchTermLower));

            if (searchTermLower && !matchesSearch) return false;
            
            if (currentFilters.stream && item.stream !== currentFilters.stream) return false;
            if (currentFilters.level && item.level !== currentFilters.level) return false;
            if (currentFilters.subjectId && subjectName !== currentFilters.subjectId) return false;
            if (currentFilters.packageId && packageName !== currentFilters.packageId) return false;

            if (!isResourceView) {
                if (currentFilters.status && item.status !== currentFilters.status) return false;
                if (currentFilters.submissionType && item.submissionType !== currentFilters.submissionType) return false;
                if (currentFilters.batchId && batchName !== currentFilters.batchId) return false;
            }
            return true;
        });
        
        return data.map(item => ({
            // Common
            id: item.id,
            title: item.title,
            subject: getSubjectName(item.subjectId),
            
            // Resource Specific Fields 
            stream: item.stream, 
            level: item.level,
            package: getPackageName(item.packageId),
            
            // Assignment Specific Fields 
            assignmentNo: item.assignmentNo,
            batch: item.batchId ? getBatchPrefix(item.batchId) : '',
            maxMarks: item.maxMarks,
            submitDate: item.submitDate ? formatDate(item.submitDate) : '', 
            submissionType: item.submissionType,
            status: item.status,
            view: 'View', // <--- ADDED: Data field for the new column
            
            fullData: item, 
        }));

    }, [sourceData, activeFilters, searchTerm, isResourceView]);
    
    // --- COLUMN CONFIGURATIONS ---
    
    // 1. ORIGINAL COLUMNS (Used for Tasks & Class-Notes)
    const ASSIGNMENT_COLUMN_ORDER = [
        'assignmentNo', 'title', 'subject', 'batch', 'maxMarks', 
        'submitDate', 'submissionType', 'view', 'status' // <--- ADDED 'view' HERE
    ];

    // 2. NEW RESOURCE COLUMNS (Added Subject, Course, Level, Programme)
    const RESOURCE_COLUMN_ORDER = [
        'id', 'title', 'subject', 'stream', 'level', 'package', 'view' // <--- ADDED 'view' HERE
    ];
    
    const columnDisplayNameMap = {
        // Assignment Columns
        assignmentNo: '#',
        title: isResourceView ? 'Material Name' : 'Assignment Title', 
        subject: 'Subject',
        batch: 'Batch',
        maxMarks: 'Marks',
        submitDate: 'Due Date',
        submissionType: 'Sub. Type',
        status: 'Metadata Status',
        view: 'View Doc', // <--- ADDED Label
        // Resource Columns
        id: 'Material ID',
        stream: 'Course', 
        level: 'Level',
        package: 'Programme' 
    };

    const handleDynamicTableSearch = useCallback((query) => {
        setSearchTerm(query);
    }, []);

    const handleDynamicTableFilterChange = useCallback((column, value) => {
        setActiveFilters(prev => ({ ...prev, [column]: value }));
    }, []);
    
    const handleRowClick = useCallback((rowId) => {
        // Prevent row click if clicking view button logic is handled in formatCellData, 
        // but typically e.stopPropagation in the button prevents this.
        if (isResourceView) return; 

        const rowData = filteredData.find(a => a.id === rowId);
        if (rowData) {
            onViewSubmissions(rowData.fullData);
        }
    }, [filteredData, onViewSubmissions, isResourceView]);

    const customFormatCellData = useCallback((key, value, row) => {
        // --- ADDED: LOGIC FOR VIEW COLUMN ---
        if (key === 'view') {
            return (
                <button 
                    className="DT_action-btn" 
                    title="Open Document in New Tab"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        // Simulate opening a file URL. In production, use row.fullData.fileUrl
                        const dummyUrl = `https://example.com/files/${row.fullData.fileName || 'document.pdf'}`;
                        window.open(dummyUrl, '_blank'); 
                    }}
                >
                    <FiExternalLink size={18} style={{ color: '#007bff' }} />
                </button>
            );
        }

        // Only apply special formatting for Assignments
        if (!isResourceView) {
            if (key === 'status') {
                let statusClass = 'DT_pill-pending';
                if (value === 'Approved') statusClass = 'DT_pill-completed';
                if (value === 'Rejected') statusClass = 'DT_pill-rejected';
                return <span className={`DT_pill ${statusClass}`}>{value}</span>;
            }
            if (key === 'maxMarks') {
                 return `${value} Marks`;
            }
        }
        return value;
    }, [isResourceView]);
    
    const customActionsRenderer = useCallback((row) => {
        const isSubmissionViewActive = viewingSubmissionFor?.id === row.id;
        return (
            <div className="DT_action-btn-container am_assignment-action-cell">
                {/* Removed View/Download from here since we added a specific View Column, 
                    OR you can keep them for "Action" redundancy. I will keep Edit/Delete here 
                    to keep actions focused on Management */}
                <button className="DT_action-btn" title="Edit Metadata"
                   onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                   disabled={isSubmissionViewActive}>
                   <Edit size={16} />
               </button>
               <button className="DT_action-btn" title="Delete"
                   onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                   disabled={isSubmissionViewActive}>
                   <Trash2 size={16} />
               </button>
            </div>
        );
    }, [viewingSubmissionFor]);
    
    const handleEdit = useCallback((row) => {
        if (viewingSubmissionFor?.id === row.id) return;
        onEditAssignment(row.fullData);
    }, [viewingSubmissionFor, onEditAssignment]);
    
    const handleDelete = useCallback((row) => {
        if (viewingSubmissionFor?.id === row.id) return;
        if (window.confirm(`Are you sure you want to delete "${row.title}"?`)) {
            onDeleteAssignment(row.fullData.id); 
        }
    }, [viewingSubmissionFor, onDeleteAssignment]);

    if (!selectedMaterialType) return <></>;
    
    const materialTypeName = MATERIALS_TYPE_DATA.get(selectedMaterialType) || 'Assignments';

    return (
        <DynamicTable
            data={filteredData}
            columnOrder={isResourceView ? RESOURCE_COLUMN_ORDER : ASSIGNMENT_COLUMN_ORDER}
            columnDisplayNameMap={columnDisplayNameMap}
            title={materialTypeName} 
            customDescription={isResourceView 
                ? `Browse and manage ${materialTypeName}.` 
                : `Showing assignments for: ${materialTypeName}. Click any row to view student submissions.`
            }
            
            onRowClickable={!isResourceView}
            onRowClick={handleRowClick}
            selectedRowId={selectedAssignmentId}

            filterDefinitions={filterDefinitions}
            activeFilters={activeFilters}
            onFilterChange={handleDynamicTableFilterChange}
            userRole={'teacher'}

            {...(userRole !== 'Student' && !isResourceView && {
                onAddNew: () => { if (!viewingSubmissionFor) onAddAssignment(); },
                add_new_button_label: 'Add New Assignment', 
            })}

            // Actions 
            onEdit={handleEdit}
            onDelete={handleDelete}
            
            formatCellData={customFormatCellData}
            customActionsRenderer={customActionsRenderer}
            
            onSearch={handleDynamicTableSearch}
            searchQuery={searchTerm}
        />
    );
};

// ... [AssignmentFormModal AND AssignmentManagement REMAIN UNCHANGED] ...
// (Keep the rest of the file exactly as is)

// For brevity, adding the wrapper export here to complete the file structure if you copy paste
const AssignmentManagement = ({userRole}) => {
    // ... (Keep existing code)
    const INITIAL_STREAM = "CA";
    const INITIAL_LEVEL = "Foundation";
    const INITIAL_BATCH_ID = 101; 
    const INITIAL_SUBJECT_ID = 1; 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState(null); 
    const [viewingSubmissionFor, setViewingSubmissionFor] = useState(null);
    const [selectedMaterialType, setSelectedMaterialType] = useState(null); 
    
    const assignmentRef = useRef(null);
    const submissionViewRef = useRef(null);
    const mainWrapperRef = useRef(null); 
    
    useEffect(() => {
        if (mainWrapperRef.current) {
            mainWrapperRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    }, []);

    const handleMaterialTypeSelect = useCallback((materialTypeId) => {
        setSelectedMaterialType(materialTypeId);
        setViewingSubmissionFor(null); 
        setTimeout(() => {
            if (assignmentRef.current) {
                assignmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, []);

    useEffect(() => {
        if (viewingSubmissionFor && submissionViewRef.current) {
            submissionViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [viewingSubmissionFor]);

    const handleViewSubmissions = (assignment) => {
        if (!assignment) { setViewingSubmissionFor(null); return; }
        if (viewingSubmissionFor && viewingSubmissionFor.id === assignment.id) {
            setViewingSubmissionFor(null);
        } else {
            setViewingSubmissionFor(assignment); 
        }
    };
    
    const handleOpenModal = (assignment = null) => {
        setViewingSubmissionFor(null); 
        setAssignmentToEdit(assignment); 
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setAssignmentToEdit(null); };
    
    const handleAssignmentSubmit = (formData) => {
        console.log("Submit", formData);
        const newId = DUMMY_ASSIGNMENTS.length + 1;
        DUMMY_ASSIGNMENTS.push({
            id: newId, subjectId: INITIAL_SUBJECT_ID, assignmentNo: newId, 
            title: formData.title, maxMarks: parseInt(formData.marks, 10), 
            submitDate: formData.submitDate, submissionType: formData.submissionType,
            stream: INITIAL_STREAM, level: INITIAL_LEVEL, batchId: INITIAL_BATCH_ID,
            packageId: 'super', institute: 'ICAI', status: 'Pending'
        });
    };
    
    const handleDeleteAssignment = (id) => {
        DUMMY_ASSIGNMENTS = DUMMY_ASSIGNMENTS.filter(a => a.id !== id);
        alert(`Assignment ID ${id} deleted.`);
    };

    return (
    <div className="am_wrapper" ref={mainWrapperRef}> 
        <div className="am_header">
            <h1 className="am_page-title">Assignment Management</h1>
        </div>
        
        <div className="am_card-slider-section">
            <CardSlider
                institutes={MATERIALS_TYPE_DATA}
                title='Materials Type'
                icon_title="Materials Type"
                selectedCard={selectedMaterialType}
                onSelectInstitute={handleMaterialTypeSelect}
            />
        </div>
        
        <div className="am_assignment-view-section" ref={assignmentRef}>
            <AssignmentDisplay
                assignments={DUMMY_ASSIGNMENTS} 
                userRole={userRole}
                onAddAssignment={handleOpenModal} 
                onEditAssignment={handleOpenModal}
                onDeleteAssignment={handleDeleteAssignment}
                viewingSubmissionFor={viewingSubmissionFor} 
                onViewSubmissions={handleViewSubmissions} 
                selectedMaterialType={selectedMaterialType} 
            />
        </div>
            
      
        
        {isModalOpen && (
            <AssignmentFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                context={{}}
                initialData={assignmentToEdit}
                onSubmit={handleAssignmentSubmit}
            />
        )}
    </div>
);
};

export default AssignmentManagement;