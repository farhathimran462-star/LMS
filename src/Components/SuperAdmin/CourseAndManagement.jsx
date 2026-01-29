import CardSlider from '../../Components/Reusable/CardSlider';
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { FaEdit } from "react-icons/fa"; 
import "../../Styles/SuperAdmin/CourseAndManagement.css";
import DynamicTable from '../../Components/Reusable/DynamicTable';
import DynamicForm from '../../Components/Reusable/DynamicForm'; 
import { 
    getAllCourses, 
    createCourse, 
    updateCourse
} from '../../api/coursesApi';
import { 
    getLevelsByCourse, 
    createLevel, 
    updateLevel
} from '../../api/levelsApi';

import {
    getSubjectsByLevel,
    createSubject,
    updateSubject,
    deleteSubject,
    createChapter,
    updateChapter,
    deleteChapter
} from '../../api/subjectsApi';



// --- Main Component ---
const CourseManagement = ({ userRole }) => {
    // Column orders
    const subjectColumnOrder = ['subject_code', 'subject_name', 'chapters_count', 'estimated_hours'];
    const chapterColumnOrder = ['chapter_number', 'chapter_name', 'estimated_hours'];
    
    // --- CHAPTER EDIT/DELETE STATE ---
    const [chapterFormState, setChapterFormState] = useState({
        isOpen: false,
        mode: 'creation', // 'creation' or 'edition'
        initialData: {}
    });
    const [confirmDeleteChapter, setConfirmDeleteChapter] = useState(null);
    // --- CHAPTER FORM CONFIG ---
    const getChapterFormConfig = () => {
        return [
            {
                name: 'course_name',
                label: 'Course',
                type: 'text-enter',
                required: false,
                readOnly: true,
                fullWidth: false
            },
            {
                name: 'level_name',
                label: 'Level',
                type: 'text-enter',
                required: false,
                readOnly: true,
                fullWidth: false
            },
            {
                name: 'subject_name',
                label: 'Subject',
                type: 'text-enter',
                required: false,
                readOnly: true,
                fullWidth: true
            },
            {
                name: 'chapter_number',
                label: 'Chapter Number',
                type: 'text-enter',
                required: true,
                placeholder: 'e.g., 01',
                fullWidth: false
            },
            {
                name: 'chapter_name',
                label: 'Chapter Name',
                type: 'text-enter',
                required: true,
                placeholder: 'e.g., Introduction',
                fullWidth: false
            },
            {
                name: 'estimated_hours',
                label: 'Estimated Hours',
                type: 'number',
                required: true,
                placeholder: 'e.g., 10',
                fullWidth: false
            }
        ];
    };

    // --- CHAPTER EDIT/DELETE HANDLERS ---
    const handleAddChapterClick = () => {
        if (!selectedSubject) {
            alert('Please select a subject first');
            return;
        }
        const currentCourse = coursesData.get(activeCourseId) || '';
        const currentLevel = levelsData.get(activeLevelId) || '';
        
        setChapterFormState({
            isOpen: true,
            mode: 'creation',
            initialData: {
                course_name: currentCourse,
                level_name: currentLevel,
                subject_name: selectedSubject?.subject_name || ''
            }
        });
    };

    const handleEditChapter = (chapter) => {
        const currentCourse = coursesData.get(activeCourseId) || '';
        const currentLevel = levelsData.get(activeLevelId) || '';
        
        setChapterFormState({
            isOpen: true,
            mode: 'edition',
            initialData: {
                id: chapter.id,
                course_name: currentCourse,
                level_name: currentLevel,
                subject_name: selectedSubject?.subject_name || '',
                chapter_number: chapter.chapter_number,
                chapter_name: chapter.chapter_name,
                estimated_hours: chapter.estimated_hours || 0
            }
        });
    };

    const handleDeleteChapter = (chapter) => {
        setConfirmDeleteChapter({ id: chapter.id });
    };

    const handleConfirmDeleteChapter = async () => {
        if (!confirmDeleteChapter) return;
        setLoading(true);
        try {
            const { error } = await deleteChapter(confirmDeleteChapter.id);
            if (error) throw error;
            // Remove from selectedSubject.chapters_data
            setSelectedSubject(prev => ({
                ...prev,
                chapters_data: prev.chapters_data.filter(ch => ch.id !== confirmDeleteChapter.id)
            }));
            alert('Chapter deleted successfully!');
        } catch (error) {
            console.error('Error deleting chapter:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setConfirmDeleteChapter(null);
        }
    };

    const handleChapterFormSubmit = async (formData) => {
        if (!selectedSubject) {
            alert('Please select a subject first');
            return;
        }

        setLoading(true);
        try {
            if (chapterFormState.mode === 'creation') {
                // Validate unique chapter number for this subject
                const existingChapter = selectedSubject.chapters_data?.find(
                    ch => ch.chapter_number === formData.chapter_number
                );
                if (existingChapter) {
                    alert(`Chapter number "${formData.chapter_number}" already exists for this subject. Please use a different chapter number.`);
                    setLoading(false);
                    return;
                }

                // Get user info for created_by
                const userDataStr = sessionStorage.getItem('userData') || localStorage.getItem('userData');
                const userData = userDataStr ? JSON.parse(userDataStr) : null;
                const createdBy = userData?.full_name || userData?.username || 'Unknown';

                const newChapter = {
                    subject_id: selectedSubject.id,
                    level_id: activeLevelId,
                    course_id: activeCourseId,
                    chapter_number: formData.chapter_number,
                    chapter_name: formData.chapter_name,
                    estimated_hours: parseFloat(formData.estimated_hours) || 0,
                    created_by: createdBy
                };

                const { data, error } = await createChapter(newChapter);
                if (error) throw error;

                // Add to selectedSubject.chapters_data
                setSelectedSubject(prev => ({
                    ...prev,
                    chapters_data: [...prev.chapters_data, data]
                }));

                alert('Chapter created successfully!');
            } else if (chapterFormState.mode === 'edition') {
                // Validate unique chapter number (excluding current chapter)
                const existingChapter = selectedSubject.chapters_data?.find(
                    ch => ch.chapter_number === formData.chapter_number && ch.id !== chapterFormState.initialData.id
                );
                if (existingChapter) {
                    alert(`Chapter number "${formData.chapter_number}" already exists for this subject. Please use a different chapter number.`);
                    setLoading(false);
                    return;
                }

                const { error } = await updateChapter(chapterFormState.initialData.id, {
                    chapter_number: formData.chapter_number,
                    chapter_name: formData.chapter_name,
                    estimated_hours: parseFloat(formData.estimated_hours) || 0
                });
                if (error) throw error;
                // Update in selectedSubject.chapters_data
                setSelectedSubject(prev => ({
                    ...prev,
                    chapters_data: prev.chapters_data.map(ch =>
                        ch.id === chapterFormState.initialData.id
                            ? { 
                                ...ch, 
                                chapter_number: formData.chapter_number, 
                                chapter_name: formData.chapter_name,
                                estimated_hours: parseFloat(formData.estimated_hours) || 0
                            }
                            : ch
                    )
                }));
                alert('Chapter updated successfully!');
            }
        } catch (error) {
            console.error('Error saving chapter:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setChapterFormState({ isOpen: false, mode: 'creation', initialData: {} });
        }
    };

    // Refs
    const levelsRef = useRef(null);
    const subjectsTableRef = useRef(null);
    const chapterDetailsRef = useRef(null);

    // --- STATE MANAGEMENT ---
    const [coursesData, setCoursesData] = useState(new Map());
    const [levelsData, setLevelsData] = useState(new Map());
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [activeLevelId, setActiveLevelId] = useState(null);
    const [subjectsData, setSubjectsData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get current user role from session storage
    const checkSuperAdminAccess = () => {
        const userRoleFromStorage = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
        if (userRoleFromStorage !== 'Super Admin') {
            alert('Access Denied: Only Super Admins can perform this action.');
            return false;
        }
        return true;
    };
    
    // Selection State
    const [selectedSubject, setSelectedSubject] = useState(null);

    const [confirmDelete, setConfirmDelete] = useState(null);
    const [tableSearchTerm, setTableSearchTerm] = useState(""); 
    
    // --- Dynamic Form State ---
    const [formState, setFormState] = useState({
        isOpen: false,
        type: null, // 'course', 'level', 'subject'
        mode: 'creation', // 'creation' or 'edition'
        initialData: {}
    });

    // --- FETCH DATA FROM SUPABASE ---
    const fetchCourses = useCallback(async () => {
        if (!checkSuperAdminAccess()) return;
        
        setLoading(true);
        const { data, error } = await getAllCourses();
        if (!error && data) {
            const coursesMap = new Map(data.map(course => [course.id, course.course_name]));
            setCoursesData(coursesMap);
        } else if (error) {
            console.error('Error fetching courses:', error);
        }
        setLoading(false);
    }, []);

    const fetchLevels = async (courseId) => {
        if (!checkSuperAdminAccess()) return;
        
        setLoading(true);
        const { data, error } = await getLevelsByCourse(courseId);
        if (!error && data) {
            const levelsMap = new Map(data.map(level => [level.id, level.level_name]));
            setLevelsData(levelsMap);
        } else if (error) {
            console.error('Error fetching levels:', error);
            setLevelsData(new Map());
        }
        setLoading(false);
    };

    const fetchSubjects = async (levelId) => {
        if (!checkSuperAdminAccess()) return;
        
        setLoading(true);
        const { data, error } = await getSubjectsByLevel(levelId);
        if (!error && data) {
            // Transform data to match component format
            const transformedData = data.map(subject => {
                // Use chapters directly with their estimated_hours from the database
                const chaptersWithHours = subject.chapters || [];
                
                // Calculate total estimated hours from all chapters
                const totalHours = chaptersWithHours.reduce((sum, ch) => 
                    sum + (parseFloat(ch.estimated_hours) || 0), 0);
                
                return {
                    id: subject.id,
                    subject_code: subject.subject_code,
                    subject_name: subject.subject_name,
                    estimated_hours: totalHours,
                    chapters_count: chaptersWithHours.length,
                    chapters_data: chaptersWithHours
                };
            });
            setSubjectsData(transformedData);
        } else if (error) {
            console.error('Error fetching subjects:', error);
            setSubjectsData([]);
        }
        setLoading(false);
    };

    // Fetch courses on component mount
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // --- FORM CONFIGURATION GENERATOR ---
    const getFormConfig = (type) => {
        if (type === 'course') {
            return [
                { 
                    name: 'course_name', 
                    label: 'Course Name', 
                    type: 'text-enter', 
                    required: true, 
                    placeholder: 'e.g., Chartered Accountant',
                    fullWidth: true
                },
                {
                    name: 'course_id',
                    label: 'Course ID (Optional)',
                    type: 'text-enter',
                    required: false,
                    placeholder: 'Enter ID or leave blank to auto-generate',
                    fixed: formState.mode === 'edition'
                },
                { 
                    name: 'description', 
                    label: 'Description', 
                    type: 'text-enter', 
                    fullWidth: true,
                    placeholder: 'Add a brief description (Optional)'
                }
            ];
        } 
        else if (type === 'level') {
            return [
                { 
                    name: 'courseName', 
                    label: 'Selected Course', 
                    type: 'text-enter', 
                    readOnly: true, 
                    required: true,
                    className: 'cm_field-readonly' 
                },
                { 
                    name: 'level_name', 
                    label: 'Level Name', 
                    type: 'text-enter', 
                    required: true, 
                    placeholder: 'e.g., Foundation',
                    fullWidth: true
                },
                {
                    name: 'level_id',
                    label: 'Level ID (Optional)',
                    type: 'text-enter',
                    required: false,
                    placeholder: 'Enter ID or leave blank to auto-generate',
                    fixed: formState.mode === 'edition'
                },
                { 
                    name: 'description', 
                    label: 'Description', 
                    type: 'text-enter', 
                    fullWidth: true,
                    placeholder: 'Add a brief description (Optional)'
                }
            ];
        } 
        else if (type === 'subject') {

            return [
                { 
                    name: 'subject_name', 
                    label: 'Subject Name', 
                    type: 'text-enter', 
                    required: true,
                    placeholder: 'e.g., Advanced Auditing',
                    fullWidth: false
                },
                { 
                    name: 'subject_code', 
                    label: 'Subject Code', 
                    type: 'text-enter', 
                    required: true,
                    placeholder: 'e.g., ADT501',
                    fixed: formState.mode === 'edition'
                }
            ];
        }
        return [];
    };

    // Filtered Subjects Data
    const filteredSubjects = useMemo(() => {
        if (!activeLevelId) return [];
        if (!tableSearchTerm) return subjectsData; 
        const lowerCaseSearch = tableSearchTerm.toLowerCase();
        return subjectsData.filter(subject => 
            subject.subject_name.toLowerCase().includes(lowerCaseSearch) ||
            subject.subject_code.toLowerCase().includes(lowerCaseSearch)
        );
    }, [activeLevelId, tableSearchTerm, subjectsData]);

    // =================================================================
    // === HANDLERS ===
    // =================================================================

    const handleSubjectRowClick = (subjectId) => {
        const subject = subjectsData.find(s => s.id === subjectId);
        if (selectedSubject?.id === subjectId) {
            setSelectedSubject(null);
        } else {
            setSelectedSubject(subject);
        }
    };

    const handleCourseSelect = (courseId) => {
        setActiveCourseId(courseId);
        setActiveLevelId(null);
        setSelectedSubject(null);
        setLevelsData(new Map());
        setSubjectsData([]);
        // Fetch levels for the selected course
        fetchLevels(courseId);
    };

    const handleLevelSelect = (levelId) => {
        setActiveLevelId(levelId);
        setSelectedSubject(null);
        setTableSearchTerm('');
        // Fetch subjects for the selected level
        fetchSubjects(levelId);
    };
    
    // --- OPEN DYNAMIC FORM HANDLERS ---

    const handleAddCourseClick = () => {
        if (!checkSuperAdminAccess()) return;
        
        setFormState({
            isOpen: true,
            type: 'course',
            mode: 'creation',
            initialData: { course_name: '', course_id: '', description: '' }
        });
    };

    const handleAddLevelClick = () => {
        if (!checkSuperAdminAccess()) return;
        
        if (!activeCourseId) {
            alert("Please select a Course first.");
            return;
        }
        const selectedCourseName = coursesData.get(activeCourseId) || "Unknown Course";
        setFormState({
            isOpen: true,
            type: 'level',
            mode: 'creation',
            initialData: { 
                courseName: selectedCourseName, 
                level_name: '', 
                level_id: '', 
                description: '' 
            }
        });
    };

    const handleAddSubjectClick = () => {
        if (!checkSuperAdminAccess()) return;
        
        if (!activeLevelId) {
            alert("Please select a Course and Level first.");
            return;
        }
        setFormState({
            isOpen: true,
            type: 'subject',
            mode: 'creation',
            initialData: { 
                subject_name: '', 
                subject_code: ''
            }
        });
    };

    const handleEditSubject = (subject) => {
        if (!checkSuperAdminAccess()) return;
        
        setFormState({
            isOpen: true,
            type: 'subject',
            mode: 'edition',
            initialData: {
                id: subject.id,
                subject_name: subject.subject_name,
                subject_code: subject.subject_code
            }
        });
    };

    // --- SUBMIT DYNAMIC FORM HANDLER ---
    const handleDynamicFormSubmit = async (formData) => {
        if (!checkSuperAdminAccess()) return;
        
        const type = formState.type;
        const mode = formState.mode;
        setLoading(true);

        try {
            if (type === 'course') {
                const courseData = {
                    course_id: formData.course_id || `COURSE_${Date.now()}`,
                    course_name: formData.course_name,
                    description: formData.description || null
                };

                if (mode === 'edition') {
                    const { error } = await updateCourse(formData.id, courseData);
                    if (error) throw error;
                    alert('Course updated successfully!');
                } else {
                    const { error } = await createCourse(courseData);
                    if (error) throw error;
                    alert('Course created successfully!');
                }
                fetchCourses();
            } 
            else if (type === 'level') {
                const levelData = {
                    level_id: formData.level_id || `LEVEL_${Date.now()}`,
                    level_name: formData.level_name,
                    course_id: activeCourseId,
                    description: formData.description || null
                };

                if (mode === 'edition') {
                    const { error } = await updateLevel(formData.id, levelData);
                    if (error) throw error;
                    alert('Level updated successfully!');
                } else {
                    const { error } = await createLevel(levelData);
                    if (error) throw error;
                    alert('Level created successfully!');
                }
                fetchLevels(activeCourseId);
            } 
            else if (type === 'subject') {
                const subjectData = {
                    subject_code: formData.subject_code,
                    subject_name: formData.subject_name,
                    level_id: activeLevelId
                };

                if (mode === 'edition') {
                    const { error } = await updateSubject(formData.subject_code, subjectData);
                    if (error) throw error;
                    alert('Subject updated successfully!');
                } else {
                    const { error } = await createSubject(subjectData);
                    if (error) throw error;
                    alert('Subject created successfully!');
                }
                fetchSubjects(activeLevelId);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setFormState({ isOpen: false, type: null, mode: 'creation', initialData: {} });
        }
    };

    const handleDeleteMaterial = (item) => {
        if (!checkSuperAdminAccess()) return;
        
        setConfirmDelete({ type: 'subject', id: item.id });
    };
    
    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        
        setLoading(true);
        try {
            if(confirmDelete.type === 'subject') {
                const { error } = await deleteSubject(confirmDelete.id);
                if (error) throw error;
                
                setSubjectsData(prev => prev.filter(s => s.id !== confirmDelete.id));
                setSelectedSubject(null);
                alert('Subject deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setConfirmDelete(null);
        }
    };

    const handleTableSearch = (query) => {
        setTableSearchTerm(query);
    };
    
    // --- Scroll Effects ---
    const scrollToRef = (ref) => {
        if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    useEffect(() => { window.scrollTo(0, 0); }, []);
    useEffect(() => { if (activeCourseId) scrollToRef(levelsRef); }, [activeCourseId]);
    useEffect(() => { if (activeLevelId) setTimeout(() => scrollToRef(subjectsTableRef), 100); }, [activeLevelId]);


    // =================================================================
    // RENDER FUNCTIONS
    // =================================================================

    const renderCourseSelection = () => (
        <div className="cm_step-card cm_step-1">
            <CardSlider
                institutes={coursesData}
                title='Courses'
                icon_title="Courses"
                fromTabOf="Courses"
                onSelectInstitute={handleCourseSelect}
                onAddButtonClick={handleAddCourseClick} 
            />
        </div>
    );

    const renderLevelSelection = () => activeCourseId && (
        <div ref={levelsRef} className="cm_step-card cm_step-2">
            <CardSlider
                institutes={levelsData}
                title={ 'Levels'}
                icon_title="Levels"
                fromTabOf="Levels"
                onSelectInstitute={handleLevelSelect}
                onAddButtonClick={handleAddLevelClick}
            />
        </div>
    );

    const renderMaterialsTable = () => activeLevelId && (
            <div ref={subjectsTableRef} className="cm_step-card cm_step-3">
                <DynamicTable
                    data={filteredSubjects} 
                    unfilteredData={subjectsData}
                    columnOrder={subjectColumnOrder} 
                    onEdit={handleEditSubject}
                    onDelete={handleDeleteMaterial}
                    title={`Subjects`}
                    onSearch={handleTableSearch}
                    onAddNew={handleAddSubjectClick}
                    customDescription="** Select rows to view Chapters **"
                    userRole={userRole}
                    onRowClickable={true}
                    onRowClick={handleSubjectRowClick} 
                    selectedRowId={selectedSubject ? selectedSubject.id : null}
                />
            </div>
    );
    
    const renderChapterDetails = () => selectedSubject && (
        <div ref={chapterDetailsRef} className="cm_step-card cm_chapter-separate-section">
            <h3>Chapters for {selectedSubject.subject_name}</h3>
            <DynamicTable
                data={selectedSubject.chapters_data || []}
                columnOrder={chapterColumnOrder}
                title="Chapters"
                onEdit={handleEditChapter}
                onDelete={handleDeleteChapter}
                onAddNew={handleAddChapterClick}
                add_new_button_label="Add Chapter"
                userRole={userRole}
            />
        </div>
    );

    return (
        <div className="cm_wrapper">
            <h1 className="cm_title">Course and Material Management</h1>

            {loading && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading...
                </div>
            )}

            {renderCourseSelection()}
            {renderLevelSelection()}
            {renderMaterialsTable()}
            {renderChapterDetails()}


            {formState.isOpen && (
                <DynamicForm
                    isOpen={formState.isOpen}
                    mode={formState.mode}
                    fieldsConfig={getFormConfig(formState.type)}
                    initialData={formState.initialData}
                    onClose={() => setFormState({ isOpen: false, type: null, mode: 'creation', initialData: {} })}
                    onSubmit={handleDynamicFormSubmit}
                />
            )}

            {chapterFormState.isOpen && (
                console.log('Opening Chapter Form with data:', chapterFormState.initialData),
                <DynamicForm
                    isOpen={chapterFormState.isOpen}
                    mode={chapterFormState.mode}
                    fieldsConfig={getChapterFormConfig()}
                    initialData={chapterFormState.initialData}
                    onClose={() => setChapterFormState({ isOpen: false, mode: 'creation', initialData: {} })}
                    onSubmit={handleChapterFormSubmit}
                />
            )}

            {confirmDelete && (
                <div className={`cm_model-overlay ${confirmDelete ? 'active' : ''}`}>
                    <div className="cm_model-content cm_confirm-popup">
                        <FiAlertTriangle size={32} className="cm_confirm-icon" />
                        <h4>Confirm Deletion</h4>
                        <p>Are you sure you want to delete this item? This action is irreversible.</p>
                        <div className="cm_modal-actions">
                            <button className="cm_btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="cm_btn-delete" onClick={handleConfirmDelete}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteChapter && (
                <div className={`cm_model-overlay ${confirmDeleteChapter ? 'active' : ''}`}>
                    <div className="cm_model-content cm_confirm-popup">
                        <FiAlertTriangle size={32} className="cm_confirm-icon" />
                        <h4>Confirm Chapter Deletion</h4>
                        <p>Are you sure you want to delete this chapter? This action is irreversible.</p>
                        <div className="cm_modal-actions">
                            <button className="cm_btn-secondary" onClick={() => setConfirmDeleteChapter(null)}>Cancel</button>
                            <button className="cm_btn-delete" onClick={handleConfirmDeleteChapter}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;