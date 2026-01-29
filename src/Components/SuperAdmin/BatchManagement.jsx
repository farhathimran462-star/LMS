import '../../Styles/SuperAdmin/BatchManagement.css'; 
import '../../Styles/SuperAdmin/UserManagement.css'; 

import React, { useState, useEffect, useMemo } from "react";
import CardSlider from '../Reusable/CardSlider';
// --- Importing consistent React Icons (Fa) ---
import { FaPlusCircle, FaTimes, FaBookOpen, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
 

// --- API IMPORTS ---
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getProgrammesByCourseLevel } from '../../api/programmesApi';
import { getAllBatches } from '../../api/batchesApi';

const BatchManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Database state
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [batches, setBatches] = useState([]);
    
    // Selection state
    const [activeInstitutionId, setActiveInstitutionId] = useState(null);
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [activeLevel, setActiveLevel] = useState(null);
    const [activeProgrammeId, setActiveProgrammeId] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    
    // Prepare institutions data for CardSlider with images
    const institutionsForSlider = useMemo(() => {
        console.log('Raw institutions data:', institutions);
        const mappedData = new Map(institutions.map(inst => {
            console.log('Mapping institution:', { id: inst.id, name: inst.institute_name, photo: inst.photo });
            return [
                inst.id,
                {
                    name: inst.institute_name,
                    image: inst.photo || inst.profilePhoto || ''
                }
            ];
        }));
        console.log('Mapped institutionsForSlider:', Array.from(mappedData.entries()));
        return mappedData;
    }, [institutions]);
    
    // Fetch institutions on mount
    useEffect(() => {
        const fetchInstitutions = async () => {
            setLoading(true);
            const { data, error } = await getAllInstitutions();
            if (!error && data) {
                setInstitutions(data);
            }
            setLoading(false);
        };
        fetchInstitutions();
    }, []);
    
    // Fetch courses on mount
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            const { data, error } = await getAllCourses();
            if (!error && data) {
                setCourses(data);
            }
            setLoading(false);
        };
        fetchCourses();
    }, []);
    
    // Fetch levels when course is selected
    useEffect(() => {
        if (!activeCourseId) {
            setLevels([]);
            return;
        }
        const fetchLevels = async () => {
            setLoading(true);
            console.log('Fetching levels for course:', activeCourseId);
            const { data, error } = await getLevelsByCourse(activeCourseId);
            if (error) {
                console.error('Error fetching levels:', error);
            } else if (data) {
                console.log('Levels fetched:', data);
                setLevels(data);
            }
            setLoading(false);
        };
        fetchLevels();
    }, [activeCourseId]);
    
    // Fetch programmes when level is selected
    useEffect(() => {
        if (!activeCourseId || !activeLevel) {
            setProgrammes([]);
            return;
        }
        const fetchProgrammes = async () => {
            setLoading(true);
            console.log('Fetching programmes for course:', activeCourseId, 'and level id:', activeLevel.id);
            const { data, error } = await getProgrammesByCourseLevel(activeCourseId, activeLevel.id);
            if (error) {
                console.error('Error fetching programmes:', error);
            } else if (data) {
                console.log('Programmes fetched:', data);
                setProgrammes(data);
            } else {
                console.log('No programmes found for this course and level');
            }
            setLoading(false);
        };
        fetchProgrammes();
    }, [activeCourseId, activeLevel]);
    
    // Fetch all batches
    useEffect(() => {
        const fetchBatches = async () => {
            const { data, error } = await getAllBatches();
            if (!error && data) {
                setBatches(data);
            }
        };
        fetchBatches();
    }, []);
    
    // Filter batches by programme
    const filteredBatches = batches.filter(batch => 
        !activeProgrammeId || batch.programme_id === activeProgrammeId
    );

    // Handlers
    const handleInstitutionSelect = (institutionId) => {
        setActiveInstitutionId(institutionId);
        setActiveCourseId(null);
        setActiveLevel(null);
        setActiveProgrammeId(null);
        setSelectedBatch(null);
    };
    
    const handleCourseSelect = (courseId) => {
        setActiveCourseId(courseId);
        setActiveLevel(null);
        setActiveProgrammeId(null);
        setSelectedBatch(null);
    };
    
    const handleLevelSelect = (level) => {
        setActiveLevel(level);
        setActiveProgrammeId(null);
        setSelectedBatch(null);
    };
    
    const handleProgrammeSelect = (programmeId) => {
        setActiveProgrammeId(programmeId);
        setSelectedBatch(null);
    };
    
    const handleBatchSelect = (batch) => {
        setSelectedBatch(batch);
    };

    // --- Render Functions ---
    const BatchForm = () => {
        const selectedProgramme = programmes.find(p => p.id === activeProgrammeId);
        const placeholderName = selectedProgramme ? `${selectedProgramme.programme_name} Batch` : 'New Batch';
        
        return (
            <div className="batch_card-section fade-in" style={{marginBottom: 'var(--space-6)'}}>
                <div className="batch_form-header flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Create New Batch</h3>
                    <button type="button" className="btn-icon text-gray-500 hover:text-red-500" onClick={() => setShowForm(false)}>
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-4 sm:flex-row flex-col">
                        <div className="flex-1">
                            <label htmlFor="batchName" className="input-label">Batch Name</label>
                            <input type="text" id="batchName" placeholder={`e.g., ${placeholderName}`} className="input-text" />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="batchCenter" className="input-label">Center/Location</label>
                            <select id="batchCenter" className="input-select">
                                <option>Main Campus - Pune</option>
                                <option>Virtual/Online</option>
                                <option>Satellite Center - Mumbai</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4 items-end sm:flex-row flex-col">
                        <div className="flex-1">
                            <label htmlFor="batchCapacity" className="input-label">Max Capacity</label>
                            <input type="number" id="batchCapacity" placeholder="e.g., 100" defaultValue="100" className="input-text" />
                        </div>
                        <button className="btn btn-primary btn-lg flex-1">
                            <FaPlusCircle size={18} /> Create Batch
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const BatchCard = ({ batch, isSelected, onClick }) => (
        <div 
            className={`batch_batch-card ${isSelected ? 'selected' : ''} flex-center`} 
            onClick={onClick}
        >
            <FaCalendarAlt size={20} />
            <span className="batch_batch-year-text">{batch.batch_name || 'Batch'}</span>
        </div>
    );



    return (
        <div className="batch_management slide-down">
            {/* Header Section */}
            <div className="batch_um-header">
                <h2 className="page-title text-3xl font-bold">Batch Management</h2>
                <div className="batch_um-actions">

                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        <FaPlusCircle size={18} />
                        <span>{showForm ? "Close Form" : "Create Batch"}</span>
                    </button>
                </div>
            </div>

            {showForm && <BatchForm />}
            
            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <p className="text-lg text-gray-600">Loading data...</p>
                </div>
            ) : (
                <>
                    {/* 1. Institution Selection */}
                    <div className="batch_card-section">
                        <CardSlider
                            title="Institutions"
                            institutes={institutionsForSlider}
                            onSelectInstitute={handleInstitutionSelect}
                            icon_title="Institutions"
                            searchBar={false}
                        />
                    {activeInstitutionId && (
                        <div className="batch_card-section">
                            <h3 className="batch_section-title text-xl font-semibold">Select Course</h3>
                            <div className="batch_master-course-selection">
                                {courses.map(course => (
                                    <div 
                                        key={course.id}
                                        className={`batch_course-card ${activeCourseId === course.id ? 'selected' : ''}`}
                                        onClick={() => handleCourseSelect(course.id)}
                                    >
                                        <FaBookOpen size={24} className="mb-2" />
                                        {course.course_name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Level Selection (shown only when course is selected) */}
                    {activeCourseId && (
                        <div className="batch_card-section">
                            <h3 className="batch_section-title text-xl font-semibold">Select Level</h3>
                            {levels.length > 0 ? (
                                <div className="batch_program-selection-grid">
                                    {levels.map(level => (
                                        <div 
                                            key={level.id}
                                            className={`batch_program-card ${activeLevel?.id === level.id ? 'selected' : ''}`}
                                            onClick={() => handleLevelSelect(level)}
                                        >
                                            <FaMapMarkerAlt size={24} className="text-brand-orange-dark" />
                                            <span className="font-semibold">{level.level_name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="batch_empty-state">No levels available for this course.</p>
                            )}
                        </div>
                    )}

                    {/* 4. Programme Selection (shown only when level is selected) */}
                    {activeLevel && (
                        <div className="batch_card-section">
                            <h3 className="batch_section-title text-xl font-semibold">Select Programme</h3>
                            {programmes.length > 0 ? (
                                <div className="batch_program-selection-grid">
                                    {programmes.map(programme => (
                                        <div 
                                            key={programme.id}
                                            className={`batch_program-card ${activeProgrammeId === programme.id ? 'selected' : ''}`}
                                            onClick={() => handleProgrammeSelect(programme.id)}
                                        >
                                            <FaBookOpen size={24} className="text-brand-orange-dark" />
                                            <span className="font-semibold">{programme.programme_name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="batch_empty-state">No programmes available for this level.</p>
                            )}
                        </div>
                    )}

                    {/* 5. Batch Display (shown only when programme is selected) */}
                    {activeProgrammeId && (
                        <div className="batch_card-section">
                            <h3 className="batch_section-title text-xl font-semibold">Batches</h3>
                            {filteredBatches.length > 0 ? (
                                <div className="batch_program-selection-grid">
                                    {filteredBatches.map(batch => (
                                        <BatchCard
                                            key={batch.id}
                                            batch={batch}
                                            isSelected={selectedBatch?.id === batch.id}
                                            onClick={() => handleBatchSelect(batch)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="batch_empty-state">No batches available for this programme.</p>
                            )}
                        </div>
                    )}

                    {/* 6. Batch Details (shown when a batch is selected) */}
                    {selectedBatch && (
                        <div className="batch_card-section">
                            <h3 className="batch_section-title text-xl font-semibold">Batch Details</h3>
                            <div className="p-6 bg-white rounded-lg shadow">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Batch Name</p>
                                        <p className="font-semibold">{selectedBatch.batch_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Start Date</p>
                                        <p className="font-semibold">{selectedBatch.start_date || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">End Date</p>
                                        <p className="font-semibold">{selectedBatch.end_date || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p className="font-semibold">{selectedBatch.status || 'Active'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BatchManagement;