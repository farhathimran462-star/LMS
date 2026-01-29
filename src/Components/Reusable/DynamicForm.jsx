import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../../Styles/Reusable/DynamicForm.css'; 
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaCamera } from "react-icons/fa"; 

// ===============================================
// 1. Utility Components
// ===============================================

// --- Custom Single Select Dropdown ---
const CustomDropdown = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
  
    const selectedOption = options.find(opt => opt.value === value);
  
    return (
      <div className="DFORM_Dropdown_Wrapper" ref={dropdownRef} style={{width:'100%'}}>
        <div 
          className={`DFORM_Dropdown_Trigger ${isOpen ? 'DFORM_Dropdown_Trigger--Open' : ''} ${!value ? 'DFORM_Dropdown_Trigger--Placeholder' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="DFORM_Dropdown_Label">
            {selectedOption ? selectedOption.label : (placeholder || "Select")}
          </span>
          <span className="DFORM_Dropdown_Arrow">▼</span>
        </div>
        
        {isOpen && (
          <ul className="DFORM_Dropdown_Menu">
            {options.map((option) => (
              <li 
                key={option.value} 
                className={`DFORM_Dropdown_Item ${value === option.value ? 'DFORM_Dropdown_Item--Selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
};

// --- Multi-Select Dropdown ---
const MultiSelectDropdown = ({ options, value = [], onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = (optionValue) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const getTriggerText = () => {
        if (!value || value.length === 0) return placeholder || "Select options";
        const selectedLabels = value.map(v => {
            const opt = options.find(o => o.value === v);
            return opt ? opt.label : v;
        });
        return selectedLabels.join(', ');
    };

    return (
        <div className="DFORM_Dropdown_Wrapper" ref={dropdownRef}>
            <div 
                className={`DFORM_Dropdown_Trigger ${isOpen ? 'DFORM_Dropdown_Trigger--Open' : ''} ${value.length === 0 ? 'DFORM_Dropdown_Trigger--Placeholder' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="DFORM_Dropdown_Label">
                    {getTriggerText()}
                </span>
                <span className="DFORM_Dropdown_Arrow">▼</span>
            </div>

            {isOpen && (
                <div className="DFORM_Dropdown_Menu">
                    {options.map((option) => {
                        const isSelected = value.includes(option.value);
                        return (
                            <div 
                                key={option.value}
                                className={`DFORM_Dropdown_Item ${isSelected ? 'DFORM_Dropdown_Item--Selected' : ''}`}
                                onClick={() => handleToggle(option.value)}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                <input type="checkbox" checked={isSelected} readOnly />
                                <span>{option.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Profile Image Upload Component ---
const ProfileImageUpload = ({ value, onChange, field }) => {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        let objectUrl;
        if (value instanceof File) {
            objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
        } else if (typeof value === 'string' && value.length > 0) {
            setPreview(value);
        } else {
            setPreview(null);
        }
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [value]);

    return (
        <div className="DFORM_Profile_Upload_Container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div 
                className="DFORM_Profile_Circle"
                style={{
                    width: '120px', height: '120px', borderRadius: '50%', border: '3px solid #e0e0e0',
                    overflow: 'hidden', position: 'relative', cursor: 'pointer', backgroundColor: '#f8f9fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={() => document.getElementById(`file-upload-${field.name}`).click()}
            >
                {preview ? (
                    <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ color: '#ccc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FaCamera size={30} />
                        <span style={{ fontSize: '10px', marginTop: '4px' }}>Upload</span>
                    </div>
                )}
            </div>
            <input
                id={`file-upload-${field.name}`} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) onChange(file);
                }}
            />
        </div>
    );
};


// --- UPDATED Repeater Group ---
const RepeaterGroup = ({ subFields, values = [], onChange }) => {
    const [newItem, setNewItem] = useState({});
    const [editingIndex, setEditingIndex] = useState(null);
    const [editTempData, setEditTempData] = useState({});

    // Helper to render correct input based on subField type
    const renderInput = (sub, value, handleChange, isEditMode = false) => {
        if (sub.type === 'single-select') {
            return (
                <CustomDropdown 
                    options={sub.options || []}
                    value={value}
                    onChange={(val) => handleChange(sub.name, val)}
                    placeholder={sub.placeholder || sub.label}
                />
            );
        } else if (sub.type === 'date') {
            return (
                <input
                    type="date"
                    className="DFORM_Input_Date DFORM_Repeater_Input"
                    value={value || ''}
                    onChange={(e) => handleChange(sub.name, e.target.value)}
                />
            );
        } else if (sub.type === 'number') {
            return (
                <input
                    type="number"
                    className="DFORM_Input_Number DFORM_Repeater_Input"
                    placeholder={sub.placeholder}
                    value={value || ''}
                    onChange={(e) => handleChange(sub.name, e.target.value)}
                />
            );
        } else if (sub.type === 'dropdown') {
            // Support 'dropdown' alias for backwards compatibility
            return (
                <CustomDropdown 
                    options={sub.options || []}
                    value={value}
                    onChange={(val) => handleChange(sub.name, val)}
                    placeholder={sub.placeholder || sub.label}
                />
            );
        } else {
            // Default Text
            return (
                <input
                    type="text"
                    className="DFORM_Input_Text DFORM_Repeater_Input"
                    placeholder={sub.placeholder}
                    value={value || ''}
                    onChange={(e) => handleChange(sub.name, e.target.value)}
                />
            );
        }
    };

    // --- Add Logic ---
    const handleNewInputChange = (name, val) => {
        setNewItem(prev => ({ ...prev, [name]: val }));
    };

    const handleAddItem = () => {
        // Basic check: Ensure at least one field has data
        const hasData = Object.values(newItem).some(val => val && String(val).trim() !== '');
        if (!hasData) return;
        onChange([...values, newItem]);
        setNewItem({});
    };

    const handleDeleteItem = (index) => {
        if (editingIndex === index) {
            setEditingIndex(null);
            setEditTempData({});
        }
        const updatedValues = values.filter((_, i) => i !== index);
        onChange(updatedValues);
    };

    // --- Edit Logic ---
    const startEditing = (index) => {
        setEditingIndex(index);
        setEditTempData(values[index]);
    };

    const handleEditChange = (name, val) => {
        setEditTempData(prev => ({ ...prev, [name]: val }));
    };

    const saveEdit = () => {
        const updatedValues = [...values];
        updatedValues[editingIndex] = editTempData;
        onChange(updatedValues);
        setEditingIndex(null);
        setEditTempData({});
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditTempData({});
    };

    return (
        <div className="DFORM_Repeater_Wrapper">
            
            {/* List of Items */}
            {values.map((item, idx) => (
                <div key={idx} className="DFORM_Repeater_Item">
                    {editingIndex === idx ? (
                        // --- EDIT MODE ---
                        <>
                            {subFields.map(sub => (
                                <div key={sub.name} className="DFORM_Repeater_Field" style={{ flex: sub.width ? `0 0 ${sub.width}` : '1' }}>
                                    {renderInput(sub, editTempData[sub.name], handleEditChange, true)}
                                </div>
                            ))}
                            <div className="DFORM_Repeater_Actions">
                                <button type="button" onClick={saveEdit} className="DFORM_Action_Icon DFORM_Icon_Save"><FaCheck /></button>
                                <button type="button" onClick={cancelEdit} className="DFORM_Action_Icon DFORM_Icon_Cancel"><FaTimes /></button>
                            </div>
                        </>
                    ) : (
                        // --- VIEW MODE ---
                        <>
                            {subFields.map(sub => (
                                <span key={sub.name} className="DFORM_Repeater_Text" style={{ flex: sub.width ? `0 0 ${sub.width}` : '1' }}>
                                    {item[sub.name]}
                                </span>
                            ))}
                            <div className="DFORM_Repeater_Actions">
                                <button type="button" onClick={() => startEditing(idx)} className="DFORM_Action_Icon DFORM_Icon_Edit"><FaEdit /></button>
                                <button type="button" onClick={() => handleDeleteItem(idx)} className="DFORM_Action_Icon DFORM_Icon_Delete"><FaTrash /></button>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Input Row for New Item */}
            <div className="DFORM_Repeater_InputRow">
                {subFields.map(sub => (
                    <div key={sub.name} className="DFORM_Repeater_Field" style={{ flex: sub.width ? `0 0 ${sub.width}` : '1' }}>
                        <small className="DFORM_Repeater_Label">{sub.label}</small>
                        {renderInput(sub, newItem[sub.name], handleNewInputChange, false)}
                    </div>
                ))}
                <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="DFORM_Btn_Primary DFORM_Repeater_AddBtn"
                    title="Add Item"
                >
                    <FaPlus />
                </button>
            </div>
        </div>
    );
};


// ===============================================
// 2. Confirmation Modal Component
// ===============================================

const DFORM_ConfirmationModal = ({ isOpen, mode, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const actionText = mode === 'creation' ? 'create' : 'edit';
  const confirmationMessage = `Are you sure you want to ${actionText} this entry?`;
  const title = mode === 'creation' ? 'Confirm Creation' : 'Confirm Edit';

  return (
    <div className="DFORM_Inner_Overlay">
      <div className="DFORM_Confirmation_Box">
        <h4 className="DFORM_Confirmation_Title">{title}</h4>
        <p className="DFORM_Confirmation_Message">{confirmationMessage}</p>
        <div className="DFORM_Confirmation_Actions">
          <button className="DFORM_Btn DFORM_Btn_Secondary" onClick={onCancel}>Cancel</button>
          <button className="DFORM_Btn DFORM_Btn_Primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// 3. Main Dynamic Form Component
// ===============================================

const DynamicForm = ({
  isOpen,
  mode,
  fieldsConfig = [], 
  initialData = {},
  onClose,
  onSubmit,
  onFieldChange, // Add this new prop
}) => {
  const [formData, setFormData] = useState({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  useEffect(() => {
    setFormData(prevFormData => {
      let baseData = {};
      if (Object.keys(initialData).length > 0) {
        baseData = initialData;
      } 

      const newFormData = {};
      fieldsConfig.forEach(field => {
        if (baseData[field.name] !== undefined && baseData[field.name] !== null) {
          newFormData[field.name] = baseData[field.name];
        } else if (prevFormData[field.name] !== undefined && prevFormData[field.name] !== '' && prevFormData[field.name] !== null) {
          // Preserve existing value when fieldsConfig updates (e.g., dynamic dropdown options)
          newFormData[field.name] = prevFormData[field.name];
        } else if (field.type === 'multi-select' || field.type === 'repeater-group') {
          newFormData[field.name] = [];
        } else {
          newFormData[field.name] = '';
        }
      });
      return newFormData;
    });
  }, [mode, initialData, fieldsConfig]); 

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Call the parent's onFieldChange if provided
    if (onFieldChange) {
      onFieldChange(name, value);
    }
  }, [onFieldChange]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const requiredFields = fieldsConfig.filter(f => f.required);
    let isValid = true;
    for (const field of requiredFields) {
        const val = formData[field.name];
        if (!val || (Array.isArray(val) && val.length === 0)) {
            if (val !== 0 && val !== false) {
                alert(`Field "${field.label}" is required.`);
                isValid = false;
                break;
            }
        }
    }

    if (isValid) {
      setIsConfirmationOpen(true);
    }
  };

  const handleConfirmAction = () => {
    setIsConfirmationOpen(false);
    onSubmit(formData, mode);
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'creation' ? 'Create New Entry' : 'Edit Entry';

  return (
    <div className="DFORM_Modal_Overlay">
      <div className="DFORM_Modal_Content">
        <div className="DFORM_Scrollable_Wrapper">
            <div className="DFORM_Modal_Header">
                <h3 className="DFORM_Modal_Title">{modalTitle}</h3>
                <button className="DFORM_Modal_Close" onClick={onClose}>&times;</button>
            </div>

            <form className="DFORM_Form" onSubmit={handleFormSubmit}>
            {fieldsConfig.map((field) => {
                const columnClass = field.fullWidth ? 'DFORM_Column_1' : 'DFORM_Column_2';
                
                // --- SPECIAL HANDLER FOR PROFILE IMAGES ---
                if (field.type === 'file-upload' && field.isProfileImage) {
                    return (
                        <div key={field.name} className="DFORM_Form_Field DFORM_Column_1" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                             <ProfileImageUpload 
                                value={formData[field.name]}
                                onChange={(file) => handleChange(field.name, file)}
                                field={field}
                             />
                        </div>
                    );
                }
                
                // --- STANDARD FIELDS ---
                const fieldProps = {
                    id: field.name,
                    name: field.name,
                    value: formData[field.name] || '',
                    onChange: (e) => handleChange(field.name, e.target.value),
                    disabled: field.readOnly || field.fixed || (mode === 'edition' && field.fixed),
                    readOnly: field.readOnly,
                };

                const commonField = (
                    <>
                        {field.descriptionText && <p className="DFORM_Field_Description">{field.descriptionText}</p>}
                        {field.hintText && <small className="DFORM_Field_Hint">{field.hintText}</small>}
                    </>
                );

                let inputElement;
                switch (field.type) {
                case 'text-enter':
                    inputElement = <input type="text" className={`DFORM_Input_Text ${field.readOnly ? 'DFORM_Input_ReadOnly' : ''}`} maxLength={field.numberLimit} {...fieldProps} required={field.required} />;
                    break;
                case 'number':
                case 'number-limit':
                    inputElement = <input type="number" className="DFORM_Input_Number" max={field.numberLimit} {...fieldProps} required={field.required} />;
                    break;
                case 'textarea':
                    inputElement = <textarea className="DFORM_Input_Text" rows={field.rows || 4} {...fieldProps} required={field.required} />;
                    break;
                case 'date':
                case 'date-start':
                case 'date-end':
                    inputElement = <input type="date" className="DFORM_Input_Date" {...fieldProps} required={field.required} />;
                    break;
                case 'single-select':
                    inputElement = <CustomDropdown options={field.options} value={formData[field.name]} onChange={(val) => handleChange(field.name, val)} placeholder={`Select ${field.label}`} />;
                    break;
                case 'multi-select':
                    inputElement = <MultiSelectDropdown options={field.options} value={formData[field.name]} onChange={(newValues) => handleChange(field.name, newValues)} placeholder={`Select ${field.label}`} />;
                    break;
                case 'repeater-group':
                    inputElement = <RepeaterGroup subFields={field.subFields} values={formData[field.name] || []} onChange={(newValues) => handleChange(field.name, newValues)} />;
                    break;
                case 'display-box':
                    inputElement = <div className="DFORM_DisplayBox"><span className="DFORM_DisplayBox_Icon">{field.icon}</span><span className="DFORM_DisplayBox_Text">{field.displayText}</span></div>;
                    break;
                case 'file-upload':
                    inputElement = (
                        <>
                            {formData[field.name] && (
                                <div className="DFORM_CurrentFile">
                                    <span>{formData[field.name] instanceof File ? formData[field.name].name : (typeof formData[field.name] === 'string' ? formData[field.name].split('/').pop().substring(0, 20) : 'File Uploaded')}</span>
                                    {field.downloadVisibility && typeof formData[field.name] === 'string' && <a href={formData[field.name]} target="_blank" rel="noopener noreferrer" className="DFORM_Download_Btn">Download</a>}
                                </div>
                            )}
                            <input type="file" className="DFORM_Input_File" accept={field.acceptedFileTypes} onChange={(e) => { const file = e.target.files[0]; if (file) handleChange(field.name, file); }} required={field.required && !formData[field.name]} />
                        </>
                    );
                    break;
                case 'time-start':
                case 'time-end':
                    inputElement = <input type="time" className="DFORM_Input_Time" {...fieldProps} required={field.required} />;
                    break;
                case 'week-day':
                    const weekdays = [{ l: 'Monday', v: 'mon' }, { l: 'Tuesday', v: 'tue' }, { l: 'Wednesday', v: 'wed' }, { l: 'Thursday', v: 'thu' }, { l: 'Friday', v: 'fri' }, { l: 'Saturday', v: 'sat' }, { l: 'Sunday', v: 'sun' }];
                    inputElement = (
                        <div className="DFORM_Custom_Select_Container">
                             {weekdays.map(day => (
                                <div key={day.v} className={`DFORM_SelectablePill ${formData[field.name] === day.v ? 'DFORM_SelectablePill--Selected' : ''}`} onClick={() => handleChange(field.name, day.v)}>{day.l}</div>
                            ))}
                        </div>
                    );
                    break;
                default: inputElement = <p>Unknown Field Type: {field.type}</p>;
                }

                return (
                    <div key={field.name} className={`DFORM_Form_Field ${columnClass}`}>
                        <label className="DFORM_Label" htmlFor={field.name}>
                            {field.label} {field.required && <span className="DFORM_Required_Asterisk">*</span>}
                        </label>
                        {inputElement}
                        {commonField}
                    </div>
                );
            })}

            <div className="DFORM_Form_Actions DFORM_Column_1">
                <button type="submit" className="DFORM_Btn DFORM_Btn_Primary">
                    {mode === 'creation' ? 'Create' : 'Save Changes'}
                </button>
            </div>
            </form>
        </div>

        <DFORM_ConfirmationModal
          isOpen={isConfirmationOpen}
          mode={mode}
          onCancel={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmAction}
        />
      </div>
    </div>
  );
};

export default DynamicForm;