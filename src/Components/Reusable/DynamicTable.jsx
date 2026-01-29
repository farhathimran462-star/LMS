import React, { useState, useEffect, useRef } from 'react';
import '../../Styles/Reusable/DynamicTable.css';
import {
    AlertTriangle, Edit, FileText, Trash2, Plus, Search, 
    CheckCircle, XOctagon, ListChecks, 
    Upload, Download, UserX, UserCheck,
    PauseCircle, PlayCircle, Calendar,
    Save, X 
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 

const DynamicTable = ({
    data,
    userRole,
    onEdit,
    onDelete,
    onSearch,
    onStatusChange,
    onHold, 
    columnOrder, 
    title,
    onAddNew,
    add_new_button_label,
    customDescription,
    onDataImported,
    onExcelFormat, 
    unfilteredData, 
    onSuspendReactivate,
    onCustomExport,
    
    // --- NEW PROP ---
    onView, 
    onFileUpload, // For file upload (PDF/images etc)
    // ----------------
    
    // --- Date Filter Props ---
    showDateFilter = false,    
    activeDateFilter = '',     
    onDateChange,
    
    // --- Date Range Filter Props ---
    showDateRangeFilter = false,
    dateRange = { from: '', to: '' },
    onDateRangeChange,

    // --- Inline Editing Props ---
    editingRowId = null, 
    onSaveEdit,          
    onCancelEdit,
    onInputChange, 

    onRowClick, 
    onRowClickable = false, 
    selectedRowId = null, 
    
    filterDefinitions = {},
    activeFilters = {},
    onFilterChange,
    
    pillColumns = [],
    
    // Columns to stick to the RIGHT (Next to Actions)
    displayAtFixed = []
}) => {

    // --- State ---
    const [openFilterKey, setOpenFilterKey] = useState(null);
    const [openVisibilityFilter, setOpenVisibilityFilter] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);

    // --- Refs ---
    const visibilityFilterRef = useRef(null);
    const exportMenuRef = useRef(null);
    const importInputRef = useRef(null);
    const fileUploadInputRef = useRef(null);

    // --- Derived State & Helpers ---
    const hasData = data && data.length > 0;
    const allDefinedKeys = columnOrder || (hasData ? Object.keys(data[0]) : []);
    const [activeVisibleColumns, setActiveVisibleColumns] = useState(allDefinedKeys);
    
    // Update visible columns when columnOrder changes
    useEffect(() => {
        setActiveVisibleColumns(allDefinedKeys);
    }, [columnOrder]);
    
    // --- Click Outside Handler ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (visibilityFilterRef.current && !visibilityFilterRef.current.contains(event.target)) {
                setOpenVisibilityFilter(false);
            }
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setIsExportOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [visibilityFilterRef, exportMenuRef]);

    if (!data) {
        return (
          <div className="DT_no-data-container">
            <AlertTriangle size={18} />
            <p className="DT_no-data-text">No data to display for {title}.</p>
          </div>
        );
    }
    
    const noResults = data.length === 0;
    const normalizeKey = (key) => key.toLowerCase().trim();

    const formatHeader = (key) =>
        key.replace(/_/g, ' ')
           .replace(/([A-Z])/g, ' $1')
           .trim()
           .split(' ')
           .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
           .join(' ');

    // --- 1. COLUMN REORDERING LOGIC ---
    // Filter visible columns
    let visibleCols = allDefinedKeys.filter(key => activeVisibleColumns.includes(key));
    
    // Separate Fixed vs Scrolling columns
    const fixedCols = visibleCols.filter(key => displayAtFixed.includes(key));
    const scrollingCols = visibleCols.filter(key => !displayAtFixed.includes(key));
    
    // Final Order: Scrolling Columns -> Fixed Columns -> Actions (handled separately in render)
    const columns = [...scrollingCols, ...fixedCols];

    // --- 2. ACTIONS COLUMN LOGIC ---
    const hasEditDeleteActions = (onEdit || onDelete || onSuspendReactivate || editingRowId !== null); 
    const hasApprovalActions = onStatusChange || onHold; 
    
    // The "Actions" column is the main sticky one on the far right
    const showActionsColumn = hasEditDeleteActions;
    const showApprovalActionsColumn = hasApprovalActions && !showActionsColumn;
    const hasSuspendAction = onSuspendReactivate;

    const filterKeys = Object.keys(filterDefinitions);
    const hasFilters = filterKeys.length > 0 && onFilterChange;
    const shouldDisplayVisibilityFilter = allDefinedKeys.length > 0;

    const getColumnClassName = (key) =>
        `DT_column-${normalizeKey(key).replace(/[^a-z0-9_]/g, '')}`;

    // --- 3. STICKY STYLE CALCULATIONS ---
    const DATA_COL_WIDTH = 150; 
    const ACTION_COL_WIDTH = 100; // Fixed width for Actions Column

    const isSticky = (key) => displayAtFixed.includes(key);
    
    // Calculate style for Fixed Data Columns (e.g. Roll No, Name)
    const getStickyStyle = (key) => {
        if (!isSticky(key)) return {};
        
        const indexInFixed = fixedCols.indexOf(key);
        // Calculate position from the end of the list
        const positionFromEnd = fixedCols.length - 1 - indexInFixed;
        
        // If Actions column exists, we must push these columns to the left of it
        const baseOffset = showActionsColumn ? ACTION_COL_WIDTH : 0;
        const rightOffset = baseOffset + (positionFromEnd * DATA_COL_WIDTH);

        return {
            position: 'sticky',
            right: `${rightOffset}px`,
            zIndex: 10, 
            backgroundColor: 'var(--dt-bg, #ffffff)',
           
            boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
            minWidth: `${DATA_COL_WIDTH}px`,
            maxWidth: `${DATA_COL_WIDTH}px`
        };
    };

    // Calculate style for the Actions Column (Always Right: 0)
    const getActionStickyStyle = () => {
        return {
            position: 'sticky',
            right: 0,
            zIndex: 20, // Highest Z-Index
            // backgroundColor: 'var(--dt-bg, #ffffff)',
            backgroundColor:'#e91e63',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
             color: 'white',
            width: `${ACTION_COL_WIDTH}px`,
            minWidth: `${ACTION_COL_WIDTH}px`,
            maxWidth: `${ACTION_COL_WIDTH}px`,
            borderLeft: '1px solid #e0e0e0',
            textAlign: 'center'
        };
    };

    // --- Formatters & Helpers ---
    const formatCellData = (key, value) => {
        if (value == null) return '';
        
        // Handle photo/image columns
        if (normalizeKey(key) === 'photo' || normalizeKey(key) === 'image' || normalizeKey(key) === 'avatar') {
            // Check if it's a string (URL) before using startsWith
            if (value && typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
                return (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img 
                            src={value} 
                            alt="Institution" 
                            style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '4px', 
                                objectFit: 'cover' 
                            }} 
                            onError={(e) => { 
                                e.target.style.display = 'none'; 
                            }}
                        />
                    </div>
                );
            }
            // If it's a File object or non-URL, don't display
            return '';
        }
        
        const isPillColumn = pillColumns.map((col) => normalizeKey(col)).includes(normalizeKey(key));
        if (isPillColumn) {
            const items = Array.isArray(value) ? value : String(value).split(',').map((i) => i.trim()).filter((i) => i.length > 0);
            return (
                <div className="DT_multi-pill-container">
                    {items.map((item, index) => (
                        <span key={index} className={`DT_pill DT_pill-${item.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '')}`}>
                            {item}
                        </span>
                    ))}
                </div>
            );
        }
        return value;
    };
    
    const handleColumnVisibilityToggle = (columnKey) => {
        setActiveVisibleColumns(prev => prev.includes(columnKey) ? prev.filter(key => key !== columnKey) : [...prev, columnKey]);
    };
    
    const handleAllColumnsToggle = () => {
        setActiveVisibleColumns(activeVisibleColumns.length === allDefinedKeys.length ? [] : allDefinedKeys);
    };

    const getVisibilityFilterHeader = () => {
        if (activeVisibleColumns.length === allDefinedKeys.length) return "All Columns";
        if (activeVisibleColumns.length === 0) return "No Columns Selected";
        return `${activeVisibleColumns.length} of ${allDefinedKeys.length} Columns`;
    }
    
    const getRowUniqueId = (row) => row.id || row.code || row.user_id || row.material_id || row.rollno || null;

    const handleInternalRowClick = (row) => {
        if (onRowClickable && onRowClick) {
            const rowId = getRowUniqueId(row);
            if (rowId) onRowClick(rowId);
        }
    };

    // --- Export Functions ---
    const handleExport = (withFilters) => {
        // If custom export handler provided, use it instead
        if (onCustomExport) {
            onCustomExport();
            setIsExportOpen(false);
            return;
        }
        const dataToExport = withFilters ? data : unfilteredData;
        if (!dataToExport || dataToExport.length === 0) return alert('No data to export.');

        const keysToExport = columnOrder || Object.keys(dataToExport[0]);
        const formattedData = dataToExport.map(row => {
            let newRow = {};
            keysToExport.forEach(key => { newRow[formatHeader(key)] = row[key]; });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, `${title || 'data'}_${withFilters ? 'filtered' : 'all'}.xlsx`);
        setIsExportOpen(false);
    };

    const handleExportPDF = (withFilters) => {
        try {
            const dataToExport = withFilters ? data : (unfilteredData || data);
            if (!dataToExport || dataToExport.length === 0) return alert('No data to export.');
            const doc = new jsPDF('landscape', 'pt', 'a4');
            const keysToExport = columnOrder || Object.keys(dataToExport[0]);
            const headers = [keysToExport.map(key => formatHeader(key))];
            const body = dataToExport.map(row => 
                keysToExport.map(key => {
                    const value = row[key];
                    if (value === null || value === undefined) return '';
                    return String(value);
                })
            );
            doc.setFontSize(18);
            doc.text(`${title || 'Data'} Report`, 40, 40);
            autoTable(doc, {
                head: headers, body: body, startY: 60, theme: 'grid',
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            });
            doc.save(`${title || 'data'}_${withFilters ? 'filtered' : 'all'}.pdf`);
        } catch (error) {
            console.error("PDF Export Error: ", error);
            alert("PDF generation failed. See console.");
        }
        setIsExportOpen(false);
    };
    
    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file || !onDataImported) return;
        
        const fileName = file.name.toLowerCase();
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                let json;
                
                // Handle JSON files
                if (fileName.endsWith('.json')) {
                    const text = event.target.result;
                    json = JSON.parse(text);
                }
                // Handle CSV files
                else if (fileName.endsWith('.csv')) {
                    const text = event.target.result;
                    const workbook = XLSX.read(text, { type: 'string' });
                    json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                }
                // Handle Excel files (.xlsx, .xls)
                else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    const bstr = event.target.result;
                    const workbook = XLSX.read(bstr, { type: 'binary' });
                    json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                }
                else {
                    alert('Unsupported file format. Please use .csv, .json, .xlsx, or .xls');
                    return;
                }
                
                if (json && json.length > 0) {
                    onDataImported(json);
                } else {
                    alert('No data found in the file.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert(`Failed to import file: ${error.message}`);
            }
            if (importInputRef.current) importInputRef.current.value = null;
        };
        
        // Read file based on type
        if (fileName.endsWith('.json') || fileName.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    };

    // Handle file upload for timetables (PDF/images)
    const handleFileUploadChange = (e) => {
        const file = e.target.files[0];
        if (!file || !onFileUpload) return;
        
        onFileUpload(file);
        
        // Reset input
        if (fileUploadInputRef.current) {
            fileUploadInputRef.current.value = null;
        }
    };

    return (
        <div className="DT_main-container">
            {/* --- HEADER ROW --- */}
            <div className="DT_header-row">
                {title && <h2 className="DT_title-header DT_header-title">{title}</h2>}

                {(onSearch || onAddNew || onDataImported || onFileUpload) && (
                    <div className="DT_controls-group DT_top-controls">
                        {onSearch && (
                            <div className="DT_search-container">
                                <Search size={16} className="DT_search-icon" />
                                <input type="text" placeholder={`Search ${title || 'Data'}...`} onChange={(e) => onSearch(e.target.value)} className="DT_search-input" />
                            </div>
                        )}
                        
                        {/* --- FIXED LOGIC HERE --- */}
                        {onAddNew && (
                            (userRole === 'Super Admin' || userRole === 'Admin') || 
                            (userRole === 'Teacher' && (
                                title === "Institutions" || 
                                title === "Class-Notes" || 
                                title === "Tasks" || 
                                title === "Chapters" || 
                                title.includes("Chapters in") ||
                                title === "Expense Requests" ||
                                add_new_button_label
                            ))
                        ) && (
                            <button onClick={onAddNew} className="DT_add-new-btn">
                                <Plus size={18} /> {add_new_button_label || `Add New ${title}`}
                            </button>
                        )}

                        {onExcelFormat && (
                            typeof onExcelFormat === 'function' ? (
                                <button 
                                    onClick={onExcelFormat} 
                                    className="DT_action-btn DT_excel-format-btn"
                                    style={{
                                        backgroundColor: 'white',
                                        color: '#e91e63',
                                        padding: '8px 16px',
                                        border: '1px solid #e91e63',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#e91e63';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'white';
                                        e.target.style.color = '#e91e63';
                                    }}
                                >
                                    <FileText size={18} /> Excel Format
                                </button>
                            ) : (
                                <a 
                                    href={onExcelFormat} 
                                    download 
                                    className="DT_action-btn DT_excel-format-btn" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        backgroundColor: 'white',
                                        color: '#e91e63',
                                        padding: '8px 16px',
                                        border: '1px solid #e91e63',
                                        borderRadius: '4px',
                                        gap: '6px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <FileText size={18} /> Excel Format
                                </a>
                            )
                        )}

                        {onDataImported && (
                            <>
                                <button onClick={() => importInputRef.current && importInputRef.current.click()} className="DT_import-btn">
                                    <Upload size={17} /> Import
                                </button>
                                <input type="file" ref={importInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".csv, .json, .xlsx, .xls" />
                            </>
                        )}

                        {onFileUpload && (
                            <>
                                <button onClick={() => fileUploadInputRef.current && fileUploadInputRef.current.click()} className="DT_import-btn" style={{ backgroundColor: 'white', color: '#ec4899', border: '2px solid #ec4899' }}>
                                    <Upload size={17} /> Upload Timetable
                                </button>
                                <input type="file" ref={fileUploadInputRef} onChange={handleFileUploadChange} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" />
                            </>
                        )}
                        
                        <div className="DT_export-container" ref={exportMenuRef} style={{ position: 'relative' }}>
                            <button onClick={() => setIsExportOpen(!isExportOpen)} className="DT_export-btn">
                                <Download size={18} /> Export
                            </button>
                            {isExportOpen && (
                                <div className="DT_export-menu" style={{ position: 'absolute', left: 0, top: '100%', backgroundColor: 'white', border: '2px solid #e91e63', zIndex: 9999, minWidth: '150px', borderRadius: '4px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                                    <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', color: '#999', background: '#f9f9f9' }}>EXCEL DOWNLOAD</div>
                                    <div className="DT_export-option" onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleExport(true);
                                    }} style={{ padding: '12px 16px', cursor: 'pointer', userSelect: 'none', backgroundColor: 'white' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>Excel (Filtered)</div>
                                    <div className={`DT_export-option ${!unfilteredData ? 'DT_disabled' : ''}`} onClick={() => unfilteredData && handleExport(false)} style={{ padding: '8px 12px', cursor: 'pointer' }}>Excel (All Data)</div>
                                    <div style={{ height: '1px', background: '#eee' }}></div>
                                    <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', color: '#888', background: '#f9f9f9' }}>PDF DOWNLOAD</div>
                                    <div className="DT_export-option" onClick={() => handleExportPDF(true)} style={{ padding: '8px 12px', cursor: 'pointer' }}>PDF (Filtered)</div>
                                    <div className={`DT_export-option ${!unfilteredData ? 'DT_disabled' : ''}`} onClick={() => unfilteredData && handleExportPDF(false)} style={{ padding: '8px 12px', cursor: 'pointer' }}>PDF (All Data)</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- FILTER ROW --- */}
            {(hasFilters || shouldDisplayVisibilityFilter || showDateFilter || showDateRangeFilter) && (
                <div className="DT_filter-row">
                    {customDescription ? <p>{customDescription}</p> : <p>** filters for below Table ** </p> }
                    <div className='DT_filter_flexy'>
                        
                        {/* 1. DATE RANGE FILTER */}
                        {showDateRangeFilter && (
                            <div className="DT_filter-container" style={{display:'flex', gap:'8px'}}>
                                <div className="DT_custom-date-wrapper" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', padding: '5px 10px', height: '35px' }}>
                                    <span style={{fontSize:'12px', color:'#888', marginRight:'5px'}}>From:</span>
                                    <input
                                        type="date"
                                        value={dateRange.from || ''}
                                        onChange={(e) => onDateRangeChange && onDateRangeChange('from', e.target.value)}
                                        className="DT_date-input-element"
                                        style={{ border: 'none', outline: 'none', color: '#444', fontSize: '13px', background: 'transparent', cursor: 'pointer' }}
                                    />
                                </div>
                                <div className="DT_custom-date-wrapper" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', padding: '5px 10px', height: '35px' }}>
                                    <span style={{fontSize:'12px', color:'#888', marginRight:'5px'}}>To:</span>
                                    <input
                                        type="date"
                                        value={dateRange.to || ''}
                                        onChange={(e) => onDateRangeChange && onDateRangeChange('to', e.target.value)}
                                        className="DT_date-input-element"
                                        style={{ border: 'none', outline: 'none', color: '#444', fontSize: '13px', background: 'transparent', cursor: 'pointer' }}
                                    />
                                </div>
                                {(dateRange.from || dateRange.to) && (
                                    <button 
                                        onClick={() => onDateRangeChange && (onDateRangeChange('from', '') || onDateRangeChange('to', ''))}
                                        style={{border:'none', background:'none', color:'#e91e63', cursor:'pointer', fontSize:'12px', fontWeight:'bold'}}
                                    >
                                        Clear Dates
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 2. LEGACY SINGLE DATE FILTER */}
                        {showDateFilter && !showDateRangeFilter && (
                            <div className="DT_filter-container">
                                <div className="DT_custom-date-wrapper" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px', padding: '5px 10px', height: '35px', cursor: 'pointer' }}>
                                    <Calendar size={16} style={{ marginRight: '8px', color: '#666' }} />
                                    <input
                                        type="date"
                                        value={activeDateFilter || ''}
                                        onChange={(e) => onDateChange && onDateChange(e.target.value)}
                                        className="DT_date-input-element"
                                        style={{ border: 'none', outline: 'none', color: '#444', fontSize: '13px', fontFamily: 'inherit', background: 'transparent', cursor: 'pointer' }}
                                    />
                                    {activeDateFilter && (
                                        <div onClick={(e) => { e.stopPropagation(); onDateChange && onDateChange(''); }} style={{ marginLeft: '8px', fontSize: '16px', color: '#999', cursor: 'pointer', lineHeight: 1 }}>&times;</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. VISIBILITY FILTER */}
                        {shouldDisplayVisibilityFilter && (
                            <div className="DT_filter-container" ref={visibilityFilterRef}>
                                <div className={`DT_custom-dropdown-select ${openVisibilityFilter ? 'DT_dropdown-open' : ''}`} onClick={() => setOpenVisibilityFilter(!openVisibilityFilter)} tabIndex="0">
                                    <div className="DT_custom-dropdown-value DT_flex-start">
                                        <ListChecks size={18} style={{ marginRight: '8px' }} />
                                        {getVisibilityFilterHeader()}
                                    </div>
                                    <div className="DT_custom-dropdown-arrow">&#9662;</div>
                                </div>
                                {openVisibilityFilter && (
                                    <div className="DT_custom-dropdown-menu"> 
                                        <div className="DT_custom-dropdown-option DT_select-all" onClick={handleAllColumnsToggle} style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                                            <input type="checkbox" checked={activeVisibleColumns.length === allDefinedKeys.length} readOnly className="DT_column-checkbox" />
                                            <span className="DT_column-label">{activeVisibleColumns.length === allDefinedKeys.length ? 'Deselect All' : 'Select All'}</span>
                                        </div>
                                        {allDefinedKeys.map((key) => (
                                            <div key={key} className={`DT_custom-dropdown-option ${activeVisibleColumns.includes(key) ? 'DT_active-option' : ''}`} onClick={() => handleColumnVisibilityToggle(key)}>
                                                <input type="checkbox" checked={activeVisibleColumns.includes(key)} readOnly className="DT_column-checkbox" />
                                                <span className="DT_column-label">{formatHeader(key)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* 4. STANDARD FILTERS */}
                        {hasFilters && filterKeys.map(columnKey => (
                            <div key={columnKey} className="DT_filter-container">
                                <div className={`DT_custom-dropdown-select ${openFilterKey === columnKey ? 'DT_dropdown-open' : ''}`} onClick={() => setOpenFilterKey(openFilterKey === columnKey ? null : columnKey)} tabIndex="0">
                                    <div className="DT_custom-dropdown-value">
                                        {filterDefinitions[columnKey].find(opt => opt.value === (activeFilters[columnKey] || ''))?.label || formatHeader(columnKey)}
                                    </div>
                                    <div className="DT_custom-dropdown-arrow">&#9662;</div>
                                </div>
                                {openFilterKey === columnKey && (
                                    <div className="DT_custom-dropdown-menu">
                                        {filterDefinitions[columnKey].map((option) => (
                                            <div key={option.value} className={`DT_custom-dropdown-option ${option.value === activeFilters[columnKey] ? 'DT_active-option' : ''}`} onClick={() => { onFilterChange(columnKey, option.value); setOpenFilterKey(null); }}>
                                                {option.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* --- TABLE CONTENT --- */}
            <div className='DT_table-wrapper'>
                <div className="DT_Table-wrapper-container">
                    <table className="DT_table">
                        <thead className="DT_table-head">
                            <tr>

                                
                                {/* 1. STANDARD DATA COLUMNS */}
                                {columns.map((key) => (
                                    <th 
                                        key={key} 
                                        className={`DT_th-cell ${getColumnClassName(key)} ${isSticky(key) ? 'DT_sticky-col' : ''}`}
                                        style={getStickyStyle(key)}
                                    >
                                        <div className="DT_th-content-wrapper">{formatHeader(key)}</div>
                                    </th>
                                ))}
                                {showApprovalActionsColumn && <th className="DT_th-cell DT_column-approval-actions">Actions</th>}
                                
                                {/* 2. STICKY ACTIONS COLUMN HEADER */}
                                {showActionsColumn && (
                                    <th 
                                        className="DT_th-cell DT_column-actions DT_sticky-action-header"
                                        style={getActionStickyStyle()}
                                    >
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        
                        {noResults ? (
                            <tbody>
                                <tr>
                                    <td colSpan={columns.length + (showApprovalActionsColumn ? 1 : 0) + (showActionsColumn ? 1 : 0)} className="DT_td-cell DT_no-results-cell">
                                        <div className="DT_no-data-container DT_no-results-message">
                                            <FileText size={18} className="DT_no-results-icon"/>
                                            <p className="DT_no-data-text">No results found matching your search or filter criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody className="DT_table-body">
                                {data.map((row, rowIndex) => {
                                    const rowId = getRowUniqueId(row);
                                    const isRowSelected = selectedRowId !== null && rowId === selectedRowId;
                                    const rowStatus = row.status || row.approved_status;
                                    
                                    // CHECK IF THIS ROW IS CURRENTLY BEING EDITED
                                    const isEditing = editingRowId !== null && editingRowId === rowId;
                                    
                                    // NEW LOGIC: Check if row is finalized (Accepted/Approved/Rejected)
                                    const statusLower = (rowStatus || '').toLowerCase();
                                    const isFinalized = ['accepted', 'rejected', 'approved'].includes(statusLower);

                                    return (
                                        <tr key={rowIndex} className={`DT_tr ${onRowClickable ? 'DT_row-clickable' : ''} ${isRowSelected ? 'DT_row-selected' : ''}`} onClick={onRowClickable ? (e) => handleInternalRowClick(row) : undefined}>
                                            
                                            {/* 1. DATA CELLS */}
                                            {columns.map((colKey) => {
                                                
                                                // --- VIEW COLUMN LOGIC ---
                                                if (colKey.toLowerCase() === 'view') {
                                                    return (
                                                        <td 
                                                            key={`${rowIndex}-${colKey}`} 
                                                            className={`DT_td-cell ${getColumnClassName(colKey)} ${isSticky(colKey) ? 'DT_sticky-col' : ''}`}
                                                            style={getStickyStyle(colKey)}
                                                        >
                                                            <div style={{display:'flex', justifyContent:'center'}}>
                                                                <button 
                                                                    className="DT_action-btn" 
                                                                    style={{color: '#2196F3', borderColor: '#2196F3', background: 'white', display:'flex', alignItems:'center', justifyContent:'center', width:'30px', height:'30px', padding:0}}
                                                                    onClick={(e) => { e.stopPropagation(); onView && onView(row); }}
                                                                    title="Download Sample PDF"
                                                                >
                                                                    <Download size={16} /> 
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                                // -------------------------

                                                // Check if this specific column should be editable
                                                // Exclude 'actions' and 'view' columns from being editable input
                                                const isEditable = isEditing && colKey.toLowerCase() !== 'actions' && colKey.toLowerCase() !== 'view';

                                                return (
                                                    <td 
                                                        key={`${rowIndex}-${colKey}`} 
                                                        className={`DT_td-cell ${getColumnClassName(colKey)} ${pillColumns.map(c => normalizeKey(c)).includes(normalizeKey(colKey)) ? 'DT_td-has-pill' : ''} ${isSticky(colKey) ? 'DT_sticky-col' : ''}`}
                                                        style={getStickyStyle(colKey)}
                                                    >
                                                        {isEditable ? (
                                                            /* --- RENDER INPUT IF EDITING --- */
                                                            <input 
                                                                type="text" 
                                                                className="DT_edit-input"
                                                                value={row[colKey] || ''}
                                                                // Trigger the parent's handler to update state
                                                                onChange={(e) => onInputChange && onInputChange(rowId, colKey, e.target.value)}
                                                                // Prevent row click when clicking input
                                                                onClick={(e) => e.stopPropagation()} 
                                                                style={{
                                                                    width: '100%', 
                                                                    padding: '4px', 
                                                                    border: '1px solid #ccc', 
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        ) : (
                                                            /* --- RENDER TEXT IF NOT EDITING --- */
                                                            formatCellData(colKey, row[colKey])
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* 2. APPROVAL ACTIONS (Legacy/Non-sticky) */}
                                            {showApprovalActionsColumn && (
                                                <td className="DT_td-cell DT_td-approval-action-cell DT_column-approval-actions">
                                                    <div className="DT_action-btn-container">
                                                        {onStatusChange && (rowStatus !== 'Approved') && (
                                                            <button className="DT_action-btn DT_approve-btn" onClick={(e) => { e.stopPropagation(); onStatusChange(rowId || row, 'Approved'); }}>
                                                                <CheckCircle size={16} /> Approve
                                                            </button>
                                                        )}
                                                        {onStatusChange && (rowStatus !== 'Rejected') && (
                                                            <button className="DT_action-btn DT_reject-btn" onClick={(e) => { e.stopPropagation(); onStatusChange(rowId || row, 'Rejected'); }}>
                                                                <XOctagon size={16} /> Reject
                                                            </button>
                                                        )}
                                                        {onHold && (rowStatus !== 'Approved' && rowStatus !== 'Rejected') && (() => {
                                                            const isOnHold = rowStatus === 'OnHolded';
                                                            return (
                                                                <button 
                                                                    className={`DT_action-btn ${isOnHold ? 'DT_release-btn' : 'DT_onhold-btn'}`} 
                                                                    style={{ backgroundColor: isOnHold ? '#10b981' : '#f59e0b', color: 'white', borderColor: 'transparent' }}
                                                                    onClick={(e) => { e.stopPropagation(); onHold(rowId || row, isOnHold ? 'Released' : 'OnHolded'); }}
                                                                >
                                                                    {isOnHold ? <PlayCircle size={16} /> : <PauseCircle size={16} />} 
                                                                    {isOnHold ? 'Release' : 'On Hold'}
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            )}

                                            {/* 3. MAIN ACTIONS COLUMN (STICKY) */}
                                            {showActionsColumn && (
                                                <td 
                                                    className="DT_td-cell DT_td-action-cell DT_column-actions DT_sticky-action-cell"
                                                    style={getActionStickyStyle()}
                                                >
                                                    <div className="DT_action-btn-container" style={{justifyContent: 'center'}}>
                                                        
                                                        {isEditing ? (
                                                            // --- EDIT MODE BUTTONS ---
                                                            <>
                                                                <button 
                                                                    className="DT_action-btn DT_save-btn" 
                                                                    title="Save Changes" 
                                                                    style={{color:'green', borderColor:'green', backgroundColor:'#fff'}}
                                                                    onClick={(e) => { e.stopPropagation(); onSaveEdit(row); }}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button 
                                                                    className="DT_action-btn DT_cancel-btn" 
                                                                    title="Dismiss Changes" 
                                                                    style={{color:'red', borderColor:'red', backgroundColor:'#fff'}}
                                                                    onClick={(e) => { e.stopPropagation(); onCancelEdit(row); }}
                                                                >
                                                                    <XOctagon size={16} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            // --- DEFAULT MODE BUTTONS ---
                                                            <>
                                                                {hasSuspendAction && (() => {
                                                                    const isSuspended = row.status === 'Suspended';
                                                                    return (
                                                                        <button className={`DT_action-btn ${isSuspended ? 'DT_unsuspend-btn' : 'DT_suspend-btn'}`} title={isSuspended ? 'Reactivate User' : 'Suspend User'} onClick={(e) => { e.stopPropagation(); onSuspendReactivate(row); }} style={{ padding: '3px 3px', fontSize: '10px'}}>
                                                                            {isSuspended ? <UserCheck size={12} /> : <UserX size={12} />} 
                                                                        </button>
                                                                    );
                                                                })()}
                                                                
                                                                {/* LOGIC CHANGE: HIDE EDIT IF FINALIZED */}
                                                                {!isFinalized && onEdit && (
                                                                    <button className="DT_action-btn DT_edit-btn" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(row); }} style={{ padding: '3px 3px', fontSize: '10px'}}>
                                                                        <Edit size={12} />
                                                                    </button>
                                                                )}
                                                                
                                                                {/* LOGIC CHANGE: HIDE DELETE IF FINALIZED */}
                                                                {!isFinalized && onDelete && (
                                                                    <button className="DT_action-btn DT_delete-btn" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(row); }} style={{ padding: '3px 3px', fontSize: '10px' }}>
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DynamicTable;