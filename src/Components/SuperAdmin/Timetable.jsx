import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DynamicTable from "../Reusable/DynamicTable";
import "../../Styles/SuperAdmin/AttendanceManagement.css"; 
import { FiDownload, FiEye, FiX } from "react-icons/fi";

// API Imports
import { getAllInstitutions } from '../../api/institutionsApi';
import { getCoursesByInstitution, getAllCourses } from '../../api/coursesApi';
import { getLevelsByCourse, getAllLevels } from '../../api/levelsApi';
import { getProgrammesByCourseLevel, getAllProgrammes } from '../../api/programmesApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllClasses } from '../../api/classesApi';
import { uploadTimetable, getAllTimetables, downloadTimetable, deleteTimetable } from '../../api/timetablesApi';
import { supabase } from '../../config/supabaseClient';

// =======================================================
// === PREVIEW MODAL COMPONENT ===
// =======================================================
const TimetablePreview = ({ timetable, onClose }) => {
    const isPDF = timetable.file_type === 'pdf';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(timetable.file_type);

    return (
        <div className="batch_modal" style={{ zIndex: 1000 }}>
            <div className="batch_modal-content" style={{ maxWidth: '90vw', maxHeight: '90vh', width: '900px' }}>
                <div className="batch_modal-header">
                    <h3><FiEye /> Preview: {timetable.timetable_name}</h3>
                    <FiX onClick={onClose} className="batch_close-modal" style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ padding: '20px', maxHeight: '75vh', overflow: 'auto' }}>
                    {isPDF && (
                        <iframe
                            src={timetable.file_url}
                            style={{ width: '100%', height: '70vh', border: 'none' }}
                            title="Timetable PDF Preview"
                        />
                    )}
                    {isImage && (
                        <img
                            src={timetable.file_url}
                            alt={timetable.timetable_name}
                            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                        />
                    )}
                    {!isPDF && !isImage && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Preview not available for {timetable.file_type.toUpperCase()} files.</p>
                            <button 
                                className="batch_btn-primary" 
                                onClick={() => downloadTimetable(timetable.file_path, timetable.file_name)}
                                style={{ marginTop: '20px' }}
                            >
                                <FiDownload /> Download File
                            </button>
                        </div>
                    )}
                </div>
                <div className="batch_modal-actions">
                    <button className="batch_btn-secondary" onClick={onClose}>Close</button>
                    <button 
                        className="batch_btn-primary" 
                        onClick={() => downloadTimetable(timetable.file_path, timetable.file_name)}
                    >
                        <FiDownload /> Download
                    </button>
                </div>
            </div>
        </div>
    );
};

