// =========================================================================
// SINGLE FILE CONTAINING:
// 1. CustomDropdown Component
// 2. Reusable ConfirmationModal Component
// 3. MaterialFormModal Component (The main form)
// 4. Required CSS Styles
// =========================================================================

import React, { useState, useEffect } from 'react';
import { 
    FiUpload, FiLink, FiCalendar, FiSave, 
    FiToggleRight, FiToggleLeft, FiChevronDown, FiCheckCircle 
} from "react-icons/fi";
import "../../Styles/SuperAdmin/MaterialsManagement.css";
// NOTE: You must install 'react-datepicker' (npm install react-datepicker)
// and import its CSS globally or in your main component (e.g., import "react-datepicker/dist/react-datepicker.css";)
// For this example, we use a mock DatePicker for demonstration.
// In a real project, replace the mock with the actual library import.
// import DatePicker from 'react-datepicker'; 
const DatePicker = (props) => (
    <input 
        type="datetime-local" 
        className={`mm_input-text mm_datepicker ${props.className || ''}`} 
        onChange={(e) => props.onChange(e.target.value ? new Date(e.target.value) : null)}
        placeholder={props.placeholderText}
    />
);


// --- MOCK COURSE DATA (Used in MaterialFormModal) ---
const COURSE_OPTIONS = [
    { label: 'CA Foundation', value: 'ca_foundation' },
    { label: 'CA Intermediate', value: 'ca_intermeduate' },
    { label: 'CA Advanced', value: 'ca_advanced' },
    { label: 'CMA Intermediate', value: 'cma_intermeduate' },
    { label: 'CMA Advanced', value: 'cma_advanced' },
];


// =========================================================================
// 1. CustomDropdown.jsx
// =========================================================================

/**
 * Custom dropdown component using divs/spans instead of default <select>.
 */
