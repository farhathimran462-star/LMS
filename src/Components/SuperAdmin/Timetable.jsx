import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DynamicTable from "../Reusable/DynamicTable";
import "../../Styles/SuperAdmin/AttendanceManagement.css"; 
import { FiDownload, FiEye, FiX } from "react-icons/fi";

// API Imports
import { getAllInstitutions } from '../../api/institutionsApi';
import { getCoursesByInstitution } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getProgrammesByCourseLevel } from '../../api/programmesApi';
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
        institution: '',
        course: '',
        level: '',
        programme: '',
        batch: '',
        class: ''
    });

    // --- FETCH INITIAL DATA ---
    useEffect(() => {
        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [insData, timetableData] = await Promise.all([
                getAllInstitutions(),
                getAllTimetables({})
            ]);
            
            if (insData.error) throw new Error(insData.error.message);
            if (timetableData.error) throw new Error(timetableData.error.message);
            
            setInstitutions(insData.data || []);
            setTimetables(timetableData.data || []);
        } catch (err) {
            console.error('Error fetching data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch courses when institution is selected
    useEffect(() => {
        if (activeFilters.institution && institutions.length > 0) {
            const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
            if (selectedInst) {
                fetchCourses(selectedInst.id);
            }
        } else {
            setCourses([]);
        }
    }, [activeFilters.institution, institutions]);

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
        if (activeFilters.course && courses.length > 0) {
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            if (selectedCourse) {
                fetchLevels(selectedCourse.id);
            }
        } else {
            setLevels([]);
        }
    }, [activeFilters.course, courses]);

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

    // Fetch programmes when level is selected
    useEffect(() => {
        if (activeFilters.level && levels.length > 0 && courses.length > 0) {
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            if (selectedCourse && selectedLevel) {
                fetchProgrammes(selectedCourse.id, selectedLevel.id);
            }
        } else {
            setProgrammes([]);
        }
    }, [activeFilters.level, levels, courses, activeFilters.course]);

    const fetchProgrammes = async (courseId, levelId) => {
        try {
            const { data, error } = await getProgrammesByCourseLevel(courseId, levelId);
            if (error) throw error;
            setProgrammes(data || []);
        } catch (err) {
            console.error('Error fetching programmes:', err.message);
            setProgrammes([]);
        }
    };

    // Fetch batches when programme is selected
    useEffect(() => {
        if (activeFilters.programme) {
            fetchBatches();
        } else {
            setBatches([]);
        }
    }, [activeFilters.programme]);

    const fetchBatches = async () => {
        try {
            const { data, error } = await getAllBatches();
            if (error) throw error;
            
            // Filter batches by selected filters
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

    // Fetch classes when batch is selected
    useEffect(() => {
        if (activeFilters.batch && batches.length > 0) {
            const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
            if (selectedBatch) {
                fetchClasses(selectedBatch.id);
            }
        } else {
            setClasses([]);
        }
    }, [activeFilters.batch, batches]);

    const fetchClasses = async (batchId) => {
        try {
            const { data, error } = await getAllClasses();
            if (error) throw error;
            const filtered = (data || []).filter(c => c.batch_id === batchId);
            setClasses(filtered);
        } catch (err) {
            console.error('Error fetching classes:', err.message);
            setClasses([]);
        }
    };

    // Handle filter change
    const handleFilterChange = useCallback((key, value) => {
        setActiveFilters(prev => {
            const updated = { ...prev, [key]: value };
            
            // Reset dependent filters when parent changes
            if (key === 'institution') {
                updated.course = '';
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
            } else if (key === 'course') {
                updated.level = '';
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
            } else if (key === 'level') {
                updated.programme = '';
                updated.batch = '';
                updated.class = '';
            } else if (key === 'programme') {
                updated.batch = '';
                updated.class = '';
            } else if (key === 'batch') {
                updated.class = '';
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

        // 1. INSTITUTION
        defs.institution = [
            { value: '', label: 'All Institute' },
            ...institutions.map(inst => ({ 
                value: inst.institute_name, 
                label: inst.institute_name 
            }))
        ];

        // 2. COURSE
        defs.course = [
            { value: '', label: 'All Course' },
            ...courses.map(course => ({ 
                value: course.course_name, 
                label: course.course_name 
            }))
        ];

        // 3. LEVEL
        defs.level = [
            { value: '', label: 'All Level' },
            ...levels.map(level => ({ 
                value: level.level_name, 
                label: level.level_name 
            }))
        ];

        // 4. PROGRAMME
        defs.programme = [
            { value: '', label: 'All Programme' },
            ...programmes.map(prog => ({ 
                value: prog.programme_name, 
                label: prog.programme_name 
            }))
        ];

        // 5. BATCH
        defs.batch = [
            { value: '', label: 'All Batch' },
            ...batches.map(batch => ({ 
                value: batch.batch_name, 
                label: batch.batch_name 
            }))
        ];

        // 6. CLASS
        defs.class = [
            { value: '', label: 'All Class' },
            ...classes.map(cls => ({ 
                value: cls.class_name, 
                label: cls.class_name 
            }))
        ];
        
        return defs;
    }, [institutions, courses, levels, programmes, batches, classes]);

    // --- DATA TRANSFORMATION ---
    const getFilteredTimetableData = useMemo(() => {
        console.log('All timetables:', timetables);
        console.log('Active filters:', activeFilters);
        console.log('Institutions:', institutions);
        console.log('Courses:', courses);
        console.log('Levels:', levels);
        console.log('Programmes:', programmes);
        console.log('Batches:', batches);
        console.log('Classes:', classes);
        
        let data = [...timetables];
        console.log('Initial data copy:', data);
        // Apply filters
        if (activeFilters.institution) {
            const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
            console.log('Selected institution:', selectedInst);
            
            if (selectedInst) {
                data = data.filter(t => t.institute_id === selectedInst.id);
            }
            console.log('Institution filter : ',data);
        }
        if (activeFilters.course) {
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            console.log('Selected course:', selectedCourse);
            if (selectedCourse) {
                data = data.filter(t => t.course_id === selectedCourse.id);
            }
            console.log('course filter : ',data);
        }
        if (activeFilters.level) {
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            console.log('Selected level:', selectedLevel);
            if (selectedLevel) {
                data = data.filter(t => t.level_id === selectedLevel.id);
            }
            console.log('level filter : ',data);
        }
        if (activeFilters.programme) {
            const selectedProgramme = programmes.find(p => p.programme_name === activeFilters.programme);
            console.log('Selected programme:', selectedProgramme);
            if (selectedProgramme) {
                data = data.filter(t => t.programme_id === selectedProgramme.id);
            }
            console.log('programme filter : ',data);
        }
        if (activeFilters.batch) {
            const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
            console.log('Selected batch:', selectedBatch);
            if (selectedBatch) {
                data = data.filter(t => t.batch_id === selectedBatch.id);
            }
            console.log('batch filter : ',data);
        }
        if (activeFilters.class) {
            const selectedClass = classes.find(c => c.class_name === activeFilters.class);
            console.log('Selected class:', selectedClass);
            if (selectedClass) {
                data = data.filter(t => t.class_id === selectedClass.id);
            }
            console.log('class filter : ',data);
        }

        console.log('Filtered data:', data);

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(t => 
                t.timetable_name?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            );
        }

        // Add action buttons
        return data.map(t => ({
            ...t,
            timetable_name: t.timetable_name || 'Untitled',
            start_date: t.start_date || 'N/A',
            end_date: t.end_date || 'N/A',
            file_type: t.file_type?.toUpperCase() || 'N/A',
            uploaded_at: t.uploaded_at ? new Date(t.uploaded_at).toLocaleDateString() : 'N/A',
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
        }));

    }, [timetables, activeFilters, searchQuery, institutions, courses, levels, programmes, batches, classes]);

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
            const selectedInst = institutions.find(i => i.institute_name === activeFilters.institution);
            const selectedCourse = courses.find(c => c.course_name === activeFilters.course);
            const selectedLevel = levels.find(l => l.level_name === activeFilters.level);
            const selectedProgramme = programmes.find(p => p.programme_name === activeFilters.programme);
            const selectedBatch = batches.find(b => b.batch_name === activeFilters.batch);
            const selectedClass = classes.find(c => c.class_name === activeFilters.class);

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

            // Use correct ID field (check both id and institute_id)
            const institutionId = selectedInst.id || selectedInst.institute_id;
            const courseId = selectedCourse.id || selectedCourse.course_id;
            const levelId = selectedLevel.id || selectedLevel.level_id;
            const programmeId = selectedProgramme.id || selectedProgramme.programme_id;
            const batchId = selectedBatch.id || selectedBatch.batch_id;
            const classId = selectedClass.id || selectedClass.class_id;

            console.log('IDs to use:', {
                institutionId,
                courseId,
                levelId,
                programmeId,
                batchId,
                classId
            });

            const metadata = {
                timetable_name: `${selectedClass.class_name} - Timetable`,
                description: 'Uploaded via Timetable Management',
                institution_id: institutionId,
                course_id: courseId,
                level_id: levelId,
                programme_id: programmeId,
                batch_id: batchId,
                class_id: classId,
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
    const columnOrder = ['timetable_name', 'file_type', 'start_date', 'end_date', 'uploaded_at', 'preview', 'download'];
    const columnDisplayNames = {
        timetable_name: 'Timetable Name',
        file_type: 'File Type',
        start_date: 'Start Date',
        end_date: 'End Date',
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