import React, { useState, useEffect } from "react";
import { 
    FiSearch, FiX, FiCheckCircle, FiAlertCircle, FiPaperclip, FiArrowLeft, FiUser, FiCalendar
} from "react-icons/fi";
import "../../../Styles/SuperAdmin/Assignment.css"; 

// --- DUMMY DATA STRUCTURES (Provided by User for Context) ---

const DUMMY_SUBMISSIONS_DATA = [
    // ASSIGNMENT ID 1 (CA Foundation / CFA01)
    { assignmentId: 1, studentId: 9001, studentName: "Aman Sharma", file: "Aman_A1_Acc_Final.pdf", marks: 45, submittedDate: "2025-04-25", validated: true, approvalStatus: "Approved", approvedDate: "2025-04-26", fileSizeKB: 520 },
    { assignmentId: 1, studentId: 9002, studentName: "Bhavna Singh", file: "Bhavna_A1_Acc_V1.docx", marks: null, submittedDate: "2025-04-26", validated: false, approvalStatus: "Pending", approvedDate: null, fileSizeKB: 1024 }, // <-- Target Student
    { assignmentId: 1, studentId: 9003, studentName: "Chirag Dutta", file: "Chirag_A1_Acc_R1.pdf", marks: null, submittedDate: "2025-04-27", validated: false, approvalStatus: "Rejected", approvedDate: "2025-04-27", fileSizeKB: 305 },
    
    // ASSIGNMENT ID 2 (CA Foundation / CFL02)
    { assignmentId: 2, studentId: 9004, studentName: "Deepak Verma", file: "Deepak_A2_Law_Case.pdf", marks: 32, submittedDate: "2025-05-14", validated: true, approvalStatus: "Approved", approvedDate: "2025-05-15", fileSizeKB: 850 },
    { assignmentId: 2, studentId: 9005, studentName: "Esha Gupta", file: "Esha_A2_Law_Draft.pdf", marks: null, submittedDate: "2025-05-15", validated: false, approvalStatus: "Pending", approvedDate: null, fileSizeKB: 600 },
    
    // ASSIGNMENT ID 5 (CA Intermediate / CIA05)
    { assignmentId: 5, studentId: 9101, studentName: "Gaurav Kohli", file: "Gaurav_A5_InterAcc.docx", marks: 65, submittedDate: "2025-03-20", validated: true, approvalStatus: "Approved", approvedDate: "2025-03-22", fileSizeKB: 1500 },
    { assignmentId: 5, studentId: 9102, studentName: "Hitesh Jain", file: "Hitesh_A5_InterAcc.pdf", marks: 58, submittedDate: "2025-03-21", validated: true, approvalStatus: "Approved", approvedDate: "2025-03-22", fileSizeKB: 400 },

    // ASSIGNMENT ID 13 (CMA Foundation / CMF13)
    { assignmentId: 13, studentId: 9201, studentName: "Ira Khan", file: "Ira_A13_CMA_Law.pdf", marks: 40, submittedDate: "2025-04-10", validated: true, approvalStatus: "Approved", approvedDate: "2025-04-12", fileSizeKB: 780 },
    { assignmentId: 13, studentId: 9202, studentName: "Jatin Malik", file: "Jatin_A13_CMA_Law.pdf", marks: 35, submittedDate: "2025-04-11", validated: true, approvalStatus: "Approved", approvedDate: "2025-04-12", fileSizeKB: 920 },
    
    // ASSIGNMENT ID 16 (CA Advanced / CAA16)
    { assignmentId: 16, studentId: 9301, studentName: "Karan Iyer", file: "Karan_A16_AdvRep.pdf", marks: 80, submittedDate: "2025-05-10", validated: true, approvalStatus: "Approved", approvedDate: "2025-05-11", fileSizeKB: 2048 },
];
// --- END DUMMY DATA ---

// Helper to format file size
const formatFileSize = (kb) => {
    if (kb >= 1024) {
        return `${(kb / 1024).toFixed(2)} MB`;
    }
    return `${kb} KB`;
};