const CustomDropdown = ({ label, options, selectedValue, onSelect, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const selectedOption = options.find(opt => opt.value === selectedValue) || { label: 'Select Course', value: null };

    const handleSelect = (option) => {
        onSelect(option.value);
        setIsOpen(false);
    };

    return (
        <div className={`mm_form-group ${className}`}>
            <label className="mm_form-label">{label}</label>
            <div className="mm_custom-dropdown-container">
                <div 
                    className={`mm_custom-dropdown-header ${isOpen ? 'mm_active' : ''}`} 
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="mm_custom-dropdown-selected-value">{selectedOption.label}</div>
                    <FiChevronDown size={16} className="mm_custom-dropdown-icon" />
                </div>
                {isOpen && (
                    <div className="mm_custom-dropdown-list">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                className="mm_custom-dropdown-item"
                                onClick={() => handleSelect(option)}
                            >
                                {option.label}
                                {option.value === selectedValue && <FiCheckCircle size={16} className="mm_selected-icon" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// =========================================================================
// 2. ConfirmationModal.jsx
// =========================================================================

/**
 * A generic, centered confirmation modal.
 */
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;
    
    return (
        <div className="mm_modal-backdrop">
            <div className="mm_modal-content mm_confirmation-modal">
                <h3 className="mm_modal-title">{title}</h3>
                <p className="mm_modal-message">{message}</p>
                <div className="mm_modal-footer">
                    <button type="button" className="mm_btn-secondary_cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button type="button" className="mm_btn-primary mm_btn-danger" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


// =========================================================================
// 3. MaterialFormModal.jsx
// =========================================================================

/**
 * Modal for adding or editing a Subject Material.
 */
const MaterialFormModal = ({ isOpen, onClose, onSubmit, onEdit, materialData, context }) => {
    
    const isEditMode = !!materialData;
    
    // --- State Initialization ---
    const [formState, setFormState] = useState({
        materialName: materialData?.name || '',
        course: materialData?.course || COURSE_OPTIONS[0].value,
        // Non-editable fields pulled from context or existing data
        batch: context?.selectedBatch?.name || materialData?.batch || 'N/A', 
        subject: context?.selectedSubject?.label || materialData?.subject || 'N/A', 
        
        // Determine initial type (video, file, or url)
        materialType: materialData?.isLink ? 'url' : (materialData?.type === 'video' ? 'video' : 'file'), 
        uploadFile: null,
        driveUrl: materialData?.link || '',
        description: materialData?.description || '',
        isDownloadable: materialData?.isDownloadable ?? true, 
        visibleStartTime: materialData?.visibleStartTime ? new Date(materialData.visibleStartTime) : null,
        visibleEndTime: materialData?.visibleEndTime ? new Date(materialData.visibleEndTime) : null,
    });
    const [errors, setErrors] = useState({});
    const [isConfirming, setIsConfirming] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            // Reset state or re-initialize form fields on open
            setFormState({
                materialName: materialData?.name || '',
                course: materialData?.course || COURSE_OPTIONS[0].value,
                batch: context?.selectedBatch?.name || materialData?.batch || 'N/A', 
                subject: context?.selectedSubject?.label || materialData?.subject || 'N/A', 
                materialType: materialData?.isLink ? 'url' : (materialData?.type === 'video' ? 'video' : 'file'), 
                uploadFile: null,
                driveUrl: materialData?.link || '',
                description: materialData?.description || '',
                isDownloadable: materialData?.isDownloadable ?? true, 
                visibleStartTime: materialData?.visibleStartTime ? new Date(materialData.visibleStartTime) : null,
                visibleEndTime: materialData?.visibleEndTime ? new Date(materialData.visibleEndTime) : null,
            });
            setErrors({});
            setIsConfirming(false);
        }
    }, [isOpen, materialData, context]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        // Clear error for the field being edited
        setErrors(prev => {
            if (prev[field]) {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            }
            return prev;
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const ONE_HUNDRED_MB_BYTES = 104857600;
            if (formState.materialType === 'video' && file.size > ONE_HUNDRED_MB_BYTES) {
                setErrors(prev => ({ ...prev, uploadFile: 'Video file must be under 100 MB.' }));
                handleChange('uploadFile', null);
                e.target.value = null; // Clear file input
            } else {
                handleChange('uploadFile', file);
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formState.materialName.trim()) newErrors.materialName = 'Material Name is required.';
        
        // Check if an upload is needed (for new material, or if editing and replacing an upload/URL)
        const isUploadNeeded = !isEditMode || (isEditMode && formState.materialType !== 'url' && !materialData?.link && !formState.uploadFile);
        const isUrlNeeded = !isEditMode || (isEditMode && formState.materialType === 'url' && !formState.driveUrl.trim());

        if (formState.materialType !== 'url' && isUploadNeeded && !formState.uploadFile) {
            // If in Add mode OR Edit mode, type is file/video, no existing file AND no new file
             newErrors.uploadFile = 'File upload is required or provide an existing file name.';
        }
        if (formState.materialType === 'url' && isUrlNeeded) {
             newErrors.driveUrl = 'Drive URL is required.';
        }
        
        if (formState.visibleStartTime && formState.visibleEndTime && formState.visibleStartTime >= formState.visibleEndTime) {
            newErrors.visibleEndTime = 'End Time must be after Start Time.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Step 1 of Save: Validate and open confirmation
    const handleSave = () => {
        if (!validateForm()) return;
        setIsConfirming(true);
    };
    
    // Step 2 of Save: Execute submit/edit function
    const handleConfirmSave = () => {
        setIsConfirming(false);
        
        const finalData = {
            id: materialData?.id, 
            materialName: formState.materialName,
            course: formState.course,
            batch: formState.batch,
            subject: formState.subject,
            description: formState.description,
            isDownloadable: formState.isDownloadable,
            // Use ISOString for Date objects if they exist
            visibleStartTime: formState.visibleStartTime ? new Date(formState.visibleStartTime).toISOString() : null,
            visibleEndTime: formState.visibleEndTime ? new Date(formState.visibleEndTime).toISOString() : null,
            
            // Abstraction of upload details for the consuming component
            uploadDetails: formState.materialType === 'url' 
                ? { type: 'link', link: formState.driveUrl } 
                : { 
                    type: formState.materialType, // 'video' or 'file'
                    file: formState.uploadFile ? formState.uploadFile.name : materialData?.fileName, 
                    size: formState.uploadFile?.size || materialData?.size,
                },
        };

        if (isEditMode) {
            onEdit(finalData);
        } else {
            onSubmit(finalData);
        }
        
        onClose(); // Close the form modal after submission
    };

    // --- Dynamic Upload Input Render ---
    const renderUploadInput = () => {
        switch (formState.materialType) {
            case 'video':
            case 'file':
                const isVideo = formState.materialType === 'video';
                return (
                    <div className="mm_form-group">
                        <label className="mm_form-label">
                            <FiUpload size={16} /> Upload {isVideo ? 'Video' : 'File'}
                        </label>
                        <input
                            type="file"
                            className={`mm_file-input ${errors.uploadFile ? 'mm_input-error' : ''}`}
                            onChange={handleFileChange}
                            accept={isVideo ? 'video/*' : '*/*'}
                        />
                        <small className="mm_input-hint">
                            {isVideo 
                                ? 'Max 100 MB limit for video files.' 
                                : 'Upload document or image file.'
                            }
                            {isEditMode && !formState.uploadFile && (
                                <span className="mm_edit-hint"> (Existing file: {materialData.fileName})</span>
                            )}
                        </small>
                        {errors.uploadFile && <p className="mm_error-message">{errors.uploadFile}</p>}
                    </div>
                );
            case 'url':
                return (
                    <div className="mm_form-group">
                        <label className="mm_form-label" htmlFor="driveUrl">
                            <FiLink size={16} /> Drive/External URL
                        </label>
                        <input
                            id="driveUrl"
                            type="url"
                            className={`mm_input-text ${errors.driveUrl ? 'mm_input-error' : ''}`}
                            value={formState.driveUrl}
                            onChange={(e) => handleChange('driveUrl', e.target.value)}
                            placeholder="e.g., https://drive.google.com/..."
                        />
                         {errors.driveUrl && <p className="mm_error-message">{errors.driveUrl}</p>}
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="mm_modal-backdrop">
            <div className="mm_modal-content">
                <h3 className="mm_modal-title">{isEditMode ? 'Edit Material' : 'Add New Material'}</h3>
                
                <form className="mm_material-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    
                    {/* ROW 1: Name, Course */}
                    <div className="mm_form-row-2">
                        <div className="mm_form-group">
                            <label className="mm_form-label" htmlFor="materialName">Material Name</label>
                            <input
                                id="materialName"
                                type="text"
                                className={`mm_input-text ${errors.materialName ? 'mm_input-error' : ''}`}
                                value={formState.materialName}
                                onChange={(e) => handleChange('materialName', e.target.value)}
                                placeholder="Enter material name"
                            />
                            {errors.materialName && <p className="mm_error-message">{errors.materialName}</p>}
                        </div>

                        {/* Custom Dropdown for Course */}
                        <CustomDropdown
                            label="Course"
                            options={COURSE_OPTIONS}
                            selectedValue={formState.course}
                            onSelect={(value) => handleChange('course', value)}
                        />
                    </div>
                    
                    {/* ROW 2: Batch (Non-editable), Subject (Non-editable) */}
                    <div className="mm_form-row-2">
                        <div className="mm_form-group">
                            <label className="mm_form-label">Batch</label>
                            <input
                                type="text"
                                className="mm_input-text mm_input-disabled"
                                value={formState.batch}
                                readOnly
                                disabled
                            />
                            <small className="mm_input-hint">Non-editable (e.g., CA Foundation - Apr - 2025)</small>
                        </div>
                        
                        <div className="mm_form-group">
                            <label className="mm_form-label">Subject</label>
                            <input
                                type="text"
                                className="mm_input-text mm_input-disabled"
                                value={formState.subject}
                                readOnly
                                disabled
                            />
                            <small className="mm_input-hint">Non-editable (e.g., Taxation)</small>
                        </div>
                    </div>

                    {/* Material Type Toggle: File/Video vs. URL */}
                    <div className="mm_form-group">
                        <label className="mm_form-label">Material Type</label>
                        <div className="mm_material-type-toggle">
                            <button
                                type="button"
                                className={`mm_toggle-btn ${formState.materialType !== 'url' ? 'mm_active' : ''}`}
                                onClick={() => handleChange('materialType', 'file')}
                            >
                                <FiUpload size={16} /> File Upload (Doc/Image/Video)
                            </button>
                            <button
                                type="button"
                                className={`mm_toggle-btn ${formState.materialType === 'url' ? 'mm_active' : ''}`}
                                onClick={() => handleChange('materialType', 'url')}
                            >
                                <FiLink size={16} /> Drive/External URL
                            </button>
                            
                             {/* Sub-toggle for File/Video */}
                             {formState.materialType !== 'url' && (
                                <div className="mm_file-type-sub-toggle">
                                     <button
                                        type="button"
                                        className={`mm_toggle-btn mm_sub-btn ${formState.materialType === 'file' ? 'mm_active' : ''}`}
                                        onClick={() => handleChange('materialType', 'file')}
                                    >
                                        Document/File
                                    </button>
                                     <button
                                        type="button"
                                        className={`mm_toggle-btn mm_sub-btn ${formState.materialType === 'video' ? 'mm_active' : ''}`}
                                        onClick={() => handleChange('materialType', 'video')}
                                    >
                                        Video
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Conditional Upload/URL Input */}
                    {renderUploadInput()}
                    
                    {/* Description */}
                    <div className="mm_form-group">
                        <label className="mm_form-label" htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className="mm_input-textarea"
                            value={formState.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows="3"
                            placeholder="Provide a brief description of the material..."
                        ></textarea>
                    </div>

                    {/* ROW 4: Visibility Start/End Time */}
                    <div className="mm_form-row-2">
                        <div className="mm_form-group">
                            <label className="mm_form-label">
                                <FiCalendar size={16} /> Visible Start Time
                            </label>
                            <DatePicker
                                selected={formState.visibleStartTime}
                                onChange={(date) => handleChange('visibleStartTime', date)}
                                className="mm_datepicker"
                                placeholderText="Select start date and time"
                            />
                        </div>
                        
                        <div className="mm_form-group">
                            <label className="mm_form-label">
                                <FiCalendar size={16} /> Visible End Time
                            </label>
                            <DatePicker
                                selected={formState.visibleEndTime}
                                onChange={(date) => handleChange('visibleEndTime', date)}
                                className={`mm_datepicker ${errors.visibleEndTime ? 'mm_input-error' : ''}`}
                                placeholderText="Select end date and time"
                            />
                            {errors.visibleEndTime && <p className="mm_error-message">{errors.visibleEndTime}</p>}
                        </div>
                    </div>
                    
                    {/* Downloadable Toggle Button */}
                    <div className="mm_form-group">
                        <label className="mm_form-label">Downloadable Option</label>
                        <div 
                            className={`mm_download-toggle ${formState.isDownloadable ? 'mm_toggle-on' : 'mm_toggle-off'}`} 
                            onClick={() => handleChange('isDownloadable', !formState.isDownloadable)}
                        >
                            <button type="button" className="mm_download-toggle-button">
                                {formState.isDownloadable ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                                <span>{formState.isDownloadable ? 'Downloadable (Students can download)' : 'View Only (No download access)'}</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Modal Footer (Buttons) */}
                    <div className="mm_modal-footer">
                        <button type="button" className="mm_btn-secondary_cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="mm_btn-primary">
                            <FiSave size={16} /> {isEditMode ? 'Save Changes' : 'Add Material'}
                        </button>
                    </div>
                </form>
                
            </div>
            
            {/* Confirmation Modal (Center Popup on Save Click) */}
            <ConfirmationModal
                isOpen={isConfirming}
                title={isEditMode ? "Confirm Edit" : "Confirm Addition"}
                message={`Are you sure you want to ${isEditMode ? 'save changes to' : 'add'} the material: "${formState.materialName}"?`}
                onConfirm={handleConfirmSave}
                onCancel={() => setIsConfirming(false)}
                confirmText={isEditMode ? 'Save' : 'Add'}
            />
        </div>
    );
};

export default MaterialFormModal; // Export the main component

