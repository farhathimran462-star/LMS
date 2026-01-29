import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FaEye, FaDownload } from 'react-icons/fa';
import DynamicForm from "../Reusable/DynamicForm";
import DynamicTable from "../Reusable/DynamicTable";
import CardSlider from "../Reusable/CardSlider";
import '../../Styles/SuperAdmin/MaterialsManagement.css';

// API Imports
import {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterialStatus,
    updateMaterial,
    deleteMaterial,
    downloadMaterialDocument
} from '../../api/materialsApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getAllLevels } from '../../api/levelsApi';
import { getAllProgrammes } from '../../api/programmesApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllClasses } from '../../api/classesApi';
import { getAllSubjects } from '../../api/subjectsApi';

// Material Type Cards Configuration
const MATERIAL_TYPES = [
    { id: 'MCP-Materials', label: 'MCP Materials', description: 'Global course materials', canCreate: true },
    { id: 'MCP-Notes', label: 'MCP Notes', description: 'Global course notes', canCreate: true },
    { id: 'Class-Notes', label: 'Class Notes', description: 'Class-specific notes', canCreate: false },
    { id: 'Tasks', label: 'Tasks', description: 'Student assignments', canCreate: false }
];

// Column configuration for DynamicTable
const MATERIAL_COLUMN_ORDER = [
    'id',
    'material_name',
    'material_type',
    'subject',
    'course',
    'level',
    'institution',
    'uploaded_by_name',
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
    course: 'Course',
    level: 'Level',
    institution: 'Institution',
    uploaded_by_name: 'Uploaded By',
    uploaded_date: 'Uploaded',
    file_size_kb: 'Size (KB)',
    status: 'Status',
    Document: 'File'
};

const MaterialsManagement = ({ userRole }) => {
    // User info from session
    const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = currentUserData.user_id;

    // Role detection
    const isSuperAdminRole = userRole?.toLowerCase().trim() === 'super admin';
    const isAdminRole = userRole?.toLowerCase().trim() === 'admin';

    console.log('📚 MaterialsManagement - Role:', userRole, 'User ID:', currentUserId);

    // State for hierarchy data
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [levels, setLevels] = useState([]);
    const [programmes, setProgrammes] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // State for materials
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    // State for cascading selections (for form)
    const [selectedCourseInForm, setSelectedCourseInForm] = useState(null);
    const [selectedLevelInForm, setSelectedLevelInForm] = useState(null);
    // Material type selection
    const [selectedMaterialType, setSelectedMaterialType] = useState(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('creation');
    const [formInitialData, setFormInitialData] = useState({});
    const [editingMaterialId, setEditingMaterialId] = useState(null);

    // Filter state
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        course_id: '',
        level_id: '',
        subject_id: '',
        institution_id: '',
        programme_id: '',
        batch_id: '',
        class_id: ''
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
                subjectsRes
            ] = await Promise.all([
                getAllInstitutions(),
                getAllCourses(),
                getAllLevels(),
                getAllProgrammes(),
                getAllBatches(),
                getAllClasses(),
                getAllSubjects()
            ]);

            setInstitutions(institutionsRes.data || []);
            setCourses(coursesRes.data || []);
            setLevels(levelsRes.data || []);
            setProgrammes(programmesRes.data || []);
            setBatches(batchesRes.data || []);
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
        };

        fetchHierarchyData();
    }, []);

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
                        Object.entries(activeFilters).filter(([, value]) => value !== '')
                    )
                };

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
    }, [selectedMaterialType, activeFilters]);

    // Handlers
    const handleMaterialTypeSelect = (typeId) => {
        setSelectedMaterialType(typeId);
        setActiveFilters({
            status: '',
            course_id: '',
            level_id: '',
            subject_id: '',
            institution_id: '',
            programme_id: '',
            batch_id: '',
            class_id: ''
        });
    };

    const handleFilterChange = useCallback((column, value) => {
        setActiveFilters(prev => ({ ...prev, [column]: value }));
    }, []);

    const handleOpenAddModal = () => {
        const selectedType = MATERIAL_TYPES.find(t => t.id === selectedMaterialType);
        
        if (!selectedType?.canCreate) {
            alert(`${selectedType?.label || 'This material type'} can only be created by Teachers.`);
            return;
        }

        setFormInitialData({});
        setEditingMaterialId(null);
        setFormMode('creation');
        setIsFormOpen(true);
    };

    const handleEditMaterial = useCallback(async (row) => {
        // Prevent editing Class-Notes and Tasks (only Teachers can edit these)
        if (row.material_type === 'Class-Notes' || row.material_type === 'Tasks') {
            alert('Class Notes and Tasks can only be edited by Teachers.');
            return;
        }

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

            const materialData = {
                ...formData,
                material_type: selectedMaterialType,
                uploaded_by: currentUserId,
                user_role: userRole
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
            setSelectedCourseInForm(null);
            setSelectedLevelInForm(null);
        } catch (err) {
            alert('Error: ' + (err.message || 'Failed to save material'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMaterial = useCallback(async (row) => {
        // Prevent deleting Class-Notes and Tasks (only Teachers can delete these)
        if (row.material_type === 'Class-Notes' || row.material_type === 'Tasks') {
            alert('Class Notes and Tasks can only be deleted by Teachers.');
            return;
        }

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

    const handleApproveMaterial = useCallback(async (id) => {
        const { error } = await updateMaterialStatus(id, 'Approved', currentUserId);
        if (error) {
            alert('Failed to approve material: ' + error);
        } else {
            setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'Approved' } : m));
        }
    }, [currentUserId]);

    const handleRejectMaterial = useCallback(async (id) => {
        const { error } = await updateMaterialStatus(id, 'Rejected', currentUserId);
        if (error) {
            alert('Failed to reject material: ' + error);
        } else {
            setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'Rejected' } : m));
        }
    }, [currentUserId]);

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
            course: material.courses ? material.courses.course_name : '-',
            level: material.levels ? material.levels.level_name : '-',
            institution: material.institutions ? material.institutions.institute_name : 'Global',
            uploaded_by_name: 'User', // TODO: Join with users table
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

    // Form field configuration
    const getFormFields = () => {
        const isMCPType = selectedMaterialType === 'MCP-Materials' || selectedMaterialType === 'MCP-Notes';

        const fields = [
            {
                name: 'material_name',
                label: 'Material Name',
                type: 'text-enter',
                required: true,
                fullWidth: true,
                placeholder: 'e.g., Financial Accounting Chapter 1'
            },
            {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                required: false,
                fullWidth: true,
                placeholder: 'Brief description of the material'
            }
        ];

        // Course selection (cascading)
        fields.push({
            name: 'course_id',
            label: 'Course',
            type: 'single-select',
            options: courses.map(c => ({
                label: c.course_name || c.name,
                value: c.id
            })),
            required: true,
            fullWidth: true
        });

        // Level selection (filtered by course)
        if (selectedCourseInForm || formInitialData.course_id) {
            const courseId = selectedCourseInForm || formInitialData.course_id;
            const filteredLevels = levels.filter(l => l.course_id === courseId);

            fields.push({
                name: 'level_id',
                label: 'Level',
                type: 'single-select',
                options: filteredLevels.map(l => ({
                    label: l.level_name || l.name,
                    value: l.id
                })),
                required: true,
                fullWidth: true
            });
        }

        // Subject selection (filtered by level)
        if (selectedLevelInForm || formInitialData.level_id) {
            const levelId = selectedLevelInForm || formInitialData.level_id;
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

        // For Class-Notes and Tasks (shouldn't reach here for Super Admin/Admin, but keeping for completeness)
        if (!isMCPType) {
            fields.push(
                {
                    name: 'institution_id',
                    label: 'Institution',
                    type: 'single-select',
                    options: institutions.map(i => ({
                        label: i.institute_name,
                        value: i.id
                    })),
                    required: true,
                    fullWidth: true
                },
                {
                    name: 'programme_id',
                    label: 'Programme',
                    type: 'single-select',
                    options: programmes.map(p => ({
                        label: p.programme_name,
                        value: p.id
                    })),
                    required: true,
                    fullWidth: true
                },
                {
                    name: 'batch_id',
                    label: 'Batch',
                    type: 'single-select',
                    options: batches.map(b => ({
                        label: b.batch_name,
                        value: b.id
                    })),
                    required: true,
                    fullWidth: true
                },
                {
                    name: 'class_id',
                    label: 'Class',
                    type: 'single-select',
                    options: classes.map(c => ({
                        label: c.class_name,
                        value: c.id
                    })),
                    required: true,
                    fullWidth: true
                }
            );
        }

        // Access control fields
        fields.push(
            {
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
            }
        );

        // File upload
        fields.push({
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

        if (courses.length > 0) {
            defs.course_id = [
                { value: '', label: 'All Courses' },
                ...courses.map(c => ({ value: c.id, label: c.course_name || c.name }))
            ];
        }

        if (levels.length > 0) {
            defs.level_id = [
                { value: '', label: 'All Levels' },
                ...levels.map(l => ({ value: l.id, label: l.level_name || l.name }))
            ];
        }

        if (subjects.length > 0) {
            defs.subject_id = [
                { value: '', label: 'All Subjects' },
                ...subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.subject_name}` }))
            ];
        }

        return defs;
    }, [courses, levels, subjects]);

    // Action props based on role and material type
    const actionProps = {};
    if (isSuperAdminRole || isAdminRole) {
        // Only allow edit/delete for MCP Materials and MCP Notes (not for Class-Notes and Tasks)
        const canEditDelete = selectedMaterialType === 'MCP-Materials' || selectedMaterialType === 'MCP-Notes';
        
        if (canEditDelete) {
            actionProps.onEdit = handleEditMaterial;
            actionProps.onDelete = handleDeleteMaterial;
        }
        
        // Approve/Reject logic:
        // Super Admin: Can approve/reject all material types
        // Admin: Can only approve/reject Class-Notes and Tasks (NOT MCP-Materials or MCP-Notes)
        const canApproveReject = isSuperAdminRole || 
                                (isAdminRole && (selectedMaterialType === 'Class-Notes' || selectedMaterialType === 'Tasks'));
        
        if (canApproveReject) {
            actionProps.onApprove = handleApproveMaterial;
            actionProps.onReject = handleRejectMaterial;
        }
    }

    if (loading && !selectedMaterialType) {
        return <div className="MM_materials-management"><p>Select a material type to begin...</p></div>;
    }

    return (
        <div className="MM_materials-management">
            <h1 className="MM_header">Materials Management</h1>

            {/* Material Type Selection */}
            <CardSlider
                institutes={new Map(MATERIAL_TYPES.map(type => [
                    type.id, 
                    { 
                        name: `${type.label}${type.canCreate ? '' : ' (View Only)'}`,
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
                    <hr className="MM_separator" />

                    {error && <div className="MM_error-message">{error}</div>}

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
                                : `View ${selectedMaterialType} created by Teachers`
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
                            if (fieldName === 'course_id') {
                                setSelectedCourseInForm(value);
                                setFormInitialData(prev => ({ ...prev, course_id: value, level_id: null, subject_id: null }));
                            } else if (fieldName === 'level_id') {
                                setSelectedLevelInForm(value);
                                setFormInitialData(prev => ({ ...prev, level_id: value, subject_id: null }));
                            }
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default MaterialsManagement;
