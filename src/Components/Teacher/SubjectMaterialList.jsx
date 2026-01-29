import React, { useState, useMemo } from 'react';
import { 
    FiSearch, FiX, FiPlus, FiList, FiGrid, 
    FiCheckCircle, FiTrash2, FiEdit2, FiFileText, 
    FiFile, FiImage, FiLink, FiDownload
} from "react-icons/fi"; 
import MaterialFormModal from './MaterialOverlayForms';
const mockMaterialsData = [
    { id: 10001, subjectId: 'S_Taxation', name: 'Tax Laws Handbook 2024.pdf', type: 'pdf', size: '5.2 MB', uploaded: '2024-08-01', description: 'Latest Tax Amendments', isDownloadable: true, isLink: false, fileName: 'TaxLaws.pdf' },
    { id: 10002, subjectId: 'S_Accounting', name: 'GAAP Principles Overview.docx', type: 'docx', size: '1.1 MB', uploaded: '2024-07-25', description: 'Introduction to GAAP', isDownloadable: true, isLink: false, fileName: 'GAAP.docx' },
    { id: 10003, subjectId: 'S_Accounting', name: 'Financial Statements Guide.xlsx', type: 'xlsx', size: '0.8 MB', uploaded: '2024-08-05', description: 'Excel template for reports', isDownloadable: true, isLink: false, fileName: 'FSG.xlsx' },
    { id: 10004, subjectId: 'S_Law', name: 'Corporate Law Links', type: 'link', size: 'N/A', uploaded: '2024-07-20', description: 'External links to regulatory bodies', isDownloadable: false, isLink: true, link: 'http://example.com/law' },
];

const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
        case 'pdf': return FiFileText;
        case 'docx':
        case 'doc': return FiFile;
        case 'xlsx':
        case 'xls': return FiDownload; // Using download icon for excel/data
        case 'pptx':
        case 'ppt': return FiImage; // Placeholder icon
        case 'link': return FiLink;
        default: return FiFile;
    }
};



