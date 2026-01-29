import React, { useState, useMemo, useEffect } from 'react';
import { FaDownload, FaEye } from 'react-icons/fa';
import DynamicTable from "../Reusable/DynamicTable";
import CardSlider from "../Reusable/CardSlider";
import '../../Styles/Student/StudentMaterial.css';

// API Imports
import {
    getMaterialsByStudent,
    downloadMaterialDocument
} from '../../api/materialsApi';
import { getStudentById } from '../../api/usersApi';
import { getAllSubjects } from '../../api/subjectsApi';
import { getAllClasses } from '../../api/classesApi';

// Material Type Cards Configuration (All View Only for Students)
const MATERIAL_TYPES = [
    { id: 'MCP-Materials', label: 'MCP Materials', description: 'Course materials' },
    { id: 'MCP-Notes', label: 'MCP Notes', description: 'Course notes' },
    { id: 'Class-Notes', label: 'Class Notes', description: 'Class notes from teachers' },
    { id: 'Tasks', label: 'Tasks', description: 'Assignments' }
];

// Column configuration
const MATERIAL_COLUMN_ORDER = [
    'id',
    'material_name',
    'material_type',
    'subject',
    'class',
    'uploaded_date',
    'file_size_kb',
    'Document'
];

const columnDisplayNameMap = {
    id: 'ID',
    material_name: 'Material Name',
    material_type: 'Type',
    subject: 'Subject',
    class: 'Class',
    uploaded_date: 'Uploaded',
    file_size_kb: 'Size (KB)',
    Document: 'File'
};

