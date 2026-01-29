import CardSlider from '../../Components/Reusable/CardSlider';
import React, { useState, useEffect, useMemo, useRef } from "react";
// import institutionsData from '../dummy.json';
// -----------------------

import {
    FiSearch, FiX, FiEdit2, FiPlus, FiTrash2, FiAlertTriangle,
    FiHome, FiStar, FiLayers, FiBookOpen
} from "react-icons/fi";
import DynamicTable from '../Reusable/DynamicTable';
import DynamicForm from "../Reusable/DynamicForm"; // 1. Import DynamicForm

// Remove MOCK_Programme, will use DB data

// Will fetch courses and levels from DB
import { getAllCourses } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getProgrammesByCourseLevel, createProgramme, updateProgramme, updateProgrammeSubjects, getProgrammeSubjects } from '../../api/programmesApi';
import { getSubjectsByLevel } from '../../api/subjectsApi';


// =======================================================
// === 2. DYNAMIC FORM CONFIGURATION ===
// =======================================================
const getProgrammeFormConfig = (availableSubjects = []) => {
    return [
        { 
            name: 'course', 
            label: 'Selected Course', 
            type: 'text-enter', 
            readOnly: true, // Non-editable
            fullWidth: true 
        },
        { 
            name: 'level', 
            label: 'Selected Level', 
            type: 'text-enter', 
            readOnly: true, // Non-editable
            fullWidth: true 
        },
        { 
            name: 'name', 
            label: 'Programme Name', 
            type: 'text-enter', 
            required: true, 
            fullWidth: true,
            hintText: "e.g., Sure Pass 2026"
        },
        { 
            name: 'id', 
            label: 'Programme ID', 
            type: 'text-enter', 
            required: false, // Optional
            hintText: "Optional unique identifier"
        },
        {
            name: 'subjects',
            label: 'Select Subjects',
            type: 'multi-select',
            required: true,
            fullWidth: true,
            options: availableSubjects.map(sub => ({
                label: `${sub.subject_code} - ${sub.subject_name}`,
                value: sub.id
            })),
            hintText: "Select subjects that belong to this programme"
        },
        { 
            name: 'description', 
            label: 'Description', 
            type: 'text-enter', 
            required: false, // Optional
            fullWidth: true,
            hintText: "Brief details about this programme"
        }
    ];
};

