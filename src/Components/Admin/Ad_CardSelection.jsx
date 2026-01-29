import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    FiSearch, FiPlus, FiEdit2, FiTrash2,
    FiX, FiAlertTriangle, FiCheckCircle,
} from "react-icons/fi";
import { CheckCircle } from "lucide-react"; 
import { RiUserForbidFill } from "react-icons/ri"; 
import DynamicTable from "../Reusable/DynamicTable";
import "../../Styles/Admin/Ad_CardSelection.css";

// --- NEW HELPER FUNCTIONS (Copied from TeacherManagement) ---
// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Helper function to calculate date one week from now
const getOneWeekFromNow = (startDate = new Date()) => {
    const nextWeek = new Date(startDate);
    nextWeek.setDate(startDate.getDate() + 7);
    return formatDate(nextWeek);
};

// --- STATIC DATA OPTIONS ---
const COURSE_STREAMS = ["CA", "CMA", "ACMA"];
const COURSE_LEVELS = ["Foundation", "Intermediate", "Final"];
const Programme_OPTIONS = ["Junior Pack", "Remastered Pack", "Sure Pass"];
const CLASS_OPTIONS = ["Class A", "Class B", "Class C"];

// --- DUMMY DATA ---
const dummyInstitutes = [
    { id: 1, name: "Nexus Academy", prefix: "NA", location: "Mumbai" },
    { id: 2, name: "Global EdTech", prefix: "GET", location: "Delhi" },
];

// --- COLUMN DEFINITIONS (Updated to include suspension dates) ---
const STUDENT_COLUMN_ORDER = [
    'fullName', 'rollNumber', 'instituteName', 'program', 'level', 'package', 'class', 
    'courses', 'admissionDate', 'suspensionStart', 'suspensionEnd', 'status', 'email', 'phone'
];

