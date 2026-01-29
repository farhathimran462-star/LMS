import React, { useState, useMemo, useEffect, useCallback } from 'react';
import DynamicTable from '../Reusable/DynamicTable';
import DynamicForm from '../Reusable/DynamicForm'; 
import { 
  Plus,
  X,
  Save,
  Trash2,
  Edit2
} from 'lucide-react';

// API Imports
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses, getCoursesByInstitution } from '../../api/coursesApi';
import { getAllLevels, getLevelsByCourse } from '../../api/levelsApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllClasses, getClassesByTeacher } from '../../api/classesApi';
import { getAllSubjects, getChaptersBySubject } from '../../api/subjectsApi';
import { getAllProgrammes } from '../../api/programmesApi';
import { getAllTeachers } from '../../api/usersApi';
import { createCourseCompletion, getCourseCompletionsByTeacher } from '../../api/courseCompletionApi';

// ==========================================
// 1. CONSTANTS & HELPERS
// ==========================================
const CHAPTER_STATUS_COLORS = {
    'Accepted': 'success',
    'Approved': 'success',
    'Completed': 'success',
    'Ongoing': 'primary',
    'Pending': 'warning',
    'Rejected': 'danger',
    'Not Started': 'default'
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const TeacherCompletionPage = ({ userRole }) => {
    // Get current user data from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || localStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;
    
    // State Management
    const [activeFilters, setActiveFilters] = useState({
        institution: '',
        course: '',
        level: '',
        programme: '',
        batch: '',
        class: ''
    });
    const [activeChapterFilters, setActiveChapterFilters] = useState({});
    const [subjectSearch, setSubjectSearch] = useState('');
    const [chapterSearch, setChapterSearch] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);
    const [selectedChapterId, setSelectedChapterId] = useState(null);

    // API Data States
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [batches, setBatches] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [teacherClasses, setTeacherClasses] = useState([]); // Only classes assigned to this teacher
    const [completions, setCompletions] = useState([]);
    const [loading, setLoading] = useState(false);

    // DynamicForm States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('creation'); // 'creation' or 'edition'
    const [editingCompletion, setEditingCompletion] = useState({});
    
    // Form dynamic data
    const [formInstitutions, setFormInstitutions] = useState([]);
    const [formCourses, setFormCourses] = useState([]);
    const [formLevels, setFormLevels] = useState([]);
    const [formProgrammes, setFormProgrammes] = useState([]);
    const [formBatches, setFormBatches] = useState([]);
    const [formClasses, setFormClasses] = useState([]);
    const [formSubjects, setFormSubjects] = useState([]);
    const [formChapters, setFormChapters] = useState([]);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [insData, subData, teachersData, progData, batchData, coursesData, levelsData] = await Promise.all([
                getAllInstitutions(),
                getAllSubjects(),
                getAllTeachers(),
                getAllProgrammes(),
                getAllBatches(),
                getAllCourses(),
                getAllLevels()
            ]);
            
            if (insData.error) throw new Error(insData.error.message);
            if (subData.error) throw new Error(subData.error.message);
            if (teachersData.error) throw new Error(teachersData.error.message);
            
            setInstitutions(insData.data || []);
            setSubjects(subData.data || []);
            setTeachers(teachersData.data || []);
            setProgrammes(progData.data || []);
            setBatches(batchData.data || []);
            setCourses(coursesData.data || []);
            setLevels(levelsData.data || []);
        } catch (err) {
            console.error('Error fetching initial data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Find current teacher and their assigned classes
    useEffect(() => {
        const fetchTeacherData = async () => {
            if (teachers.length > 0 && currentUserId) {
                const teacher = teachers.find(t => t.user_id === currentUserId);
                console.log('🔍 Found teacher:', teacher);
                
                if (teacher) {
                    setCurrentTeacher(teacher);
                    
                    // Fetch classes assigned to this teacher
                    const teacherId = teacher.id || teacher.teacher_id;
                    console.log('🔍 Fetching classes for teacher ID:', teacherId);
                    
                    if (teacherId) {
                        const { data: assignedClasses, error } = await getClassesByTeacher(currentUserId);
                        console.log('📚 Teacher assigned classes:', assignedClasses);
                        
                        if (!error && assignedClasses) {
                            setTeacherClasses(assignedClasses);
                        } else {
                            console.error('Error fetching teacher classes:', error);
                            setTeacherClasses([]);
                        }
                    }
                }
            }
        };
        
        fetchTeacherData();
    }, [teachers, currentUserId]);

    // Fetch teacher's course completions
    useEffect(() => {
        const fetchCompletions = async () => {
            if (currentTeacher) {
                const teacherId = currentTeacher.id || currentTeacher.teacher_id;
                if (teacherId) {
                    const { data, error } = await getCourseCompletionsByTeacher(teacherId);
                    if (!error && data) {
                        setCompletions(data);
                    }
                }
            }
        };
        
        fetchCompletions();
    }, [currentTeacher]);

    // Note: Courses and levels are now fetched in fetchInitialData()
    // No need for separate useEffects that clear them when filters are empty

    // Fetch batches when programme is selected (filter by institution, course, level, programme)
    useEffect(() => {
        if (activeFilters.programme) {
            fetchFilteredBatches();
        } else {
            setBatches([]);
        }
    }, [activeFilters.programme, activeFilters.level, activeFilters.institution, activeFilters.course]);

    const fetchFilteredBatches = async () => {
        try {
            const { data, error } = await getAllBatches();
            if (error) throw error;
            
            // Filter batches by selected institution, course, level, programme
            const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            const selectedProgramme = programmes.find(p => p.programme_name === activeFilters.programme);
            
            const filtered = (data || []).filter(b => 
                (!selectedInst || b.institute_id === selectedInst.id) &&
                (!selectedCourse || b.course_id === selectedCourse.id) &&
                (!selectedLevel || b.level_id === selectedLevel.id) &&
                (!selectedProgramme || b.programme_id === selectedProgramme.id)
            );
            
            setBatches(filtered);
        } catch (err) {
            console.error('Error fetching batches:', err.message);
            setBatches([]);
        }
    };

    // Fetch classes when batch is selected (filter by teacher's assigned classes)
    useEffect(() => {
        if (activeFilters.batch && teacherClasses.length > 0) {
            fetchFilteredClasses();
        } else if (teacherClasses.length > 0) {
            setClasses(teacherClasses);
        } else {
            setClasses([]);
        }
    }, [activeFilters.batch, teacherClasses]);

    const fetchFilteredClasses = async () => {
        try {
            const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
            
            // Filter teacher's assigned classes by selected batch
            const filtered = teacherClasses.filter(c => 
                !selectedBatch || c.batch_id === selectedBatch.id
            );
            
            setClasses(filtered);
        } catch (err) {
            console.error('Error filtering classes:', err.message);
            setClasses([]);
        }
    };

    // Handle filter changes with cascading reset
    const handleFilterChange = useCallback((column, value) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev, [column]: value };
            
            if (column === 'institution') {
                newFilters.course = '';
                newFilters.level = '';
                newFilters.programme = '';
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'course') {
                newFilters.level = '';
                newFilters.programme = '';
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'level') {
                newFilters.programme = '';
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'programme') {
                newFilters.batch = '';
                newFilters.class = '';
            } else if (column === 'batch') {
                newFilters.class = '';
            }
            
            return newFilters;
        });
    }, []);

    // Calculate subject list based on teacher's assigned classes
    const subjectList = useMemo(() => {
        console.log('📊 Calculating subjectList...');
        console.log('📊 teacherClasses:', teacherClasses);
        console.log('📊 programmes:', programmes);
        
        if (!teacherClasses || teacherClasses.length === 0) {
            console.log('⚠️ No teacher classes found');
            return [];
        }

        let filteredClasses = teacherClasses;

        // Apply filters
        if (activeFilters.institution) {
            const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
            if (selectedInst) {
                filteredClasses = filteredClasses.filter(c => c.institute_id === selectedInst.id);
            }
        }
        if (activeFilters.course) {
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            if (selectedCourse) {
                filteredClasses = filteredClasses.filter(c => c.course_id === selectedCourse.id);
            }
        }
        if (activeFilters.level) {
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            if (selectedLevel) {
                filteredClasses = filteredClasses.filter(c => c.level_id === selectedLevel.id);
            }
        }
        if (activeFilters.programme) {
            const selectedProgramme = programmes.find(p => p.programme_name === activeFilters.programme);
            if (selectedProgramme) {
                filteredClasses = filteredClasses.filter(c => c.programme_id === selectedProgramme.id);
            }
        }
        if (activeFilters.batch) {
            const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
            if (selectedBatch) {
                filteredClasses = filteredClasses.filter(c => c.batch_id === selectedBatch.id);
            }
        }
        if (activeFilters.class) {
            filteredClasses = filteredClasses.filter(c => c.class_name === activeFilters.class);
        }

        console.log('📊 filteredClasses:', filteredClasses);
        console.log('📊 All courses:', courses);
        console.log('📊 All levels:', levels);

        // For each class, get subjects from programme_subjects
        const rows = [];
        filteredClasses.forEach(classItem => {
            console.log('🔍 Processing class:', classItem.class_name, 'course_id:', classItem.course_id, 'level_id:', classItem.level_id);
            
            const programme = programmes.find(p => p.id === classItem.programme_id || p.programme_id === classItem.programme_id);
            console.log('🔍 Found programme:', programme);
            
            const institution = institutions.find(i => i.id === classItem.institute_id || i.institution_id === classItem.institute_id);
            const course = courses.find(c => c.id === classItem.course_id || c.course_id === classItem.course_id);
            const level = levels.find(l => l.id === classItem.level_id || l.level_id === classItem.level_id);
            const batch = batches.find(b => b.id === classItem.batch_id || b.batch_id === classItem.batch_id);
            
            console.log('🔍 Found institution:', institution);
            console.log('🔍 Found course:', course);
            console.log('🔍 Found level:', level);
            console.log('🔍 Found batch:', batch);

            if (programme && programme.programme_subjects && programme.programme_subjects.length > 0) {
                console.log('✅ Programme has subjects:', programme.programme_subjects);
                
                programme.programme_subjects.forEach(ps => {
                    // programme_subjects has nested subjects object
                    const subject = ps.subjects || subjects.find(s => s.id === ps.subject_id);
                    console.log('🔍 Processing subject:', subject);
                    
                    if (subject) {
                        // Calculate completion from completions data
                        const subjectCompletions = completions.filter(comp => 
                            comp.class_id === classItem.id && 
                            comp.subject_id === subject.id
                        );
                        const totalTaken = subjectCompletions.reduce((sum, comp) => sum + (comp.hours_taken || 0), 0);
                        const totalActual = subject.estimated_hours || 0;
                        const percent = totalActual > 0 ? Math.round((totalTaken / totalActual) * 100) : 0;

                        rows.push({
                            id: `${classItem.id}_${subject.id}`,
                            class_id: classItem.id,
                            subject_id: subject.id,
                            institution: institution?.institute_name || 'N/A',
                            course: course?.course_name || 'N/A',
                            level: level?.level_name || 'N/A',
                            programme: programme?.programme_name || 'N/A',
                            batch: batch?.batch_name || 'N/A',
                            class_name: classItem.class_name,
                            subject: subject.subject_name,
                            total_actual_hours: `${totalActual} Hrs`,
                            total_taken_hours: `${totalTaken} Hrs`,
                            percent_completed: (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold w-8 text-right">{percent}%</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${percent}%`}}></div>
                                    </div>
                                </div>
                            )
                        });
                    }
                });
            } else {
                console.log('⚠️ Programme not found or has no subjects for class:', classItem.class_name);
                console.log('⚠️ Programme ID:', classItem.programme_id);
                console.log('⚠️ All programmes:', programmes.map(p => ({ id: p.id, name: p.programme_name, subjects: p.programme_subjects?.length })));
            }
        });

        console.log('📊 Final rows:', rows);

        // Apply search filter
        if (subjectSearch) {
            const lowerQuery = subjectSearch.toLowerCase();
            return rows.filter(r => 
                r.subject.toLowerCase().includes(lowerQuery) || 
                r.class_name.toLowerCase().includes(lowerQuery) ||
                r.institution.toLowerCase().includes(lowerQuery)
            );
        }

        return rows;
    }, [teacherClasses, subjects, programmes, institutions, courses, levels, batches, completions, subjectSearch, activeFilters]);


    // Generate filter definitions for the subject table
    const filterDefs = useMemo(() => {
        const defs = {};

        // 1. INSTITUTION - from teacher's assigned classes
        const uniqueInstitutions = [...new Set(teacherClasses.map(c => {
            const inst = institutions.find(i => i.id === c.institute_id);
            return inst?.institute_name;
        }).filter(Boolean))];
        
        defs.institution = [
            { value: '', label: 'All Institution' },
            ...uniqueInstitutions.map(name => ({ value: name, label: name }))
        ];

        // 2. COURSE
        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({ value: course.course_name, label: course.course_name }))
        ];

        // 3. LEVEL
        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({ value: level.level_name, label: level.level_name }))
        ];

        // 4. PROGRAMME - filter by course and level if selected
        let filteredProgrammes = programmes;
        if (activeFilters.course && activeFilters.level) {
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            if (selectedCourse && selectedLevel) {
                filteredProgrammes = programmes.filter(p => 
                    p.course_id === selectedCourse.id && p.level_id === selectedLevel.id
                );
            }
        }
        defs.programme = [
            { value: '', label: 'All Programme' },
            ...filteredProgrammes.map(prog => ({ value: prog.programme_name, label: prog.programme_name }))
        ];

        // 5. BATCH
        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({ value: batch.batch_name, label: batch.batch_name }))
        ];

        // 6. CLASS - from teacher's assigned classes only
        const uniqueClasses = [...new Set(classes.map(c => c.class_name).filter(Boolean))];
        defs.class = [
            { value: '', label: 'All Class' },
            ...uniqueClasses.map(name => ({ value: name, label: name }))
        ];
        
        return defs;
    }, [institutions, courses, levels, programmes, batches, teacherClasses, classes, activeFilters]);

    // Fetch chapters when subject is selected - NOT NEEDED ANYMORE
    // We'll show course completion records instead
    
    // Generate course completion list for the selected subject
    const completionList = useMemo(() => {
        if (!selectedSubjectId) return [];

        // Extract class_id and subject_id from the composite id
        const [class_id, subject_id] = selectedSubjectId.split('_');
        
        // Filter completions for this class and subject
        let filteredCompletions = completions.filter(comp => 
            comp.class_id === class_id && 
            comp.subject_id === subject_id
        );

        // Apply status filter if selected
        if (activeChapterFilters.status) {
            filteredCompletions = filteredCompletions.filter(c => c.status === activeChapterFilters.status);
        }

        // Map to table rows
        return filteredCompletions.map(completion => {
            // Get chapter details
            const chapter = completion.chapters || { chapter_number: '?', chapter_name: 'Unknown' };
            
            return {
                id: completion.id,
                chapterNo: `Ch-${chapter.chapter_number}`,
                chapterName: chapter.chapter_name,
                hoursTaken: `${completion.hours_taken || 0} hrs`,
                status: completion.status || 'Pending',
                submittedDate: completion.submitted_date ? new Date(completion.submitted_date).toLocaleDateString() : '--',
                approvedBy: completion.approved_by || '--',
                approvedDate: completion.approved_date ? new Date(completion.approved_date).toLocaleDateString() : '--',
                rejectionReason: completion.rejection_reason || '--'
            };
        });
    }, [selectedSubjectId, completions, activeChapterFilters]);

    const chapterFilterDefs = useMemo(() => {
        const statusOpts = [...new Set(completions.map(c => c.status))].sort().map(v => ({label: v, value: v}));

        return { 
            status: statusOpts 
        };
    }, [completions]);

    // Handle opening the new course completion form
    const handleAddNewClick = async () => {
        if (!selectedSubjectId) {
            alert('Please select a subject first');
            return;
        }
        
        const selectedRow = subjectList.find(r => r.id === selectedSubjectId);
        if (!selectedRow) return;

        // Get IDs from the selected row
        const inst = institutions.find(i => i.institute_name === selectedRow.institution);
        const course = courses.find(c => c.course_name === selectedRow.course);
        const level = levels.find(l => l.level_name === selectedRow.level);
        const programme = programmes.find(p => p.programme_name === selectedRow.programme);
        const batch = batches.find(b => b.batch_name === selectedRow.batch);
        const cls = teacherClasses.find(c => c.class_name === selectedRow.class_name);
        const subj = subjects.find(s => s.subject_name === selectedRow.subject);

        // Pre-populate form with selected subject's context
        const initialData = {
            institution: inst?.id || '',
            course: course?.id || '',
            level: level?.id || '',
            programme: programme?.id || '',
            batch: batch?.id || '',
            class: cls?.id || '',
            subject: subj?.id || '',
            chapter: '',
            hours_taken: '',
            status: 'Ongoing'
        };
        
        setEditingCompletion(initialData);
        
        // Load cascading data
        if (inst) {
            setFormInstitutions([inst]);
            const { data: coursesData } = await getCoursesByInstitution(inst.id);
            if (coursesData) setFormCourses(coursesData);
        }
        
        if (course) {
            const { data: levelsData } = await getLevelsByCourse(course.id);
            if (levelsData) setFormLevels(levelsData);
        }
        
        if (level && course) {
            const filteredProgrammes = programmes.filter(p => 
                p.course_id === course.id && p.level_id === level.id
            );
            setFormProgrammes(filteredProgrammes);
        }
        
        if (programme && inst && course && level) {
            const filteredBatches = batches.filter(b => 
                b.institute_id === inst.id &&
                b.course_id === course.id &&
                b.level_id === level.id &&
                b.programme_id === programme.id
            );
            setFormBatches(filteredBatches);
        }
        
        if (batch) {
            const filteredClasses = teacherClasses.filter(c => c.batch_id === batch.id);
            setFormClasses(filteredClasses);
        }
        
        if (cls && programme) {
            const prog = programmes.find(p => p.id === cls.programme_id);
            if (prog && prog.programme_subjects) {
                // Handle both nested subjects object and subject_id reference
                const classSubjects = prog.programme_subjects
                    .map(ps => ps.subjects || subjects.find(s => s.id === ps.subject_id))
                    .filter(Boolean);
                setFormSubjects(classSubjects);
            }
        }
        
        if (subj) {
            const { data: chaptersData } = await getChaptersBySubject(subj.id);
            if (chaptersData) setFormChapters(chaptersData);
        }
        
        setFormMode('creation');
        setIsFormOpen(true);
    };

    // Handle form field changes for cascading dropdowns
    const handleFormFieldChange = async (fieldName, value) => {
        console.log('Form field changed:', fieldName, value);
        
        if (fieldName === 'institution') {
            // Fetch courses for this institution
            const { data, error } = await getCoursesByInstitution(value);
            if (!error && data) {
                setFormCourses(data);
            }
            setFormLevels([]);
            setFormProgrammes([]);
            setFormBatches([]);
            setFormClasses([]);
            setFormSubjects([]);
            setFormChapters([]);
        } else if (fieldName === 'course') {
            // Fetch levels for this course
            const { data, error } = await getLevelsByCourse(value);
            if (!error && data) {
                setFormLevels(data);
            }
            setFormProgrammes([]);
            setFormBatches([]);
            setFormClasses([]);
            setFormSubjects([]);
            setFormChapters([]);
        } else if (fieldName === 'level') {
            // Filter programmes by course and level
            const inst = institutions.find(i => i.id === editingCompletion.institution);
            const course = courses.find(c => c.id === editingCompletion.course);
            
            const filteredProgrammes = programmes.filter(p => 
                p.course_id === editingCompletion.course && p.level_id === value
            );
            setFormProgrammes(filteredProgrammes);
            setFormBatches([]);
            setFormClasses([]);
            setFormSubjects([]);
            setFormChapters([]);
        } else if (fieldName === 'programme') {
            // Filter batches by institution, course, level, programme
            const filteredBatches = batches.filter(b => 
                b.institute_id === editingCompletion.institution &&
                b.course_id === editingCompletion.course &&
                b.level_id === editingCompletion.level &&
                b.programme_id === value
            );
            setFormBatches(filteredBatches);
            setFormClasses([]);
            setFormSubjects([]);
            setFormChapters([]);
        } else if (fieldName === 'batch') {
            // Filter classes by batch and teacher assignment
            const filteredClasses = teacherClasses.filter(c => c.batch_id === value);
            setFormClasses(filteredClasses);
            setFormSubjects([]);
            setFormChapters([]);
        } else if (fieldName === 'class') {
            // Get subjects for this class from programme_subjects
            const selectedClass = teacherClasses.find(c => c.id === value);
            if (selectedClass) {
                const programme = programmes.find(p => p.id === selectedClass.programme_id);
                if (programme && programme.programme_subjects) {
                    const subjectIds = programme.programme_subjects.map(ps => ps.subject_id);
                    const classSubjects = subjects.filter(s => subjectIds.includes(s.id));
                    setFormSubjects(classSubjects);
                }
            }
            setFormChapters([]);
        } else if (fieldName === 'subject') {
            // Fetch chapters for this subject
            const { data, error } = await getChaptersBySubject(value);
            if (!error && data) {
                setFormChapters(data);
            }
        }
        
        // Update editingCompletion to track current form values
        setEditingCompletion(prev => ({ ...prev, [fieldName]: value }));
    };

    // Handle form submission
    const handleSaveCompletion = async (formData) => {
        console.log('Submitting course completion:', formData);
        
        try {
            const teacherId = currentTeacher.id || currentTeacher.teacher_id;
            
            const completionData = {
                teacher_id: teacherId,
                institution_id: formData.institution,
                course_id: formData.course,
                level_id: formData.level,
                programme_id: formData.programme,
                batch_id: formData.batch,
                class_id: formData.class,
                subject_id: formData.subject,
                chapter_id: formData.chapter,
                hours_taken: parseFloat(formData.hours_taken),
                status: formData.status,
                submitted_date: new Date().toISOString()
            };
            
            const { data, error } = await createCourseCompletion(completionData);
            
            if (error) {
                alert('Error submitting course completion: ' + error.message);
                console.error('Error:', error);
                return;
            }
            
            alert('Course completion submitted successfully!');
            setIsFormOpen(false);
            
            // Refresh completions
            const { data: updatedCompletions } = await getCourseCompletionsByTeacher(teacherId);
            if (updatedCompletions) {
                setCompletions(updatedCompletions);
            }
        } catch (err) {
            alert('Error submitting course completion: ' + err.message);
            console.error('Error:', err);
        }
    };

    // 3. CONFIGURATION FOR DYNAMIC FORM
    const completionFieldsConfig = useMemo(() => [
        // --- Context Fields (Dropdowns) ---
        { 
            name: 'institution', 
            label: 'Institution', 
            type: 'single-select', 
            options: formInstitutions.map(i => ({ value: i.id, label: i.institute_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'course', 
            label: 'Course', 
            type: 'single-select', 
            options: formCourses.map(c => ({ value: c.id, label: c.course_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'level', 
            label: 'Level', 
            type: 'single-select', 
            options: formLevels.map(l => ({ value: l.id, label: l.level_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'programme', 
            label: 'Programme', 
            type: 'single-select', 
            options: formProgrammes.map(p => ({ value: p.id, label: p.programme_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'batch', 
            label: 'Batch', 
            type: 'single-select', 
            options: formBatches.map(b => ({ value: b.id, label: b.batch_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'class', 
            label: 'Class', 
            type: 'single-select', 
            options: formClasses.map(c => ({ value: c.id, label: c.class_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'subject', 
            label: 'Subject', 
            type: 'single-select', 
            options: formSubjects.map(s => ({ value: s.id, label: s.subject_name })),
            required: true, 
            fullWidth: false
        },
        { 
            name: 'chapter', 
            label: 'Chapter', 
            type: 'single-select', 
            options: formChapters.map(ch => ({ value: ch.id, label: `${ch.chapter_number}. ${ch.chapter_name}` })),
            required: true, 
            fullWidth: false
        },

        // --- User Input Fields ---
        {
            name: 'hours_taken',
            label: 'Hours Completed',
            type: 'number',
            required: true,
            fullWidth: false,
            min: 0,
            step: 0.5
        },
        {
            name: 'status',
            label: 'Status',
            type: 'single-select',
            options: [
                { value: 'Ongoing', label: 'Ongoing' },
                { value: 'Completed', label: 'Completed' }
            ],
            required: true,
            fullWidth: false
        }
    ], [formInstitutions, formCourses, formLevels, formProgrammes, formBatches, formClasses, formSubjects, formChapters]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <h1 className='atm_section-title'>Course Completion Panel</h1>
            
            {loading && <div className="text-center py-4">Loading...</div>}
            
            {!loading && teacherClasses.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">No classes assigned to you yet. Please contact your admin.</p>
                </div>
            )}
            
            {!loading && teacherClasses.length > 0 && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <DynamicTable
                            data={subjectList}
                            columnOrder={['institution', 'course', 'level', 'programme', 'batch', 'class_name', 'subject', 'total_actual_hours', 'total_taken_hours', 'percent_completed']}
                            columnDisplayNameMap={{
                                institution: 'Institute', course: 'Course', level: 'Level', programme: 'Programme', 
                                batch: 'Batch', class_name: 'Class', subject: 'Subject', 
                                total_actual_hours: 'Estimated Hours', total_taken_hours: 'Completed Hours', percent_completed: '% Completed'
                            }}
                            filterDefinitions={filterDefs}
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                            onRowClickable={true}
                            onRowClick={(id) => {
                                setSelectedSubjectId(prev => prev === id ? null : id);
                                setSelectedChapterId(null);
                                setActiveChapterFilters({}); 
                            }}
                            selectedRowId={selectedSubjectId}
                            onSearch={(term) => setSubjectSearch(term)}
                            userRole={userRole}
                            onAddNew={null} 
                            unfilteredData={null}
                            title={'My Subjects'} 
                        />
                    </div>

                    {selectedSubjectId && (
                        <div className="ml-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500 animate-in fade-in slide-in-from-top-2">
                            <DynamicTable
                                data={completionList}
                                columnOrder={['chapterNo', 'chapterName', 'hoursTaken', 'status', 'submittedDate', 'approvedDate', 'rejectionReason']}
                                columnDisplayNameMap={{
                                    chapterNo: 'Chapter No', 
                                    chapterName: 'Chapter Name', 
                                    hoursTaken: 'Hours Taken', 
                                    status: 'Status', 
                                    submittedDate: 'Submitted On',
                                    approvedDate: 'Approved On',
                                    rejectionReason: 'Rejection Reason'
                                }}
                                filterDefinitions={chapterFilterDefs}
                                activeFilters={activeChapterFilters}
                                onFilterChange={(k, v) => setActiveChapterFilters(p => ({...p, [k]: v}))}
                                onSearch={(term) => setChapterSearch(term)}
                                
                                onAddNew={handleAddNewClick}
                                add_new_button_label="Submit Completion"
                                
                                userRole={userRole}
                                onRowClickable={false}
                                unfilteredData={null}
                                title={'Course Completion Records'}
                                customDescription={"** Click '+' button to submit a new course completion. **"}
                                pillColumns={['status']}
                                statusColorMap={CHAPTER_STATUS_COLORS}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Reusable Dynamic Form for Course Completion */}
            <DynamicForm 
                isOpen={isFormOpen}
                mode={formMode}
                fieldsConfig={completionFieldsConfig}
                initialData={editingCompletion}
                onFieldChange={handleFormFieldChange}
                onClose={() => {
                    setIsFormOpen(false);
                    setFormInstitutions([]);
                    setFormCourses([]);
                    setFormLevels([]);
                    setFormProgrammes([]);
                    setFormBatches([]);
                    setFormClasses([]);
                    setFormSubjects([]);
                    setFormChapters([]);
                    setEditingCompletion({});
                }}
                onSubmit={handleSaveCompletion}
            />
        </div>
    );
};

export default TeacherCompletionPage;