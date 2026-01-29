import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PlusCircle, X, CheckCircle, Pencil, Trash2, Save } from "lucide-react"; 
import { FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdBlock } from "react-icons/md"; 
import { RiUserForbidFill } from "react-icons/ri"; 
import { HiUserCircle } from "react-icons/hi"; 
import '../../Styles/SuperAdmin/TeacherManagement.css'; 
// --- New Import ---
import DynamicTable from "../Reusable/DynamicTable";

// --- STATIC DATA AND CONSTANTS ---
const COURSES_OPTIONS = ["Physics", "Math", "Biology", "Chemistry", "History"];
const BATCHES_OPTIONS = ["Batch A", "Batch B", "Batch C", "Batch C", "Batch D"];
const Programme_OPTIONS = ["Basic Package", "Premium Package", "Gold Package"]; 

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Helper function to calculate date one week from now
const getOneWeekFromNow = (startDate = new Date()) => {
    const nextWeek = new Date(startDate);
    nextWeek.setDate(startDate.getDate() + 7);
    return formatDate(nextWeek);
};

// Define the precise column order for the DynamicTable
const TEACHER_COLUMN_ORDER = [
  'fullName', 
  'employeeId', 
  'email', 
  'instituteName', 
  'courses', 
  'assignedBatch', 
  'assignedPackage', 
  'joiningDate', 
  'status',
];

const initialNewTeacherState = {
  fullName: "",
  employeeId: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  courses: [],
  assignedBatch: [],
  joiningDate: "",
  status: "Active",
  suspensionReason: "",
  suspensionStart: "", 
  suspensionEnd: "",
  profile_image: null,
  instituteName: "",
  assignedPackage: "", 
};

