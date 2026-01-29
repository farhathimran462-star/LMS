import React, { Component } from 'react';
import DynamicForm from './DynamicForm'; 

// --- 1. Example Field Configuration (Outside the Class for stability) ---
const SUBJECT_FIELDS_CONFIG = [
    {
        name: 'subjectName',
        label: 'Subject Name',
        type: 'text-enter',
        required: true,
        fullWidth: false,
        numberLimit: 100,
        hintText: 'e.g., Financial Accounting',
    },
    {
        name: 'subjectCode',
        label: 'Subject Code',
        type: 'text-enter',
        required: true,
        fixed: true,
        fullWidth: false,
        hintText: 'e.g., CF-ACC-101',
    },
    {
        name: 'instructor',
        label: 'Lead Instructor',
        type: 'single-select',
        required: true,
        pillsColor: 'purple',
        options: [
            { label: 'Dr. Sharma', value: 'SKSharma' },
            { label: 'Prof. Iyer', value: 'JVIyer' },
            { label: 'Mr. Gupta', value: 'RPGupta' },
        ],
        fullWidth: false,
    },
    {
        name: 'classDay',
        label: 'Primary Class Day',
        type: 'week-day',
        required: true,
        fullWidth: false,
    },
    {
        name: 'topics',
        label: 'Key Topics Covered',
        type: 'multi-select',
        required: true,
        fullWidth: true,
        pillsColor: 'green',
        options: [
            { label: 'GST', value: 'GST' },
            { label: 'Income Tax', value: 'IT' },
            { label: 'Audit Standards', value: 'AS' },
            { label: 'Company Law', value: 'CL' },
        ],
    },
    {
        name: 'maxStudents',
        label: 'Maximum Students',
        type: 'number-limit',
        required: false,
        fullWidth: false,
        numberLimit: 200,
        hintText: 'Max capacity is 200',
    },
    {
        name: 'classStart',
        label: 'Start Time',
        type: 'time-start',
        required: true,
        fullWidth: false,
    },
    {
        name: 'statusInfo',
        label: 'Current Status',
        type: 'display-box',
        displayText: 'This is a Live subject.',
        icon: '🟢',
        fullWidth: true,
    },
];

// --- 2. Example Initial Data for Edition Mode (Outside the Class) ---
const EXAMPLE_INITIAL_DATA = {
    subjectName: "Taxation (Income Tax & GST)",
    subjectCode: "CF-TAX-101",
    instructor: "SKSharma",
    classDay: "tue",
    topics: ['IT', 'GST'],
    maxStudents: 150,
    classStart: '09:30',
};

// Simple inline styles for buttons
const style = {
    buttonPrimary: {
        padding: '10px 20px',
        backgroundColor: '#6c5ce7',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    buttonSecondary: {
        padding: '10px 20px',
        backgroundColor: '#dfe6e9',
        color: '#2d3436',
        border: '1px solid #b2bec3',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
    }
}


class Practise extends Component {
  
    // Initialize state
    state = {
        isFormOpen: false,
        formMode: 'edition', // Can be 'creation' or 'edition'
    };

    // Class methods defined using arrow functions do not need explicit binding
    handleOpenForm = (mode) => {
        this.setState({ 
            formMode: mode,
            isFormOpen: true,
        });
    };

    handleCloseForm = () => {
        this.setState({ isFormOpen: false });
    };

    handleSubmit = (data, mode) => {
        console.log(`Form Submitted in ${mode} mode:`, data);
        alert(`Data for ${mode} mode logged to console!`);
    };

    render() {
        const { isFormOpen, formMode } = this.state;
        
        // Stabilize initialData reference for DynamicForm (Same logic as functional component)
        const currentInitialData = formMode === 'edition' ? EXAMPLE_INITIAL_DATA : {}; 

        return (
            <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
                <h1>Dynamic Form Demonstration (Class Component)</h1>
                <p>Click below to open the modal form.</p>
                
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button 
                        onClick={() => this.handleOpenForm('creation')}
                        style={style.buttonPrimary}
                    >
                        Open Form (Creation Mode)
                    </button>
                    <button 
                        onClick={() => this.handleOpenForm('edition')}
                        style={style.buttonSecondary}
                    >
                        Open Form (Edition Mode)
                    </button>
                </div>

                {/* RENDER THE IMPORTED DYNAMIC FORM COMPONENT */}
                <DynamicForm 
                    isOpen={isFormOpen}
                    mode={formMode}
                    fieldsConfig={SUBJECT_FIELDS_CONFIG} 
                    initialData={currentInitialData} 
                    onClose={this.handleCloseForm}
                    onSubmit={this.handleSubmit}
                />
            </div>
        );
    }
}

export default Practise;