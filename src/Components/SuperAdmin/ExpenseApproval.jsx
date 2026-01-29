import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaPlus, FaEye, FaDownload } from 'react-icons/fa';
import DynamicForm from "../Reusable/DynamicForm"; 
import DynamicTable from "../Reusable/DynamicTable";
import CardSlider from "../Reusable/CardSlider";
import '../../Styles/SuperAdmin/ExpenseApprovalForm.css';

// API Imports
import { 
    createExpense, 
    getAllExpenses, 
    getExpensesByTeacher, 
    getExpensesByInstitution,
    getExpenseById,
    updateExpenseStatus, 
    updateExpense, 
    deleteExpense,
    downloadExpenseDocument
} from '../../api/expensesApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getAllLevels } from '../../api/levelsApi';
import { getAllProgrammes } from '../../api/programmesApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllClasses, getClassesByTeacher } from '../../api/classesApi';
import { getAllTeachers, getAllAdmins } from '../../api/usersApi'; 

// --- 2. CONFIGURATION ARRAYS ---
const COMMON_PURPOSES = [
    'Flight ticket', 'Local taxi fair', 'Software license', 
    'Printing materials', 'Hotel stay', 'Team lunch', 'Fuel', 'Stationery'
];

const PAYMENT_MODES = ['Self-paid', 'Institute Advance'];
const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected', 'OnHold'];

// --- 3. COLUMN DEFINITIONS ---
const EXPENSE_COLUMN_ORDER = [
    'id', 
    'teacherName', 
    'institution', 
    'course',      
    'batch',       
    'lineItemPurposes', 
    'submittedDate', 
    'status',
    'totalAmount', 
    'Document', 
];

const columnDisplayNameMap = {
    id: 'ID',
    teacherName: 'Teacher',
    institution: 'Institution',
    course: 'Course',
    batch: 'Batch',
    lineItemPurposes: 'Details (Purpose | Date | Amount)', 
    submittedDate: 'Submitted',
    status: 'Status',
    totalAmount: 'Total (₹)',
    Document: 'Proof', 
};