const TeacherManagement = () => {
  const [showForm, setShowForm] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  // Filter state for DynamicTable custom filters
  const [activeFilters, setActiveFilters] = useState({ 
    batch: "", 
    status: "", 
    subject: "", 
    institute: "", 
    package: "" 
  });

  const [teachers, setTeachers] = useState([
    {
      id: 1, 
      fullName: "Vikram R. R. Rao", 
      employeeId: "TCH502",
      email: "vikram@careerpoint.com",
      phone: "+91-9812345678",
      username: "vikram.teacher",
      courses: ["Physics", "Math"],
      assignedBatch: ["Batch A", "Batch C"],
      joiningDate: "2025-07-01",
      status: "Active",
      suspensionReason: "",
      suspensionStart: "",
      suspensionEnd: "",
      profile_image: null, 
      instituteName: "Career Point Institute",
      assignedPackage: "Premium Package",
    },
    {
      id: 2, 
      fullName: "Riya Patel",
      employeeId: "TCH503",
      email: "riya@careerpoint.com",
      phone: "+91-9823456789",
      username: "riya.teacher",
      courses: ["Biology"],
      assignedBatch: ["Batch B"],
      joiningDate: "2025-06-01",
      status: "Suspended",
      suspensionReason: "Contract break",
      suspensionStart: "2025-09-01",
      suspensionEnd: "2025-09-08",
      profile_image: null,
      instituteName: "Global Academy",
      assignedPackage: "Basic Package",
    },
    {
      id: 3, 
      fullName: "Amit Sharma",
      employeeId: "TCH504",
      email: "amit@test.com",
      phone: "+91-9000011111",
      username: "amit.teacher",
      courses: ["Chemistry", "Physics"],
      assignedBatch: ["Batch A", "Batch D"],
      joiningDate: "2025-08-15",
      status: "Active",
      suspensionReason: "",
      suspensionStart: "",
      suspensionEnd: "",
      profile_image: null,
      instituteName: "Career Point Institute",
      assignedPackage: "Premium Package",
    }
  ]);

  const [newTeacher, setNewTeacher] = useState(initialNewTeacherState);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); 
  
  // Removed selectedTeachers state as it's not used with DynamicTable
  // const [selectedTeachers, setSelectedTeachers] = useState([]); 
  const [editTeacher, setEditTeacher] = useState(null); 
  
  const [suspendPopup, setSuspendPopup] = useState({ 
    open: false, 
    teacher: null, 
    reason: '', 
    status: 'Suspended',
    start_date: formatDate(new Date()),
    end_date: getOneWeekFromNow(new Date()) 
  }); 

  const [deletePopup, setDeletePopup] = useState({ open: false, teacher: null });
  
  useEffect(() => {
    if (editTeacher) {
      // Ensure all fields are correctly mapped for editing
      setNewTeacher({ 
          ...initialNewTeacherState, 
          ...editTeacher,
          courses: editTeacher.courses || [],
          assignedBatch: editTeacher.assignedBatch || [],
          joiningDate: editTeacher.joiningDate || '',
          status: editTeacher.status || 'Active',
          instituteName: editTeacher.instituteName || '',
          assignedPackage: editTeacher.assignedPackage || '',
      });
    } else {
      setNewTeacher(initialNewTeacherState);
    }
  }, [editTeacher]);

  // --- Filter and Form Logic ---
  const handleCloseForm = () => {
    setNewTeacher(initialNewTeacherState);
    setEditTeacher(null); 
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTeacher((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e, key) => {
    const { value, checked } = e.target;
    setNewTeacher((prev) => {
      const currentValues = prev[key];
      if (checked) {
        return { ...prev, [key]: [...currentValues, value] };
      } else {
        return { ...prev, [key]: currentValues.filter((v) => v !== value) };
      }
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const newId = teachers.reduce((maxId, teacher) => Math.max(teacher.id || 0, maxId), 0) + 1;
    setTeachers((prev) => [...prev, {...newTeacher, id: newId, employeeId: newTeacher.employeeId || `TCH${newId}`, instituteName: newTeacher.instituteName || 'Unassigned Institute'}]);
    
    handleCloseForm();
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000); 
  };
  
  const handleUpdate = (e) => {
    e.preventDefault();
    setTeachers(prev => prev.map(t => t.id === newTeacher.id ? newTeacher : t));
    
    setEditTeacher(null); 
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000); 
  };
  
  // --- DynamicTable Action Handlers (Wrapped existing logic) ---
  const handleEdit = useCallback((teacher) => {
    setEditTeacher(teacher); 
    setShowForm(true); 
  }, []);

  const handleDelete = useCallback((teacher) => {
    setDeletePopup({ open: true, teacher });
  }, []);

  // Renamed to match DynamicTable prop
  const handleSuspendReactivate = useCallback((teacher) => { 
    const isSuspended = teacher.status === 'Suspended';
    const today = formatDate(new Date());

    setSuspendPopup({ 
        open: true, 
        teacher: teacher, 
        reason: teacher.suspensionReason || '', 
        status: isSuspended ? 'Active' : 'Suspended', 
        start_date: isSuspended ? '' : (teacher.suspensionStart || today), 
        end_date: isSuspended ? '' : (teacher.suspensionEnd || getOneWeekFromNow(new Date())) 
    });
  }, []);

  const handleSuspendConfirm = (e) => {
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

    setTeachers(prev => prev.map(t => 
        t.id === suspendPopup.teacher.id 
        ? { 
            ...t, 
            status: suspendPopup.status, 
            suspensionReason: isSuspending ? suspendPopup.reason : '',
            suspensionStart: finalStart,
            suspensionEnd: finalEnd
          }
        : t
    ));
    
    setSuspendPopup({ open: false, teacher: null, reason: '', status: 'Suspended', start_date: formatDate(new Date()), end_date: getOneWeekFromNow(new Date()) });
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000); 
  };
  
  // --- Filtering and Options Logic for DynamicTable ---
  const getInstituteOptions = () => {
    const institutes = new Set(teachers.map(t => t.instituteName).filter(Boolean));
    // DynamicTable expects [{value: '', label: 'All...'}, ...]
    const options = Array.from(institutes).sort().map(i => ({ value: i, label: i }));
    return [{ value: "", label: "All Institutes" }, ...options];
  };

  const getCourseOptions = () => {
      const options = COURSES_OPTIONS.map(c => ({ value: c, label: c }));
      return [{ value: "", label: "All Subjects" }, ...options];
  };
  
  const getBatchOptions = () => {
      const options = BATCHES_OPTIONS.map(b => ({ value: b, label: b }));
      return [{ value: "", label: "All Batches" }, ...options];
  };

  const getPackageOptions = () => {
      const options = Programme_OPTIONS.map(p => ({ value: p, label: p }));
      return [{ value: "", label: "All Programme" }, ...options];
  };

  const getStatusOptions = () => {
      return [
          { value: "", label: "All Status" },
          { value: "Active", label: "Active" },
          { value: "Suspended", label: "Suspended" },
      ];
  };
  
  const TEACHER_FILTER_DEFINITIONS = useMemo(() => ({
    instituteName: getInstituteOptions(), // Key must match column name
    assignedBatch: getBatchOptions(),
    assignedPackage: getPackageOptions(),
    status: getStatusOptions(),
    courses: getCourseOptions(),
  }), [teachers]);

  // Handler to update the filter state (used by DynamicTable)
  const handleFilterChange = useCallback((column, value) => {
    // Note: column comes from filterDefinitions keys (e.g., 'instituteName', 'assignedPackage')
    setActiveFilters(prev => ({ ...prev, [column]: value }));
  }, []);


  const filteredTeachers = useMemo(() => {
    // 1. Apply general search term (DynamicTable handles this internally if onSearch is passed, 
    // but since we are replacing the internal search, we handle it here on the full data set).
    let data = teachers;
    if (searchTerm) {
        const query = searchTerm.toLowerCase();
        data = data.filter(t => 
            t.fullName.toLowerCase().includes(query) ||
            t.email.toLowerCase().includes(query)
        );
    }

    // 2. Apply Custom Filters (Batch, Status, Subject, etc.)
    return data.filter((t) => {
        const matchesInstitute = !activeFilters.institute || t.instituteName === activeFilters.institute;
        // Check if ANY assignedBatch includes the filter batch
        const matchesBatch = !activeFilters.batch || t.assignedBatch.includes(activeFilters.batch);
        const matchesStatus = !activeFilters.status || t.status === activeFilters.status;
        // Check if ANY course includes the filter subject
        const matchesSubject = !activeFilters.subject || t.courses.includes(activeFilters.subject);
        const matchesPackage = !activeFilters.package || t.assignedPackage === activeFilters.package;

        return matchesInstitute && matchesBatch && matchesStatus && matchesSubject && matchesPackage;
    });

  }, [teachers, searchTerm, activeFilters]);


  // --- Reusable Form Component (Used for Create & Edit) ---
  const TeacherForm = ({ onSubmit, isEdit }) => (
    <form className="tm_user-form" onSubmit={onSubmit}>
        <div className="tm_form-row">
            <div className="tm_form-group">
                <label>Full Name<span className="tm_required">*</span></label>
                <input name="fullName" placeholder="Full Name" value={newTeacher.fullName} onChange={handleChange} required />
            </div>
            <div className="tm_form-group">
                <label>Employee ID<span className="tm_required">*</span></label>
                <input name="employeeId" placeholder="Employee ID" value={newTeacher.employeeId} onChange={handleChange} required disabled={isEdit} />
            </div>
        </div>
        <div className="tm_form-row">
            <div className="tm_form-group">
                <label>Email<span className="tm_required">*</span></label>
                <input type="email" name="email" placeholder="Email" value={newTeacher.email} onChange={handleChange} required />
            </div>
            <div className="tm_form-group">
                <label>Phone</label>
                <input name="phone" placeholder="Phone" value={newTeacher.phone} onChange={handleChange} required />
            </div>
        </div>
        {!isEdit && ( 
        <div className="tm_form-row">
            <div className="tm_form-group">
                <label>Username</label>
                <input name="username" placeholder="Username" value={newTeacher.username} onChange={handleChange} />
            </div>
            <div className="tm_form-group">
                <label>Password<span className="tm_required">*</span></label>
                <input type="password" name="password" placeholder="Password" value={newTeacher.password} onChange={handleChange} required={!isEdit} />
            </div>
        </div>
        )}
        <div className="tm_form-row">
             <div className="tm_form-group" style={{gridColumn: 'span 2'}}>
                <label>Institute Name</label>
                <input name="instituteName" placeholder="Institute Name" value={newTeacher.instituteName || ''} onChange={handleChange} />
            </div>
        </div>
        <div className="tm_form-row">
            <div className="tm_form-group">
                <label>Courses</label>
                <div className="tm_checkbox-group">
                    {COURSES_OPTIONS.map((course) => (
                        <label key={course} className="tm_checkbox-label">
                            <input
                                type="checkbox"
                                value={course}
                                checked={newTeacher.courses.includes(course)}
                                onChange={(e) => handleCheckboxChange(e, "courses")}
                            />
                            {course}
                        </label>
                    ))}
                </div>
            </div>
            <div className="tm_form-group">
                <label>Assigned Batches</label>
                <div className="tm_checkbox-group">
                    {BATCHES_OPTIONS.map((batch) => (
                        <label key={batch} className="tm_checkbox-label">
                            <input
                                type="checkbox"
                                value={batch}
                                checked={newTeacher.assignedBatch.includes(batch)}
                                onChange={(e) => handleCheckboxChange(e, "assignedBatch")}
                            />
                            {batch}
                        </label>
                    ))}
                </div>
            </div>
        </div>
        <div className="tm_form-row">
            <div className="tm_form-group">
                <label>Assigned Package</label>
                <select name="assignedPackage" value={newTeacher.assignedPackage} onChange={handleChange}>
                    <option value="">Select Package</option>
                    {Programme_OPTIONS.map(pkg => (
                        <option key={pkg} value={pkg}>{pkg}</option>
                    ))}
                </select>
            </div>
            <div className="tm_form-group">
                <label>Joining Date</label>
                <input type="date" name="joiningDate" value={newTeacher.joiningDate} onChange={handleChange} />
            </div>
        </div>
        <div className="tm_form-row">
            <div className="tm_form-group">
                <label>Status</label>
                <select name="status" value={newTeacher.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                </select>
            </div>
        </div>
        
        {newTeacher.status === "Suspended" && (
            <div className="tm_form-group">
                <label>Suspension Reason</label>
                <input name="suspensionReason" placeholder="Suspension Reason" value={newTeacher.suspensionReason} onChange={handleChange} />
            </div>
        )}
        
        <div className="tm_form-actions">
            <button type="submit" className="btn btn-primary">
                <Save size={20} style={{marginRight: '8px'}}/> {isEdit ? 'Update Teacher' : 'Save Teacher'}
            </button>
        </div>
    </form>
  );

  // --- JSX Render ---
  return (
    <div className="tm_user-management">
       <div className="tm_um-header">
        <h2 className="page-title">Teacher Management</h2>
        <div className="tm_um-actions">
          {/* Using the component's internal search for the table */}
          {/* <div className="tm_search-wrapper">
            <FiSearch className="tm_search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="tm_search-input"
            />
          </div> */}
          
          <button className="btn btn-primary" onClick={() => {
              setShowForm(!showForm);
              if (!showForm) setEditTeacher(null); 
          }}>
            <PlusCircle size={20} />
            <span>{showForm ? "Cancel" : "Create Teacher"}</span>
          </button>
        </div>
      </div>
      
      {/* Create Form - Inline */}
      {showForm && !editTeacher && (
        <div className="tm_user-form-card fade-in">
           <div className="tm_form-header">
              <h3>Create New Teacher</h3>
              <button type="button" className="tm_form-close-btn" onClick={handleCloseForm}>
                <X size={20} />
              </button>
            </div>
          <TeacherForm onSubmit={handleCreate} isEdit={false} />
        </div>
      )}

        <DynamicTable
            data={filteredTeachers} // Pass the data filtered by the search term
            columnOrder={TEACHER_COLUMN_ORDER}
            title="Teachers"
            
            // Actions
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSuspendReactivate={handleSuspendReactivate} // New Prop for Suspend/Reactivate

            // Filters
            filterDefinitions={TEACHER_FILTER_DEFINITIONS}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange} // DynamicTable calls this when a dropdown filter changes
            
            // Search (DynamicTable will apply this search internally to the data provided)
            onSearch={setSearchTerm} 
            
            // Data Formatting
            pillColumns={['courses', 'assignedBatch']} // These columns will be rendered as pills
            
            customDescription="Use the filters below and the search bar to manage teacher records."
        />


      {/* EDIT MODAL (KEPT AS IS) */}
      {editTeacher && (
        <div className="tm_modal-overlay fade-in">
          <div className="tm_success-modal tm_modal-content-form">
            <div className="tm_form-header" style={{border: 'none', paddingBottom: 0}}>
              <h3 style={{fontSize: 'var(--font-size-xl)'}}>Edit Teacher: {editTeacher.fullName}</h3>
              <button type="button" className="tm_form-close-btn" onClick={handleCloseForm}>
                <X size={20} />
              </button>
            </div>
            <TeacherForm onSubmit={handleUpdate} isEdit={true} />
          </div>
        </div>
      )}

      {/* SUSPEND/REACTIVATE MODAL (KEPT AS IS) */}
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
                    `Apply suspension for ${suspendPopup.teacher.fullName}.` : 
                    `Reactivate ${suspendPopup.teacher.fullName}. Suspension reason/dates will be cleared.`
                }
            </p>

            <form onSubmit={handleSuspendConfirm} style={{width: '100%'}}>
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
                onClick={() => setSuspendPopup({open: false, teacher: null, reason: '', status: 'Suspended', start_date: formatDate(new Date()), end_date: getOneWeekFromNow(new Date())})}
                style={{width: '100%', color: 'var(--color-gray-700)', borderColor: 'var(--color-gray-300)'}}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Success Popup Modal (KEPT AS IS) */}
      {showSuccessPopup && (
        <div className="tm_modal-overlay fade-in">
          <div className="tm_success-modal">
            <CheckCircle size={48} className="tm_success-icon" />
            <h3 className="tm_success-title">Success!</h3>
            <p className="tm_success-message">Teacher updated successfully!</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowSuccessPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal (KEPT AS IS) */}
      {deletePopup.open && (
        <div className="tm_modal-overlay fade-in">
          <div className="tm_success-modal" style={{background: 'var(--color-white)'}}>
            <Trash2 size={48} style={{color: 'var(--color-error)'}} className="tm_success-icon" />
            <h3 className="tm_success-title" style={{color: 'var(--color-error-dark)'}}>Confirm Deletion</h3>
            <p className="tm_success-message">Are you sure you want to delete **{deletePopup.teacher.fullName}**?</p>
            <button 
              className="btn btn-primary" 
              style={{backgroundColor: 'var(--color-error)', width: '100%', marginBottom: '10px'}}
              onClick={() => {
                setTeachers(prev => prev.filter(t => t.id !== deletePopup.teacher.id)); 
                setDeletePopup({open: false, teacher: null});
                setShowSuccessPopup(true); 
                setTimeout(() => setShowSuccessPopup(false), 3000);
              }}
            >
              Confirm Delete
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setDeletePopup({open: false, teacher: null})}
              style={{width: '100%'}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;