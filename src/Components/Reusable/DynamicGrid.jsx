import React from 'react';
import styles from '../../Styles/Reusable/DynamicGrid.module.css';

// Component to render individual key:value pairs inside the cell
const KeyValueDisplay = ({ data }) => (
  <div className={styles['GRIDS_key-value-list']}>
    {data.map((item, index) => (
      <div key={index} className={styles['GRIDS_key-value-item']}>
        <span className={styles['GRIDS_key']}>{item.key}:</span>
        <span className={styles['GRIDS_value']}>{item.value}</span>
      </div>
    ))}
  </div>
);

// Component to render the pill indicator
const PillDisplay = ({ color }) => (
    <div 
        className={styles['GRIDS_pill']} 
        style={{ backgroundColor: color || 'var(--brand-pink)' }}
    />
);

/**
 * DynamicGrid Component
 * @param {string} [primaryTitle=''] - Main title displayed above the grid.
 * @param {string} [secondaryTitle=''] - Secondary title/description.
 * @param {number} rowCount - Number of rows.
 * @param {number} colCount - Number of columns.
 * @param {Array<Object>} content - Structured content array.
 * @param {React.ReactNode} [footerComponent=null] - Component to render below the main grid.
 * @param {boolean} [outerBorderStyles=false] - Flag to apply dedicated outer border/shadow styling.
 * @param {boolean} [gridContentFlexibility=false] - Flag to size columns based on content width (min-content).
 */
const DynamicGrid = ({ 
    primaryTitle = '',           
    secondaryTitle = '',         
    rowCount, 
    colCount, 
    content,
    footerComponent = null, 
    outerBorderStyles = false,
    gridContentFlexibility = false, 
}) => {
  // Calculate the total number of cells
  const totalCells = rowCount * colCount;
  
  // Validation
  if (content.length < totalCells) {
    console.warn(`Content array length (${content.length}) is less than the required cells (${totalCells}). Empty cells will be displayed.`);
  }

  // Prepare the main grid cells array
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const cellData = content[index] || {}; 
    const { no, cellTitle, data, metadata, pill } = cellData;

    // Check if the cell is truly empty
    const isSlotEmpty = !cellTitle && (!Array.isArray(data) || data.length === 0) && (!Array.isArray(metadata) || metadata.length === 0);

    // Conditional class application
    const cellClassName = isSlotEmpty 
      ? styles['GRIDS_grid-cell-empty-slot'] 
      : styles['GRIDS_grid-cell'];

    return (
      <div 
        key={no || index} 
        className={cellClassName} 
      >
        {/* Render content only if the slot is not logically empty */}
        {!isSlotEmpty && (
          <>
            {/* Render Pill (Top Right) */}
            {pill && pill.active && <PillDisplay color={pill.color} />}

            {/* Render the individual cell title */}
            {cellTitle && <div className={styles['GRIDS_cell-primary-title']}>{cellTitle}</div>}
            
            {/* Render the list of key:value pairs */}
            {Array.isArray(data) && data.length > 0 && <KeyValueDisplay data={data} />}

            {/* Render Metadata (Descriptive text) */}
            {Array.isArray(metadata) && metadata.length > 0 && (
                <div className={styles['GRIDS_metadata-container']}>
                    {metadata.map((desc, i) => (
                        <p key={i} className={styles['GRIDS_metadata-description']}>
                            {desc}
                        </p>
                    ))}
                </div>
            )}

            {/* Handle empty content */}
            {(!data || data.length === 0) && (!metadata || metadata.length === 0) && (
                <div className={styles['GRIDS_cell-empty']}>Incomplete Data</div>
            )}
          </>
        )}
      </div>
    );
  });
  
  // Conditional class application for wrapper
  const wrapperClass = `${styles['GRIDS_wrapper']} ${outerBorderStyles ? styles['GRIDS_wrapper-styled'] : ''}`;
  const flexMode = gridContentFlexibility ? 'min-content' : '1fr'; 

  return (
    <div className={wrapperClass}>
      {/* 1. TITLES (Rendered inside the wrapper) */}
      {(primaryTitle || secondaryTitle) && (
          <div className={styles['GRIDS_title-container']}>
              {primaryTitle && <h2 className={styles['GRIDS_primary-title']}>{primaryTitle}</h2>}
              {secondaryTitle && <p className={styles['GRIDS_secondary-title']}>{secondaryTitle}</p>}
          </div>
      )}
      
      {/* 2. MAIN GRID CONTAINER */}
      <div 
        className={styles['GRIDS_dynamic-grid-container']}
        style={{
          '--grid-rows': rowCount,
          '--grid-cols': colCount,
          '--grid-flex-mode': flexMode,
        }}
      >
        {cells}
      </div>
      
      {/* 3. FOOTER COMPONENT */}
      {footerComponent && (
          <div className={styles['GRIDS_footer-container']}>
              {footerComponent}
          </div>
      )}
    </div>
  );
};

export default DynamicGrid;