import "../../Styles/Admin/Ad_AssignmentManagement.css"; 
import ViewSubmission from "../SuperAdmin/Assignments/ViewSubmission";
import React, { useState, useRef, useEffect } from "react";
// Added all necessary icons for the Assignment Display and Modal
import { 
    FiSearch, FiX, FiBookOpen, FiZap, FiCalendar, FiArrowLeft, FiArrowRight, 
    FiCheckCircle, FiGrid, FiList, FiClock, FiFileText, FiDownload, 
    FiUpload, FiEdit, FiTrash2, FiMaximize2, FiLayers, FiCheckSquare, 
    FiAlertCircle, FiPlus, FiSave, FiUploadCloud, FiPaperclip,FiEye
} from "react-icons/fi";

// --- DUMMY DATA (Re-included codes for file generation logic) ---
const DUMMY_BATCHES = [
    { id: 101, courseName: "CA Foundation - Apr 2025 Regular", batchPrefix: "CAF-Apr25R", stream: "CA", level: "Foundation", enrollment: 450, status: "Active" },
    { id: 102, courseName: "CA Foundation - Dec 2025 Fast Track", batchPrefix: "CAF-Dec25FT", stream: "CA", level: "Foundation", enrollment: 210, status: "Active" },
    { id: 105, courseName: "CA Foundation - Nov 2025 Weekend", batchPrefix: "CAF-Nov25W", stream: "CA", level: "Foundation", enrollment: 150, status: "Active" },
    { id: 501, courseName: "CA Foundation - Apr 2025 Regular", batchPrefix: "CAF-Apr25R", stream: "CA", level: "Foundation", enrollment: 450, status: "Active" },
    { id: 502, courseName: "CA Foundation - Dec 2025 Fast Track", batchPrefix: "CAF-Dec25FT", stream: "CA", level: "Foundation", enrollment: 210, status: "Active" },
    { id: 505, courseName: "CA Foundation - Nov 2025 Weekend", batchPrefix: "CAF-Nov25W", stream: "CA", level: "Foundation", enrollment: 150, status: "Active" },
    
    { id: 103, courseName: "CA Intermediate - Apr 2025 Group 1", batchPrefix: "CAI-Apr25G1", stream: "CA", level: "Intermediate", enrollment: 620, status: "Active" },
    { id: 106, courseName: "CA Intermediate - May 2026 Combined", batchPrefix: "CAI-May26C", stream: "CA", level: "Intermediate", enrollment: 410, status: "Active" },
    
    { id: 201, courseName: "CMA Foundation - Apr 2025 Batch A", batchPrefix: "CMF-Apr25A", stream: "CMA", level: "Foundation", enrollment: 120, status: "Active" },
    { id: 203, courseName: "CMA Intermediate - Apr 2025 Term 1", batchPrefix: "CMI-Apr25T1", stream: "CMA", level: "Intermediate", enrollment: 150, status: "Active" },
    
    { id: 301, courseName: "CA Advanced - May 2025", batchPrefix: "CAA-May25", stream: "CA", level: "Advanced", enrollment: 500, status: "Active" },
];

const COURSE_SUBJECTS = {
    "CA": {
        "Foundation": [
            { id: 1, code: "CFA01", name: "Principles and Practice of Accounting" },
            { id: 2, code: "CFL02", name: "Business Laws and Business Correspondence and Reporting" },
            { id: 3, code: "CFM03", name: "Business Mathematics and Logical Reasoning and Statistics" },
            { id: 4, code: "CFE04", name: "Business Economics and Business and Commercial Knowledge" },
        ],
        "Intermediate": [
            { id: 5, code: "CIA05", name: "Accounting" },
            { id: 6, code: "CIL06", name: "Corporate and Other Laws" },
            { id: 7, code: "CIC07", name: "Cost and Management Accounting" },
            { id: 8, code: "CIT08", name: "Taxation (Direct & Indirect)" },
            { id: 9, code: "CIA09", name: "Advanced Accounting" },
            { id: 10, code: "CIA10", name: "Auditing and Assurance" },
            { id: 11, code: "CIE11", name: "Enterprise Information Systems & Strategic Management" },
            { id: 12, code: "CIF12", name: "Financial Management & Economics for Finance" },
        ],
        "Advanced": [
            { id: 16, code: "CAA16", name: "Financial Reporting" },
            { id: 17, code: "CAS17", name: "Strategic Financial Management" },
            { id: 18, code: "CAA18", name: "Advanced Auditing and Professional Ethics" },
        ]
    },
    "CMA": {
        "Foundation": [
            { id: 13, code: "CMF13", name: "Fundamentals of Business Laws and Ethics" },
            { id: 14, code: "CMF14", name: "Fundamentals of Financial and Cost Accounting" },
            { id: 15, code: "CMF15", name: "Fundamentals of Business Economics and Management" },
        ],
        "Intermediate": [
            { id: 19, code: "CMI19", name: "Corporate Laws & Compliance" },
            { id: 20, code: "CMI20", name: "Cost Accounting" },
            { id: 21, code: "CMI21", name: "Operations Management & Strategic Management" },
        ],
        "Advanced": [
            { id: 22, code: "CMA22", name: "Corporate Financial Reporting" },
            { id: 23, code: "CMA23", name: "Strategic Cost Management" },
        ]
    }
};

// New color variables for colorful grid cards based on index.css colors
const CARD_COLOR_STYLES = [
    { background: 'ad_asm_card-color-pink', text: 'ad_asm_text-pink-dark' },    // Brand Pink
    { background: 'ad_asm_card-color-orange', text: 'ad_asm_text-orange-dark' },  // Brand Orange
    { background: 'ad_asm_card-color-info', text: 'ad_asm_text-info-dark' },      // Info Blue/Teal
    { background: 'ad_asm_card-color-success', text: 'ad_asm_text-success-dark' }, // Success Green
];

// Replaced DUMMY_ASSIGNMENTS to be mutable (for simulation)
let DUMMY_ASSIGNMENTS = [
    { 
        id: 1, 
        subjectId: 1, 
        assignmentNo: 1, 
        title: "Partnership Accounts Fundamentals & Final Accounts", 
        marks: 50, 
        startDate: "2025-04-10", 
        submitDate: "2025-04-25", 
        submittedCount: 320, 
        status: "Upcoming", 
        fileName: "Assgn-1_Partner_Fund.pdf",
        submissionType: "Online",
        colorId: 0 
    },
    { 
        id: 2, 
        subjectId: 1, 
        assignmentNo: 2, 
        title: "Consignment and Joint Venture Practice Problems", 
        marks: 40, 
        startDate: "2025-05-01", 
        submitDate: "2025-05-15", 
        submittedCount: 290, 
        status: "Completed", 
        fileName: "Assgn-2_Consignment_JV.docx",
        submissionType: "Offline",
        colorId: 1
    },
    { 
        id: 3, 
        subjectId: 2, 
        assignmentNo: 1, 
        title: "Indian Contract Act Case Studies & Theory Questions", 
        marks: 60, 
        startDate: "2025-04-15", 
        submitDate: "2025-04-30", 
        submittedCount: 150, 
        status: "Upcoming", 
        fileName: "Assgn-1_Contract_Law.pdf",
        submissionType: "Online",
        colorId: 2
    },
    { 
        id: 4, 
        subjectId: 2, 
        assignmentNo: 2, 
        title: "Negotiable Instruments Act - MCQs and Short Notes", 
        marks: 30, 
        startDate: "2025-05-05", 
        submitDate: "2025-05-20", 
        submittedCount: 180, 
        status: "Upcoming", 
        fileName: "Assgn-2_NIA_MCQs.pdf",
        submissionType: "Online",
        colorId: 3
    },
    { 
        id: 5, 
        subjectId: 5, 
        assignmentNo: 1, 
        title: "Consolidated Financial Statements & AS-21 Practical", 
        marks: 75, 
        startDate: "2025-03-20", 
        submitDate: "2025-04-10", 
        submittedCount: 550, 
        status: "Completed", 
        fileName: "Assgn-1_CFS_AS21.pdf",
        submissionType: "Offline",
        colorId: 0
    },
    { 
        id: 6, 
        subjectId: 6, 
        assignmentNo: 1, 
        title: "Company Law: Share Capital & Debentures", 
        marks: 50, 
        startDate: "2025-05-25", 
        submitDate: "2025-06-10", 
        submittedCount: 0, 
        status: "Upcoming", 
        fileName: "Assgn-1_Comp_Law.pdf",
        submissionType: "Online",
        colorId: 1
    },
];

const streams = [
    { name: "CA", label: "Chartered Accountancy" },
    { name: "CMA", label: "Cost & Management Accountancy" },
];

const initialLevelOptions = ["Foundation", "Intermediate", "Advanced"];

/**
 * Helper to get subject details 
 */
const getSubjectDetails = (stream, level, subjectId) => {
    // NOTE: Hardcoding 'CA' and 'Foundation' for demonstration since actual state isn't available
    const effectiveStream = stream || "CA"; 
    const effectiveLevel = level || "Foundation";
    const subjects = COURSE_SUBJECTS[effectiveStream]?.[effectiveLevel] || [];
    return subjects.find(sub => sub.id === subjectId) || {};
}

// Helper to format date (to YYYY-MM-DD for input fields)
const formatDate = (dateString, forInput = false) => {
    if (forInput) {
        return dateString;
    }
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// ... (generateFileContent and handleFileAction remain the same) ...

/**
 * Helper function to generate dummy file content (simulating PDF/DOCX)
 */
const generateFileContent = (assignment) => {
    const tempStream = "CA"; 
    const tempLevel = "Foundation";
    
    const subject = getSubjectDetails(tempStream, tempLevel, assignment.subjectId).name || 'Unknown Subject';
    const subjectCode = getSubjectDetails(tempStream, tempLevel, assignment.subjectId).code || 'N/A';
    
    const content = `
# Assignment Paper: ${assignment.title}

## Subject: ${subject} (${subjectCode})
| Metric | Details |
|---|---|
| Assignment No. | ${assignment.assignmentNo} |
| Total Marks | ${assignment.marks} |
| Submission Deadline | ${formatDate(assignment.submitDate, true)} |

---
// ... (rest of the dummy content)
This document is a **simulated assignment paper** designed for demonstration purposes.
`;

    const extension = assignment.fileName.split('.').pop().toLowerCase();
    let mimeType = 'text/plain';

    if (extension === 'pdf') {
        mimeType = 'application/pdf';
        return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
    } else if (extension === 'docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        return new Blob([content], { type: mimeType });
    } else {
        return new Blob([content], { type: 'text/plain' });
    }
};

/**
 * Function to handle file view/download
 */
const handleFileAction = (assignment, actionType) => {
    const fileContent = generateFileContent(assignment);

    if (actionType === 'view') {
        const url = (typeof fileContent === 'string' && fileContent.startsWith('data:')) 
                    ? fileContent 
                    : URL.createObjectURL(fileContent);

        window.open(url, '_blank');
        
        if (typeof fileContent !== 'string') {
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }

    } else if (actionType === 'download') {
        const url = URL.createObjectURL(fileContent);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', assignment.fileName); 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
    }
};

// ... (BatchDisplay and SubjectDisplay components remain the same) ...
const BatchDisplay = ({ batches, stream, level, selectedBatchId, onBatchSelect }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const sliderRef = useRef(null);
    const filteredBatches = batches.filter(batch =>
        batch.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.batchPrefix.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const handleScroll = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = 300;
            sliderRef.current.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
        }
    };
    return (
        <div className="ad_asm_detail-panel-container ad_asm_full-width-panel">
            <div className="ad_asm_detail-panel-content">
                <div className="ad_asm_batch-controls-header">
                    <h4 className="ad_asm_detail-header ad_asm_header-in-row">Batches for: **{stream}** {level} Level</h4>
                    <div className="ad_asm_search-bar ad_asm_batch-search-bar">
                        <FiSearch className="ad_asm_search-icon" size={18} />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Batch Name or Prefix..." />
                        {searchTerm && (<FiX className="ad_asm_clear-icon" onClick={() => setSearchTerm("")} size={18} />)}
                    </div>
                </div>
                {filteredBatches.length === 0 ? (<p className="ad_asm_no-results">{batches.length > 0 ? `No batches found matching "${searchTerm}".` : `No batches currently defined for ${stream} ${level}.`}</p>) : (
                    <div className="ad_asm_batch-slider-wrapper">
                        <button className="ad_asm_slider-nav-btn ad_asm_slider-nav-left" onClick={() => handleScroll('left')} aria-label="Scroll Batches Left"><FiArrowLeft size={20} /></button>
                        <div className="ad_asm_batch-slider" ref={sliderRef}>
                            {filteredBatches.map(batch => (
                                <div key={batch.id} className={`ad_asm_batch-card ${selectedBatchId === batch.id ? 'ad_asm_subject-card-selected' : ''}`} onClick={() => onBatchSelect(batch.id)}>
                                    {selectedBatchId === batch.id && (<div className="ad_asm_batch-check-icon-overlay"><FiCheckCircle size={24} /></div>)}
                                    <p className="ad_asm_batch-prefix">{batch.batchPrefix}</p>
                                    <h5 className="ad_asm_batch-name">{batch.courseName}</h5>
                                    <div className="ad_asm_batch-meta">
                                        <span className={`ad_asm_batch-status ad_asm_status-${batch.status.toLowerCase()}`}><FiZap size={12} /> {batch.status}</span>
                                        <span className="ad_asm_batch-enrollment"><FiCalendar size={12} /> {batch.enrollment} <span className="ad_asm_enrollment-label">Students</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="ad_asm_slider-nav-btn ad_asm_slider-nav-right" onClick={() => handleScroll('right')} aria-label="Scroll Batches Right"><FiArrowRight size={20} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SubjectDisplay = ({ subjects, stream, level, selectedSubjectId, onSubjectSelect }) => {
    return (
        <div className="ad_asm_detail-panel-container ad_asm_full-width-panel ad_asm_subject-panel">
            <div className="ad_asm_subject-card-grid">
                {subjects.map(subject => (
                    <div
                        key={subject.id}
                        className={`ad_asm_subject-card ${selectedSubjectId === subject.id ? 'ad_asm_batch-card-selected' : ''}`}
                        onClick={() => onSubjectSelect(subject.id)}
                    >
                        {selectedSubjectId === subject.id && (
                             <FiCheckCircle className="ad_asm_subject-check-icon-grid" size={24} /> 
                        )}
                        <h5 className="ad_asm_subject-name">{subject.name}</h5>
                        <div className="ad_asm_subject-meta">
                            <FiBookOpen size={12} /> <span className="ad_asm_subject-level-detail">{stream} - {level} Level</span>
                            <span className="ad_asm_subject-code">({subject.code})</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * NEW COMPONENT: Assignment Display for Selected Subject (OVERHAULED UI)
 * NOTE: Corrected the prop destructuring error here.
 */
const AssignmentDisplay = ({ assignments, subjectDetails, onAddAssignment, onEditAssignment, viewingSubmissionFor, onViewSubmissions }) => {
    const [viewMode, setViewMode] = useState("table"); // 'grid' or 'table'
    const [filter, setFilter] = useState("all"); // 'all', 'upcoming', 'completed'
    const [searchTerm, setSearchTerm] = useState("");

    const subjectName = subjectDetails.name || "Selected Subject";

    const filteredAssignments = assignments
        .filter(assignment => filter === 'all' || assignment.status.toLowerCase() === filter)
        .filter(assignment => assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || assignment.assignmentNo.toString().includes(searchTerm.toLowerCase())
        );

    // This variable now correctly references the prop, which is defined in the destructuring above.
    const isSubmissionViewActive = viewingSubmissionFor !== null;

    // Helper to get status class
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'upcoming': return 'ad_asm_status-upcoming';
            case 'completed': return 'ad_asm_status-completed';
            default: return '';
        }
    };

    // Helper to get file icon and its color class
    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(extension)) return { icon: <FiFileText size={16} />, colorClass: 'text-error' };
        if (['docx', 'doc'].includes(extension)) return { icon: <FiFileText size={16} />, colorClass: 'text-info' };
        if (['zip', 'rar'].includes(extension)) return { icon: <FiLayers size={16} />, colorClass: 'text-warning' };
        return { icon: <FiFileText size={16} />, colorClass: 'text-gray-700' };
    };

    // --- Grid View Render (New UI) ---
    const renderGridView = () => (
        <div className="ad_asm_assignment-grid">
            {filteredAssignments.length === 0 ? (
                <p className="ad_asm_no-results-grid">No assignments found matching the current filters/search.</p>
            ) : (
                filteredAssignments.map(item => {
                    const colorStyle = CARD_COLOR_STYLES[item.colorId % CARD_COLOR_STYLES.length];
                    const fileInfo = getFileIcon(item.fileName);
                    return (
                        <div key={item.id} className={`ad_asm_assignment-card`}>
                            <div className={`ad_asm_card-color-strip ${colorStyle.background.replace('ad_asm_card-color-', 'ad_asm_strip-color-')}`}></div>
                            <div className="ad_asm_card-content-area">
                                <div className="ad_asm_card-header">
                                    <span className="ad_asm_card-badge">Assgn **#{item.assignmentNo}**</span>
                                    <span className={`ad_asm_status-badge ${getStatusClass(item.status)}`}>
                                        {item.status === 'Upcoming' ? <FiClock size={12} /> : <FiCheckSquare size={12} />}
                                        {item.status}
                                    </span>
                                </div>
                                <h5 className="ad_asm_assignment-title">{item.title}</h5>
                                <div className="ad_asm_card-details">
                                    <p className="ad_asm_card-info"><FiCalendar size={14} /> Due Date: **{formatDate(item.submitDate)}**</p>
                                    <p className="ad_asm_card-info"><FiAlertCircle size={14} /> Total Marks: **{item.marks}**</p>
                                    <p className="ad_asm_card-info"><FiUpload size={14} /> Submission Type: **{item.submissionType}**</p>
                                </div>
                                {/* File Info Bar */}
                                <div className={`ad_asm_file-info-bar ${fileInfo.colorClass}`}>
                                    {fileInfo.icon} <span className="ad_asm_file-name-text">{item.fileName}</span>
                                </div>
                            </div>
                            {/* Actions Footer */}
                            <div className="ad_asm_card-actions ad_asm_card-actions-grid">
                                <button className="btn btn-sm btn-outline-secondary ad_asm_action-btn-secondary" onClick={() => handleFileAction(item, 'view')}>
                                    <FiEye size={14} /> View File
                                </button>
                                <button className="btn btn-sm btn-outline-secondary ad_asm_action-btn-secondary" onClick={() => handleFileAction(item, 'download')}>
                                    <FiDownload size={14} /> Download
                                </button>
                                <button className="btn btn-sm btn-outline-info" onClick={() => onViewSubmissions({ 
                                    id: item.id, 
                                    assignmentTitle: item.title, 
                                    subjectName: subjectName 
                                })}>
                                    <FiLayers size={14} /> **{item.submittedCount}** Submissions
                                </button>
                            </div>
                            {/* Admin Controls - Moved to its own bar */}
                            <div className="ad_asm_admin-actions-footer">
                                <button className="btn btn-sm btn-outline-primary ad_asm_action-btn-sm ad_asm_action-btn-icon" onClick={() => onEditAssignment(item.id)} title="Edit Assignment">
                                    <FiEdit size={14} /> <span>Edit</span>
                                </button>
                                <button className="btn btn-sm btn-outline-danger ad_asm_action-btn-sm ad_asm_action-btn-icon" onClick={() => { /* Placeholder for Delete logic */ }} title="Delete Assignment">
                                    <FiTrash2 size={14} /> <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    // --- Table View Render (Standard List) ---
    const renderTableView = () => (
        <div className="ad_asm_assignment-table-wrapper">
            <table className="ad_asm_assignment-table">
                <thead>
                    <tr>
                        <th className="ad_asm_table-header-sticky">Assgn No.</th>
                        <th>Title</th>
                        <th>Marks</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Submissions</th>
                        <th className="ad_asm_table-actions-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAssignments.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="ad_asm_no-results-table">No assignments found matching the current filters/search.</td>
                        </tr>
                    ) : (
                        filteredAssignments.map(item => (
                            <tr key={item.id}>
                                <td data-label="Assgn No." className="ad_asm_table-no">**#{item.assignmentNo}**</td>
                                <td data-label="Title" className="ad_asm_table-title">
                                    <span className="ad_asm_title-text">{item.title}</span>
                                    <span className="ad_asm_file-link-meta">
                                        <button className="ad_asm_file-link-btn" onClick={() => handleFileAction(item, 'view')} title={`View ${item.fileName}`}>
                                            {getFileIcon(item.fileName).icon} {item.fileName}
                                        </button>
                                        <button className="ad_asm_file-link-btn" onClick={() => handleFileAction(item, 'download')} title={`Download ${item.fileName}`}>
                                            <FiDownload size={12} />
                                        </button>
                                    </span>
                                </td>
                                <td data-label="Marks" className="ad_asm_table-marks">**{item.marks}**</td>
                                <td data-label="Due Date" className="ad_asm_table-date">
                                    <FiCalendar size={12} /> {formatDate(item.submitDate)}
                                </td>
                                <td data-label="Status" className="ad_asm_table-status">
                                    <span className={`ad_asm_status-badge ${getStatusClass(item.status)}`}>{item.status}</span>
                                </td>
                                <td data-label="Submissions" className="ad_asm_table-submissions">
                                    <button className="btn btn-sm btn-outline-info" onClick={() => onViewSubmissions({ 
                                        id: item.id, 
                                        assignmentTitle: item.title, 
                                        subjectName: subjectName 
                                    })}>
                                        <FiLayers size={14} /> **{item.submittedCount}**
                                    </button>
                                </td>
                                <td data-label="Actions" className="ad_asm_table-actions-col">
                                    <div className="ad_asm_table-actions-flex">
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => onEditAssignment(item.id)} title="Edit"><FiEdit size={14} /></button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => { /* Placeholder for Delete logic */ }} title="Delete"><FiTrash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )


    return (
        <div className="ad_asm_detail-panel-container ad_asm_subject-panel ad_asm_full-width-panel">
            <h4 className="ad_asm_section-title ad_asm_assignment-panel-title">Assignments for: **{subjectName}**</h4>
            
            <div className="ad_asm_assignment-controls">
                <div className="ad_asm_control-group">
                    {/* Filter Buttons */}
                    <div className="ad_asm_filter-buttons">
                        <button 
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} 
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`btn btn-sm ${filter === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}`} 
                            onClick={() => setFilter('upcoming')}
                        >
                            Upcoming
                        </button>
                        <button 
                            className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`} 
                            onClick={() => setFilter('completed')}
                        >
                            Completed
                        </button>
                    </div>
                    {/* View Toggle Buttons */}
                    <div className="ad_asm_view-toggle btn-group">
                        <button 
                            className={`btn btn-sm ${viewMode === 'table' ? 'selected-view' : ''}`} 
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <FiList size={16} />
                        </button>
                        <button 
                            className={`btn btn-sm ${viewMode === 'grid' ? 'selected-view' : ''}`} 
                            onClick={() => setViewMode('grid')}
                            title="Grid Card View"
                        >
                            <FiGrid size={16} />
                        </button>
                    </div>
                </div>

                <div className="ad_asm_control-group">
                    {/* Search Bar */}
                    <div className="ad_asm_search-bar ad_asm_assignment-search-bar">
                        <FiSearch className="ad_asm_search-icon" size={18} />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Title or No..." />
                        {searchTerm && (<FiX className="ad_asm_clear-icon" onClick={() => setSearchTerm("")} size={18} />)}
                    </div>
                    {/* Add Button */}
                    <button className="btn btn-primary btn-sm ad_asm_add-assignment-btn" onClick={onAddAssignment}>
                        <FiPlus size={16} /> Add Assignment
                    </button>
                </div>
            </div>

            <div className="ad_asm_assignment-content">
                {viewMode === 'table' ? renderTableView() : renderGridView()}
            </div>
            
        </div>
    );
};

// ... (AssignmentFormModal and ViewSubmission were assumed to be imported or defined elsewhere, but only the main component definition is provided) ...

// Assuming a full implementation of the AssignmentManagement component from the user's file.
// The remaining code from the user's file is included here, with all class names refactored.

// --- MAIN COMPONENT: ad_asm_assignmentManagement ---
const ad_asm_assignmentManagement = () => {
    // State logic remains identical
    const [selectedStream, setSelectedStream] = useState(streams[0].name);
    const [selectedLevel, setSelectedLevel] = useState(initialLevelOptions[0]);
    const [selectedBatchId, setSelectedBatchId] = useState(DUMMY_BATCHES[0].id);
    const [selectedSubjectId, setSelectedSubjectId] = useState(1); // Default to the first subject of the default level
    const [step, setStep] = useState(1); // 1: Stream, 2: Level, 3: Batch, 4: Subject, 5: Assignment Display, 6: View Submissions

    // Modal state for adding/editing assignments
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContext, setModalContext] = useState("add"); // "add" or "edit"
    const [assignmentToEdit, setAssignmentToEdit] = useState(null); // Data for editing
    const [viewingSubmissionFor, setViewingSubmissionFor] = useState(null); // Data for viewing submissions

    // Filter data based on current selection
    const availableBatches = DUMMY_BATCHES.filter(batch => 
        batch.stream === selectedStream && batch.level === selectedLevel
    );

    const availableSubjects = COURSE_SUBJECTS[selectedStream]?.[selectedLevel] || [];

    const assignmentsForSelectedSubject = DUMMY_ASSIGNMENTS.filter(assgn => assgn.subjectId === selectedSubjectId);

    // Component Refs for scrolling/focusing
    const submissionViewRef = useRef(null);
    const assignmentDisplayRef = useRef(null);

    // Dynamic Header Title
    const headerTitle = viewingSubmissionFor
        ? `Submissions for: ${viewingSubmissionFor.assignmentTitle}`
        : "Assignment Management";

    // --- Handlers ---
    const handleStreamSelect = (streamName) => {
        setSelectedStream(streamName);
        setSelectedLevel(initialLevelOptions[0]); 
        setStep(2);
        // Reset Subject/Batch/Assignment focus
        setSelectedBatchId(null);
        setSelectedSubjectId(null);
    };

    const handleLevelSelect = (levelName) => {
        setSelectedLevel(levelName);
        // Automatically select the first batch for the new stream/level combination
        const firstBatch = DUMMY_BATCHES.find(batch => batch.stream === selectedStream && batch.level === levelName);
        setSelectedBatchId(firstBatch ? firstBatch.id : null);
        setStep(3);
        setSelectedSubjectId(null); 
    };

    const handleBatchSelect = (batchId) => {
        setSelectedBatchId(batchId);
        // Auto-select the first subject when a batch is selected
        const firstSubject = (COURSE_SUBJECTS[selectedStream]?.[selectedLevel] || [])[0];
        setSelectedSubjectId(firstSubject ? firstSubject.id : null);
        setStep(4); 
    };
    
    const handleSubjectSelect = (subjectId) => {
        setSelectedSubjectId(subjectId);
        setStep(5); // Show assignment list
        setViewingSubmissionFor(null); // Ensure submission view is closed
    };

    // --- Modal Handlers ---
    const handleOpenModal = (context, assignmentId = null) => {
        setModalContext(context);
        if (context === "edit" && assignmentId !== null) {
            const assignment = DUMMY_ASSIGNMENTS.find(a => a.id === assignmentId);
            setAssignmentToEdit(assignment);
        } else {
            setAssignmentToEdit(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setAssignmentToEdit(null);
        setModalContext("add");
    };

    const handleAddAssignment = () => {
        handleOpenModal("add");
    };

    const handleEditAssignment = (assignmentId) => {
        handleOpenModal("edit", assignmentId);
    };

    // --- Submission View Handler ---
    const handleViewSubmissions = (assignmentInfo) => {
        const selectedBatch = DUMMY_BATCHES.find(batch => batch.id === selectedBatchId);

        setViewingSubmissionFor({
            ...assignmentInfo,
            stream: selectedStream,
            level: selectedLevel,
            batchName: selectedBatch?.courseName || 'Unknown Batch',
        });
        setStep(6);
    };

    // --- Submission Logic (Simulated) ---
    const handleAssignmentSubmit = (formData) => {
        // Find highest existing ID or use 0 if the array is empty
        const maxId = DUMMY_ASSIGNMENTS.reduce((max, a) => Math.max(max, a.id), 0);
        
        const newAssignment = {
            id: formData.id || maxId + 1,
            subjectId: selectedSubjectId, // Assign to the current subject
            assignmentNo: formData.assignmentNo,
            title: formData.title,
            marks: formData.marks,
            startDate: formData.startDate,
            submitDate: formData.submitDate,
            submittedCount: formData.submittedCount || 0,
            status: new Date(formData.submitDate) > new Date() ? "Upcoming" : "Completed", // Basic status logic
            fileName: formData.fileName,
            submissionType: formData.submissionType,
            colorId: formData.colorId, // Or a dynamic calculation
        };

        if (formData.id) {
            // Edit existing
            DUMMY_ASSIGNMENTS = DUMMY_ASSIGNMENTS.map(a => a.id === formData.id ? newAssignment : a);
        } else {
            // Add new
            DUMMY_ASSIGNMENTS = [...DUMMY_ASSIGNMENTS, newAssignment];
        }
        
        // Ensure UI updates (This requires forcing a re-render in a real application)
        // For this static code simulation, we rely on the component's re-render mechanism for state change.
        setIsModalOpen(false);
        setAssignmentToEdit(null);
    };

    // Scroll to the submission view when it becomes active
    useEffect(() => {
        if (viewingSubmissionFor && submissionViewRef.current) {
            submissionViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (step === 5 && assignmentDisplayRef.current) {
            assignmentDisplayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [viewingSubmissionFor, step]);

    // Go to previous step handler
    const handleGoBack = () => {
        if (step === 6) {
            setViewingSubmissionFor(null);
            setStep(5);
        } else if (step > 1) {
            setStep(step - 1);
        }
    };

    // The entire component structure is contained within the wrapper
    return (
        <div className="ad_asm_wrapper">
            <div className="ad_asm_header">
                <h1 className="ad_asm_page-title">{headerTitle}</h1>
                <div className="ad_asm_control-group">
                    {(step > 1 && !viewingSubmissionFor) && (
                        <button className="btn btn-outline-secondary" onClick={handleGoBack}>
                            <FiArrowLeft size={16} /> Go Back to Step {step - 1}
                        </button>
                    )}
                </div>
            </div>

            {/* STEP 1: Stream Selection */}
            {step >= 1 && !viewingSubmissionFor && (
                <div className="ad_asm_stream-nav-container">
                    <div className="ad_asm_stream-nav-flex">
                        {streams.map(stream => (
                            <div 
                                key={stream.name} 
                                className={`ad_asm_nav-card ${selectedStream === stream.name ? 'selected' : ''}`}
                                onClick={() => handleStreamSelect(stream.name)}
                            >
                                <h3>{stream.name}</h3>
                                <p>{stream.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* STEP 2: Level Selection */}
            {step >= 2 && !viewingSubmissionFor && (
                <div className="ad_asm_stream-nav-container">
                    <h2 className="ad_asm_section-title ad_asm_section-title-no-border">2. Select Level</h2>
                    <div className="ad_asm_stream-nav-flex ad_asm_level-nav">
                        {initialLevelOptions.map(level => (
                            <div 
                                key={level} 
                                className={`ad_asm_nav-card ${selectedLevel === level ? 'selected_sec' : ''}`}
                                onClick={() => handleLevelSelect(level)}
                            >
                                <h3>{level}</h3>
                                <p>{selectedStream} Level</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STEP 3: Batch Selection - Displayed after Step 2 */}
            {step >= 3 && !viewingSubmissionFor && (
                <div className="ad_asm_batch-view-section">
                    <h2 className="ad_asm_section-title">3. Select a Batch to Assign</h2>
                    <BatchDisplay
                        batches={availableBatches}
                        stream={selectedStream}
                        level={selectedLevel}
                        selectedBatchId={selectedBatchId}
                        onBatchSelect={handleBatchSelect}
                    />
                </div>
            )}

            {/* STEP 4: Subject Selection - Displayed after Step 3 */}
            {step >= 4 && !viewingSubmissionFor && selectedBatchId && (
                <div className="ad_asm_subject-view-section">
                    <h2 className="ad_asm_section-title">4. Select a Subject</h2>
                    <SubjectDisplay
                        subjects={availableSubjects}
                        stream={selectedStream}
                        level={selectedLevel}
                        selectedSubjectId={selectedSubjectId}
                        onSubjectSelect={handleSubjectSelect}
                    />
                </div>
            )}

            {/* STEP 5: Assignment Display & Actions - Displayed after Step 4 */}
            {step === 5 && !viewingSubmissionFor && selectedSubjectId && (
                <div ref={assignmentDisplayRef} className="ad_asm_assignment-display-section">
                    <AssignmentDisplay
                        assignments={assignmentsForSelectedSubject}
                        subjectDetails={getSubjectDetails(selectedStream, selectedLevel, selectedSubjectId)}
                        onAddAssignment={handleAddAssignment}
                        onEditAssignment={handleEditAssignment}
                        // 泊 Passed correctly now
                        viewingSubmissionFor={viewingSubmissionFor} 
                        onViewSubmissions={handleViewSubmissions}
                    />
                </div>
            )}
        
        
        {/* NEW: Assignment Form Modal - Conditional on modal state (Always rendered at the root) */}
        {isModalOpen && (
            <AssignmentFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                context={modalContext}
                initialData={assignmentToEdit}
                onSubmit={handleAssignmentSubmit}
            />
        )}

        {viewingSubmissionFor &&
            <div ref={submissionViewRef} className="ad_asm_view-submission-wrapper">
                <ViewSubmission
                    stream={viewingSubmissionFor.stream}
                    level={viewingSubmissionFor.level}
                    batchName={viewingSubmissionFor.batchName}
                    subjectName={viewingSubmissionFor.subjectName}
                    assignmentId={viewingSubmissionFor.id} // This is the crucial filter key
                    assignmentTitle={viewingSubmissionFor.assignmentTitle}
                    onClose={() => setViewingSubmissionFor(null)} // Allows the user to go back to Step 5
                />
            </div>
        }
    </div>
);
};

export default ad_asm_assignmentManagement;