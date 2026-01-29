import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { FaEdit, FaTrashAlt, FaEye, FaDownload } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import DynamicForm from "../Reusable/DynamicForm"; 
import DynamicTable from "../Reusable/DynamicTable";
import '../../Styles/SuperAdmin/CourseCompletion.css';

// API Imports
import { 
    createCourseCompletion, 
    getAllCourseCompletions, 
    getCourseCompletionsByTeacher, 
    getCourseCompletionsByInstitution,
    getCourseCompletionById,
    updateCourseCompletionStatus, 
    updateCourseCompletion, 
    deleteCourseCompletion,
    downloadCourseCompletionDocument
} from '../../api/courseCompletionApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllClasses, getClassesByTeacher } from '../../api/classesApi';
import { getAllTeachers, getAllAdmins } from '../../api/usersApi';
import { getAllSubjects, getChaptersBySubject } from '../../api/subjectsApi';
import { getAllProgrammes } from '../../api/programmesApi';
import { getCoursesByInstitution } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getAllBatches } from '../../api/batchesApi';

// --- COLUMN DEFINITIONS ---
const SUBJECT_COMPLETION_COLUMNS = ['subjectCode', 'subjectName', 'totalHours', 'completedHours', 'completionPercentage', 'status'];
const CHAPTER_BREAKDOWN_COLUMNS = ['request_no', 'batch_name', 'class_name', 'chapter_name', 'hours_taken', 'submitted_date', 'approval_date', 'status', 'notes', 'rejection_reason'];
const TOPIC_BREAKDOWN_COLUMNS = ['topicName', 'actualHours', 'takenHours', 'completionPercentage', 'status'];
const APPROVAL_TABLE_COLUMNS = ['request_no', 'institution', 'batch_name', 'class_name', 'subject', 'chapter_name', 'date', 'total_hours', 'request_action', 'approval_status'];

// --- HELPER FUNCTIONS ---
const getStatus = (completed, total) => {
    if (completed === 0) return "Not Started";
    if (completed >= total) return "Completed";
    return "Ongoing";
};

const calculatePercentage = (completed, total) => {
    if (total === 0) return '0%';
    return `${Math.round((completed / total) * 100)}%`;
};

// --- MOCK DATA FOR CHAPTERS AND TOPICS (Replace with API calls later) ---
const MOCK_CHAPTER_DETAILS = {
    // subjectId -> chapters array
    "sub_1": [
        { chapterId: "chp_1_1", chapterName: "Introduction to Accounts", chapterNo: 1, actualHours: 15, takenHours: 15, status: "Completed" },
        { chapterId: "chp_1_2", chapterName: "Double Entry System", chapterNo: 2, actualHours: 20, takenHours: 20, status: "Completed" },
        { chapterId: "chp_1_3", chapterName: "Partnership Accounts", chapterNo: 3, actualHours: 30, takenHours: 25, status: "Ongoing" },
        { chapterId: "chp_1_4", chapterName: "Company Accounts", chapterNo: 4, actualHours: 35, takenHours: 0, status: "Not Started" },
    ],
};

const MOCK_TOPIC_DETAILS = {
    // chapterId -> topics array
    "chp_1_1": [
        { topicId: 'top_1_1_1', topicName: 'Accounting Basics', actualHours: 5, takenHours: 5, status: 'Completed' },
        { topicId: 'top_1_1_2', topicName: 'Financial Statements', actualHours: 5, takenHours: 5, status: 'Completed' },
        { topicId: 'top_1_1_3', topicName: 'Trial Balance', actualHours: 5, takenHours: 5, status: 'Completed' },
    ],
    "chp_1_3": [
        { topicId: 'top_1_3_1', topicName: 'Partnership Formation', actualHours: 10, takenHours: 10, status: 'Completed' },
        { topicId: 'top_1_3_2', topicName: 'Admission of Partner', actualHours: 10, takenHours: 8, status: 'Ongoing' },
        { topicId: 'top_1_3_3', topicName: 'Retirement/Death', actualHours: 10, takenHours: 7, status: 'Ongoing' },
    ],
};

// --- MOCK APPROVAL REQUESTS DATA ---
const MOCK_APPROVAL_REQUESTS = [
    { 
        id: 'REQ001', request_no: 1, institution: 'Main Institute', batch_name: 'Batch A', class_name: 'Class 1', subject: 'Accounts', 
        chapter_no: 3, date: '2025-11-10', started_time: '10:00 AM', ended_time: '12:00 PM', 
        request_action: 'Fresh Entry', total_hours: 2, approval_status: 'Pending'
    },
    { 
        id: 'REQ002', request_no: 2, institution: 'Main Institute', batch_name: 'Batch A', class_name: 'Class 1', subject: 'Accounts', 
        chapter_no: 4, date: '2025-11-11', started_time: '09:00 AM', ended_time: '01:00 PM', 
        request_action: 'Edited', total_hours: 4, approval_status: 'Approved'
    },
];

