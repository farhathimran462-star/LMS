// ExpenseFormModal.js
import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import '../../Styles/SuperAdmin/ExpenseApprovalForm.css'; // Assuming common styles now includes table CSS

// Field Configuration based on the uploaded image
const EXPENSE_FORM_FIELDS = [
    { name: 'teacherName', label: 'Teacher Name', type: 'Text', example: 'CA Ramesh Kumar', required: true },
    { name: 'employeeId', label: 'Employee ID', type: 'Text', example: 'TCH502', required: true },
    // --- New Field: Package (Non-editable) ---
    { name: 'package', label: 'Package', type: 'Dropdown', options: ['Sure pass'], required: true, nonEditable: true },
    { name: 'batchCourse', label: 'Batch / Course Linked', type: 'Dropdown', options: ['CA Inter – Batch A', 'CS Exec – Batch B', 'CMA Final – Batch C'], required: true },
    { name: 'expenseDate', label: 'Expense Date', type: 'Date', example: '05-10-2025', required: true },
    { name: 'paymentMode', label: 'Payment Mode', type: 'Dropdown', options: ['Self-paid', 'Institute Advance'], required: true },
    { name: 'supportingDocument', label: 'Supporting Document', type: 'file', example: 'Upload file (e.g., travel_receipt.pdf)', required: false },
];

const EXPENSE_TYPES = ['Travel', 'Training', 'Accommodation', 'Materials', 'Other'];

const initialFormState = EXPENSE_FORM_FIELDS.reduce((acc, field) => {
    acc[field.name] = '';
    // Set default value for the 'package' field
    if (field.name === 'package') {
        acc[field.name] = 'Sure pass';
    }
    return acc;
}, {});