const ViewSubmission = ({ stream, level, batchName, subjectName, assignmentId, assignmentTitle, onClose, user }) => {
    
    const [searchTerm, setSearchTerm] = useState('');
    const MAX_MARKS = 50; // Placeholder Max Marks
    
    // 1. Determine if the current user is a student
    const isStudent = user === 'Student';
    const isApprover = user !== 'Student'; // Assuming anyone not a student can approve
    const studentId = 9001; // Assuming user.id holds the student's ID

    // 2. Initial Filter: Filter by assignment ID first
    let currentAssignmentSubmissions = DUMMY_SUBMISSIONS_DATA.filter(
        sub => sub.assignmentId === assignmentId
    );

    // 3. User-Role Filter: If it's a student, filter submissions by their student ID.
    if (isStudent && studentId) {
        // IMPORTANT: Convert studentId to a number if it comes from the user object as a string,
        // to match the DUMMY_SUBMISSIONS_DATA studentId type (number).
        const studentIdNumber = Number(studentId); 
        currentAssignmentSubmissions = currentAssignmentSubmissions.filter(
            sub => sub.studentId === studentIdNumber
        );
    }

    // 4. Apply Search Filter
    const filteredSubmissions = currentAssignmentSubmissions.filter(sub => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            sub.studentName.toLowerCase().includes(searchLower) ||
            String(sub.studentId).includes(searchLower) ||
            sub.file.toLowerCase().includes(searchLower)
        );
    });

    // Determine the header count and search bar visibility
    const headerCount = isStudent ? (
        filteredSubmissions.length > 0 ? filteredSubmissions.length : 0
    ) : (
        currentAssignmentSubmissions.length
    );
    
    // Student view doesn't need a search bar to filter other students
    const showSearchBar = !isStudent;
    
    // Placeholder function for the approval action
    const handleApprovalAction = (studentId, status) => {
        console.log(`Simulating: Student ID ${studentId} submission for Assignment ${assignmentId} set to ${status}`);
        // In a real application, this would update the DUMMY_SUBMISSIONS_DATA state/API
    };

    // Helper to get file icon and its color class (copied from Assignment.jsx)
    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(extension)) return { colorClass: 'text-error' };
        if (['docx', 'doc'].includes(extension)) return { colorClass: 'text-info' };
        return { colorClass: 'text-warning' };
    };

    // --- RENDER FUNCTIONS ---

    const renderApproverTable = () => (
        <div className="vs_table-wrapper am_assignment-table-wrapper" style={{ marginTop: '15px' }}>
            <table className="am_assignment-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Assignment Name</th>
                        <th>Uploaded By</th>
                        <th>File / Size</th>
                        <th>Approve/Reject</th>
                        <th>Status Date</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((sub, index) => {
                            const fileInfo = getFileIcon(sub.file);
                            return (
                                <tr key={sub.studentId}>
                                    <td>{index + 1}</td>
                                    <td>**{assignmentTitle}**</td>
                                    <td>
                                        <FiUser size={14} style={{ marginRight: '5px' }} />
                                        {sub.studentName} ({sub.studentId})
                                    </td>
                                    <td className="am_file-cell">
                                        <FiPaperclip className={fileInfo.colorClass} />
                                        <span className="am_file-cell-text">{sub.file}</span>
                                        <span style={{ fontSize: '0.8em', color: 'var(--color-gray-600)', marginLeft: '8px' }}>
                                            ({formatFileSize(sub.fileSizeKB)})
                                        </span>
                                    </td>
                                    <td>
                                        {sub.approvalStatus === 'Pending' ? (
                                            <div className="am_action-cell">
                                                <button
                                                    className="btn btn-icon btn-sm"
                                                    title="Approve Submission"
                                                    onClick={() => handleApprovalAction(sub.studentId, 'Approved')}
                                                >
                                                    <FiCheckCircle size={16} style={{ color: 'var(--color-success-dark)' }} />
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-sm am_action-delete"
                                                    title="Reject Submission"
                                                    onClick={() => handleApprovalAction(sub.studentId, 'Rejected')}
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontWeight: 'bold' }} className={sub.approvalStatus === 'Approved' ? 'text-success' : 'text-error'}>
                                                {sub.approvalStatus}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {sub.approvedDate ? (
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <FiCalendar size={14} style={{ marginRight: '5px' }} />
                                                {sub.approvedDate}
                                            </span>
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="6" className="am_no-results-table">
                                No submissions found or matching search criteria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderStudentTable = () => (
        <div className="vs_table-wrapper am_assignment-table-wrapper" style={{ marginTop: '15px' }}>
            <table className="am_assignment-table">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Submitted File</th>
                        <th>Marks</th>
                        <th>Submitted Date</th>
                        <th>Validated</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map(sub => (
                            <tr key={sub.studentId}>
                                <td>{sub.studentName}</td>
                                <td>{sub.studentId}</td>
                                <td className="am_file-cell">
                                    {/* File Icon based on extension */}
                                    <FiPaperclip 
                                        className={`text-${sub.file.includes('.pdf') ? 'error' : sub.file.includes('.docx') ? 'info' : 'warning'}`} 
                                    />
                                    <span className="am_file-cell-text">{sub.file}</span>
                                </td>
                                <td>
                                    {sub.marks !== null ? (
                                        <span style={{ fontWeight: 'bold' }}>{sub.marks} / {MAX_MARKS}</span>
                                    ) : (
                                        <span style={{ color: 'var(--color-warning-dark)' }}>Pending</span>
                                    )}
                                </td>
                                <td>{sub.submittedDate}</td>
                                <td>
                                    {sub.validated ? (
                                        <FiCheckCircle size={16} style={{ color: 'var(--color-success-dark)' }} />
                                    ) : (
                                        <FiAlertCircle size={16} style={{ color: 'var(--color-warning-dark)' }} />
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="am_no-results-table">
                                You have no submission for this assignment or you are not enrolled.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="am_assignment-submissions-section vs_card-container">
            <div className="vs_header-bar">
                {/* Back Button */}
                <button className="vs_back-button" onClick={onClose} title="Back to Assignments">
                    <FiArrowLeft size={20} />
                </button>
                
                {/* Contextual Title - Uses the passed-in parameters */}
                <div className="vs_title-group">
                    <h4 className="vs_subtitle">
                        Subject - {subjectName}
                    </h4>
                </div>
            </div>

            <div className="vs_detail-panel-content am_detail-panel-content">
                <div className="vs_controls-header am_batch-controls-header">
                    <h4 className="vs_table-header am_detail-header">
                        Assignment Name:: {assignmentTitle} ({headerCount} {isStudent ? 'Submission' : 'Submissions'})
                    </h4>
                    
                    {/* Search Bar - Only visible for non-student users */}
                    {showSearchBar && (
                        <div className="vs_search-bar am_search-bar am_batch-search-bar">
                            <FiSearch className="am_search-icon" />
                            <input
                                type="text"
                                placeholder="Search Student Name, ID, or File..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <FiX className="am_clear-icon" onClick={() => setSearchTerm('')} />
                            )}
                        </div>
                    )}
                </div>

                {/* Table Display */}
                {isApprover ? renderApproverTable() : renderStudentTable()}
            </div>
        </div>
    );
};

export default ViewSubmission;