const ExpenseRequestDashboard = ({ userRole }) => { 
    const isTeacherRole = userRole.toLowerCase() === 'teacher'; 
    const isAdminRole = userRole.toLowerCase() === 'admin';
    const isSuperAdminRole = userRole.toLowerCase() === 'super admin';
    const isApprovalRole = isAdminRole || isSuperAdminRole;

    // Get current user data from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || localStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;

    // State for expenses and loading
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    
    // State for hierarchy navigation
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Selected hierarchy IDs
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedProgramme, setSelectedProgramme] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    // Current teacher info (for teachers only)
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [uniqueInstitutions, setUniqueInstitutions] = useState([]);
    const [uniqueCourses, setUniqueCourses] = useState([]);
    const [uniqueLevels, setUniqueLevels] = useState([]);
    const [uniqueProgrammes, setUniqueProgrammes] = useState([]);
    const [uniqueBatches, setUniqueBatches] = useState([]);
    const [availableClasses, setAvailableClasses] = useState([]);
    
    // --- STATE FOR FILTERS ---
    const [activeFilters, setActiveFilters] = useState({
        status: 'All',
    });

    const [selectedDateFilter, setSelectedDateFilter] = useState(''); 
    
    // --- STATE FOR DYNAMIC FORM ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('creation'); // 'creation' or 'edition'
    const [formInitialData, setFormInitialData] = useState({});
    const [editingExpenseId, setEditingExpenseId] = useState(null);

    // Fetch hierarchy data on mount
    useEffect(() => {
        const fetchHierarchyData = async () => {
            const [institutionsRes, coursesRes, levelsRes, programmesRes, batchesRes, classesRes, teachersRes] = await Promise.all([
                getAllInstitutions(),
                getAllCourses(),
                getAllLevels(),
                getAllProgrammes(),
                getAllBatches(),
                getAllClasses(),
                getAllTeachers()
            ]);

            setInstitutions(institutionsRes.data || []);
            setCourses(coursesRes.data || []);
            setLevels(levelsRes.data || []);
            setProgrammes(programmesRes.data || []);
            setBatches(batchesRes.data || []);
            setClasses(classesRes.data || []);
            setTeachers(teachersRes.data || []);
        };

        fetchHierarchyData();
    }, []);

    // Find current teacher info and their classes
    useEffect(() => {
        const fetchTeacherClasses = async () => {
            if (isTeacherRole && teachers.length > 0 && batches.length > 0) {
                const teacher = teachers.find(t => t.user_id === currentUserId);
                console.log('🔍 Found teacher:', teacher);
                
                if (teacher) {
                    setCurrentTeacher(teacher);
                    
                    // Fetch all classes assigned to this teacher using user_id
                    const { data: assignedClasses, error } = await getClassesByTeacher(currentUserId);
                    console.log('📚 Teacher classes:', assignedClasses, 'Error:', error);
                    
                    if (!error && assignedClasses && assignedClasses.length > 0) {
                        setTeacherClasses(assignedClasses);
                        
                        console.log('✅ Classes assigned to teacher:', assignedClasses);
                        console.log('✅ First class structure:', assignedClasses[0]);
                        
                        // Extract unique institutions from teacher's classes via batch
                        const institutionIds = [...new Set(
                            assignedClasses
                                .map(c => {
                                    // Find the batch for this class
                                    const batch = batches.find(b => b.id === c.batch_id);
                                    console.log('🔗 Class batch_id:', c.batch_id, '→ Batch found:', batch);
                                    return batch?.institute_id;
                                })
                                .filter(Boolean)
                        )];
                        console.log('🏢 Institution IDs from classes via batches:', institutionIds);
                        
                        // Match by id (UUID) since batches.institute_id references institutions.id
                        const institutionsData = institutions.filter(i => institutionIds.includes(i.id));
                        console.log('🏢 All institutions:', institutions);
                        console.log('🏢 Filtered institutions data:', institutionsData);
                        setUniqueInstitutions(institutionsData);
                        
                        // If only one institution, auto-select it
                        if (institutionIds.length === 1) {
                            setSelectedInstitution(institutionIds[0]);
                            console.log('✅ Auto-selected institution:', institutionIds[0]);
                        }
                    } else {
                        console.log('⚠️ No classes found for teacher');
                        setTeacherClasses([]);
                    }
                }
            }
        };
        
        fetchTeacherClasses();
    }, [isTeacherRole, teachers, currentUserId, institutions, batches]);

    // Find admin's institution if user is admin
    useEffect(() => {
        const fetchAdminInstitution = async () => {
            if (isAdminRole && currentUserId) {
                console.log('🔍 Looking for admin with user ID:', currentUserId);
                
                // Step 1: Fetch from admins table by user_id
                const { data: adminsData, error: adminsError } = await getAllAdmins();
                
                if (adminsError || !adminsData) {
                    console.error('❌ Error fetching admins:', adminsError);
                    
                    // Fallback to sessionStorage
                    if (currentUserData.institute_id) {
                        setSelectedInstitution(currentUserData.institute_id);
                        console.log('✅ Admin institution from session:', currentUserData.institute_id);
                    } else {
                        console.log('⚠️ No institution found for admin');
                    }
                    return;
                }
                
                // Find admin record with matching user_id
                const adminRecord = adminsData.find(a => a.user_id === currentUserId);
                console.log('🔍 Found admin record:', adminRecord);
                
                if (!adminRecord) {
                    console.log('⚠️ No admin record found for user_id:', currentUserId);
                    // Fallback to sessionStorage
                    if (currentUserData.institute_id) {
                        setSelectedInstitution(currentUserData.institute_id);
                        console.log('✅ Admin institution from session:', currentUserData.institute_id);
                    }
                    return;
                }
                
                // Step 2: Get institute_id from admin_institutions join (if available in API response)
                if (adminRecord.admin_institutions && adminRecord.admin_institutions.length > 0) {
                    // Get the first institution (assuming admin manages one institution)
                    const firstAdminInst = adminRecord.admin_institutions[0];
                    console.log('🔍 Admin institution record:', firstAdminInst);
                    
                    const instituteId = firstAdminInst.institute_id || 
                                      firstAdminInst.institutions?.id || 
                                      firstAdminInst.institutions?.institution_id;
                    
                    if (instituteId) {
                        setSelectedInstitution(instituteId);
                        console.log('✅ Admin institution from join:', instituteId);
                        return;
                    }
                }
                
                // Step 3: Fallback - sessionStorage
                if (currentUserData.institute_id) {
                    setSelectedInstitution(currentUserData.institute_id);
                    console.log('✅ Admin institution from session:', currentUserData.institute_id);
                } else {
                    console.log('⚠️ No institution found for admin');
                }
            }
        };
        
        fetchAdminInstitution();
    }, [isAdminRole, currentUserId, currentUserData.institute_id]);

    // Update available hierarchy options based on teacher's classes and selections
    useEffect(() => {
        if (!isTeacherRole || teacherClasses.length === 0) return;

        let filteredClassesList = [...teacherClasses];

        // Filter by selected institution
        if (selectedInstitution) {
            filteredClassesList = filteredClassesList.filter(c => c.institute_id === selectedInstitution);
            
            // Extract unique courses from filtered classes
            const courseIds = [...new Set(filteredClassesList.map(c => c.course_id).filter(Boolean))];
            const coursesData = courses.filter(c => courseIds.includes(c.id || c.course_id));
            setUniqueCourses(coursesData);
        }

        // Filter by selected course
        if (selectedCourse) {
            filteredClassesList = filteredClassesList.filter(c => c.course_id === selectedCourse);
            
            // Extract unique levels
            const levelIds = [...new Set(filteredClassesList.map(c => c.level_id).filter(Boolean))];
            const levelsData = levels.filter(l => levelIds.includes(l.id || l.level_id));
            setUniqueLevels(levelsData);
        }

        // Filter by selected level
        if (selectedLevel) {
            filteredClassesList = filteredClassesList.filter(c => c.level_id === selectedLevel);
            
            // Extract unique programmes
            const programmeIds = [...new Set(filteredClassesList.map(c => c.programme_id).filter(Boolean))];
            const programmesData = programmes.filter(p => programmeIds.includes(p.id || p.programme_id));
            setUniqueProgrammes(programmesData);
        }

        // Filter by selected programme
        if (selectedProgramme) {
            filteredClassesList = filteredClassesList.filter(c => c.programme_id === selectedProgramme);
            
            // Extract unique batches
            const batchIds = [...new Set(filteredClassesList.map(c => c.batch_id).filter(Boolean))];
            const batchesData = batches.filter(b => batchIds.includes(b.id || b.batch_id));
            setUniqueBatches(batchesData);
        }

        // Filter by selected batch
        if (selectedBatch) {
            filteredClassesList = filteredClassesList.filter(c => c.batch_id === selectedBatch);
        }

        setAvailableClasses(filteredClassesList);
    }, [isTeacherRole, teacherClasses, selectedInstitution, selectedCourse, selectedLevel, selectedProgramme, selectedBatch, courses, levels, programmes, batches]);

    // Fetch expenses based on role
    useEffect(() => {
        const fetchExpenses = async () => {
            setLoading(true);
            setError(null);

            try {
                let result;
                
                if (isTeacherRole && currentTeacher) {
                    // Teachers: only their expenses
                    result = await getExpensesByTeacher(currentTeacher.id);
                } else if (isAdminRole && selectedInstitution) {
                    // Admins: only their institution's expenses
                    result = await getExpensesByInstitution(selectedInstitution);
                } else if (isSuperAdminRole) {
                    // Super Admins: all expenses
                    result = await getAllExpenses();
                } else {
                    // Wait for data to load
                    setLoading(false);
                    return;
                }

                if (result.error) {
                    setError(result.error);
                } else {
                    setExpenses(result.data || []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if we have the necessary context
        if (isSuperAdminRole || (isAdminRole && selectedInstitution) || (isTeacherRole && currentTeacher)) {
            fetchExpenses();
        }
    }, [isTeacherRole, isAdminRole, isSuperAdminRole, currentTeacher, selectedInstitution]);

    // --- CHECK: ARE ALL CONTEXT FILTERS SELECTED FOR TEACHERS? ---
    const areContextFiltersSelected = useMemo(() => {
        if (!isTeacherRole) return true;
        return selectedInstitution && selectedCourse && selectedLevel && selectedProgramme && selectedBatch && selectedClass;
    }, [isTeacherRole, selectedInstitution, selectedCourse, selectedLevel, selectedProgramme, selectedBatch, selectedClass]);

    // --- CRUD Handlers ---

    // 1. OPEN FORM
    const handleOpenAddModal = () => {
        if (isTeacherRole && !currentTeacher) {
            alert("Teacher information not found. Please try logging in again or contact administrator.");
            return;
        }

        if (isTeacherRole && teacherClasses.length === 0) {
            alert("No classes assigned to you. Please contact administrator to assign classes before submitting expenses.");
            return;
        }

        setFormInitialData({
            institution_id: selectedInstitution || null,
            course_id: selectedCourse || null,
            level_id: selectedLevel || null,
            programme_id: selectedProgramme || null,
            batch_id: selectedBatch || null,
            class_id: selectedClass || null,
            lineItems: [] 
        });

        setFormMode('creation');
        setEditingExpenseId(null);
        setIsFormOpen(true);
    };

    // 2. EDIT HANDLER
    const handleEditExpense = useCallback(async (row) => { 
        if (row.status === 'Pending') {
            // Fetch full expense details with line items
            const { data: fullExpense, error } = await getExpenseById(row.id);
            if (error) {
                alert('Failed to load expense details: ' + error);
                return;
            }
            setFormInitialData(fullExpense);
            setEditingExpenseId(row.id);
            setFormMode('edition');
            setIsFormOpen(true);
        } else {
            alert(`Cannot edit expense. Only 'Pending' requests can be edited.`);
        }
    }, []);

    // 3. SAVE HANDLER (Calculates Total and calls API)
    const handleFormSubmit = async (formData, mode) => {
        setLoading(true);

        let calculatedTotal = 0;
        if (formData.lineItems && Array.isArray(formData.lineItems)) {
            calculatedTotal = formData.lineItems.reduce((sum, item) => {
                return sum + (parseFloat(item.amount) || 0);
            }, 0);
        }

        if (calculatedTotal <= 0) {
            alert('Total amount must be greater than 0');
            setLoading(false);
            return;
        }

        const expenseData = {
            teacher_id: currentTeacher.id,
            institution_id: formData.institution_id || selectedInstitution,
            course_id: formData.course_id || selectedCourse,
            level_id: formData.level_id || selectedLevel,
            programme_id: formData.programme_id || selectedProgramme,
            batch_id: formData.batch_id || selectedBatch,
            class_id: formData.class_id || selectedClass,
            expense_date: formData.expense_date,
            payment_mode: formData.payment_mode,
            total_amount: calculatedTotal,
            description: formData.description || null
        };

        try {
            let result;
            if (mode === 'creation') {
                result = await createExpense(expenseData, formData.lineItems, formData.file);
            } else {
                result = await updateExpense(editingExpenseId, expenseData, formData.lineItems, formData.file);
            }

            if (result.error) {
                alert('Failed to save expense: ' + result.error);
            } else {
                alert(mode === 'creation' ? 'Expense created successfully!' : 'Expense updated successfully!');
                setIsFormOpen(false);
                // Refresh expenses list
                if (isTeacherRole && currentTeacher) {
                    const { data } = await getExpensesByTeacher(currentTeacher.id);
                    setExpenses(data || []);
                } else if (isAdminRole && selectedInstitution) {
                    const { data } = await getExpensesByInstitution(selectedInstitution);
                    setExpenses(data || []);
                } else if (isSuperAdminRole) {
                    const { data } = await getAllExpenses();
                    setExpenses(data || []);
                }
            }
        } catch (err) {
            alert('Error saving expense: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = useCallback(async (row) => { 
        if (row.status !== 'Pending') {
             alert(`Cannot delete expense. Only 'Pending' requests can be deleted.`);
             return;
        }
        if (window.confirm(`Are you sure you want to DELETE this expense request?`)) {
            setLoading(true);
            const { error } = await deleteExpense(row.id);
            if (error) {
                alert('Failed to delete expense: ' + error);
            } else {
                alert('Expense deleted successfully!');
                setExpenses(prev => prev.filter(expense => expense.id !== row.id));
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
            return; // User cancelled
        }

        setLoading(true);
        const { error } = await updateExpenseStatus(id, newStatus, currentUserId, rejectionReason);
        
        if (error) {
            alert('Failed to update status: ' + error);
        } else {
            alert(`Expense has been ${newStatus}.`);
            // Update local state
            setExpenses(prev => prev.map(exp => {
                if (exp.id === id) {
                    return { 
                        ...exp, 
                        status: newStatus,
                        approved_by: currentUserId,
                        approval_date: new Date().toISOString(),
                        rejection_reason: rejectionReason
                    };
                }
                return exp;
            }));
        }
        setLoading(false);
    }, [currentUserId]);

    const handleHoldStatus = useCallback(async (rowOrId, newStatus) => {
        const id = typeof rowOrId === 'object' ? rowOrId.id : rowOrId;
        setLoading(true);
        const { error } = await updateExpenseStatus(id, 'OnHold', currentUserId);
        if (error) {
            alert('Failed to hold expense: ' + error);
        } else {
            setExpenses(prev => prev.map(exp => (exp.id === id ? { ...exp, status: 'OnHold' } : exp)));
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
        const { error } = await downloadExpenseDocument(filePath, fileName);
        if (error) {
            alert('Failed to download document: ' + error);
        }
    }, []);

    // Hierarchy change handlers
    const handleInstitutionChange = (institutionId) => {
        setSelectedInstitution(institutionId);
        setSelectedCourse(null);
        setSelectedLevel(null);
        setSelectedProgramme(null);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleCourseChange = (courseId) => {
        setSelectedCourse(courseId);
        setSelectedLevel(null);
        setSelectedProgramme(null);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleLevelChange = (levelId) => {
        setSelectedLevel(levelId);
        setSelectedProgramme(null);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleProgrammeChange = (programmeId) => {
        setSelectedProgramme(programmeId);
        setSelectedBatch(null);
        setSelectedClass(null);
    };

    const handleBatchChange = (batchId) => {
        setSelectedBatch(batchId);
        setSelectedClass(null);
    };

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
    };
    
    // --- Data Processing ---
    // Create display maps for hierarchy
    const institutionMap = useMemo(() => {
        const map = {};
        institutions.forEach(i => {
            map[i.id || i.institution_id] = i.institution_name || i.institute_name || i.name;
        });
        return map;
    }, [institutions]);

    const courseMap = useMemo(() => {
        const map = {};
        courses.forEach(c => {
            map[c.id || c.course_id] = c.course_name || c.name;
        });
        return map;
    }, [courses]);

    const levelMap = useMemo(() => {
        const map = {};
        levels.forEach(l => {
            map[l.id || l.level_id] = l.level_name || l.name;
        });
        return map;
    }, [levels]);

    const programmeMap = useMemo(() => {
        const map = {};
        programmes.forEach(p => {
            map[p.id || p.programme_id] = p.programme_name || p.name;
        });
        return map;
    }, [programmes]);

    const batchMap = useMemo(() => {
        const map = {};
        batches.forEach(b => {
            map[b.id || b.batch_id] = b.batch_name || b.name;
        });
        return map;
    }, [batches]);

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

    const filteredExpensesRaw = useMemo(() => {
        let filtered = [...expenses];

        // Apply status filter
        if (activeFilters.status && activeFilters.status !== 'All') {
            filtered = filtered.filter(item => item.status === activeFilters.status);
        }
        
        // Apply date filter
        if (selectedDateFilter) {
             filtered = filtered.filter(expense => {
                if (!expense.submitted_date) return false;
                const expenseDate = new Date(expense.submitted_date).toISOString().split('T')[0];
                return expenseDate === selectedDateFilter;
             });
        }

        // Apply search filter
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter(expense => {
                const teacherName = teacherMap[expense.teacher_id] || '';
                const institutionName = institutionMap[expense.institution_id] || '';
                return (
                    teacherName.toLowerCase().includes(searchLower) ||
                    institutionName.toLowerCase().includes(searchLower) ||
                    expense.payment_mode?.toLowerCase().includes(searchLower) ||
                    expense.description?.toLowerCase().includes(searchLower)
                );
            });
        }
        
        return filtered;
    }, [expenses, activeFilters, selectedDateFilter, searchText, teacherMap, institutionMap]); 
    
    const transformedTableData = useMemo(() => {
        return filteredExpensesRaw.map(expense => {
            // Get line items if they exist (need to fetch separately or join in query)
            const lineItemPurposes = expense.lineItems ? (
                <div className="EXP_line-items-cell">
                    {expense.lineItems.map((item, index) => (
                        <div key={index} className="EXP_line-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize:'11px', borderBottom:'1px dashed #eee'}}>
                            <span style={{ flex: 1.5 }}>{item.purpose}</span>
                            <span style={{ flex: 1, color:'#666' }}>{item.start_date}</span>
                            <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>₹{item.amount}</span>
                        </div>
                    ))}
                </div>
            ) : '-';

            return {
                ...expense,
                id: expense.id,
                teacherName: teacherMap[expense.teacher_id] || 'Unknown',
                institution: institutionMap[expense.institution_id] || '-',
                course: courseMap[expense.course_id] || '-',
                batch: batchMap[expense.batch_id] || '-',
                lineItemPurposes: lineItemPurposes, 
                submittedDate: expense.submitted_date ? new Date(expense.submitted_date).toLocaleDateString('en-GB') : '-',
                totalAmount: `₹${Number(expense.total_amount || 0).toLocaleString()}`,
                Document: expense.file_url ? ( 
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            className="DT_action-btn DT_view-doc" 
                            title="Preview Document" 
                            style={{color: '#2196F3'}}
                            onClick={() => window.open(expense.file_url, '_blank')}
                        >
                            <FaEye size={16} />
                        </button>
                        <button 
                            className="DT_action-btn DT_download-doc" 
                            title="Download Document" 
                            style={{color: '#4CAF50'}}
                            onClick={() => handleDownloadDocument(expense.file_path, expense.file_name)}
                        >
                            <FaDownload size={16} />
                        </button>
                    </div>
                ) : '-',
                approved_status: expense.status, 
            };
        });
    }, [filteredExpensesRaw, teacherMap, institutionMap, courseMap, batchMap, handleDownloadDocument]);


    // --- DYNAMIC FORM CONFIGURATION ---
    const getFormFields = () => {
        const fields = [];
        
        // Add hierarchy selection fields for teachers
        if (isTeacherRole && teacherClasses.length > 0) {
            // Extract ALL unique values from teacher's assigned classes (no filtering by selection)
            const allInstitutionIds = [...new Set(teacherClasses.map(c => c.class?.institute_id || c.institute_id).filter(Boolean))];
            const allCourseIds = [...new Set(teacherClasses.map(c => c.class?.course_id || c.course_id).filter(Boolean))];
            const allLevelIds = [...new Set(teacherClasses.map(c => c.class?.level_id || c.level_id).filter(Boolean))];
            const allProgrammeIds = [...new Set(teacherClasses.map(c => c.class?.programme_id || c.programme_id).filter(Boolean))];
            const allBatchIds = [...new Set(teacherClasses.map(c => c.class?.batch_id || c.batch_id).filter(Boolean))];
            
            console.log('🏢 All Institution IDs:', allInstitutionIds)
            console.log('📚 All Course IDs:', allCourseIds);
            console.log('🎯 All Level IDs:', allLevelIds);
            console.log('📋 All Programme IDs:', allProgrammeIds);
            console.log('🎓 All Batch IDs:', allBatchIds);

            // Get full objects for dropdowns
            const allInstitutionOptions = institutions.filter(i =>{console.log(i); return allInstitutionIds.includes(i.id || i.institution_id)});
            const allCourseOptions = courses.filter(c =>{console.log(c); return allCourseIds.includes(c.id || c.course_id)});
            const allLevelOptions = levels.filter(l =>{console.log(l); return allLevelIds.includes(l.id || l.level_id)});
            const allProgrammeOptions = programmes.filter(p =>{console.log(p); return allProgrammeIds.includes(p.id || p.programme_id)});
            const allBatchOptions = batches.filter(b =>{console.log(b); return allBatchIds.includes(b.id || b.batch_id)});
            const allClassOptions = teacherClasses.map(tc =>{console.log(tc); return tc.class || tc});
            

            console.log('🏢 All Institution Options:', allInstitutionOptions);
            console.log('📚 All Course Options:', allCourseOptions);
            console.log('🎯 All Level Options:', allLevelOptions);
            console.log('📋 All Programme Options:', allProgrammeOptions);
            console.log('🎓 All Batch Options:', allBatchOptions);
            console.log('🏫 All Class Options:', allClassOptions);
            
            // Only add hierarchy fields if we have options
            if (allInstitutionOptions.length > 0) {
                fields.push(
                    {
                        name: 'institution_id',
                        label: 'Institution',
                        type: 'single-select',
                        options: allInstitutionOptions.map(i => ({
                            label: i.institution_name || i.institute_name || i.name || 'Unknown Institution',
                            value: i.id || i.institution_id
                        })),
                        required: true,
                        fullWidth: true
                    }
                );
            }
            
            if (allCourseOptions.length > 0) {
                fields.push(
                    {
                        name: 'course_id',
                        label: 'Course',
                        type: 'single-select',
                        options: allCourseOptions.map(c => ({
                            label: c.course_name || c.name || 'Unknown Course',
                            value: c.id || c.course_id
                        })),
                        required: true,
                        fullWidth: true
                    }
                );
            }
            
            if (allLevelOptions.length > 0) {
                fields.push(
                    {
                        name: 'level_id',
                        label: 'Level',
                        type: 'single-select',
                        options: allLevelOptions.map(l => ({
                            label: l.level_name || l.name || 'Unknown Level',
                            value: l.id || l.level_id
                        })),
                        required: true,
                        fullWidth: true
                    }
                );
            }
            
            if (allProgrammeOptions.length > 0) {
                fields.push(
                    {
                        name: 'programme_id',
                        label: 'Programme',
                        type: 'single-select',
                        options: allProgrammeOptions.map(p => ({
                            label: p.programme_name || p.name || 'Unknown Programme',
                            value: p.id || p.programme_id
                        })),
                        required: true,
                        fullWidth: true
                    }
                );
            }
            
            if (allBatchOptions.length > 0) {
                fields.push(
                    {
                        name: 'batch_id',
                        label: 'Batch',
                        type: 'single-select',
                        options: allBatchOptions.map(b => ({
                            label: b.batch_name || b.name || 'Unknown Batch',
                            value: b.id || b.batch_id
                        })),
                        required: true,
                        fullWidth: true
                    }
                );
            }
            
            if (allClassOptions.length > 0) {
                fields.push(
                    {
                        name: 'class_id',
                        label: 'Class',
                        type: 'single-select',
                        options: allClassOptions.map(c => ({
                            label: c.class_name || c.name || 'Unknown Class',
                            value: c.id || c.class_id
                        })),
                        required: true,
                        fullWidth: true
                    }
                );
            }
        }
        
        fields.push(
            // Expense Date
            { name: 'expense_date', label: 'Expense Date', type: 'date-start', required: true, fullWidth: false },
            
            // Payment Mode
            { 
                name: 'payment_mode', 
                label: 'Payment Mode', 
                type: 'single-select', 
                options: PAYMENT_MODES.map(mode => ({ label: mode, value: mode })),
                required: true,
                fullWidth: false 
            },

            // --- REPEATER GROUP FOR LINE ITEMS ---
            { 
                name: 'lineItems', 
                label: 'Expense Line Items', 
                type: 'repeater-group', 
                fullWidth: true,
                required: true,
                descriptionText: "Add specific expense items (Travel, Training, etc.)",
                subFields: [
                    { 
                        name: 'expense_type', 
                        label: 'Expense Type', 
                        type: 'single-select', 
                        options: ['Travel', 'Training', 'Accommodation', 'Materials', 'Other'].map(t => ({ label: t, value: t })),
                        placeholder: 'Select Type', 
                        width: '25%',
                        required: true
                    },
                    { 
                        name: 'purpose', 
                        label: 'Purpose', 
                        type: 'text-enter', 
                        placeholder: 'Enter purpose', 
                        width: '25%',
                        required: true
                    },
                    { 
                        name: 'start_date', 
                        label: 'Start Date', 
                        type: 'date', 
                        placeholder: 'Select Date', 
                        width: '20%',
                        required: true
                    },
                    { 
                        name: 'end_date', 
                        label: 'End Date', 
                        type: 'date', 
                        placeholder: 'Select Date', 
                        width: '20%',
                        required: true
                    },
                    { 
                        name: 'amount', 
                        label: 'Amount (₹)', 
                        type: 'number', 
                        placeholder: '0', 
                        width: '10%',
                        required: true
                    }
                ]
            },
            
            // --- DESCRIPTION ---
            { name: 'description', label: 'Description / Notes', type: 'textarea', fullWidth: true },
            
            // --- PROOF UPLOAD ---
            { 
                name: 'file', 
                label: 'Supporting Document (PDF/Image)', 
                type: 'file-upload', 
                required: formMode === 'creation', 
                fullWidth: true,
                fileUploadLimit: 5 * 1024 * 1024, 
                hintText: "Upload PDF, PNG, JPG. Max size 5MB.",
                acceptedFileTypes: '.pdf,.png,.jpg,.jpeg'
            }
        );
        
        return fields;
    };

    // --- FILTER DEFINITIONS ---
    const expenseFilterDefinitions = {
        status: [
            { value: 'All', label: 'All Statuses' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
            { value: 'OnHold', label: 'On Hold' }, 
        ]
    };

    const summaryData = useMemo(() => {
        const pendingCount = expenses.filter(exp => exp.status === 'Pending').length;
        const approvedCount = expenses.filter(exp => exp.status === 'Approved').length;
        const totalApprovedAmount = expenses
            .filter(exp => exp.status === 'Approved')
            .reduce((total, exp) => total + parseFloat(exp.total_amount || 0), 0);
        const formattedTotalApprovedAmount = `₹${totalApprovedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        
        return { 
            pendingCount, 
            approvedCount,
            totalApprovedAmount: formattedTotalApprovedAmount,
            totalRequests: expenses.length
        };
    }, [expenses]);


    const actionProps = {};
    if (isTeacherRole) {
        actionProps.onEdit = handleEditExpense;
        actionProps.onDelete = handleDeleteExpense;
    } else if (isApprovalRole) {
        actionProps.onStatusChange = handleStatusChange;
        actionProps.onHold = handleHoldStatus; 
    }

    // Filtered hierarchy data for CardSlider (for teachers - based on their assigned classes)
    const filteredCourses = useMemo(() => {
        if (!selectedInstitution) return [];
        return isTeacherRole ? uniqueCourses : courses.filter(c => c.institute_id === selectedInstitution);
    }, [isTeacherRole, uniqueCourses, courses, selectedInstitution]);

    const filteredLevels = useMemo(() => {
        if (!selectedCourse) return [];
        return isTeacherRole ? uniqueLevels : levels.filter(l => l.course_id === selectedCourse);
    }, [isTeacherRole, uniqueLevels, levels, selectedCourse]);

    const filteredProgrammes = useMemo(() => {
        if (!selectedLevel) return [];
        return isTeacherRole ? uniqueProgrammes : programmes.filter(p => p.level_id === selectedLevel);
    }, [isTeacherRole, uniqueProgrammes, programmes, selectedLevel]);

    const filteredBatches = useMemo(() => {
        if (!selectedProgramme) return [];
        return isTeacherRole ? uniqueBatches : batches.filter(b => b.programme_id === selectedProgramme);
    }, [isTeacherRole, uniqueBatches, batches, selectedProgramme]);

    const filteredClasses = useMemo(() => {
        if (!selectedBatch) return [];
        return isTeacherRole ? availableClasses : classes.filter(c => c.batch_id === selectedBatch);
    }, [isTeacherRole, availableClasses, classes, selectedBatch]);

    if (loading) {
        return <div className="EXP_approval-dashboard"><p>Loading expenses...</p></div>;
    }

    if (error) {
        return <div className="EXP_approval-dashboard"><p style={{color: 'red'}}>Error: {error}</p></div>;
    }

    return (
        <div className="EXP_approval-dashboard">
            <h1 className="EXP_header">
                {isTeacherRole ? 'My Expense Claims' : 'Expense Approvals'}
            </h1>
            
            <div className="EXP_summary-cards-row">
                <div className="EXP_summary-card EXP_pending-card">
                    <div className="EXP_card-title">Pending Requests</div>
                    <div className="EXP_card-value EXP_pending-value">{summaryData.pendingCount}</div>
                </div>
                <div className="EXP_summary-card EXP_approved-card">
                    <div className="EXP_card-title">Approved Expenses</div>
                    <div className="EXP_card-value EXP_approved-value">{summaryData.approvedCount}</div>
                </div>
                <div className="EXP_summary-card EXP_total-card">
                    <div className="EXP_card-title">Total Approved Amount</div>
                    <div className="EXP_card-value EXP_total-value">{summaryData.totalApprovedAmount}</div>
                </div>
            </div>
            
            <hr className='EXP_summary-separator' />

            {/* Hierarchy Navigation for Teachers - Optional Quick Selection */}
            {isTeacherRole && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#666' }}>
                        📍 Optional: Pre-select Your Class (or select inside the form)
                    </h3>
                    
                    {loading && (
                        <p style={{ color: '#0066cc', marginBottom: '10px' }}>
                            ⏳ Loading your classes...
                        </p>
                    )}
                    
                    {!loading && !currentTeacher && (
                        <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '10px' }}>
                            <strong style={{ color: '#856404' }}>⚠️ Teacher Profile Not Found</strong>
                            <p style={{ margin: '5px 0 0 0', color: '#856404' }}>
                                Your teacher profile could not be loaded. Please contact administrator or try logging in again.
                            </p>
                        </div>
                    )}
                    
                    {!loading && currentTeacher && teachers.length > 0 && (
                        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px', fontSize: '14px', border: '1px solid #b3d9ff' }}>
                            <strong>👤 Teacher:</strong> {currentTeacher.full_name || 'Unknown'}
                            <br />
                            <strong>📚 Classes Found:</strong> {teacherClasses.length} {teacherClasses.length === 0 && '(⚠️ No classes assigned)'}
                        </div>
                    )}
                    
                    {!loading && currentTeacher && teacherClasses.length === 0 && (
                        <div style={{ padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', marginBottom: '10px' }}>
                            <strong style={{ color: '#721c24' }}>❌ No Classes Assigned</strong>
                            <p style={{ margin: '5px 0 0 0', color: '#721c24' }}>
                                You don't have any classes assigned to you. Please contact your administrator to assign classes before you can submit expense claims.
                            </p>
                        </div>
                    )}
                    
                    {!loading && currentTeacher && teacherClasses.length > 0 && (
                        <>
                            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
                                <strong style={{ color: '#0c5460' }}>ℹ️ Instructions:</strong>
                                <p style={{ margin: '5px 0 0 0', color: '#0c5460', fontSize: '13px' }}>
                                    You can pre-select your class here for quick access, or click "Add Expense Request" to select inside the form.
                                </p>
                            </div>
                            
                            {uniqueInstitutions.length > 0 ? (
                                <>
                                    {uniqueInstitutions.length === 1 ? (
                                        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
                                            <strong style={{ color: '#155724' }}>🏢 Institution (Auto-selected):</strong> {institutionMap[uniqueInstitutions[0].id || uniqueInstitutions[0].institution_id] || 'Unknown'}
                                        </div>
                                    ) : (
                                        <CardSlider
                                            title="🏢 Select Institution"
                                            institutes={uniqueInstitutions.map(i => ({ 
                                                id: i.id || i.institution_id, 
                                                name: i.institution_name || i.institute_name || i.name 
                                            }))}
                                            onSelectInstitute={handleInstitutionChange}
                                        />
                                    )}
                                </>
                            ) : (
                                <p style={{ color: '#dc3545' }}>⚠️ No institution data found in your classes</p>
                            )}
                        </>
                    )}
                </div>
            )}

            <DynamicTable
                data={transformedTableData}
                columnOrder={EXPENSE_COLUMN_ORDER}
                columnDisplayNameMap={columnDisplayNameMap}
                title='Expense Requests'
                userRole={userRole}
                
                {...actionProps}
                
                // --- Filters and Search ---
                onSearch={setSearchText} 
                filterDefinitions={expenseFilterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
               
                // --- Date Picker Props ---
                showDateFilter={true} 
                activeDateFilter={selectedDateFilter} 
                onDateChange={setSelectedDateFilter} 

                // --- ADD NEW BUTTON LOGIC ---
                onAddNew={isTeacherRole ? handleOpenAddModal : undefined}

                add_new_button_label={'Add Expense Request'}
                
                customDescription={isTeacherRole ? 'Click "Add Expense Request" to submit a new expense. You can select your class inside the form.' : 'Approve or reject expense requests'}
                pillColumns={['status']} 
            />

            <DynamicForm 
                isOpen={isFormOpen}
                mode={formMode}
                fieldsConfig={getFormFields()}
                initialData={formInitialData}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
            />
        </div>
    );
};

export default ExpenseRequestDashboard;