// --- Main Programme Component ---
const Programme = ({ userRole }) => {
    // --- DB DATA STATE ---
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [activeLevelId, setActiveLevelId] = useState(null);
    const [programmes, setProgrammes] = useState([]);

    // --- REPLACED: Simple modal state with Object for DynamicForm ---
    const [formModalState, setFormModalState] = useState({
        isOpen: false,
        mode: 'creation',
        data: null,
        oldName: null
    });

    const [ProgrammeearchTerm, setProgrammeearchTerm] = useState("");
    // Removed unused instSearchTerm and courseSearchTerm

    // --- FETCH DB DATA ---
    useEffect(() => {
        const fetchCourses = async () => {
            const { data, error } = await getAllCourses();
            if (!error && data) setCourses(data);
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        if (!activeCourseId) return;
        const fetchLevels = async () => {
            const { data, error } = await getLevelsByCourse(activeCourseId);
            if (!error && data) setLevels(data);
        };
        fetchLevels();
    }, [activeCourseId]);

    useEffect(() => {
        if (!activeCourseId || !activeLevelId) return;
        const fetchProgrammes = async () => {
            const { data, error } = await getProgrammesByCourseLevel(activeCourseId, activeLevelId);
            if (!error && data) setProgrammes(data);
        };
        fetchProgrammes();
    }, [activeCourseId, activeLevelId]);

    useEffect(() => {
        if (!activeLevelId) return;
        const fetchSubjects = async () => {
            const { data, error } = await getSubjectsByLevel(activeLevelId);
            if (!error && data) setSubjects(data);
        };
        fetchSubjects();
    }, [activeLevelId]);

    const coursesRef = useRef(null);
    const levelsRef = useRef(null);
    const ProgrammeRef = useRef(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const courseMap = useMemo(() => new Map(courses.map(course => [course.id, course.course_name])), [courses]);
    const levelMap = useMemo(() => new Map(levels.map(level => [level.id, level.level_name])), [levels]);

    // DERIVED STATE FOR TABLE
    const ProgrammeForSelectedLevel = useMemo(() => {
        return programmes
            .filter(pkg => pkg.programme_name.toLowerCase().includes(ProgrammeearchTerm.toLowerCase()))
            .map((pkg, idx) => ({
                s_no: idx + 1,
                name: pkg.programme_name,
                id: pkg.programme_id,
                description: pkg.description,
                course: pkg.course_id,
                level: pkg.level_id
            }));
    }, [programmes, ProgrammeearchTerm]);


    const scrollToRef = (ref) => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // --- Handlers ---

    const handleCourseCategorySelect = (courseId) => {
        setActiveCourseId(courseId);
        setActiveLevelId(null);
        if (courseId) setTimeout(() => scrollToRef(levelsRef), 100);
    };

    const handleLevelCategorySelect = (levelId) => {
        setActiveLevelId(levelId);
        if (levelId) setTimeout(() => scrollToRef(ProgrammeRef), 100);
    };

    // --- 3. UPDATED ADD/EDIT HANDLERS FOR DYNAMIC FORM ---

    const handleAddPackageClick = () => {
        setFormModalState({
            isOpen: true,
            mode: 'creation',
            data: {
                course: courseMap.get(activeCourseId) || '',
                level: levelMap.get(activeLevelId) || '',
                name: '',
                id: '',
                subjects: [],
                description: ''
            },
            oldName: null
        });
    };

    const handleEditPackageClick = async (pkgRow) => {
        // Fetch existing subjects for this programme
        const programme = programmes.find(p => p.programme_id === pkgRow.id);
        let existingSubjects = [];
        
        if (programme && programme.id) {
            const { data: programmeSubjects } = await getProgrammeSubjects(programme.id);
            if (programmeSubjects) {
                existingSubjects = programmeSubjects.map(ps => ps.subject_id);
            }
        }
        
        setFormModalState({
            isOpen: true,
            mode: 'edition',
            data: {
                course: courseMap.get(activeCourseId) || '',
                level: levelMap.get(activeLevelId) || '',
                name: pkgRow.name,
                id: pkgRow.id || '',
                subjects: existingSubjects,
                description: pkgRow.description || ''
            },
            oldName: pkgRow.name
        });
    };

    // --- 4. UPDATED SUBMIT HANDLER ---
    const handleProgrammeSubmit = async (formData, mode) => {
        if (!activeCourseId || !activeLevelId) {
            console.error("Selection incomplete.");
            return;
        }
        
        console.log('Form data received:', formData);
        console.log('Selected subjects:', formData.subjects);
        
        if (!formData.subjects || formData.subjects.length === 0) {
            alert('Please select at least one subject for this programme.');
            return;
        }
        
        const programmeData = {
            course_id: activeCourseId,
            level_id: activeLevelId,
            programme_name: formData.name.trim(),
            programme_id: formData.id || `PROG_${Date.now()}`,
            description: formData.description || ''
        };
        
        console.log('Programme data to be saved:', programmeData);
        
        try {
            if (mode === 'edition') {
                // Find the programme by programme_id
                const programmeToUpdate = programmes.find(p => p.programme_id === formData.id);
                if (!programmeToUpdate) throw new Error('Programme not found for update.');
                
                // Update programme details
                const { error: updateError } = await updateProgramme(programmeToUpdate.id, programmeData);
                if (updateError) throw updateError;
                
                // Update programme subjects
                console.log('Updating subjects for programme:', programmeToUpdate.id, formData.subjects);
                const { error: subjectsError } = await updateProgrammeSubjects(programmeToUpdate.id, formData.subjects);
                if (subjectsError) throw subjectsError;
                
                alert('Programme updated successfully!');
            } else {
                // Create programme with subjects
                console.log('Creating programme with subjects:', formData.subjects);
                const { data: newProgramme, error } = await createProgramme(programmeData, formData.subjects);
                if (error) {
                    console.error('Error from API:', error);
                    throw error;
                }
                console.log('Programme created successfully:', newProgramme);
                alert('Programme saved successfully!');
            }
            
            // Refresh programmes
            const { data } = await getProgrammesByCourseLevel(activeCourseId, activeLevelId);
            if (data) setProgrammes(data);
            setFormModalState({ isOpen: false, mode: 'creation', data: null, oldName: null });
        } catch (error) {
            console.error('Error in handleProgrammeSubmit:', error);
            alert('Error saving programme: ' + error.message);
        }
    };

    // Removed unused handleDeletePackageClick and old dummy delete logic
    // If you want to implement real delete, add DB logic here


    // --- JSX Rendering ---

    const renderCourseSelection = () => (
        <div ref={coursesRef}>
            <CardSlider
                institutes={courseMap}
                title='Courses'
                icon_title="Courses"
                onSelectInstitute={handleCourseCategorySelect}
            />
        </div>
    );

    const renderLevelSelection = () => activeCourseId && (
        <div ref={levelsRef}>
            <CardSlider
                institutes={levelMap}
                title='Levels'
                icon_title="Levels"
                fromTabOf="Programme"
                onSelectInstitute={handleLevelCategorySelect}
            />
        </div>
    );
        
    const renderProgrammeTable = () => activeLevelId && (
        <div ref={ProgrammeRef}>
            <DynamicTable
                data={ProgrammeForSelectedLevel}
                columnOrder={['s_no', 'name', 'id', 'description']}
                onEdit={handleEditPackageClick}
                onAddNew={handleAddPackageClick}
                onSearch={setProgrammeearchTerm}
                title={'Programme'}
                userRole={userRole}
            />
        </div>
    );


    return (
        <div className="PM_batch_wrapper">
            <h1 className="PM_batch_title">Programme Management Panel</h1>

            {renderCourseSelection()}
            {renderLevelSelection()}
            {(activeCourseId && activeLevelId) && renderProgrammeTable()}

            {/* --- 5. RENDER DYNAMIC FORM --- */}
            {formModalState.isOpen && (
                <DynamicForm
                    isOpen={formModalState.isOpen}
                    mode={formModalState.mode}
                    fieldsConfig={getProgrammeFormConfig(subjects)}
                    initialData={formModalState.data}
                    onClose={() => setFormModalState(prev => ({ ...prev, isOpen: false }))}
                    onSubmit={handleProgrammeSubmit}
                />
            )}

            {/* DELETE CONFIRMATION POPUP */}
            {/* Delete confirmation popup removed: delete logic not implemented */}
        </div>
    );
};

export default Programme;