import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import DynamicForm from "../Reusable/DynamicForm";
import DynamicTable from "../Reusable/DynamicTable";
import CardSlider from "../Reusable/CardSlider";
import '../../Styles/Teacher/TeacherMaterial.css';

// API Imports
import {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial,
    downloadMaterialDocument
} from '../../api/materialsApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getAllLevels } from '../../api/levelsApi';
import { getAllProgrammes } from '../../api/programmesApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllClasses, getClassesByTeacher } from '../../api/classesApi';
import { getAllSubjects } from '../../api/subjectsApi';
import { getAllTeachers } from '../../api/usersApi';

// Material Type Cards Configuration (Teachers can only create Class-Notes and Tasks)
const MATERIAL_TYPES = [
    { id: 'Class-Notes', label: 'Class Notes', description: 'Class-specific notes', canCreate: true },
    { id: 'Tasks', label: 'Tasks', description: 'Student assignments', canCreate: true },
    { id: 'MCP-Materials', label: 'MCP Materials', description: 'Global course materials (View Only)', canCreate: false },
    { id: 'MCP-Notes', label: 'MCP Notes', description: 'Global course notes (View Only)', canCreate: false }
];

// Column configuration
const MATERIAL_COLUMN_ORDER = [
    'id',
    'material_name',
    'material_type',
    'subject',
    'class',
    'batch',
    'uploaded_date',
    'file_size_kb',
    'status',
    'Document'
];

const columnDisplayNameMap = {
    id: 'ID',
    material_name: 'Material Name',
    material_type: 'Type',
    subject: 'Subject',
    class: 'Class',
    batch: 'Batch',
    uploaded_date: 'Uploaded',
    file_size_kb: 'Size (KB)',
    status: 'Status',
    Document: 'File'
};

const TeacherMaterial = ({ userRole }) => {
    // User info from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;

    console.log('📚 TeacherMaterial - User ID:', currentUserId);
    console.log('📋 Material Types:', MATERIAL_TYPES.map(t => `${t.id}: canCreate=${t.canCreate}`));

    // State for hierarchy data
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Teacher-specific data
    const [currentTeacher, setCurrentTeacher] = useState(null);
    const [teacherClasses, setTeacherClasses] = useState([]);

    // State for materials
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');

    // State for cascading selections (for form)
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [selectedProgramme, setSelectedProgramme] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    // Material type selection
    const [selectedMaterialType, setSelectedMaterialType] = useState(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('creation');
    const [formInitialData, setFormInitialData] = useState({});
    const [editingMaterialId, setEditingMaterialId] = useState(null);

    // Sync cascade state with formInitialData for edit mode
    useEffect(() => {
        if (formInitialData.institution_id) setSelectedInstitution(formInitialData.institution_id);
        if (formInitialData.course_id) setSelectedCourse(formInitialData.course_id);
        if (formInitialData.level_id) setSelectedLevel(formInitialData.level_id);
        if (formInitialData.programme_id) setSelectedProgramme(formInitialData.programme_id);
        if (formInitialData.batch_id) setSelectedBatch(formInitialData.batch_id);
        if (formInitialData.class_id) setSelectedClass(formInitialData.class_id);
    }, [formInitialData]);

    // Filter state
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        class_id: '',
        subject_id: ''
    });

    // Fetch hierarchy data on mount
    useEffect(() => {
        const fetchHierarchyData = async () => {
            const [
                institutionsRes,
                coursesRes,
                levelsRes,
                programmesRes,
                batchesRes,
                classesRes,
                subjectsRes,
                teachersRes
            ] = await Promise.all([
                getAllInstitutions(),
                getAllCourses(),
                getAllLevels(),
                getAllProgrammes(),
                getAllBatches(),
                getAllClasses(),
                getAllSubjects(),
                getAllTeachers()
            ]);

            setInstitutions(institutionsRes.data || []);
            setCourses(coursesRes.data || []);
            setLevels(levelsRes.data || []);
            setProgrammes(programmesRes.data || []);
            setBatches(batchesRes.data || []);
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            setTeachers(teachersRes.data || []);
        };

        fetchHierarchyData();
    }, []);

    // Find current teacher and their classes
    useEffect(() => {
        const fetchTeacherClasses = async () => {
            if (teachers.length > 0) {
                const teacher = teachers.find(t => t.user_id === currentUserId);
                console.log('🔍 Found teacher:', teacher);

                if (teacher) {
                    setCurrentTeacher(teacher);

                    const teacherId = teacher.id || teacher.teacher_id;
                    const { data: assignedClasses, error } = await getClassesByTeacher(teacherId);
                    console.log('📚 Teacher classes:', assignedClasses);

                    if (!error && assignedClasses && assignedClasses.length > 0) {
                        setTeacherClasses(assignedClasses);
                    }
                }
            }
        };

        fetchTeacherClasses();
    }, [teachers, currentUserId]);

    // Fetch materials when type is selected or filters change
    useEffect(() => {
        const fetchMaterials = async () => {
            if (!selectedMaterialType) {
                setMaterials([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const filters = {
                    material_type: selectedMaterialType,
                    ...Object.fromEntries(
                        Object.entries(activeFilters).filter(([_, value]) => value !== '')
                    )
                };

                // For Class-Notes and Tasks created by this teacher, add uploaded_by filter
                const isMCPType = selectedMaterialType === 'MCP-Materials' || selectedMaterialType === 'MCP-Notes';
                if (!isMCPType && currentUserId) {
                    filters.uploaded_by = currentUserId;
                }

                const { data, error } = await getAllMaterials(filters);

                if (error) {
                    setError(error.message || 'Failed to fetch materials');
                } else {
                    setMaterials(data || []);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, [selectedMaterialType, activeFilters, currentUserId]);

    // Handlers
    const handleMaterialTypeSelect = (typeId) => {
        console.log('🎯 Selected material type:', typeId);
        const selectedType = MATERIAL_TYPES.find(t => t.id === typeId);
        console.log('🔍 Found type:', selectedType);
        console.log('✅ canCreate:', selectedType?.canCreate);
        
        setSelectedMaterialType(typeId);
        setActiveFilters({
            status: '',
            class_id: '',
            subject_id: ''
        });
    };

    const handleFilterChange = useCallback((column, value) => {
        setActiveFilters(prev => ({ ...prev, [column]: value }));
    }, []);

    const handleOpenAddModal = () => {
        const selectedType = MATERIAL_TYPES.find(t => t.id === selectedMaterialType);

        if (!selectedType?.canCreate) {
            alert(`${selectedType?.label || 'This material type'} can only be created by Super Admin/Admin.`);
            return;
        }

        if (teacherClasses.length === 0) {
            alert('No classes assigned to you. Please contact admin.');
            return;
        }

        setFormInitialData({});
        setEditingMaterialId(null);
        setFormMode('creation');
        setIsFormOpen(true);
    };

    const handleEditMaterial = useCallback(async (row) => {
        if (row.status && row.status !== 'Pending') {
            alert(`Cannot edit material. Only 'Pending' materials can be edited. Current status: ${row.status}`);
            return;
        }

        const { data: fullMaterial, error } = await getMaterialById(row.id);
        if (error) {
            alert('Failed to load material details: ' + error);
            return;
        }

        setFormInitialData(fullMaterial);
        setEditingMaterialId(row.id);
        setFormMode('edition');
        setIsFormOpen(true);
    }, []);

    const handleFormSubmit = async (formData, mode) => {
        setLoading(true);

        try {
            const file = formData.file;
            delete formData.file;

            // Get selected class to extract hierarchy
            const selectedClass = teacherClasses.find(tc => {
                const classObj = tc.class || tc;
                return (classObj.id || classObj.class_id) === formData.class_id;
            });

            if (!selectedClass && mode === 'creation') {
                throw new Error('Selected class not found');
            }

            const classObj = selectedClass?.class || selectedClass;

            const materialData = {
                ...formData,
                material_type: selectedMaterialType,
                uploaded_by: currentUserId,
                institution_id: classObj?.institute_id || classObj?.institution_id,
                course_id: classObj?.course_id,
                level_id: classObj?.level_id,
                programme_id: classObj?.programme_id,
                batch_id: classObj?.batch_id
            };

            if (mode === 'creation') {
                const { data, error } = await createMaterial(materialData, file);
                if (error) throw error;

                setMaterials(prev => [data, ...prev]);
                alert('Material created successfully!');
            } else {
                const { data, error } = await updateMaterial(editingMaterialId, materialData, file);
                if (error) throw error;

                setMaterials(prev => prev.map(m => m.id === editingMaterialId ? data : m));
                alert('Material updated successfully!');
            }

            setIsFormOpen(false);
            setFormInitialData({});
            setEditingMaterialId(null);
            setSelectedInstitution(null);
            setSelectedCourse(null);
            setSelectedLevel(null);
            setSelectedProgramme(null);
            setSelectedBatch(null);
            setSelectedClass(null);
        } catch (err) {
            alert('Error: ' + (err.message || 'Failed to save material'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMaterial = useCallback(async (row) => {
        if (row.status && row.status !== 'Pending') {
            alert('Only Pending materials can be deleted.');
            return;
        }

        if (!window.confirm(`Delete material "${row.material_name}"?`)) return;

        const { error } = await deleteMaterial(row.id);
        if (error) {
            alert('Failed to delete material: ' + error);
        } else {
            setMaterials(prev => prev.filter(m => m.id !== row.id));
            alert('Material deleted successfully!');
        }
    }, []);

    const handleDownloadDocument = useCallback(async (filePath, fileName) => {
        if (!filePath) {
            alert('No document available');
            return;
        }
        const { error } = await downloadMaterialDocument(filePath, fileName);
        if (error) {
            alert('Failed to download document: ' + error);
        }
    }, []);

    // Transform data for table
    const transformedTableData = useMemo(() => {
        return materials.map(material => ({
            ...material,
            id: material.id,
            subject: material.subjects ? `${material.subjects.subject_code} - ${material.subjects.subject_name}` : '-',
            class: material.classes ? material.classes.class_name : '-',
            batch: material.batches ? material.batches.batch_name : '-',
            uploaded_date: material.uploaded_date ? new Date(material.uploaded_date).toLocaleDateString('en-GB') : '-',
            Document: material.file_url ? (
                <button
                    className="DT_action-btn DT_view-doc"
                    title="Download Document"
                    style={{ color: '#2196F3' }}
                    onClick={() => handleDownloadDocument(material.file_path, material.file_name)}
                >
                    <FaDownload size={16} />
                </button>
            ) : '-'
        }));
    }, [materials, handleDownloadDocument]);

    // Filter materials by search text
    const filteredMaterials = useMemo(() => {
        if (!searchText) return transformedTableData;

        const searchLower = searchText.toLowerCase();
        return transformedTableData.filter(material =>
            material.material_name?.toLowerCase().includes(searchLower) ||
            material.description?.toLowerCase().includes(searchLower) ||
            material.subject?.toLowerCase().includes(searchLower)
        );
    }, [transformedTableData, searchText]);

    // Form field configuration with cascading dropdowns
    const getFormFields = () => {
        const fields = [
            {
                name: 'material_name',
                label: 'Material Name',
                type: 'text-enter',
                required: true,
                fullWidth: true,
                placeholder: 'e.g., Chapter 1 Notes'
            },
            {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                required: false,
                fullWidth: true,
                placeholder: 'Brief description'
            }
        ];

        // Get unique institutions from teacher's assigned classes
        const uniqueInstitutions = [...new Set(teacherClasses.map(tc => {
            const classObj = tc.class || tc;
            return classObj.institute_id || classObj.institution_id;
        }))].filter(Boolean);

        // Institution selection
        fields.push({
            name: 'institution_id',
            label: 'Institution',
            type: 'single-select',
            options: institutions
                .filter(i => uniqueInstitutions.includes(i.id))
                .map(i => ({
                    label: i.institute_name,
                    value: i.id
                })),
            required: true,
            fullWidth: true
        });

        // Course selection (filtered by institution)
        if (selectedInstitution || formInitialData.institution_id) {
            const instId = selectedInstitution || formInitialData.institution_id;
            const filteredCourses = [...new Set(teacherClasses
                .filter(tc => {
                    const classObj = tc.class || tc;
                    return (classObj.institute_id || classObj.institution_id) === instId;
                })
                .map(tc => {
                    const classObj = tc.class || tc;
                    return classObj.course_id;
                }))].filter(Boolean);

            fields.push({
                name: 'course_id',
                label: 'Course',
                type: 'single-select',
                options: courses
                    .filter(c => filteredCourses.includes(c.id))
                    .map(c => ({
                        label: c.course_name,
                        value: c.id
                    })),
                required: true,
                fullWidth: true
            });
        }

        // Level selection (filtered by course)
        if (selectedCourse || formInitialData.course_id) {
            const courseId = selectedCourse || formInitialData.course_id;
            const filteredLevels = [...new Set(teacherClasses
                .filter(tc => {
                    const classObj = tc.class || tc;
                    return classObj.course_id === courseId;
                })
                .map(tc => {
                    const classObj = tc.class || tc;
                    return classObj.level_id;
                }))].filter(Boolean);

            fields.push({
                name: 'level_id',
                label: 'Level',
                type: 'single-select',
                options: levels
                    .filter(l => filteredLevels.includes(l.id))
                    .map(l => ({
                        label: l.level_name,
                        value: l.id
                    })),
                required: true,
                fullWidth: true
            });
        }

        // Programme selection (filtered by level)
        if (selectedLevel || formInitialData.level_id) {
            const levelId = selectedLevel || formInitialData.level_id;
            const filteredProgrammes = [...new Set(teacherClasses
                .filter(tc => {
                    const classObj = tc.class || tc;
                    return classObj.level_id === levelId;
                })
                .map(tc => {
                    const classObj = tc.class || tc;
                    return classObj.programme_id;
                }))].filter(Boolean);

            fields.push({
                name: 'programme_id',
                label: 'Programme',
                type: 'single-select',
                options: programmes
                    .filter(p => filteredProgrammes.includes(p.id))
                    .map(p => ({
                        label: p.programme_name,
                        value: p.id
                    })),
                required: true,
                fullWidth: true
            });
        }

        // Batch selection (filtered by programme)
        if (selectedProgramme || formInitialData.programme_id) {
            const programmeId = selectedProgramme || formInitialData.programme_id;
            const filteredBatches = [...new Set(teacherClasses
                .filter(tc => {
                    const classObj = tc.class || tc;
                    return classObj.programme_id === programmeId;
                })
                .map(tc => {
                    const classObj = tc.class || tc;
                    return classObj.batch_id;
                }))].filter(Boolean);

            fields.push({
                name: 'batch_id',
                label: 'Batch',
                type: 'single-select',
                options: batches
                    .filter(b => filteredBatches.includes(b.id))
                    .map(b => ({
                        label: b.batch_name,
                        value: b.id
                    })),
                required: true,
                fullWidth: true
            });
        }

        // Class selection (filtered by all above)
        if (selectedBatch || formInitialData.batch_id) {
            const batchId = selectedBatch || formInitialData.batch_id;
            const filteredClasses = teacherClasses.filter(tc => {
                const classObj = tc.class || tc;
                return classObj.batch_id === batchId;
            });

            fields.push({
                name: 'class_id',
                label: 'Class',
                type: 'single-select',
                options: filteredClasses.map(tc => {
                    const classObj = tc.class || tc;
                    return {
                        label: classObj.class_name,
                        value: classObj.id
                    };
                }),
                required: true,
                fullWidth: true
            });
        }

        // Subject selection (filtered by level and teacher's assigned subjects)
        if (selectedLevel || formInitialData.level_id) {
            const levelId = selectedLevel || formInitialData.level_id;
            const filteredSubjects = subjects.filter(s => s.level_id === levelId);

            fields.push({
                name: 'subject_id',
                label: 'Subject',
                type: 'single-select',
                options: filteredSubjects.map(s => ({
                    label: `${s.subject_code} - ${s.subject_name}`,
                    value: s.id
                })),
                required: true,
                fullWidth: true
            });
        }

        // Date and download settings
        fields.push({
                name: 'start_date',
                label: 'Available From',
                type: 'date-start',
                required: false,
                fullWidth: false
            },
            {
                name: 'end_date',
                label: 'Available Until',
                type: 'date-start',
                required: false,
                fullWidth: false
            },
            {
                name: 'is_downloadable',
                label: 'Downloadable',
                type: 'single-select',
                options: [
                    { label: 'Yes', value: true },
                    { label: 'No', value: false }
                ],
                required: true,
                fullWidth: false
            },
            {
                name: 'file',
                label: 'Upload Document',
                type: 'file-upload',
                required: formMode === 'creation',
                fullWidth: true,
                fileUploadLimit: 10 * 1024 * 1024,
                hintText: "Upload PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX. Max size 10MB.",
                acceptedFileTypes: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
            });

        return fields;
    };

    // Filter definitions for DynamicTable
    const filterDefinitions = useMemo(() => {
        const defs = {
            status: [
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' }
            ]
        };

        if (teacherClasses.length > 0) {
            defs.class_id = [
                { value: '', label: 'All Classes' },
                ...teacherClasses.map(tc => {
                    const classObj = tc.class || tc;
                    return {
                        value: classObj.id || classObj.class_id,
                        label: classObj.class_name || classObj.name
                    };
                })
            ];
        }

        if (subjects.length > 0) {
            defs.subject_id = [
                { value: '', label: 'All Subjects' },
                ...subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))
            ];
        }

        return defs;
    }, [teacherClasses, subjects]);

    // Action props for teachers
    const actionProps = {
        onEdit: handleEditMaterial,
        onDelete: handleDeleteMaterial
    };

    if (loading && !selectedMaterialType) {
        return <div className="TM_teacher-material"><p>Loading...</p></div>;
    }

    return (
        <div className="TM_teacher-material">
            <h1 className="TM_header">My Materials</h1>

            {/* Material Type Selection */}
            <CardSlider
                institutes={new Map(MATERIAL_TYPES.map(type => {
                    const displayName = type.canCreate ? type.label : `${type.label} (View Only)`;
                    console.log(`🎴 Card: ${type.id} -> "${displayName}" (canCreate: ${type.canCreate})`);
                    return [
                        type.id, 
                        { 
                            name: displayName,
                            image: null
                        }
                    ];
                }))}
                title="Material Types"
                icon_title="Materials"
                onSelectInstitute={handleMaterialTypeSelect}
                fromTabOf="Materials"
            />

            {selectedMaterialType && (
                <>
                    <hr className="TM_separator" />

                    {error && <div className="TM_error-message">{error}</div>}

                    {(() => {
                        const selectedType = MATERIAL_TYPES.find(t => t.id === selectedMaterialType);
                        const canCreate = selectedType?.canCreate;
                        const onAddNewHandler = canCreate ? handleOpenAddModal : undefined;
                        
                        console.log('🔧 DynamicTable config:', {
                            selectedMaterialType,
                            selectedType,
                            canCreate,
                            hasOnAddNew: !!onAddNewHandler
                        });
                        
                        return null;
                    })()}

                    <DynamicTable
                        data={filteredMaterials}
                        columnOrder={MATERIAL_COLUMN_ORDER}
                        columnDisplayNameMap={columnDisplayNameMap}
                        title={`${selectedMaterialType} Records`}
                        userRole={userRole}
                        {...actionProps}
                        onSearch={setSearchText}
                        filterDefinitions={filterDefinitions}
                        activeFilters={activeFilters}
                        onFilterChange={handleFilterChange}
                        onAddNew={MATERIAL_TYPES.find(t => t.id === selectedMaterialType)?.canCreate ? handleOpenAddModal : undefined}
                        add_new_button_label={`Upload ${selectedMaterialType}`}
                        customDescription={
                            MATERIAL_TYPES.find(t => t.id === selectedMaterialType)?.canCreate
                                ? `Upload and manage ${selectedMaterialType}`
                                : `View ${selectedMaterialType} (created by Admin)`
                        }
                        pillColumns={['status']}
                    />

                    <DynamicForm
                        key={`form-${isFormOpen}`}
                        isOpen={isFormOpen}
                        mode={formMode}
                        fieldsConfig={getFormFields()}
                        initialData={formInitialData}
                        onClose={() => {
                            setIsFormOpen(false);
                            setEditingMaterialId(null);
                            setFormInitialData({});
                        }}
                        onSubmit={handleFormSubmit}
                        onFieldChange={(fieldName, value) => {
                            // Update cascade state when fields change
                            if (fieldName === 'institution_id') {
                                setSelectedInstitution(value);
                                setFormInitialData(prev => ({ ...prev, institution_id: value, course_id: null, level_id: null, programme_id: null, batch_id: null, class_id: null }));
                            } else if (fieldName === 'course_id') {
                                setSelectedCourse(value);
                                setFormInitialData(prev => ({ ...prev, course_id: value, level_id: null, programme_id: null, batch_id: null, class_id: null }));
                            } else if (fieldName === 'level_id') {
                                setSelectedLevel(value);
                                setFormInitialData(prev => ({ ...prev, level_id: value, programme_id: null, batch_id: null, class_id: null }));
                            } else if (fieldName === 'programme_id') {
                                setSelectedProgramme(value);
                                setFormInitialData(prev => ({ ...prev, programme_id: value, batch_id: null, class_id: null }));
                            } else if (fieldName === 'batch_id') {
                                setSelectedBatch(value);
                                setFormInitialData(prev => ({ ...prev, batch_id: value, class_id: null }));
                            } else if (fieldName === 'class_id') {
                                setSelectedClass(value);
                                setFormInitialData(prev => ({ ...prev, class_id: value }));
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default TeacherMaterial;
