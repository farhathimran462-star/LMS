import React, { useRef } from 'react';
import SubjectMaterialList from './SubjectMaterialList'; // Assuming same directory

/**
 * Wrapper component to conditionally render the SubjectMaterialList 
 * based on whether a subject has been selected.
 * * @param {object} props 
 * @param {object | null} props.selectedSubject - The selected subject object (from TeacherMaterials.jsx useMemo).
 * @param {string | null} props.selectedStream - The selected stream ID.
 * @param {string | null} props.selectedLevel - The selected level ID.
 * @param {object | null} props.selectedBatch - The selected batch object (from TeacherMaterials.jsx useMemo).
 */
const SubjectMaterialsSection = ({ 
    selectedSubject, 
    selectedStream, 
    selectedLevel, 
    selectedBatch 
}) => {
    
    const materialListRef = useRef(null); 
    
    // The conditional rendering based on the presence of the selected subject object
    return (
        <>
            {selectedSubject !== null && (
                <div ref={materialListRef} className="mm_material-list-section">
                    <SubjectMaterialList 
                        // The 'subject' prop is the full subject object
                        subject={selectedSubject} 
                        // The 'context' contains all other relevant selections
                        context={{ 
                            selectedStream, 
                            selectedLevel, 
                            selectedBatch, 
                            selectedSubject 
                        }} 
                    />
                </div>
            )}
        </>
    );
};

export default SubjectMaterialsSection;