// --- 15 STUDENT DATA RECORDS (incorporating new filters) ---
const initialStudents = [
    // 1. CA / Foundation / Junior Pack / Class A / Nexus Academy
    { id: 1, fullName: "Aarav S. Varma", rollNumber: "CA-F-001", email: "aarav.v@lms.com", phone: "9876543210", program: "CA", level: "Foundation", package: "Junior Pack", class: "Class A", courses: ["Math", "Accounts"], batch: "CA-F-Apr25", admissionDate: "2024-11-01", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    { id: 2, fullName: "Bela R. Joshi", rollNumber: "CA-F-002", email: "bela.j@lms.com", phone: "9876543211", program: "CA", level: "Foundation", package: "Junior Pack", class: "Class A", courses: ["Math", "Accounts"], batch: "CA-F-Apr25", admissionDate: "2024-11-02", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    { id: 3, fullName: "Chirag M. Patel", rollNumber: "CA-F-003", email: "chirag.p@lms.com", phone: "9876543212", program: "CA", level: "Foundation", package: "Remastered Pack", class: "Class B", courses: ["Law", "Accounts"], batch: "CA-F-Apr25", admissionDate: "2024-11-03", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 4. CA / Intermediate / Sure Pass / Class C / Global EdTech
    { id: 4, fullName: "Deepika T. Nair", rollNumber: "CA-I-004", email: "deepika.n@lms.com", phone: "9876543213", program: "CA", level: "Intermediate", package: "Sure Pass", class: "Class C", courses: ["Costing", "Tax"], batch: "CA-I-Dec25", admissionDate: "2025-01-10", status: "Active", instituteName: "Global EdTech", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    { id: 5, fullName: "Eshaan P. Khan", rollNumber: "CA-I-005", email: "eshaan.k@lms.com", phone: "9876543214", program: "CA", level: "Intermediate", package: "Sure Pass", class: "Class C", courses: ["Costing", "Tax"], batch: "CA-I-Dec25", admissionDate: "2025-01-11", status: "Suspended", instituteName: "Global EdTech", suspensionReason: "Non-payment", suspensionStart: "2025-10-01", suspensionEnd: "2025-10-31"},
    
    // 6. CMA / Foundation / Junior Pack / Class B / Nexus Academy
    { id: 6, fullName: "Falak S. Gill", rollNumber: "CMA-F-006", email: "falak.g@lms.com", phone: "9876543215", program: "CMA", level: "Foundation", package: "Junior Pack", class: "Class B", courses: ["Math", "Eco"], batch: "CMA-F-May26", admissionDate: "2025-05-20", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    { id: 7, fullName: "Gaurav H. Yadav", rollNumber: "CMA-F-007", email: "gaurav.y@lms.com", phone: "9876543216", program: "CMA", level: "Foundation", package: "Junior Pack", class: "Class B", courses: ["Math", "Eco"], batch: "CMA-F-May26", admissionDate: "2025-05-21", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 8. CMA / Intermediate / Remastered Pack / Class A / Global EdTech
    { id: 8, fullName: "Heena B. Reddy", rollNumber: "CMA-I-008", email: "heena.r@lms.com", phone: "9876543217", program: "CMA", level: "Intermediate", package: "Remastered Pack", class: "Class A", courses: ["Audit", "FM"], batch: "CMA-I-Sep25", admissionDate: "2025-09-01", status: "Active", instituteName: "Global EdTech", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    { id: 9, fullName: "Ishaan T. Verma", rollNumber: "CMA-I-009", email: "ishaan.v@lms.com", phone: "9876543218", program: "CMA", level: "Intermediate", package: "Remastered Pack", class: "Class A", courses: ["Audit", "FM"], batch: "CMA-I-Sep25", admissionDate: "2025-09-02", status: "Active", instituteName: "Global EdTech", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 10. ACMA / Final / Sure Pass / Class A / Nexus Academy
    { id: 10, fullName: "Jiya C. Menon", rollNumber: "ACMA-F-010", email: "jiya.m@lms.com", phone: "9876543219", program: "ACMA", level: "Final", package: "Sure Pass", class: "Class A", courses: ["Strategy"], batch: "ACMA-F-Mar26", admissionDate: "2026-03-01", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 11. ACMA / Final / Remastered Pack / Class C / Nexus Academy
    { id: 11, fullName: "Karan B. Sharma", rollNumber: "ACMA-F-011", email: "karan.s@lms.com", phone: "9776543210", program: "ACMA", level: "Final", package: "Remastered Pack", class: "Class C", courses: ["Strategy"], batch: "ACMA-F-Mar26", admissionDate: "2026-03-02", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 12. CA / Final / Junior Pack / Class B / Global EdTech
    { id: 12, fullName: "Latika H. Saxena", rollNumber: "CA-F-012", email: "latika.h@lms.com", phone: "9776543211", program: "CA", level: "Final", package: "Junior Pack", class: "Class B", courses: ["Advanced Tax"], batch: "CA-F-May27", admissionDate: "2026-05-01", status: "Active", instituteName: "Global EdTech", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 13. CMA / Intermediate / Sure Pass / Class A / Nexus Academy
    { id: 13, fullName: "Manish R. Aggarwal", rollNumber: "CMA-I-013", email: "manish.a@lms.com", phone: "9776543212", program: "CMA", level: "Intermediate", package: "Sure Pass", class: "Class A", courses: ["Audit", "FM"], batch: "CMA-I-Sep25", admissionDate: "2025-09-03", status: "Suspended", instituteName: "Nexus Academy", suspensionReason: "Academic misconduct", suspensionStart: "2025-11-01", suspensionEnd: "2025-11-07"},

    // 14. ACMA / Foundation / Remastered Pack / Class B / Global EdTech
    { id: 14, fullName: "Nidhi S. Tiwari", rollNumber: "ACMA-F-014", email: "nidhi.t@lms.com", phone: "9776543213", program: "ACMA", level: "Foundation", package: "Remastered Pack", class: "Class B", courses: ["Math"], batch: "ACMA-F-Jun26", admissionDate: "2026-06-01", status: "Active", instituteName: "Global EdTech", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
    
    // 15. CA / Intermediate / Junior Pack / Class A / Nexus Academy
    { id: 15, fullName: "Omkar A. Singh", rollNumber: "CA-I-015", email: "omkar.s@lms.com", phone: "9776543214", program: "CA", level: "Intermediate", package: "Junior Pack", class: "Class A", courses: ["Costing"], batch: "CA-I-Dec25", admissionDate: "2025-01-12", status: "Active", instituteName: "Nexus Academy", suspensionReason: "", suspensionStart: "", suspensionEnd: ""},
];


// --- Main Component ---
const Ad_CardSelection = () => {
    // --- State Management for Students ---
    const [students, setStudents] = useState(initialStudents);
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [studentActiveFilters, setStudentActiveFilters] = useState({
        instituteName: "", program: "", level: "", package: "", class: "", status: "",
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // --- SUSPENSION STATE (Copied from TeacherManagement) ---
    const [suspendPopup, setSuspendPopup] = useState({ 
        open: false, 
        student: null, // Changed from 'teacher' to 'student'
        reason: '', 
        status: 'Suspended',
        start_date: formatDate(new Date()),
        end_date: getOneWeekFromNow(new Date()) 
    }); 

    // 1. Student Filter Definitions
    const STUDENT_FILTER_DEFINITIONS = useMemo(() => {
        const getUniqueOptions = (key, labelKey) => {
            // Get unique values from current student data (e.g., instituteName, status)
            const values = new Set(students.map(d => d[key]).filter(Boolean));
            const options = Array.from(values).sort().map(v => ({ value: v, label: v }));
            return [{ value: "", label: `All ${labelKey}` }, ...options];
        };
        
        // Helper to map static arrays to DynamicTable format
        const mapStaticOptions = (arr, labelKey) => {
            const options = arr.map(v => ({ value: v, label: v }));
            return [{ value: "", label: `All ${labelKey}` }, ...options];
        };

        return {
            instituteName: getUniqueOptions('instituteName', 'Institutes'),
            program: mapStaticOptions(COURSE_STREAMS, 'Programs'),
            level: mapStaticOptions(COURSE_LEVELS, 'Levels'),
            package: mapStaticOptions(Programme_OPTIONS, 'Programme'),
            class: mapStaticOptions(CLASS_OPTIONS, 'Classes'),
            status: getUniqueOptions('status', 'Status'),
        };
    }, [students]);

    // 2. Student Filtering Logic
    const filteredStudents = useMemo(() => {
        let data = students;
        if (studentSearchTerm) {
            const query = studentSearchTerm.toLowerCase();
            data = data.filter(d => 
                d.fullName.toLowerCase().includes(query) || 
                d.rollNumber.toLowerCase().includes(query) ||
                d.email.toLowerCase().includes(query)
            );
        }
        return data.filter((d) => {
            const matchesInstitute = !studentActiveFilters.instituteName || d.instituteName === studentActiveFilters.instituteName;
            const matchesProgram = !studentActiveFilters.program || d.program === studentActiveFilters.program;
            const matchesLevel = !studentActiveFilters.level || d.level === studentActiveFilters.level;
            const matchesPackage = !studentActiveFilters.package || d.package === studentActiveFilters.package;
            const matchesClass = !studentActiveFilters.class || d.class === studentActiveFilters.class;
            const matchesStatus = !studentActiveFilters.status || d.status === studentActiveFilters.status;
            
            return matchesInstitute && matchesProgram && matchesLevel && matchesPackage && matchesClass && matchesStatus;
        });
    }, [students, studentSearchTerm, studentActiveFilters]);

    // 3. Common CRUD Handlers (simplified for demonstration)
    const handleStudentFilterChange = useCallback((column, value) => { setStudentActiveFilters(prev => ({ ...prev, [column]: value })); }, []);
    
    const handleStudentEdit = useCallback((student) => { alert(`Edit Student: ${student.fullName}`); }, []);
    const handleStudentDelete = useCallback((student) => { 
        if (window.confirm(`Are you sure you want to delete student: "${student.fullName}"?`)) {
            setStudents(prev => prev.filter(s => s.id !== student.id));
            alert(`Student ${student.fullName} deleted.`);
        }
    }, [setStudents]);
    const handleStudentAddNew = () => { alert("Opening form to enroll new student..."); }
    
    // --- SUSPEND / REACTIVATE HANDLERS (Adapted from TeacherManagement) ---
    const handleStudentSuspendReactivate = useCallback((student) => { 
        const isSuspended = student.status === 'Suspended';
        const today = formatDate(new Date());

        setSuspendPopup({ 
            open: true, 
            student: student, 
            reason: student.suspensionReason || '', 
            status: isSuspended ? 'Active' : 'Suspended', 
            start_date: isSuspended ? '' : (student.suspensionStart || today), 
            end_date: isSuspended ? '' : (student.suspensionEnd || getOneWeekFromNow(new Date())) 
        });
    }, []);

    const handleStudentSuspendConfirm = (e) => {
        e.preventDefault();
        const isSuspending = suspendPopup.status === 'Suspended';
        let finalStart = suspendPopup.start_date;
        let finalEnd = suspendPopup.end_date;
        
        if (isSuspending) {
            if (!finalStart) finalStart = formatDate(new Date());
            if (!finalEnd || new Date(finalEnd) < new Date(finalStart)) { 
                finalEnd = getOneWeekFromNow(new Date(finalStart));
            }
        } else {
            finalStart = '';
            finalEnd = '';
        }

        setStudents(prev => prev.map(s => 
            s.id === suspendPopup.student.id 
            ? { 
                ...s, 
                status: suspendPopup.status, 
                suspensionReason: isSuspending ? suspendPopup.reason : '',
                suspensionStart: finalStart,
                suspensionEnd: finalEnd
              }
            : s
        ));
        
        setSuspendPopup({ open: false, student: null, reason: '', status: 'Suspended', start_date: formatDate(new Date()), end_date: getOneWeekFromNow(new Date()) });
        setSuccess(isSuspending ? `Student ${suspendPopup.student.fullName} suspended successfully.` : `Student ${suspendPopup.student.fullName} reactivated.`);
        setTimeout(() => setSuccess(null), 3000); 
    };

    // --- MAIN RENDER ---
    return (
        <div className="ad_cs_batch-pro-wrapper">
            
            <div className="ad_cs_batch-pro-header-main">
                <h1 className="ad_cs_page-title">Student Management</h1>
            </div>
            
            {/* Feedback Messages (Simplified) */}
            {error && <div className="ad_cs_batch-pro-message ad_cs_error"><FiAlertTriangle size={16} /> {error}</div>}
            {success && <div className="ad_cs_batch-pro-message ad_cs_success"><FiCheckCircle size={16} /> {success}</div>}
            
         
            <DynamicTable
                data={filteredStudents}
                columnOrder={STUDENT_COLUMN_ORDER}
                title="Students"
                onEdit={handleStudentEdit}
                onDelete={handleStudentDelete}
                onSuspendReactivate={handleStudentSuspendReactivate} // Added Suspend/Reactivate
                filterDefinitions={STUDENT_FILTER_DEFINITIONS}
                activeFilters={studentActiveFilters}
                onFilterChange={handleStudentFilterChange} 
                onSearch={setStudentSearchTerm} 
                pillColumns={['courses']}
                customDescription="Manage enrolled students across different courses, levels, Programme, and classes."
            />
            
            {/* ==================================
               SUSPEND/REACTIVATE MODAL (Copied & Adapted)
               ================================== */}
            {suspendPopup.open && (
                <div className="tm_modal-overlay fade-in">
                    <div className="tm_success-modal" style={{ maxWidth: '500px' }}>
                        {suspendPopup.status === 'Suspended' ? (
                            <RiUserForbidFill size={48} style={{color: 'var(--brand-orange)'}} className="tm_success-icon" />
                        ) : (
                            <CheckCircle size={48} className="tm_success-icon" />
                        )}
                        
                        <h3 className="tm_success-title" style={{color: suspendPopup.status === 'Suspended' ? 'var(--brand-orange-dark)' : 'var(--color-success-dark)'}}>
                            {suspendPopup.status === 'Suspended' ? 'Confirm Suspension' : 'Confirm Reactivation'}
                        </h3>
                        
                        <p className="tm_success-message" style={{marginBottom: 'var(--space-4)'}}>
                            {suspendPopup.status === 'Suspended' ? 
                                `Apply suspension for ${suspendPopup.student.fullName}.` : 
                                `Reactivate ${suspendPopup.student.fullName}. Suspension reason/dates will be cleared.`
                            }
                        </p>

                        <form onSubmit={handleStudentSuspendConfirm} style={{width: '100%'}}>
                          <div className="tm_form-group">
                            <label style={{textAlign: 'left'}}>Status<span className="tm_required">*</span></label>
                            <select 
                              name="status" 
                              value={suspendPopup.status} 
                              onChange={(e) => {
                                  setSuspendPopup(prev => ({ 
                                      ...prev, 
                                      status: e.target.value,
                                  }));
                              }}
                              required
                              className="tm_search-input" 
                              style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                            >
                              <option value="Active">Active</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>

                          {suspendPopup.status === 'Suspended' && (
                            <>
                              {/* Reason for Suspension */}
                              <div className="tm_form-group" style={{marginBottom: 'var(--space-4)'}}>
                                  <label style={{textAlign: 'left'}}>Reason for Suspension<span className="tm_required">*</span></label>
                                  <input 
                                      name="reason" 
                                      placeholder="Enter reason..." 
                                      value={suspendPopup.reason} 
                                      onChange={(e) => setSuspendPopup(prev => ({ ...prev, reason: e.target.value }))}
                                      required
                                      className="tm_search-input" 
                                      style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                                  />
                              </div>
                              
                              {/* Suspension Timeline (Date Range) */}
                              <div className="tm_form-group">
                                  <label style={{textAlign: 'left'}}>Suspension Timeline (Start to End)</label>
                                  <div className="tm_form-row" style={{gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)'}}>
                                      <input 
                                          type="date"
                                          name="start_date" 
                                          value={suspendPopup.start_date} 
                                          onChange={(e) => {
                                              let end = suspendPopup.end_date;
                                              if (!end || new Date(end) <= new Date(e.target.value)) {
                                                  end = getOneWeekFromNow(new Date(e.target.value || formatDate(new Date())));
                                              }
                                              setSuspendPopup(prev => ({ ...prev, start_date: e.target.value, end_date: end }));
                                          }}
                                          className="tm_search-input" 
                                          style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                                      />
                                      <input 
                                          type="date"
                                          name="end_date" 
                                          value={suspendPopup.end_date} 
                                          onChange={(e) => setSuspendPopup(prev => ({ ...prev, end_date: e.target.value }))}
                                          min={suspendPopup.start_date || formatDate(new Date())} 
                                          className="tm_search-input" 
                                          style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                                      />
                                  </div>
                                  <small style={{textAlign: 'left', marginTop: '5px', color: 'var(--color-gray-600)'}}>
                                      *Default end date is 1 week from start date if left empty.
                                  </small>
                              </div>
                            </>
                          )}

                          <button 
                            type="submit"
                            className="btn btn-primary" 
                            style={{backgroundColor: suspendPopup.status === 'Suspended' ? 'var(--brand-orange)' : 'var(--color-success)', width: '100%', marginTop: 'var(--space-6)', marginBottom: '10px'}}
                          >
                            {suspendPopup.status === 'Suspended' ? 'Confirm Suspend' : 'Confirm Reactivate'}
                          </button>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            onClick={() => setSuspendPopup({open: false, student: null, reason: '', status: 'Suspended', start_date: formatDate(new Date()), end_date: getOneWeekFromNow(new Date())})}
                            style={{width: '100%', color: 'var(--color-gray-700)', borderColor: 'var(--color-gray-300)'}}
                          >
                            Cancel
                          </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Ad_CardSelection;