const StudentMaterial = ({ userRole }) => {
    // User info from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;

    console.log('📚 StudentMaterial - User ID:', currentUserId);

    // State for student data
    const [studentData, setStudentData] = useState(null);

    // State for materials
    const [allMaterials, setAllMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Lookup data
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);

    // Material type selection
    const [selectedMaterialType, setSelectedMaterialType] = useState(null);

    // Filter state
    const [activeFilters, setActiveFilters] = useState({
        subject_id: ''
    });

    // Fetch lookup data and student data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch lookup data
                const [subjectsRes, classesRes, studentRes] = await Promise.all([
                    getAllSubjects(),
                    getAllClasses(),
                    getStudentById(currentUserId)
                ]);

                if (subjectsRes.data) setSubjects(subjectsRes.data);
                if (classesRes.data) setClasses(classesRes.data);
                
                if (studentRes.error) {
                    setError('Failed to fetch student information');
                    return;
                }

                console.log('🎓 Student data:', studentRes.data);
                setStudentData(studentRes.data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchInitialData();
    }, [currentUserId]);

    // Fetch materials when student data is loaded
    useEffect(() => {
        const fetchMaterials = async () => {
            if (!studentData) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Extract hierarchy from classes object if not directly available
                const course_id = studentData.course_id || studentData.classes?.course_id;
                const level_id = studentData.level_id || studentData.classes?.level_id;
                const programme_id = studentData.programme_id || studentData.classes?.programme_id;
                const batch_id = studentData.batch_id || studentData.classes?.batch_id;
                const class_id = studentData.class_id;

                console.log('🎓 Student hierarchy for materials:', {
                    course_id,
                    level_id,
                    programme_id,
                    batch_id,
                    class_id
                });

                // Fetch materials filtered by student's class/course/level
                const { data, error } = await getMaterialsByStudent({
                    course_id,
                    level_id,
                    programme_id,
                    batch_id,
                    class_id
                });

                if (error) {
                    setError(error.message || 'Failed to fetch materials');
                } else {
                    console.log('📚 Materials fetched for student:', data?.length, 'materials');
                    console.log('Materials:', data);
                    setAllMaterials(data || []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, [studentData]);

    // Handlers
    const handleMaterialTypeSelect = (typeId) => {
        setSelectedMaterialType(typeId);
        setActiveFilters({ subject_id: '' });
    };

    const handleFilterChange = (column, value) => {
        setActiveFilters(prev => ({ ...prev, [column]: value }));
    };

    const handleDownloadDocument = async (filePath, fileName) => {
        if (!filePath) {
            alert('No document available');
            return;
        }
        const { error } = await downloadMaterialDocument(filePath, fileName);
        if (error) {
            alert('Failed to download document: ' + error);
        }
    };

    const handlePreviewDocument = (fileUrl) => {
        if (!fileUrl) {
            alert('No document available for preview');
            return;
        }
        window.open(fileUrl, '_blank');
    };

    // Filter materials by selected type
    const filteredByType = useMemo(() => {
        if (!selectedMaterialType) return [];
        return allMaterials.filter(m => m.material_type === selectedMaterialType);
    }, [allMaterials, selectedMaterialType]);

    // Apply additional filters
    const filteredMaterials = useMemo(() => {
        let filtered = [...filteredByType];

        if (activeFilters.subject_id) {
            filtered = filtered.filter(m => m.subject_id === activeFilters.subject_id);
        }

        return filtered;
    }, [filteredByType, activeFilters]);

    // Create lookup maps
    const subjectMap = useMemo(() => {
        const map = {};
        subjects.forEach(s => {
            map[s.id] = `${s.subject_code} - ${s.subject_name}`;
        });
        return map;
    }, [subjects]);

    const classMap = useMemo(() => {
        const map = {};
        classes.forEach(c => {
            map[c.id] = c.class_name;
        });
        return map;
    }, [classes]);

    // Transform data for table
    const transformedTableData = useMemo(() => {
        return filteredMaterials.map(material => ({
            ...material,
            id: material.id,
            subject: material.subject_id ? (subjectMap[material.subject_id] || '-') : '-',
            class: material.class_id ? (classMap[material.class_id] || '-') : (material.material_type?.startsWith('MCP') ? 'All Classes' : '-'),
            uploaded_date: material.uploaded_date ? new Date(material.uploaded_date).toLocaleDateString('en-GB') : '-',
            Document: material.file_url ? (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                        className="DT_action-btn DT_view-doc"
                        title="Preview Document"
                        style={{ color: '#2196F3' }}
                        onClick={() => handlePreviewDocument(material.file_url)}
                    >
                        <FaEye size={16} />
                    </button>
                    {material.is_downloadable && (
                        <button
                            className="DT_action-btn DT_download-doc"
                            title="Download Document"
                            style={{ color: '#4CAF50' }}
                            onClick={() => handleDownloadDocument(material.file_path, material.file_name)}
                        >
                            <FaDownload size={16} />
                        </button>
                    )}
                </div>
            ) : '-'
        }));
    }, [filteredMaterials, subjectMap, classMap]);

    // Filter by search text
    const searchedMaterials = useMemo(() => {
        if (!searchText) return transformedTableData;

        const searchLower = searchText.toLowerCase();
        return transformedTableData.filter(material =>
            material.material_name?.toLowerCase().includes(searchLower) ||
            material.description?.toLowerCase().includes(searchLower) ||
            material.subject?.toLowerCase().includes(searchLower)
        );
    }, [transformedTableData, searchText]);

    // Filter definitions for DynamicTable
    const filterDefinitions = useMemo(() => {
        const defs = {};

        // Get unique subjects from filtered materials
        const uniqueSubjects = [...new Set(filteredByType.map(m => m.subject_id).filter(Boolean))];
        const subjectOptions = uniqueSubjects
            .map(subjectId => {
                const subject = subjects.find(s => s.id === subjectId);
                return subject ? {
                    value: subjectId,
                    label: `${subject.subject_code} - ${subject.subject_name}`
                } : null;
            })
            .filter(Boolean);

        if (subjectOptions.length > 0) {
            defs.subject_id = [
                { value: '', label: 'All Subjects' },
                ...subjectOptions
            ];
        }

        return defs;
    }, [filteredByType, subjects]);

    // Count materials by type for card badges
    const materialCounts = useMemo(() => {
        const counts = {};
        MATERIAL_TYPES.forEach(type => {
            counts[type.id] = allMaterials.filter(m => m.material_type === type.id).length;
        });
        return counts;
    }, [allMaterials]);

    if (loading) {
        return <div className="SM_student-material"><p>Loading materials...</p></div>;
    }

    if (error) {
        return <div className="SM_student-material"><p className="SM_error">{error}</p></div>;
    }

    return (
        <div className="SM_student-material">
            <h1 className="SM_header">My Study Materials</h1>


            {/* Material Type Selection */}
            <CardSlider
                institutes={new Map(MATERIAL_TYPES.map(type => [
                    type.id, 
                    { 
                        name: `${type.label} (${materialCounts[type.id] || 0} items)`,
                        image: null
                    }
                ]))}
                title="Material Types"
                icon_title="Materials"
                onSelectInstitute={handleMaterialTypeSelect}
                fromTabOf="Materials"
            />

            {selectedMaterialType && (
                <>
                    <hr className="SM_separator" />

                    {searchedMaterials.length === 0 ? (
                        <div className="SM_empty-state">
                            <p>No {selectedMaterialType} available for your class yet.</p>
                        </div>
                    ) : (
                        <DynamicTable
                            data={searchedMaterials}
                            columnOrder={MATERIAL_COLUMN_ORDER}
                            columnDisplayNameMap={columnDisplayNameMap}
                            title={`${selectedMaterialType} (${searchedMaterials.length})`}
                            userRole={userRole}
                            onSearch={setSearchText}
                            filterDefinitions={filterDefinitions}
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                            customDescription={`View and download ${selectedMaterialType} for your class`}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default StudentMaterial;