const Timetable = ({ userRole }) => {
    // User info from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;
    
    // Role detection
    const isSuperAdmin = userRole?.toLowerCase().trim() === 'super admin';
    const isAdmin = userRole?.toLowerCase().trim() === 'admin';
    const isTeacher = userRole?.toLowerCase().trim() === 'teacher';

    // State
    const [timetables, setTimetables] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [allLevels, setAllLevels] = useState([]);
    const [allProgrammes, setAllProgrammes] = useState([]);
    const [allBatches, setAllBatches] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewTimetable, setPreviewTimetable] = useState(null);

    // --- UNIFIED FILTER STATE ---
    const [activeFilters, setActiveFilters] = useState({
        institution: '', // will store institution.id
        course: '',      // will store course.id
        level: '',       // will store level.id
        programme: '',   // will store programme.id
        batch: '',       // will store batch.id
        class: ''        // will store class.id
    });

    // --- FETCH INITIAL DATA ---
    useEffect(() => {
        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [insData, timetableData, coursesData, levelsData, programmesData, batchesData, classesData] = await Promise.all([
                getAllInstitutions(),
                getAllTimetables({}),
                getAllCourses(),
                getAllLevels(),
                getAllProgrammes(),
                getAllBatches(),
                getAllClasses()
            ]);
            if (insData.error) throw new Error(insData.error.message);
            if (timetableData.error) throw new Error(timetableData.error.message);
            if (coursesData.error) throw new Error(coursesData.error.message);
            if (levelsData.error) throw new Error(levelsData.error.message);
            if (programmesData.error) throw new Error(programmesData.error.message);
            if (batchesData.error) throw new Error(batchesData.error.message);
            if (classesData.error) throw new Error(classesData.error.message);
            setInstitutions(insData.data || []);
            setTimetables(timetableData.data || []);
            setAllCourses(coursesData.data || []);
            setAllLevels(levelsData.data || []);
            setAllProgrammes(programmesData.data || []);
            setAllBatches(batchesData.data || []);
            setAllClasses(classesData.data || []);
        } catch (err) {
            console.error('Error fetching data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter options based on parent selection, but always show all if no parent is selected
    // Courses: fetch when institution is selected, else clear
    useEffect(() => {
        if (activeFilters.institution && institutions.length > 0) {
            getCoursesByInstitution(activeFilters.institution).then(({ data, error }) => {
                if (error) setCourses([]);
                else setCourses(data || []);
            });
        } else {
            setCourses([]);
        }
    }, [activeFilters.institution, institutions]);

    // Levels: fetch when course is selected, else clear
    useEffect(() => {
        if (activeFilters.course && courses.length > 0) {
            getLevelsByCourse(activeFilters.course).then(({ data, error }) => {
                if (error) setLevels([]);
                else setLevels(data || []);
            });
        } else {
            setLevels([]);
        }
    }, [activeFilters.course, courses]);

    // Programmes: fetch when level is selected, else clear
    useEffect(() => {
        if (activeFilters.level && activeFilters.course && levels.length > 0 && courses.length > 0) {
            getProgrammesByCourseLevel(activeFilters.course, activeFilters.level).then(({ data, error }) => {
                if (error) setProgrammes([]);
                else setProgrammes(data || []);
            });
        } else {
            setProgrammes([]);
        }
    }, [activeFilters.level, activeFilters.course, levels, courses]);

    // Batches: fetch when programme is selected, else clear
    useEffect(() => {
        getAllBatches().then(({ data, error }) => {
            if (error) {
                setBatches([]);
            } else {
                if (activeFilters.programme && programmes.length > 0) {
                    setBatches((data || []).filter(b => b.programme_id === activeFilters.programme));
                } else {
                    setBatches(data || []);
                }
            }
        });
    }, [activeFilters.programme, programmes]);

    // Classes: fetch when batch is selected, else clear
    useEffect(() => {
        if (activeFilters.batch && batches.length > 0) {
            getAllClasses().then(({ data, error }) => {
                if (error) setClasses([]);
                else {
                    setClasses((data || []).filter(c => c.batch_id === activeFilters.batch));
                }
            });
        } else {
            setClasses([]);
        }
    }, [activeFilters.batch, batches]);

    const handleFilterChange = useCallback((key, value) => {
        setActiveFilters(prev => {
            const updated = { ...prev, [key]: value };
            if (key === 'institution') {
                updated.course = '';
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
                setCourses([]);
                setLevels([]);
                setProgrammes([]);
                setBatches([]);
                setClasses([]);
            } else if (key === 'course') {
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
                setLevels([]);
                setProgrammes([]);
                setBatches([]);
                setClasses([]);
            } else if (key === 'level') {
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
                setProgrammes([]);
                setBatches([]);
                setClasses([]);
            } else if (key === 'programme') {
                updated.batch = '';
                updated.class = '';
                setBatches([]);
                setClasses([]);
            } else if (key === 'batch') {
                updated.class = '';
                setClasses([]);
            }
            return updated;
        });
    }, []);

    // Handle search
    const handleSearchChange = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    // Check if upload is allowed
    const showUpload = useMemo(() => {
        const mandatoryFilters = ['institution', 'course', 'level', 'programme', 'batch', 'class'];
        return mandatoryFilters.every(key => activeFilters[key] !== '');
    }, [activeFilters]);

    // --- FILTER DEFINITIONS ---
    const timetableFilterDefinitions = useMemo(() => {
        const defs = {};
        defs.institution = [
            { value: '', label: 'All Institute' },
            ...institutions.map(inst => ({
                value: inst.id,
                label: inst.institute_name
            }))
        ];
        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({
                value: course.id,
                label: course.course_name
            }))
        ];
        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({
                value: level.id,
                label: level.level_name
            }))
        ];
        defs.programme = [
            { value: '', label: 'All Programme' },
            ...programmes.map(prog => ({
                value: prog.id,
                label: prog.programme_name
            }))
        ];
        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({
                value: batch.id,
                label: batch.batch_name
            }))
        ];
        defs.class = [
            { value: '', label: 'All Class' },
            ...classes.map(cls => ({
                value: cls.id,
                label: cls.class_name
            }))
        ];
        return defs;
    }, [institutions, courses, levels, programmes, batches, classes]);

    // --- DATA TRANSFORMATION ---
    const getFilteredTimetableData = useMemo(() => {
        let data = [...timetables];
        // Debug: log IDs and types
        console.log(data);
        console.log('Timetable filter - activeFilters:', activeFilters);
        console.log('Timetable data sample:', data[0]);
        if (activeFilters.institution && activeFilters.institution !== '') {
            data = data.filter(t => String(t.institute_id) === String(activeFilters.institution));
        }
        if (activeFilters.course && activeFilters.course !== '') {
            data = data.filter(t => String(t.course_id) === String(activeFilters.course));
        }
        if (activeFilters.level && activeFilters.level !== '') {
            data = data.filter(t => String(t.level_id) === String(activeFilters.level));
        }
        if (activeFilters.programme && activeFilters.programme !== '') {
            data = data.filter(t => String(t.programme_id) === String(activeFilters.programme));
        }
        if (activeFilters.batch && activeFilters.batch !== '') {
            data = data.filter(t => String(t.batch_id) === String(activeFilters.batch));
        }
        if (activeFilters.class && activeFilters.class !== '') {
            data = data.filter(t => String(t.class_id) === String(activeFilters.class));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(t => 
                t.timetable_name?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Debug: log filtered data
        console.log('Filtered timetable data:', data);

        return data.map(t => {
            const institutionName = institutions.find(i => String(i.id) === String(t.institute_id))?.institute_name || '';
            // Use allCourses for table mapping to avoid empty course values
            const courseName = (allCourses || []).find(c => String(c.id) === String(t.course_id))?.course_name || '';
            // Use allLevels and allProgrammes for table mapping
            const levelName = (allLevels || []).find(l => String(l.id) === String(t.level_id))?.level_name || '';
            const programmeName = (allProgrammes || []).find(p => String(p.id) === String(t.programme_id))?.programme_name || '';
            // Use allBatches and allClasses for table mapping to avoid empty values
            const batchName = (allBatches || []).find(b => String(b.id) === String(t.batch_id))?.batch_name || '';
            const className = (allClasses || []).find(c => String(c.id) === String(t.class_id))?.class_name || '';
            return {
                ...t,
                timetable_name: t.timetable_name || 'Untitled',
                institution: institutionName,
                course: courseName,
                level: levelName,
                programme: programmeName,
                batch: batchName,
                class: className,
                preview: (
                    <button 
                        className="batch_btn-secondary" 
                        style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setPreviewTimetable(t);
                        }}
                    >
                        <FiEye /> Preview
                    </button>
                ),
                download: (
                    <button 
                        className="batch_btn-primary" 
                        style={{ padding: '5px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await downloadTimetable(t.file_path, t.file_name);
                            } catch (error) {
                                alert('Error downloading file: ' + error.message);
                            }
                        }}
                    >
                        <FiDownload /> Download
                    </button>
                )
            };
        });
    }, [timetables, activeFilters, searchQuery, institutions, courses, allLevels, allProgrammes, batches, classes]);

    // Handle delete
    const handleDelete = async (timetableRow) => {
        if (window.confirm('Are you sure you want to delete this timetable?')) {
            const { error } = await deleteTimetable(timetableRow.id);
            if (error) {
                alert('Error deleting timetable: ' + error.message);
            } else {
                setTimetables(prev => prev.filter(t => t.id !== timetableRow.id));
                alert('Timetable deleted successfully!');
            }
        }
    };

    // Handle file upload
    const handleFileUpload = async (file) => {
        if (!showUpload) {
            alert('Please select all filters before uploading');
            return;
        }

        setLoading(true);
        try {
            // Find selected objects by ID
            const selectedInst = institutions.find(i => i.id === activeFilters.institution);
            const selectedCourse = courses.find(c => c.id === activeFilters.course);
            const selectedLevel = levels.find(l => l.id === activeFilters.level);
            const selectedProgramme = programmes.find(p => p.id === activeFilters.programme);
            const selectedBatch = batches.find(b => b.id === activeFilters.batch);
            const selectedClass = classes.find(c => c.id === activeFilters.class);

            console.log('Selected Institution:', selectedInst);
            console.log('Selected Course:', selectedCourse);
            console.log('Selected Level:', selectedLevel);
            console.log('Selected Programme:', selectedProgramme);
            console.log('Selected Batch:', selectedBatch);
            console.log('Selected Class:', selectedClass);

            // Validate all selections
            if (!selectedInst || !selectedCourse || !selectedLevel || !selectedProgramme || !selectedBatch || !selectedClass) {
                alert('Error: Could not find selected values. Please try selecting filters again.');
                return;
            }

            const metadata = {
                timetable_name: `${selectedClass.class_name} - Timetable`,
                description: 'Uploaded via Timetable Management',
                institution_id: selectedInst.id,
                course_id: selectedCourse.id,
                level_id: selectedLevel.id,
                programme_id: selectedProgramme.id,
                batch_id: selectedBatch.id,
                class_id: selectedClass.id,
                start_date: new Date().toISOString().split('T')[0],
                end_date: null,
                uploaded_by: currentUserId
            };

            console.log('Upload Metadata:', metadata);

            const { error } = await uploadTimetable(metadata, file);
            
            if (error) throw error;

            alert('Timetable uploaded successfully!');
            await fetchInitialData(); // Refresh data
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading timetable: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Column configuration
    const columnOrder = ['timetable_name', 'institution', 'course', 'level', 'programme', 'batch', 'class', 'preview', 'download'];
    const columnDisplayNames = {
        timetable_name: 'Timetable Name',
        institution: 'Institute',
        course: 'Course',
        level: 'Level',
        programme: 'Programme',
        batch: 'Batch',
        class: 'Class',
        uploaded_at: 'Uploaded On',
        preview: 'Preview',
        download: 'Download'
    };

    return (
        <div className="batches-wrapper">
            <h1 className="batch_title">Timetable Management</h1>

            <DynamicTable
                title="Timetables"
                data={getFilteredTimetableData}
                columnOrder={columnOrder}
                columnDisplayNameMap={columnDisplayNames}
                
                filterDefinitions={timetableFilterDefinitions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                
                customDescription={
                    isSuperAdmin || isAdmin 
                        ? "Select all filters to upload timetables. Use Preview button to view files before downloading."
                        : null
                }
                
                onAddNew={null} // Disable standard Add New
                onFileUpload={showUpload && (isSuperAdmin || isAdmin) ? handleFileUpload : null}
                onDelete={isSuperAdmin || isAdmin ? handleDelete : null}
                
                unfilteredData={timetables} 
                userRole={userRole}
                onSearch={handleSearchChange}
            />

            {/* Preview Modal */}
            {previewTimetable && (
                <TimetablePreview 
                    timetable={previewTimetable}
                    onClose={() => setPreviewTimetable(null)}
                />
            )}

            {loading && <div>Loading...</div>}
        </div>
    );
};

export default Timetable;