// Simplified Mock for Grid View
const ExplorerMaterialView = ({ materials, triggerMaterialEdit, triggerSingleDelete, handleSelectMaterial, selectedMaterials }) => {
    return (
        <div className="mm_explorer-grid">
            {materials.map(material => (
                <div key={material.id} className={`mm_explorer-card ${selectedMaterials.has(material.id) ? 'mm_selected-card' : ''}`}>
                    <div className="mm_card-header">
                        <label className="mm_custom-checkbox">
                            <input 
                                type="checkbox" 
                                checked={selectedMaterials.has(material.id)} 
                                onChange={() => handleSelectMaterial(material.id)} 
                            />
                            <span className="mm_checkmark"></span>
                        </label>
                        <div className="mm_card-actions-top">
                            <button className="mm_action-btn" onClick={() => triggerMaterialEdit(material)}><FiEdit2 size={14} /></button>
                            <button className="mm_action-btn" onClick={() => triggerSingleDelete(material)}><FiTrash2 size={14} /></button>
                        </div>
                    </div>
                    {/* Placeholder content */}
                    {React.createElement(getFileIcon(material.type), { size: 36, className: 'mm_card-icon-main' })}
                    <div className="mm_card-title">{material.name}</div>
                    <div className="mm_card-footer">
                         <span className={`mm_status-badge ${material.isDownloadable ? 'mm_badge-success' : 'mm_badge-danger'}`}>
                            {material.isDownloadable ? 'Downloadable' : 'View Only'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- START SubjectMaterialList Component ---
const SubjectMaterialList = ({ subject, context }) => {
    
    // Filter mock data based on subject prop ID
    const initialMaterials = mockMaterialsData.filter(doc => doc.subjectId === subject.id);
    
    const [materials, setMaterials] = useState(initialMaterials);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [materialToEdit, setMaterialToEdit] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'grid'
    const [selectedMaterials, setSelectedMaterials] = useState(new Set());
    const [isRenaming, setIsRenaming] = useState(null); // ID of material being renamed
    const [renameValue, setRenameValue] = useState('');
    
    // --- Handlers for Materials ---
    const handleAddMaterial = (newMaterialData) => {
        const newDocId = Math.max(...materials.map(m => m.id), 10000) + 1;
        const newMaterial = {
            id: newDocId,
            subjectId: subject.id,
            name: newMaterialData.materialName,
            type: newMaterialData.uploadDetails.type === 'file' 
                ? newMaterialData.uploadDetails.file.split('.').pop() || 'file' 
                : 'link',
            size: newMaterialData.uploadDetails.size || 'N/A',
            uploaded: new Date().toISOString().slice(0, 10),
            description: newMaterialData.description,
            isDownloadable: newMaterialData.isDownloadable,
            isLink: newMaterialData.uploadDetails.type === 'link',
        };
        setMaterials(prev => [newMaterial, ...prev]);
        setSelectedMaterials(new Set()); // Clear selection
    };

    const handleEditMaterial = (updatedMaterial) => {
        setMaterials(prev => prev.map(m => 
            m.id === updatedMaterial.id 
                ? {
                    ...m,
                    name: updatedMaterial.materialName,
                    description: updatedMaterial.description,
                    isDownloadable: updatedMaterial.isDownloadable,
                    type: updatedMaterial.type, // Simplification
                }
                : m
        ));
    };
    
    const handleDeleteMaterial = (id) => {
        setMaterials(prev => prev.filter(m => m.id !== id));
        setIsConfirmModalOpen(false);
        setSelectedMaterials(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };
    
    // --- Handlers for Table UI Actions ---
    const triggerSingleDelete = (material) => {
        setMaterialToDelete(material);
        setIsConfirmModalOpen(true);
    };

    const triggerMaterialEdit = (material) => {
        setMaterialToEdit(material);
        setIsEditModalOpen(true);
    };
    
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setSelectedMaterials(new Set()); 
    };

    // --- Selection Handlers ---
    const handleSelectMaterial = (id) => {
        setSelectedMaterials(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const filteredMaterials = useMemo(() => {
        return materials.filter(material => 
            material.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [materials, searchTerm]);
    
    const handleSelectAll = () => {
        if (selectedMaterials.size === filteredMaterials.length && filteredMaterials.length > 0) {
            setSelectedMaterials(new Set());
        } else {
            setSelectedMaterials(new Set(filteredMaterials.map(m => m.id)));
        }
    };

    const handleDeleteSelected = () => {
        setMaterials(prev => prev.filter(m => !selectedMaterials.has(m.id)));
        setSelectedMaterials(new Set());
    };
    
    // --- Rename Handlers ---
    const startRename = (material) => {
        setIsRenaming(material.id);
        setRenameValue(material.name);
    };

    const saveRename = (materialId) => {
        setMaterials(prev => prev.map(m => 
            m.id === materialId ? { ...m, name: renameValue } : m
        ));
        setIsRenaming(null);
        setRenameValue('');
    };

    // --- Material Table Sub-Component (List View) ---
    const MaterialTable = ({ materials }) => {
        return (
            <div className="mm_table-responsive-container">
                <table className="mm_material-table">
                    <thead>
                        <tr>
                            <th className="mm_checkbox-col">
                                <label className="mm_custom-checkbox">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedMaterials.size === materials.length && materials.length > 0} 
                                        onChange={handleSelectAll} 
                                        disabled={materials.length === 0}
                                    />
                                    <span className="mm_checkmark"></span>
                                </label>
                            </th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded Date</th>
                            <th>Downloadable</th>
                            <th className="mm_actions-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.length > 0 ? (
                            materials.map(material => {
                                const isSelected = selectedMaterials.has(material.id);
                                const isCurrentlyRenaming = isRenaming === material.id;
                                const FileIcon = getFileIcon(material.type);

                                return (
                                    <tr key={material.id} className={isSelected ? 'mm_selected-row' : ''}>
                                        <td className="mm_checkbox-col">
                                            <label className="mm_custom-checkbox">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected} 
                                                    onChange={() => handleSelectMaterial(material.id)}
                                                />
                                                <span className="mm_checkmark"></span>
                                            </label>
                                        </td>
                                        <td className="mm_filename-col" onDoubleClick={() => startRename(material)}>
                                            <FileIcon size={20} className={`mm_file-icon mm_file-icon-${material.type}`} />
                                            {isCurrentlyRenaming ? (
                                                <input
                                                    type="text"
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    onBlur={() => saveRename(material.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveRename(material.id);
                                                        if (e.key === 'Escape') setIsRenaming(null);
                                                    }}
                                                    autoFocus
                                                    className="mm_rename-input"
                                                />
                                            ) : (
                                                <span title={material.description}>{material.name} </span>
                                            )}
                                            {isCurrentlyRenaming && (
                                                <button className="mm_action-btn mm_action-save" onClick={() => saveRename(material.id)} title="Save Rename">
                                                    <FiCheckCircle size={14} />
                                                </button>
                                            )}
                                        </td>
                                        <td><span className="mm_file-extension">{material.type.toUpperCase()}</span></td>
                                        <td>{material.size}</td>
                                        <td>{material.uploaded}</td>
                                        <td>
                                            <span className={`mm_status-badge ${material.isDownloadable ? 'mm_badge-success' : 'mm_badge-danger'}`}>
                                                {material.isDownloadable ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="mm_actions-col">
                                            <div className="mm_table-actions-group">
                                                <button className="mm_action-btn mm_action-edit" onClick={() => triggerMaterialEdit(material)} title="Edit Material">
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button className="mm_action-btn mm_action-delete" onClick={() => triggerSingleDelete(material)} title="Delete Material">
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="mm_empty-state">
                                    <FiFileText size={40} />
                                    <p>No materials uploaded for this subject yet.</p>
                                    <button className="mm_btn-primary" onClick={() => setIsAddModalOpen(true)}>
                                        <FiPlus /> Add First Material
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };
    
    // --- Main Return for SubjectMaterialList ---
    return (
        <div className="mm_material-list-container">
            <div className="mm_section-header-flex">
                <h2 className="mm_section-title-no-border">Materials for {subject.label || subject.name}</h2>
                <div className="mm_actions_group">
                    <div className="mm_subject-search-bar mm_search-bar" style={{width: '250px'}}>
                        <FiSearch className="mm_search-icon" />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        {searchTerm && <FiX className="mm_clear-icon" onClick={() => setSearchTerm('')} />}
                    </div>
                    <button className="add_new_material" onClick={() => setIsAddModalOpen(true)}>
                        <FiPlus /> Add New Material
                    </button>
                </div>
            </div>

            {selectedMaterials.size > 0 && (
                <div className="mm_bulk-actions">
                    <span>{selectedMaterials.size} items selected</span>
                    <button 
                        className="mm_btn-primary mm_btn-danger-outline mm_btn-small" 
                        onClick={handleDeleteSelected}
                    >
                        <FiTrash2 /> Delete Selected
                    </button>
                </div>
            )}
            
            {filteredMaterials.length === 0 && searchTerm ? (
                <div className="mm_empty-state">
                    <FiSearch size={40} />
                    <p>No materials found matching "{searchTerm}".</p>
                </div>
            ) : (
                <>
                    {currentView === 'list' && (
                        <MaterialTable 
                            materials={filteredMaterials} 
                        />
                    )}
                    {currentView === 'grid' && (
                        <ExplorerMaterialView
                            materials={filteredMaterials}
                            triggerMaterialEdit={triggerMaterialEdit}
                            triggerSingleDelete={triggerSingleDelete}
                            handleSelectMaterial={handleSelectMaterial}
                            selectedMaterials={selectedMaterials}
                        />
                    )}
                </>
            )}

            <MaterialFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                context={context}
                onSubmit={handleAddMaterial}
            />

            <MaterialFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                context={context}
                materialData={materialToEdit}
                onEdit={handleEditMaterial}
            />
{/* 
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the material: "${materialToDelete?.name}"? This action cannot be undone.`}
                onConfirm={() => handleDeleteMaterial(materialToDelete.id)}
                onCancel={() => setIsConfirmModalOpen(false)}
            /> */}
        </div>
    );
};

export default SubjectMaterialList;