// --- Helper for generating filter options ---
const generateFilterOptions = (data, columnName, includeAll = true) => {
    const uniqueValues = Array.from(new Set(data.map(item => item[columnName])));
    
    const options = uniqueValues
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map(value => ({ value: value, label: value }));
        
    if (includeAll) {
        const label = `All ${columnName.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
        return [{ value: '', label }, ...options];
    }
    return options;
};

// --- COLUMN DEFINITIONS FOR OLD TABLE ---
const COMPLETION_COLUMN_ORDER = [
    'id', 
    'teacherName', 
    'institution', 
    'class',
    'subject',
    'chapter',
    'hoursTaken',
    'completionDate',
    'submittedDate', 
    'status',
    'Document', 
];

const columnDisplayNameMap = {
    id: 'ID',
    teacherName: 'Teacher',
    institution: 'Institution',
    class: 'Class',
    subject: 'Subject',
    chapter: 'Chapter',
    hoursTaken: 'Hours',
    completionDate: 'Completed On',
    submittedDate: 'Submitted',
    status: 'Status',
    Document: 'Proof', 
};

const CourseCompletionDashboard = ({ userRole }) => {
    console.log('🎯 CourseCompletion - Received userRole:', userRole);
    
    // --- REFS for scrolling ---
    const approvalTableRef = useRef(null);
    const chapterTableRef = useRef(null);
    const topicTableRef = useRef(null);
    
    const normalizedRole = (userRole || '').toString().toLowerCase().trim();
    const isTeacherRole = normalizedRole === 'teacher'; 
    const isAdminRole = normalizedRole === 'admin';
    const isSuperAdminRole = normalizedRole === 'super admin';
    const isApprovalRole = isAdminRole || isSuperAdminRole;
    
    console.log('🎯 Role flags:', { isTeacherRole, isAdminRole, isSuperAdminRole });

    // Get current user data from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || localStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;

    // State for completions and loading
    const [completions, setCompletions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    
    // State for hierarchy navigation
    const [institutions, setInstitutions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [batches, setBatches] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Current teacher info (for teachers only)
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    
    // --- STATE FOR OLD FILTERS (for approval table) ---
    const [activeFilters, setActiveFilters] = useState({
        status: 'All',
    });

    const [selectedDateFilter, setSelectedDateFilter] = useState('');
    
    // --- STATE FOR CASCADING FILTERS (for subject completion table) ---
    const [cascadingFilters, setCascadingFilters] = useState({
        institution: '',
        course: '',
        level: '',
        batch: '',
        class: ''
    });
    
    // --- STATE FOR APPROVAL TABLE FILTERS ---
    const [approvalFilters, setApprovalFilters] = useState({
        institution: '',
        batch_name: '',
        class_name: '',
        subject: '',
        approval_status: ''
    });
    
    // --- STATE FOR DRILL-DOWN (Subject → Chapter → Topic) ---
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [selectedChapterId, setSelectedChapterId] = useState(null);
    
    // --- SEARCH STATES ---
    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [approvalSearchTerm, setApprovalSearchTerm] = useState(''); 
    
    // --- STATE FOR DYNAMIC FORM ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('creation'); // 'creation' or 'edition'
    const [formInitialData, setFormInitialData] = useState({});
    const [editingCompletionId, setEditingCompletionId] = useState(null);
    
    // Form dynamic options
    const [selectedClassInForm, setSelectedClassInForm] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSubjectInForm, setSelectedSubjectInForm] = useState(null);
    const [availableChapters, setAvailableChapters] = useState([]);

    // Fetch hierarchy data on mount
    useEffect(() => {
        const fetchHierarchyData = async () => {
            const [institutionsRes, classesRes, teachersRes, subjectsRes, batchesRes] = await Promise.all([
                getAllInstitutions(),
                getAllClasses(),
                getAllTeachers(),
                getAllSubjects(),
                getAllBatches()
            ]);

            setInstitutions(institutionsRes.data || []);
            setClasses(classesRes.data || []);
            setTeachers(teachersRes.data || []);
            setSubjects(subjectsRes.data || []);
            setBatches(batchesRes.data || []);
        };

        fetchHierarchyData();
    }, []);

    // Find current teacher info and their classes
    useEffect(() => {
        const fetchTeacherClasses = async () => {
            if (isTeacherRole && teachers.length > 0) {
                const teacher = teachers.find(t => t.user_id === currentUserId);
                console.log('🔍 Found teacher:', teacher);
                console.log('🔍 Teacher ID fields:', { id: teacher?.id, teacher_id: teacher?.teacher_id });
                
                if (teacher) {
                    setCurrentTeacher(teacher);
                    
                    // Handle both id and teacher_id fields
                    const teacherId = teacher.id || teacher.teacher_id;
                    console.log('🔍 Using teacher ID:', teacherId);
                    
                    if (!teacherId) {
                        console.error('❌ Teacher found but has no id or teacher_id field:', teacher);
                        return;
                    }
                    
                    // Fetch all classes assigned to this teacher
                    const { data: assignedClasses, error } = await getClassesByTeacher(teacherId);
                    console.log('📚 Teacher classes:', assignedClasses);
                    
                    if (!error && assignedClasses && assignedClasses.length > 0) {
                        setTeacherClasses(assignedClasses);
                    } else {
                        setTeacherClasses([]);
                    }
                }
            }
        };
        
        fetchTeacherClasses();
    }, [isTeacherRole, teachers, currentUserId, institutions]);

    // Find admin's institution
    useEffect(() => {
        const fetchAdminInstitution = async () => {
            if (isAdminRole && currentUserId) {
                const { data: adminsData, error: adminsError } = await getAllAdmins();
                
                if (adminsError || !adminsData) {
                    if (currentUserData.institute_id) {
                        setSelectedInstitution(currentUserData.institute_id);
                    }
                    return;
                }
                
                const adminRecord = adminsData.find(a => a.user_id === currentUserId);
                
                if (!adminRecord) {
                    if (currentUserData.institute_id) {
                        setSelectedInstitution(currentUserData.institute_id);
                    }
                    return;
                }
                
                if (adminRecord.admin_institutions && adminRecord.admin_institutions.length > 0) {
                    const firstAdminInst = adminRecord.admin_institutions[0];
                    const instituteId = firstAdminInst.institute_id || 
                                      firstAdminInst.institutions?.id || 
                                      firstAdminInst.institutions?.institution_id;
                    
                    if (instituteId) {
                        setSelectedInstitution(instituteId);
                        return;
                    }
                }
                
                if (currentUserData.institute_id) {
                    setSelectedInstitution(currentUserData.institute_id);
                }
            }
        };
        
        fetchAdminInstitution();
    }, [isAdminRole, currentUserId, currentUserData.institute_id]);

    // Fetch completions based on role
    useEffect(() => {
        const fetchCompletions = async () => {
            setLoading(true);
            setError(null);

            try {
                let result;
                
                if (isTeacherRole && currentTeacher) {
                    const teacherId = currentTeacher.id || currentTeacher.teacher_id;
                    if (!teacherId) {
                        console.error('❌ No teacher ID found');
                        setLoading(false);
                        return;
                    }
                    result = await getCourseCompletionsByTeacher(teacherId);
                } else if (isAdminRole && selectedInstitution) {
                    result = await getCourseCompletionsByInstitution(selectedInstitution);
                } else if (isSuperAdminRole) {
                    result = await getAllCourseCompletions();
                } else {
                    setLoading(false);
                    return;
                }

                if (result.error) {
                    setError(result.error);
                } else {
                    console.log('✅ Course completions loaded:', result.data?.length || 0, 'records');
                    setCompletions(result.data || []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (isSuperAdminRole || (isAdminRole && selectedInstitution) || (isTeacherRole && currentTeacher)) {
            fetchCompletions();
        }
    }, [isTeacherRole, isAdminRole, isSuperAdminRole, currentTeacher, selectedInstitution]);

    // Fetch subjects when class is selected in form
    useEffect(() => {
        const fetchSubjectsForClass = async () => {
            console.log('🔄 useEffect triggered - selectedClassInForm:', selectedClassInForm);
            console.log('🔄 teacherClasses:', teacherClasses);
            
            if (!selectedClassInForm || teacherClasses.length === 0) {
                console.log('⚠️ No class selected or no teacher classes');
                setAvailableSubjects([]);
                return;
            }

            // Find the selected class
            const selectedClassData = teacherClasses.find(tc => {
                const classObj = tc.class || tc;
                return (classObj.id || classObj.class_id) === selectedClassInForm;
            });

            console.log('🔍 Selected class data:', selectedClassData);

            if (!selectedClassData) {
                console.log('❌ Class not found in teacherClasses');
                setAvailableSubjects([]);
                return;
            }

            const classObj = selectedClassData.class || selectedClassData;
            const programmeId = classObj.programme_id;

            console.log('📚 Fetching subjects for programme:', programmeId);
            console.log('📚 Class object:', classObj);

            // Fetch all programmes to get programme_subjects
            const { data: programmes, error: progError } = await getAllProgrammes();
            console.log('📚 All programmes:', programmes);
            console.log('📚 Programme error:', progError);
            
            const programme = programmes?.find(p => (p.id || p.programme_id) === programmeId);
            console.log('📚 Found programme:', programme);

            if (!programme || !programme.programme_subjects || programme.programme_subjects.length === 0) {
                console.log('⚠️ No subjects found for programme');
                console.log('⚠️ programme.programme_subjects:', programme?.programme_subjects);
                setAvailableSubjects([]);
                return;
            }

            // Get all subjects
            const { data: allSubjects, error: subjError } = await getAllSubjects();
            console.log('📚 All subjects:', allSubjects);
            console.log('📚 Subject error:', subjError);
            
            // Filter subjects that are linked to this programme
            const subjectIds = programme.programme_subjects.map(ps => { console.log(ps); return ps.subjects.id; });
            console.log('📚 Subject IDs from programme:', subjectIds);
            
            const linkedSubjects = allSubjects?.filter(s => subjectIds.includes(s.id)) || [];

            console.log('✅ Found subjects:', linkedSubjects);
            setAvailableSubjects(linkedSubjects);
        };

        fetchSubjectsForClass();
    }, [selectedClassInForm, teacherClasses]);

    // Fetch chapters when subject is selected in form
    useEffect(() => {
        const fetchChaptersForSubject = async () => {
            if (!selectedSubjectInForm) {
                setAvailableChapters([]);
                return;
            }

            console.log('📖 Fetching chapters for subject:', selectedSubjectInForm);
            const { data: chapters, error } = await getChaptersBySubject(selectedSubjectInForm);
            
            if (!error && chapters) {
                console.log('✅ Found chapters:', chapters);
                setAvailableChapters(chapters);
            } else {
                setAvailableChapters([]);
            }
        };

        fetchChaptersForSubject();
    }, [selectedSubjectInForm]);

    // Fetch courses when institution is selected
    useEffect(() => {
        if (cascadingFilters.institution && institutions.length > 0) {
            const selectedInst = institutions.find(i => i.institute_name === cascadingFilters.institution);
            if (selectedInst) {
                fetchCourses(selectedInst.id);
            }
        } else {
            setCourses([]);
        }
    }, [cascadingFilters.institution, institutions]);

    const fetchCourses = async (institutionId) => {
        try {
            const { data, error } = await getCoursesByInstitution(institutionId);
            if (error) throw error;
            setCourses(data || []);
        } catch (err) {
            console.error('Error fetching courses:', err.message);
            setCourses([]);
        }
    };

    // Fetch levels when course is selected
    useEffect(() => {
        if (cascadingFilters.course && courses.length > 0) {
            const selectedCourse = courses.find(c => c.course_name === cascadingFilters.course);
            if (selectedCourse) {
                fetchLevels(selectedCourse.id);
            }
        } else {
            setLevels([]);
        }
    }, [cascadingFilters.course, courses]);

    const fetchLevels = async (courseId) => {
        try {
            const { data, error } = await getLevelsByCourse(courseId);
            if (error) throw error;
            setLevels(data || []);
        } catch (err) {
            console.error('Error fetching levels:', err.message);
            setLevels([]);
        }
    };

    // Fetch batches when level is selected
    useEffect(() => {
        if (cascadingFilters.level) {
            fetchBatches();
        } else {
            setBatches([]);
        }
    }, [cascadingFilters.level]);

    const fetchBatches = async () => {
        try {
            const { data, error } = await getAllBatches();
            if (error) throw error;
            setBatches(data || []);
        } catch (err) {
            console.error('Error fetching batches:', err.message);
            setBatches([]);
        }
    };

    // Fetch classes when batch is selected
    useEffect(() => {
        if (cascadingFilters.batch) {
            fetchClasses();
        } else {
            setClasses([]);
        }
    }, [cascadingFilters.batch, batches]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await getAllClasses();
            if (error) throw error;
            
            // Filter classes by selected batch
            const selectedBatch = batches.find(b => b.batch_name === cascadingFilters.batch);
            
            const filtered = (data || []).filter(c => 
                !selectedBatch || c.batch_id === selectedBatch.id
            );
            
            setClasses(filtered);
        } catch (err) {
            console.error('Error fetching classes:', err.message);
            setClasses([]);
        }
    };



    // --- CRUD Handlers ---

    const handleOpenAddModal = () => {
        if (isTeacherRole && !currentTeacher) {
            alert("Teacher information not found. Please try logging in again or contact administrator.");
            return;
        }

        if (isTeacherRole && teacherClasses.length === 0) {
            alert("No classes assigned to you. Please contact administrator to assign classes before submitting completions.");
            return;
        }

        // Reset form selections
        setSelectedClassInForm(null);
        setAvailableSubjects([]);
        setSelectedSubjectInForm(null);
        setAvailableChapters([]);

        setFormInitialData({
            class_id: null,
            subject_id: null,
            chapter_id: null,
            completion_date: '',
            hours_taken: '',
            notes: '',
            file: null
        });

        setFormMode('creation');
        setEditingCompletionId(null);
        setIsFormOpen(true);
    };

    const handleEditCompletion = useCallback(async (row) => { 
        console.log('📝 Edit clicked for row:', row);
        console.log('📝 Row status:', row.status, 'Type:', typeof row.status);
        
        // Allow editing if status is 'Pending' or null (treat null as Pending)
        if (row.status && row.status !== 'Pending') {
            alert(`Cannot edit completion. Only 'Pending' requests can be edited. Current status: ${row.status}`);
            return;
        }
        
        const { data: fullCompletion, error } = await getCourseCompletionById(row.id);
        if (error) {
            alert('Failed to load completion details: ' + error);
            return;
        }
        
        console.log('📝 Full completion data:', fullCompletion);
        
        // Set form initial data
        setFormInitialData(fullCompletion);
        setEditingCompletionId(row.id);
        
        // Pre-populate class and subject selections to trigger cascading dropdowns
        if (fullCompletion.class_id) {
            console.log('📝 Setting class_id:', fullCompletion.class_id);
            setSelectedClassInForm(fullCompletion.class_id);
        }
        if (fullCompletion.subject_id) {
            console.log('📝 Setting subject_id:', fullCompletion.subject_id);
            setSelectedSubjectInForm(fullCompletion.subject_id);
        }
        
        setFormMode('edition');
        setIsFormOpen(true);
    }, []);

    const handleFormSubmit = async (formData, mode) => {
        setLoading(true);

        // Find selected class details
        const selectedClassData = teacherClasses.find(tc => {
            const classObj = tc.class || tc;
            return (classObj.id || classObj.class_id) === formData.class_id;
        });
        
        if (!selectedClassData) {
            alert('Selected class not found');
            setLoading(false);
            return;
        }

        const classObj = selectedClassData.class || selectedClassData;
        const teacherId = currentTeacher.id || currentTeacher.teacher_id;
        
        if (!teacherId) {
            alert('Teacher ID not found. Please refresh and try again.');
            setLoading(false);
            return;
        }
        
        const completionData = {
            teacher_id: teacherId,
            institution_id: classObj.institute_id || classObj.institution_id,
            course_id: classObj.course_id,
            level_id: classObj.level_id,
            programme_id: classObj.programme_id,
            batch_id: classObj.batch_id,
            class_id: formData.class_id,
            subject_id: formData.subject_id,
            chapter_id: formData.chapter_id,
            completion_date: formData.completion_date,
            hours_taken: parseFloat(formData.hours_taken) || 0,
            notes: formData.notes || null
        };

        try {
            let result;
            if (mode === 'creation') {
                result = await createCourseCompletion(completionData, formData.file);
            } else {
                result = await updateCourseCompletion(editingCompletionId, completionData, formData.file);
            }

            if (result.error) {
                alert('Failed to save completion: ' + result.error);
            } else {
                alert(mode === 'creation' ? 'Completion created successfully!' : 'Completion updated successfully!');
                setIsFormOpen(false);
                // Refresh completions list
                if (isTeacherRole && currentTeacher) {
                    const { data } = await getCourseCompletionsByTeacher(currentTeacher.id);
                    setCompletions(data || []);
                } else if (isAdminRole && selectedInstitution) {
                    const { data } = await getCourseCompletionsByInstitution(selectedInstitution);
                    setCompletions(data || []);
                } else if (isSuperAdminRole) {
                    const { data } = await getAllCourseCompletions();
                    setCompletions(data || []);
                }
            }
        } catch (err) {
            alert('Error saving completion: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCompletion = useCallback(async (row) => { 
        if (row.status !== 'Pending') {
             alert(`Cannot delete completion. Only 'Pending' requests can be deleted.`);
             return;
        }
        if (window.confirm(`Are you sure you want to DELETE this completion request?`)) {
            setLoading(true);
            const { error } = await deleteCourseCompletion(row.id);
            if (error) {
                alert('Failed to delete completion: ' + error);
            } else {
                alert('Completion deleted successfully!');
                setCompletions(prev => prev.filter(completion => completion.id !== row.id));
            }
            setLoading(false);
        }
    }, []);

    const handleStatusChange = useCallback(async (id, newStatus) => {
        if (!currentUserId) {
            alert('User information not found');
            return;
        }

        const rejectionReason = newStatus === 'Rejected' 
            ? prompt('Please enter rejection reason:')
            : null;

        if (newStatus === 'Rejected' && !rejectionReason) {
            return;
        }

        setLoading(true);
        const { error } = await updateCourseCompletionStatus(id, newStatus, currentUserId, rejectionReason);
        
        if (error) {
            alert('Failed to update status: ' + error);
        } else {
            alert(`Completion has been ${newStatus}.`);
            setCompletions(prev => prev.map(comp => {
                if (comp.id === id) {
                    return { 
                        ...comp, 
                        status: newStatus,
                        approved_by: currentUserId,
                        approval_date: new Date().toISOString(),
                        rejection_reason: rejectionReason
                    };
                }
                return comp;
            }));
        }
        setLoading(false);
    }, [currentUserId]);

    const handleHoldStatus = useCallback(async (rowOrId) => {
        const id = typeof rowOrId === 'object' ? rowOrId.id : rowOrId;
        setLoading(true);
        const { error } = await updateCourseCompletionStatus(id, 'OnHold', currentUserId);
        if (error) {
            alert('Failed to hold completion: ' + error);
        } else {
            setCompletions(prev => prev.map(comp => (comp.id === id ? { ...comp, status: 'OnHold' } : comp)));
        }
        setLoading(false);
    }, [currentUserId]);

    const handleFilterChange = useCallback((column, value) => {
        setActiveFilters(prev => ({ ...prev, [column]: value }));
    }, []);

    const handleDownloadDocument = useCallback(async (filePath, fileName) => {
        if (!filePath) {
            alert('No document available');
            return;
        }
        const { error } = await downloadCourseCompletionDocument(filePath, fileName);
        if (error) {
            alert('Failed to download document: ' + error);
        }
    }, []);

    // --- Data Processing ---
    const institutionMap = useMemo(() => {
        const map = {};
        institutions.forEach(i => {
            map[i.id || i.institution_id] = i.institution_name || i.institute_name || i.name;
        });
        return map;
    }, [institutions]);

    const classMap = useMemo(() => {
        const map = {};
        classes.forEach(c => {
            map[c.id || c.class_id] = c.class_name || c.name;
        });
        return map;
    }, [classes]);

    const teacherMap = useMemo(() => {
        const map = {};
        teachers.forEach(t => {
            map[t.id] = t.full_name || t.name;
        });
        return map;
    }, [teachers]);
    
    // Create lookup maps for subjects and chapters from completion data
    const subjectChapterMaps = useMemo(() => {
        const subjectMap = {};
        const chapterMap = {};
        
        if (Array.isArray(completions)) {
            completions.forEach(comp => {
                try {
                    // If the completion has subject/chapter details joined, use them
                    if (comp.subjects && comp.subject_id) {
                        const subjectCode = comp.subjects.subject_code || '';
                        const subjectName = comp.subjects.subject_name || 'Unknown';
                        subjectMap[comp.subject_id] = subjectCode ? `${subjectCode} - ${subjectName}` : subjectName;
                    }
                    if (comp.chapters && comp.chapter_id) {
                        const chapterNum = comp.chapters.chapter_number || '';
                        const chapterName = comp.chapters.chapter_name || 'Unknown';
                        chapterMap[comp.chapter_id] = chapterNum ? `Ch ${chapterNum}: ${chapterName}` : chapterName;
                    }
                } catch (err) {
                    console.error('Error processing completion maps:', err);
                }
            });
        }
        
        return { subjectMap, chapterMap };
    }, [completions]);

    const filteredCompletionsRaw = useMemo(() => {
        let filtered = [...completions];

        if (activeFilters.status && activeFilters.status !== 'All') {
            filtered = filtered.filter(item => item.status === activeFilters.status);
        }
        
        if (selectedDateFilter) {
             filtered = filtered.filter(completion => {
                if (!completion.submitted_date) return false;
                const completionDate = new Date(completion.submitted_date).toISOString().split('T')[0];
                return completionDate === selectedDateFilter;
             });
        }

        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter(completion => {
                const teacherName = teacherMap[completion.teacher_id] || '';
                const institutionName = institutionMap[completion.institution_id] || '';
                return (
                    teacherName.toLowerCase().includes(searchLower) ||
                    institutionName.toLowerCase().includes(searchLower) ||
                    completion.notes?.toLowerCase().includes(searchLower)
                );
            });
        }
        
        return filtered;
    }, [completions, activeFilters, selectedDateFilter, searchText, teacherMap, institutionMap]); 
    
    const transformedTableData = useMemo(() => {
        const { subjectMap, chapterMap } = subjectChapterMaps;
        return filteredCompletionsRaw.map(completion => {
            return {
                ...completion,
                id: completion.id,
                teacherName: teacherMap[completion.teacher_id] || 'Unknown',
                institution: institutionMap[completion.institution_id] || '-',
                class: classMap[completion.class_id] || '-',
                subject: subjectMap[completion.subject_id] || '-',
                chapter: chapterMap[completion.chapter_id] || '-',
                hoursTaken: completion.hours_taken || 0,
                completionDate: completion.completion_date ? new Date(completion.completion_date).toLocaleDateString('en-GB') : '-',
                submittedDate: completion.submitted_date ? new Date(completion.submitted_date).toLocaleDateString('en-GB') : '-',
                Document: completion.proof_document_url ? ( 
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className="DT_action-btn DT_view-doc" 
                            title="Preview Document" 
                            style={{color: '#2196F3'}}
                            onClick={() => window.open(completion.proof_document_url, '_blank')}
                        >
                            <FaEye size={16} />
                        </button>
                        <button 
                            className="DT_action-btn DT_download-doc" 
                            title="Download Document" 
                            style={{color: '#4CAF50'}}
                            onClick={() => handleDownloadDocument(completion.proof_document_path, completion.proof_document_name)}
                        >
                            <FaDownload size={16} />
                        </button>
                    </div>
                ) : '-',
            };
        });
    }, [filteredCompletionsRaw, teacherMap, institutionMap, classMap, subjectChapterMaps, handleDownloadDocument]);

    // --- FORM CONFIGURATION ---
    const getFormFields = () => {
        console.log('📝 getFormFields called');
        console.log('📝 formInitialData:', formInitialData);
        console.log('📝 selectedSubjectInForm:', selectedSubjectInForm);
        console.log('📝 availableChapters:', availableChapters.length);
        
        const fields = [];
        
        // Check if form was opened from chapter table (for pre-filled context fields)
        const isFromChapterTable = formInitialData.fromChapterTable === true;
        console.log('📝 isFromChapterTable:', isFromChapterTable);
        
        // If form was opened from chapter table, show pre-filled context fields as read-only
        if (isFromChapterTable) {
            console.log('📝 Adding read-only context fields');
            fields.push(
                { name: 'institution', label: 'Institution', type: 'text-enter', required: false, fullWidth: false, disabled: true },
                { name: 'course', label: 'Course', type: 'text-enter', required: false, fullWidth: false, disabled: true },
                { name: 'level', label: 'Level', type: 'text-enter', required: false, fullWidth: false, disabled: true },
                { name: 'batch', label: 'Batch', type: 'text-enter', required: false, fullWidth: false, disabled: true },
                { name: 'class', label: 'Class', type: 'text-enter', required: false, fullWidth: false, disabled: true },
                { name: 'subject', label: 'Subject', type: 'text-enter', required: false, fullWidth: true, disabled: true }
            );
        }
        
        // Class selection (from teacher's assigned classes) - only if not pre-filled
        if (isTeacherRole && teacherClasses.length > 0 && !formInitialData.institution) {
            fields.push({
                name: 'class_id',
                label: 'Select Class',
                type: 'single-select',
                options: teacherClasses.map(tc => {
                    const classObj = tc.class || tc;
                    return {
                        label: classObj.class_name || classObj.name || 'Unknown Class',
                        value: classObj.id || classObj.class_id
                    };
                }),
                required: true,
                fullWidth: true
            });
        }
        
        // Subject - only if not pre-filled
        if (!formInitialData.institution) {
            fields.push({
                name: 'subject_id', 
                label: 'Subject', 
                type: 'single-select', 
                options: availableSubjects.map(s => ({
                    label: `${s.subject_code} - ${s.subject_name}`,
                    value: s.id
                })),
                required: true,
                fullWidth: true,
                disabled: !selectedClassInForm || availableSubjects.length === 0
            });
        }
        
        fields.push(
            // Chapter - dynamically populated based on selected subject
            { 
                name: 'chapter_id', 
                label: 'Chapter', 
                type: 'single-select', 
                options: availableChapters.map(ch => ({
                    label: `Ch ${ch.chapter_number}: ${ch.chapter_name}`,
                    value: ch.id
                })),
                required: true,
                fullWidth: true,
                disabled: availableChapters.length === 0
            },
            
            // Hours Taken
            { 
                name: 'hours_taken', 
                label: 'Hours Completed', 
                type: 'number', 
                required: true,
                fullWidth: false,
                placeholder: 'e.g., 10'
            },
            
            // Status Dropdown
            {
                name: 'status',
                label: 'Status',
                type: 'single-select',
                options: [
                    { label: 'Ongoing', value: 'Ongoing' },
                    { label: 'Completed', value: 'Completed' }
                ],
                required: true,
                fullWidth: false
            },
            
            // Completion Date
            { name: 'completion_date', label: 'Completion Date', type: 'date-start', required: false, fullWidth: false },
            
            // Notes
            { name: 'notes', label: 'Notes / Remarks', type: 'textarea', fullWidth: true },
            
            // Proof Upload
            { 
                name: 'file', 
                label: 'Supporting Document (PDF/Image)', 
                type: 'file-upload', 
                required: false, 
                fullWidth: true,
                fileUploadLimit: 5 * 1024 * 1024, 
                hintText: "Upload PDF, PNG, JPG. Max size 5MB.",
                acceptedFileTypes: '.pdf,.png,.jpg,.jpeg'
            }
        );
        
        return fields;
    };

    // --- FILTER DEFINITIONS ---
    const completionFilterDefinitions = {
        status: [
            { value: 'All', label: 'All Statuses' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'OnHold', label: 'On Hold' }, 
        ]
    };

    const summaryData = useMemo(() => {
        const pendingCount = completions.filter(comp => comp.status === 'Pending').length;
        const approvedCount = completions.filter(comp => comp.status === 'Approved').length;
        const totalHours = completions
            .filter(comp => comp.status === 'Approved')
            .reduce((total, comp) => total + parseFloat(comp.hours_taken || 0), 0);
        
        return { 
            pendingCount, 
            approvedCount,
            totalHours: totalHours.toFixed(1),
            totalRequests: completions.length
        };
    }, [completions]);

    // --- HANDLERS FOR DRILL-DOWN UI ---
    const scrollToElement = useCallback((ref) => {
        ref.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
        });
    }, []);

    const handleSubjectSelect = useCallback((subjectId) => {
        if (selectedSubjectId === subjectId) {
            setSelectedSubjectId(null);
            setSelectedChapterId(null);
        } else {
            setSelectedSubjectId(subjectId);
            setSelectedChapterId(null);
            setTimeout(() => scrollToElement(chapterTableRef), 100);
        }
    }, [selectedSubjectId, scrollToElement]);

    const handleChapterSelect = useCallback((chapterId) => {
        if (selectedChapterId === chapterId) {
            setSelectedChapterId(null);
        } else {
            setSelectedChapterId(chapterId);
            setTimeout(() => scrollToElement(topicTableRef), 100);
        }
    }, [selectedChapterId, scrollToElement]);

    const handleCascadingFilterChange = useCallback((column, value) => {
        setCascadingFilters(prev => {
            const newFilters = { ...prev, [column]: value };
            
            if (column === 'institution') {
                newFilters.course = '';
                newFilters.level = '';
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'course') {
                newFilters.level = '';
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'level') {
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'batch') {
                newFilters.class = '';
            }
            
            return newFilters;
        });

        setSelectedSubjectId(null);
        setSelectedChapterId(null);
    }, []);

    const handleApprovalFilterChange = useCallback((column, value) => {
        setApprovalFilters(prev => ({ ...prev, [column]: value }));
    }, []);

    const handleSubjectSearch = useCallback((query) => {
        setSubjectSearchTerm(query);
    }, []);

    const handleApprovalSearch = useCallback((query) => {
        setApprovalSearchTerm(query);
    }, []);

    // --- CASCADING FILTER DEFINITIONS ---
    const cascadingFilterDefinitions = useMemo(() => {
        console.log('🔵 Creating cascadingFilterDefinitions...');
        console.log('🔵 Institutions:', institutions.length, institutions);
        console.log('🔵 Courses:', courses.length, courses);
        console.log('🔵 Levels:', levels.length, levels);
        console.log('🔵 Batches:', batches.length, batches);
        console.log('🔵 Classes:', classes.length, classes);
        
        const defs = {};

        defs.institution = [
            { value: '', label: 'All Institution' },
            ...institutions.map(inst => ({ value: inst.institute_name, label: inst.institute_name }))
        ];

        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({ value: course.course_name, label: course.course_name }))
        ];

        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({ value: level.level_name, label: level.level_name }))
        ];

        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({ value: batch.batch_name, label: batch.batch_name }))
        ];

        defs.class = [
            { value: '', label: 'All Class' },
            ...classes.map(cls => ({ value: cls.class_name, label: cls.class_name }))
        ];

        console.log('🔵 Filter definitions created:', Object.keys(defs));
        console.log('🔵 Institution options:', defs.institution.length);
        console.log('🔵 Full defs:', defs);

        return defs;
    }, [institutions, courses, levels, batches, classes]);

    const approvalFilterDefinitions = useMemo(() => {
        return {
            institution: generateFilterOptions(MOCK_APPROVAL_REQUESTS, 'institution'),
            batch_name: generateFilterOptions(MOCK_APPROVAL_REQUESTS, 'batch_name'),
            class_name: generateFilterOptions(MOCK_APPROVAL_REQUESTS, 'class_name'),
            subject: generateFilterOptions(MOCK_APPROVAL_REQUESTS, 'subject'),
            approval_status: generateFilterOptions(MOCK_APPROVAL_REQUESTS, 'approval_status'),
        };
    }, []);

    // --- DATA TRANSFORMATION FOR DRILL-DOWN TABLES ---
    const subjectCompletionData = useMemo(() => {
        // Get all subjects first
        let filteredSubjects = subjects;

        // Apply level filter if selected
        if (cascadingFilters.level && levels.length > 0) {
            const selectedLevel = levels.find(l => l.level_name === cascadingFilters.level);
            if (selectedLevel) {
                filteredSubjects = filteredSubjects.filter(s => s.level_id === selectedLevel.id);
            }
        }

        // Apply search
        if (subjectSearchTerm) {
            const query = subjectSearchTerm.toLowerCase();
            filteredSubjects = filteredSubjects.filter(subject => 
                subject.subject_code?.toLowerCase().includes(query) ||
                subject.subject_name?.toLowerCase().includes(query)
            );
        }

        // Now get completion data for these subjects
        let completionData = completions;

        // Apply cascading filters to completion data
        if (cascadingFilters.institution) {
            completionData = completionData.filter(record => record.institutions?.institute_name === cascadingFilters.institution);
        }
        if (cascadingFilters.course) {
            completionData = completionData.filter(record => record.courses?.course_name === cascadingFilters.course);
        }
        if (cascadingFilters.level) {
            completionData = completionData.filter(record => record.levels?.level_name === cascadingFilters.level);
        }
        if (cascadingFilters.batch) {
            completionData = completionData.filter(record => record.batches?.batch_name === cascadingFilters.batch);
        }
        if (cascadingFilters.class) {
            completionData = completionData.filter(record => record.classes?.class_name === cascadingFilters.class);
        }

        // Group completion data by subject
        const subjectCompletionMap = {};
        completionData.forEach(record => {
            const subjectId = record.subject_id;
            if (!subjectCompletionMap[subjectId]) {
                subjectCompletionMap[subjectId] = {
                    totalHours: 0,
                    completedHours: 0
                };
            }
            subjectCompletionMap[subjectId].totalHours += parseFloat(record.total_hours || 0);
            subjectCompletionMap[subjectId].completedHours += parseFloat(record.completed_hours || 0);
        });

        // Map all subjects with their completion status
        return filteredSubjects.map(subject => {
            const completion = subjectCompletionMap[subject.id] || { totalHours: 0, completedHours: 0 };
            const totalHours = subject.estimated_hours || 0;
            const completedHours = completion.completedHours;

            return {
                id: subject.id,
                subjectCode: subject.subject_code || 'N/A',
                subjectName: subject.subject_name || 'N/A',
                totalHours: `${totalHours} hrs`,
                completedHours: `${completedHours} hrs`,
                completionPercentage: calculatePercentage(completedHours, totalHours),
                status: getStatus(completedHours, totalHours)
            };
        });
    }, [subjects, completions, cascadingFilters, subjectSearchTerm, levels]);

    const chapterBreakdownData = useMemo(() => {
        if (!selectedSubjectId) return [];
        
        // Filter completions for selected subject that are Approved or Rejected
        const subjectCompletions = completions.filter(completion => 
            completion.subject_id === selectedSubjectId && 
            (completion.status === 'Approved' || completion.status === 'Rejected')
        );
        
        // Transform to table format
        return subjectCompletions.map((completion, index) => {
            const chapter = completion.chapters;
            const batch = completion.batches || batches.find(b => b.id === completion.batch_id);
            const classObj = completion.classes || classes.find(c => c.id === completion.class_id);
            
            return {
                id: completion.id,
                request_no: index + 1,
                batch_name: batch?.batch_name || 'N/A',
                class_name: classObj?.class_name || 'N/A',
                chapter_name: chapter?.chapter_name || 'N/A',
                hours_taken: `${completion.hours_taken || 0} hrs`,
                submitted_date: completion.submitted_date ? new Date(completion.submitted_date).toLocaleDateString() : 'N/A',
                approval_date: completion.approval_date ? new Date(completion.approval_date).toLocaleDateString() : 'N/A',
                status: completion.status,
                notes: completion.notes || '-',
                rejection_reason: completion.rejection_reason || '-'
            };
        });
    }, [selectedSubjectId, completions, batches, classes]);

    const topicBreakdownData = useMemo(() => {
        if (!selectedChapterId) return [];
        return (MOCK_TOPIC_DETAILS[selectedChapterId] || []).map(topic => ({
            id: topic.topicId,
            topicName: topic.topicName,
            actualHours: `${topic.actualHours} hrs`,
            takenHours: `${topic.takenHours} hrs`,
            completionPercentage: calculatePercentage(topic.takenHours, topic.actualHours),
            status: topic.status,
        }));
    }, [selectedChapterId]);

    // Transform completions to approval table format (unfiltered) - Only Pending requests
    const approvalTableUnfilteredData = useMemo(() => {
        // Filter to show only Pending requests in approval table
        const pendingCompletions = completions.filter(c => c.status === 'Pending');
        
        const transformed = pendingCompletions.map((completion, index) => {
            // Use joined data from API response first, fallback to finding in arrays
            const institution = completion.institutions || institutions.find(i => (i.id || i.institution_id) === completion.institution_id);
            const batch = completion.batches || batches.find(b => (b.id || b.batch_id) === completion.batch_id);
            const classObj = completion.classes || classes.find(c => (c.id || c.class_id) === completion.class_id);
            const subject = completion.subjects || subjects.find(s => (s.id || s.subject_id) === completion.subject_id);
            const chapter = completion.chapters;
            
            // Debug logging for first record
            if (index === 0) {
                console.log('🔍 First completion record:', completion);
                console.log('🔍 Institution found:', institution);
                console.log('🔍 Batch found:', batch);
                console.log('🔍 Class found:', classObj);
                console.log('🔍 Subject found:', subject);
                console.log('🔍 Chapter found:', chapter);
                console.log('🔍 Completion date:', completion.completion_date);
                console.log('🔍 Submitted date:', completion.submitted_date);
                console.log('🔍 All institutions array:', institutions.length);
                console.log('🔍 All batches array:', batches.length);
            }
            
            return {
                id: completion.id,
                request_no: index + 1,
                institution: institution?.institute_name || 'N/A',
                batch_name: batch?.batch_name || 'N/A',
                class_name: classObj?.class_name || 'N/A',
                subject: subject?.subject_name || 'N/A',
                chapter_name: chapter?.chapter_name || 'N/A',
                date: completion.submitted_date ? new Date(completion.submitted_date).toLocaleDateString() : 'N/A',
                request_action: 'Fresh Entry',
                total_hours: completion.hours_taken || 0,
                approval_status: completion.status || 'Pending',
                completion_id: completion.id,
                teacher_id: completion.teacher_id,
                notes: completion.notes,
                proof_document_url: completion.proof_document_url
            };
        });
        
        console.log('📊 Approval table data transformed:', transformed.length, 'records');
        if (transformed.length > 0) {
            console.log('📊 First transformed record:', transformed[0]);
        }
        return transformed;
    }, [completions, institutions, batches, classes, subjects]);

    const approvalTableData = useMemo(() => {
        // Start with unfiltered data
        let data = [...approvalTableUnfilteredData];

        // Apply filters
        Object.keys(approvalFilters).forEach(key => {
            const filterValue = approvalFilters[key];
            if (filterValue) {
                data = data.filter(req => req[key] === filterValue);
            }
        });
        
        // Apply search
        if (approvalSearchTerm) {
            const query = approvalSearchTerm.toLowerCase();
            data = data.filter(req => 
                req.institution.toLowerCase().includes(query) ||
                req.batch_name.toLowerCase().includes(query) ||
                req.class_name.toLowerCase().includes(query) ||
                req.subject.toLowerCase().includes(query) ||
                req.request_action.toLowerCase().includes(query) ||
                req.approval_status.toLowerCase().includes(query)
            );
        }
        
        // Format display values
        return data.map(req => ({
            ...req,
            request_no: `#${req.request_no}`,
            total_hours: `${req.total_hours} hrs`,
        }));
    }, [approvalTableUnfilteredData, approvalFilters, approvalSearchTerm]);

    // --- COLUMN DISPLAY NAMES ---
    const subjectColumnDisplayNames = {
        subjectCode: 'Code',
        subjectName: 'Subject Name',
        totalHours: 'Total Hrs',
        completedHours: 'Completed Hrs',
        completionPercentage: 'Completion %',
        status: 'Status'
    };

    const chapterColumnDisplayNames = {
        request_no: 'Req. No',
        batch_name: 'Batch',
        class_name: 'Class',
        chapter_name: 'Chapter Name',
        hours_taken: 'Hours Taken',
        submitted_date: 'Submitted Date',
        approval_date: 'Approval Date',
        status: 'Status',
        notes: 'Notes',
        rejection_reason: 'Rejection Reason'
    };

    const topicColumnDisplayNames = {
        topicName: 'Topic Name',
        actualHours: 'Actual Hrs',
        takenHours: 'Taken Hrs',
        completionPercentage: 'Completion %',
        status: 'Status'
    };

    const approvalColumnDisplayNames = {
        request_no: 'Req. No',
        institution: 'Institution',
        batch_name: 'Batch',
        class_name: 'Class',
        subject: 'Subject',
        chapter_name: 'Chapter Name',
        date: 'Date',
        total_hours: 'Total Hrs',
        request_action: 'Action Type',
        approval_status: 'Approval Status'
    };

    // Handler for creating course completion from chapter table
    const handleCreateFromChapter = useCallback(() => {
        if (!selectedSubjectId) return;

        // Get selected subject details
        const selectedSubject = subjectCompletionData.find(s => s.id === selectedSubjectId);
        if (!selectedSubject) return;

        console.log('🎯 Opening form with subject:', selectedSubject);
        console.log('🎯 Selected subject ID:', selectedSubjectId);

        // Pre-fill form with cascading filter values and selected subject
        const prefilledData = {
            institution: cascadingFilters.institution || 'Not Selected',
            course: cascadingFilters.course || 'Not Selected',
            level: cascadingFilters.level || 'Not Selected',
            batch: cascadingFilters.batch || 'Not Selected',
            class: cascadingFilters.class || 'Not Selected',
            subject: selectedSubject.subjectName || '',
            chapter_id: null,
            hours_taken: '',
            status: 'Ongoing',
            fromChapterTable: true  // Flag to indicate form was opened from chapter table
        };

        console.log('🎯 Pre-filled form data:', prefilledData);

        setFormInitialData(prefilledData);
        setSelectedSubjectInForm(selectedSubjectId);
        setAvailableChapters([]); // Reset chapters, will be fetched by useEffect
        setFormMode('creation');
        setEditingCompletionId(null);
        setIsFormOpen(true);
    }, [selectedSubjectId, subjectCompletionData, cascadingFilters]);

    // --- RENDER FUNCTIONS FOR DRILL-DOWN TABLES ---
    const renderSubjectCompletionTable = () => {
        console.log('🎯 Rendering Subject Completion Table');
        console.log('🎯 cascadingFilterDefinitions keys:', Object.keys(cascadingFilterDefinitions));
        console.log('🎯 cascadingFilterDefinitions:', cascadingFilterDefinitions);
        console.log('🎯 cascadingFilters:', cascadingFilters);
        console.log('🎯 handleCascadingFilterChange:', !!handleCascadingFilterChange);
        
        return (
        <DynamicTable
            data={subjectCompletionData}
            columnOrder={SUBJECT_COMPLETION_COLUMNS}
            columnDisplayNameMap={subjectColumnDisplayNames}
            title="Subject Completion Status"
            customDescription="Click on a subject row to view chapter breakdown"
            userRole={userRole}
            
            filterDefinitions={cascadingFilterDefinitions}
            activeFilters={cascadingFilters}
            onFilterChange={handleCascadingFilterChange}
            
            onRowClickable={true}
            onRowClick={handleSubjectSelect}
            selectedRowId={selectedSubjectId}
            
            pillColumns={['status']}
            onSearch={handleSubjectSearch}
        />
        );
    };

    const renderChapterBreakdownTable = () => {
        if (!selectedSubjectId) return null;

        const selectedSubject = subjectCompletionData.find(s => s.id === selectedSubjectId);
        const subjectName = selectedSubject ? selectedSubject.subjectName : "Selected Subject";
        
        console.log('📘 Chapter Table - isTeacherRole:', isTeacherRole);
        console.log('📘 Chapter Table - userRole:', userRole);
        console.log('📘 Chapter Table - Will show button:', isTeacherRole || userRole === 'Teacher');
        
        return (
            <div ref={chapterTableRef} style={{ marginTop: '2rem' }}>
                <DynamicTable
                    data={chapterBreakdownData}
                    columnOrder={CHAPTER_BREAKDOWN_COLUMNS}
                    columnDisplayNameMap={chapterColumnDisplayNames}
                    title={`Approved/Rejected Completions for ${subjectName}`}
                    customDescription="View all approved and rejected course completion records for this subject."
                    userRole={userRole}
                    
                    pillColumns={['status']}
                />
            </div>
        );
    };

    const renderTopicBreakdownTable = () => {
        if (!selectedChapterId) return null;

        const selectedChapter = chapterBreakdownData.find(c => c.id === selectedChapterId);
        const chapterName = selectedChapter ? selectedChapter.chapterName : "Selected Chapter";

        return (
            <div ref={topicTableRef} style={{ marginTop: '2rem' }}>
                <DynamicTable
                    data={topicBreakdownData}
                    columnOrder={TOPIC_BREAKDOWN_COLUMNS}
                    columnDisplayNameMap={topicColumnDisplayNames}
                    title={`Topics in ${chapterName}`}
                    customDescription="Details and status of individual topics"
                    
                    pillColumns={['status']}
                />
            </div>
        );
    };

    const renderApprovalRequestsTable = () => (
        <div ref={approvalTableRef} style={{ marginTop: '3rem' }}>
            <DynamicTable
                data={approvalTableData}
                unfilteredData={approvalTableUnfilteredData}
                columnOrder={APPROVAL_TABLE_COLUMNS}
                columnDisplayNameMap={approvalColumnDisplayNames}
                title="Completion Approval Requests"
                customDescription="Review and approve/reject hours logged by teachers"
                
                filterDefinitions={approvalFilterDefinitions}
                activeFilters={approvalFilters}
                onFilterChange={handleApprovalFilterChange}
                
                onSearch={handleApprovalSearch}
                
                pillColumns={['approval_status', 'request_action']}
                hasApprovalActions={true}
                onStatusChange={handleStatusChange}
                onHold={handleHoldStatus}
            />
        </div>
    );

    const actionProps = {};
    if (isTeacherRole) {
        actionProps.onEdit = handleEditCompletion;
        actionProps.onDelete = handleDeleteCompletion;
        console.log('👤 Teacher role - Edit/Delete actions enabled');
    } else if (isApprovalRole) {
        actionProps.onStatusChange = handleStatusChange;
        actionProps.onHold = handleHoldStatus;
        console.log('👔 Admin/SuperAdmin role - Approve/Reject actions enabled');
    }

    console.log('🔘 Button config:', { 
        isTeacherRole, 
        showAddButton: isTeacherRole ? 'YES' : 'NO',
        teacherClassesCount: teacherClasses.length,
        currentTeacherId: currentTeacher?.id || currentTeacher?.teacher_id || 'Not found',
        currentTeacher: currentTeacher
    });
    
    if (loading) {
        return <div className="CC_approval-dashboard"><p>Loading course completions...</p></div>;
    }

    if (error) {
        return <div className="CC_approval-dashboard"><p style={{color: 'red'}}>Error: {error}</p></div>;
    }

    return (
        <div className="CC_approval-dashboard">
            <div className="course-completion-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="CC_header">
                    {isTeacherRole ? 'My Course Completions' : 'Course Completion Management'}
                </h1>
                {isSuperAdminRole && (
                    <button 
                        className="batch_btn-secondary"
                        onClick={() => scrollToElement(approvalTableRef)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FiSend size={16} /> View Completion Approval Requests
                    </button>
                )}
            </div>

            {/* Subject Completion View (SuperAdmin and Teachers) */}
            {(isSuperAdminRole || isTeacherRole) && (
                <div className="course-completion-drill-down">
                    {/* LEVEL 1: Subject Completion Table */}
                    {renderSubjectCompletionTable()}

                    {/* LEVEL 2: Chapter Breakdown Table */}
                    {renderChapterBreakdownTable()}
                    
                    {/* LEVEL 3: Topic Breakdown Table */}
                    {renderTopicBreakdownTable()}
                    
                    {/* Approval Requests Table (SuperAdmin only) */}
                    {isSuperAdminRole && renderApprovalRequestsTable()}
                </div>
            )}

            {/* Admin View: Original completion requests table */}
            {isAdminRole && (
                <>
                    {console.log('🎨 DynamicTable Props:', {
                        userRole,
                        isTeacherRole,
                        onAddNew: isTeacherRole ? 'handleOpenAddModal function' : undefined,
                        actionProps,
                        dataLength: transformedTableData.length
                    })}

                    <DynamicTable
                        data={transformedTableData}
                        columnOrder={COMPLETION_COLUMN_ORDER}
                        columnDisplayNameMap={columnDisplayNameMap}
                        title='Course Completion Requests'
                        userRole={userRole}
                        
                        {...actionProps}
                        
                        onSearch={setSearchText} 
                        filterDefinitions={completionFilterDefinitions}
                        activeFilters={activeFilters}
                        onFilterChange={handleFilterChange}
                       
                        showDateFilter={true} 
                        activeDateFilter={selectedDateFilter} 
                        onDateChange={setSelectedDateFilter} 

                        onAddNew={isTeacherRole ? handleOpenAddModal : undefined}

                        add_new_button_label={'Submit Course Completion'}
                        
                        customDescription={isTeacherRole ? 'Click "Submit Course Completion" to record completed chapters.' : 'Approve or reject course completion requests'}
                        pillColumns={['status']} 
                    />
                </>
            )}

            {/* Form for creating/editing course completions */}
            <DynamicForm 
                key={`form-${isFormOpen}`}
                isOpen={isFormOpen}
                mode={formMode}
                fieldsConfig={getFormFields()}
                initialData={formInitialData}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedClassInForm(null);
                    setAvailableSubjects([]);
                    setSelectedSubjectInForm(null);
                    setAvailableChapters([]);
                }}
                onSubmit={handleFormSubmit}
                onFieldChange={(fieldName, value) => {
                    console.log('📝 Field changed:', fieldName, '=', value);
                    if (fieldName === 'class_id') {
                        console.log('🎯 Class changed, updating selectedClassInForm');
                        setSelectedClassInForm(value);
                        setSelectedSubjectInForm(null);
                        setAvailableChapters([]);
                    } else if (fieldName === 'subject_id') {
                        console.log('🎯 Subject changed, updating selectedSubjectInForm');
                        setSelectedSubjectInForm(value);
                    }
                }}
            />
        </div>
    );
};

export default CourseCompletionDashboard;