const CustomDropdown = ({ label, options, value, onChange, name, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Disable opening if the field is specifically marked as non-editable
    const isDisabled = disabled || (options.length === 1 && options[0] === value);

    return (
        <div className="EXP_custom-dropdown-wrapper EXP_form-dropdown">
            <label className="EXP_form-label">{label}</label>
            <div
                className={`EXP_custom-select EXP_search-input ${isDisabled ? 'EXP_disabled' : ''}`}
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                tabIndex="0"
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="EXP_select-label">{value || `Select ${label}`}</div>
                {isOpen ? <FaChevronUp className="EXP_dropdown-icon" /> : <FaChevronDown className="EXP_dropdown-icon" />}
            </div>

            {isOpen && (
                <div className="EXP_dropdown-options-container">
                    <ul
                        className="EXP_dropdown-options-list"
                        role="listbox"
                    >
                        {options.map(option => (
                            <li
                                key={option}
                                className={`EXP_dropdown-option ${value === option ? 'EXP_selected' : ''}`}
                                onClick={() => {
                                    onChange({ target: { name, value: option } });
                                    setIsOpen(false);
                                }}
                                role="option"
                                aria-selected={value === option}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const ExpenseItemsTable = ({ expenseItems, setExpenseItems }) => {
    const [newItemType, setNewItemType] = useState('');

    const addNewExpenseItem = () => {
        if (newItemType) {
            setExpenseItems(prev => [...prev, {
                id: Date.now() + Math.random(),
                type: newItemType,
                amount: '', // Start as empty string for input focus
                description: ''
            }]);
            setNewItemType('');
        }
    };

    const updateExpenseItem = (id, field, value) => {
        setExpenseItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeExpenseItem = (id) => {
        if(window.confirm("Are you sure you want to remove this expense item?")) {
            setExpenseItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const totalAmount = expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return (
        <div className="EXP_form-group">
            <label className="EXP_form-label">Expense Line Items *</label>
            <div className="EXP_expense-line-item-adder" style={{ display: 'flex', gap: '10px', marginBottom: '10px' ,flexWrap:"wrap"}}>
                <CustomDropdown
                    label="Select Expense Type"
                    options={EXPENSE_TYPES}
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    name="newItemType"
                />
                <button
                    type="button"
                    onClick={addNewExpenseItem}
                    className="EXP_action-button EXP_approve"
                    disabled={!newItemType}
                    style={{ minWidth: '100px', height: 'fit-content', alignSelf: 'flex-end', padding: '10px' }}
                >
                    <FaPlus /> Add
                </button>
            </div>

            <div className="EXP_expense-items-table-wrapper">
                <table className="EXP_expense-items-table">
                    <thead>
                        <tr>
                            <th style={{ width: '25%' }}>Expense Type</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Amount (₹)</th>
                            {/* <th style={{ width: '45%' }}>Description</th> */}
                            <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenseItems.map((item) => (
                            <tr key={item.id}>
                                <td>{item.type}</td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)}
                                        min="0"
                                        required
                                        placeholder="0"
                                    />
                                </td>
                                
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => removeExpenseItem(item.id)}
                                        className="EXP_action-button EXP_reject"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan="2" className="EXP_expense-items-table-footer-total">Total Amount:</td>
                            <td colSpan="2" style={{ fontSize: '16px', color: '#0056b3' }}>
                                ₹{totalAmount.toLocaleString('en-IN') || '0'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {expenseItems.length === 0 && <p style={{ color: 'red', marginTop: '10px', fontSize: '13px' }}>* Please add at least one expense line item.</p>}
        </div>
    );
};


const ExpenseFormModal = ({ isOpen, onClose, currentExpense, onSave, teacherContext }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [expenseItems, setExpenseItems] = useState([]);

    useEffect(() => {
        if (currentExpense) {
            // Fill form for Edit (simplified/mocked line items for the demo)
            setFormData({
                ...currentExpense,
                teacherName: currentExpense.teacherName,
                employeeId: currentExpense.employeeId,
                package: 'Sure pass', // Ensure package is set for existing expenses
            });

            // Mocking expenseItems for an existing expense for demo purposes
            setExpenseItems([
                { id: 1, type: 'Travel', amount: '1500', description: 'Travel for guest lecture' },
                { id: 2, type: 'Accommodation', amount: '1000', description: 'Hotel stay' },
            ]);
        } else {
            // Fill form for Add new expense, defaulting teacher info
            setFormData({
                ...initialFormState,
                teacherName: teacherContext.teacherName,
                employeeId: teacherContext.employeeId,
            });
            setExpenseItems([]); // Start with empty items for new form
        }
    }, [currentExpense, teacherContext]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const totalAmount = expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        if (!formData.teacherName || !formData.batchCourse || expenseItems.length === 0 || totalAmount <= 0) {
            alert('Please fill in all required fields and add at least one expense line item with a positive amount.');
            return;
        }

        const confirmMessage = currentExpense
            ? `Are you sure you want to update expense ID ${currentExpense.id} for a total of ₹${totalAmount.toLocaleString('en-IN')}?`
            : `Are you sure you want to submit this new expense request for a total of ₹${totalAmount.toLocaleString('en-IN')}?`;

        if (window.confirm(confirmMessage)) {
            const expenseDataForSave = {
                ...formData,
                expenseItems: expenseItems.map(item => ({
                    type: item.type,
                    amount: parseFloat(item.amount),
                    description: item.description
                })),
                amount: `₹${totalAmount.toLocaleString('en-IN')}`,
                id: currentExpense ? currentExpense.id : Date.now(),
                submittedDate: currentExpense ? currentExpense.submittedDate : new Date().toLocaleDateString('en-GB'),
                status: currentExpense ? currentExpense.status : 'Pending',
                approvalDate: currentExpense ? currentExpense.approvalDate : '-',
            };
            onSave(expenseDataForSave);
            onClose();
        }
    };

    const title = currentExpense ? 'Edit Expense Request' : 'New Expense Request';

    return (
        <div className="EXP_modal-overlay" onClick={onClose}>
            <div className="EXP_modal-content" onClick={e => e.stopPropagation()}>
                <div className="EXP_modal-header">
                    <h2 className="EXP_modal-title">{title}</h2>
                    <button className="EXP_modal-close-button" onClick={onClose}><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="EXP_expense-form">
                    {EXPENSE_FORM_FIELDS.map(field => {
                        const commonProps = {
                            key: field.name,
                            name: field.name,
                            value: formData[field.name],
                            onChange: handleChange,
                            className: 'EXP_form-input',
                            placeholder: field.example,
                            required: field.required,
                            // Teacher/ID/Package should be non-editable
                            disabled: field.name === 'teacherName' || field.name === 'employeeId' || field.name === 'package'
                        };

                        if (field.type === 'Dropdown') {
                            return (
                                <CustomDropdown
                                    key={field.name}
                                    label={field.label + (field.required ? ' *' : '')}
                                    options={field.options}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    name={field.name}
                                    disabled={commonProps.disabled || field.nonEditable}
                                />
                            );
                        } else if (field.type === 'TextArea') {
                            return (
                                <div className="EXP_form-group" key={field.name}>
                                    <label className="EXP_form-label" htmlFor={field.name}>{field.label + (field.required ? ' *' : '')}</label>
                                    <textarea
                                        {...commonProps}
                                        id={field.name}
                                        rows="4"
                                    ></textarea>
                                </div>
                            );
                        } else {
                            // Text, Number, Date, File Upload
                            let inputType = field.type.toLowerCase();
                            if (inputType === 'number') inputType = 'text';
                            if (inputType === 'file upload') inputType = 'text';

                            return (
                                <div className="EXP_form-group" key={field.name}>
                                    <label className="EXP_form-label" htmlFor={field.name}>{field.label + (field.required ? ' *' : '')}</label>
                                    <input
                                        {...commonProps}
                                        id={field.name}
                                        type={inputType}
                                    />
                                </div>
                            );
                        }
                    })}

                    {/* Expense Line Items Table - Styles are now from external CSS */}
                    <ExpenseItemsTable
                        expenseItems={expenseItems}
                        setExpenseItems={setExpenseItems}
                    />

                    <div className="EXP_modal-footer">
                        <button type="button" onClick={onClose} className="EXP_action-button EXP_reject">Cancel</button>
                        <button type="submit" className="EXP_action-button EXP_approve">{currentExpense ? 'Save Changes' : 'Submit Request'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormModal;