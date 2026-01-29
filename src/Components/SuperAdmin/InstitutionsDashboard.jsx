import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FaUniversity } from 'react-icons/fa';
import '../../Styles/SuperAdmin/InstitutionsDashboard.css';
import DynamicTable from "../Reusable/DynamicTable";
import CardSlider from "../Reusable/CardSlider"; 
import DynamicForm from "../Reusable/DynamicForm";
import { 
    getAllInstitutions, 
    createInstitution, 
    updateInstitution, 
    deleteInstitution 
} from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getBatchesByInstituteWithStudents } from '../../api/batchesApi';


// --- Configuration for Dynamic Form ---
const getInstitutionFormConfig = (mode, courseOptions = []) => {
    const baseFields = [
        {
            name: 'profilePhoto',
            label: 'Profile Photo',
            type: 'file-upload',
            isProfileImage: true,
            required: false, 
            fullWidth: true, 
            fileUploadLimit: 2097152, 
            hintText: "Supported formats: JPG, PNG (Max 2MB)",
            descriptionText: "Upload the institution's logo."
        },
        {                                                                
            name: 'name', 
            label: 'Institution Name', 
            type: 'text-enter', 
            required: true, 
            fullWidth: true 
        },
        { 
            name: 'id', 
            label: 'Institution ID', 
            type: 'text-enter',
            required: true, 
            fixed: mode === 'edition', 
            hintText: "Enter a unique institution ID (e.g., INST001).",
            descriptionText: "Unique Identifier for the institution (mandatory)."
        },
        { 
            name: 'location', 
            label: 'Location / City', 
            type: 'text-enter', 
            required: true 
        },
        {
            name: 'courseIds',
            label: 'Offered Courses',
            type: 'multi-select',
            options: courseOptions,
            fullWidth: true,
            required: false,
            placeholder: "Select courses offered by this institution",
            descriptionText: "Choose all courses available at this institution."
        }
    ];

    return baseFields;
};

// --- Confirmation/Message Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isConfirmation, confirmText, institutionId }) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(institutionId);
        onClose();
    };

    return (
        <div className="inst_modal_overlay">
            <div className={`inst_modal_content inst_confirm_modal ${isConfirmation ? 'inst_delete_confirmation' : 'inst_save_message'}`}>
                <div className="inst_modal_header">
                    <h2 className="inst_modal_title">{title}</h2>
                    <button className="inst_modal_close" onClick={onClose}>&times;</button>
                </div>
                <div className="inst_form" style={{ padding: '20px' }}>
                    <p>{message}</p>
                    <div className="inst_modal_actions" style={{ position: 'relative', borderTop: 'none', padding: 0 }}>
                        {!isConfirmation && (
                             <button type="button" className="inst_btn_primary" onClick={onClose}>
                                OK
                            </button>
                        )}
                        {isConfirmation && (
                            <>
                                <button type="button" className="inst_btn_secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="button" className="inst_action_btn inst_delete_btn" onClick={handleConfirm} style={{ padding: '8px 16px' }}>
                                    {confirmText || 'Confirm'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Institution Details Panel Component ---
const InstitutionDetailsPanel = React.forwardRef(({ institution, institutionUUID, onClear }, ref) => {
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(false);

    useEffect(() => {
        const fetchBatches = async () => {
            if (!institutionUUID) return;
            
            setLoadingBatches(true);
            const { data, error } = await getBatchesByInstituteWithStudents(institutionUUID);
            
            if (!error && data) {
                setBatches(data);
            } else if (error) {
                console.error('Error fetching batches:', error);
                setBatches([]);
            }
            setLoadingBatches(false);
        };

        fetchBatches();
    }, [institutionUUID]);

    if (!institution) return null;

    const batchesColumnOrder = ['batch_name', 'course_level', 'mode', 'status', 'student_count'];
    const transformedBatches = batches.map(batch => ({
        id: batch.id,
        batch_name: batch.batch_name || 'N/A',
        course_level: `${batch.courses?.course_name || 'N/A'} - ${batch.levels?.level_name || 'N/A'}`,
        mode: batch.mode || 'N/A',
        status: batch.status || 'Active',
        student_count: batch.student_count || 0
    }));

    return (
        <div ref={ref} className="inst_details_panel_container">
            <div className="inst_details_panel">
                <header className="inst_details_panel_header">
                    <h3 className="inst_details_title">Details for {institution.name}</h3>
                    <button className="inst_details_close_btn" onClick={onClear}>&times;</button>
                </header>
                
                <section className="inst_details_summary">
                    <p><strong>ID:</strong> {institution.id}</p>
                    <p><strong>Location:</strong> {institution.location}</p>
                    <p><strong>Admins:</strong> {institution.adminNamesList}</p>
                    <p><strong>Courses:</strong> {institution.coursesList}</p>
                </section>

                <h4 className="inst_details_subtitle">Available Batches ({batches.length})</h4>
                
                {loadingBatches ? (
                    <p className="inst_no_results_small">Loading batches...</p>
                ) : batches.length > 0 ? (
                    <div className="inst_batches_table_responsive">
                        <DynamicTable 
                            data={transformedBatches}
                            columnOrder={batchesColumnOrder}
                            title={'Batches'}
                            onEdit={null}
                            onDelete={null}
                            onSearch={null}
                            onAddNew={null}
                            filterDefinitions={{}}
                        />
                    </div>
                ) : (
                    <p className="inst_no_results_small">No active batches found for this institution.</p>
                )}
            </div>
        </div>
    );
});

// --- Main Dashboard Component ---
const InstitutionsDashboard = ({userRole}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionsList, setInstitutionsList] = useState([]); 
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formModalState, setFormModalState] = useState({ isOpen: false, mode: 'add', data: null }); 
  const [confirmModalState, setConfirmModalState] = useState({ 
      isOpen: false, 
      title: '', 
      message: '', 
      isConfirmation: false, 
      confirmAction: () => {}, 
      confirmText: '',
      targetId: null, 
  });
  
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const detailsPanelRef = useRef(null);
  
  // Get current user ID from session storage
  const getUserId = () => {

    const userData = sessionStorage.getItem('userData') || localStorage.getItem('userData');
    console.log(sessionStorage.getItem('userRole'));
    console.log('userData from storage:', userData);
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user.user_id;
    }
    return null;
  };
  
  const INSTITUTIONS_COLUMN_ORDER = useMemo(() => ([
      'id', 
      'name', 
      'location', 
      'adminNamesList', 
      'coursesList', 
      'totalBatches', 
      'totalStudents'
  ]), []);
  const getInstitutionFromRow = (row) => institutionsList.find(inst => inst.id === (row.id || row));


  // --- Prepare Data for CardSlider ---
  const institutionsForSlider = useMemo(() => {
    return new Map(institutionsList.map(inst => [
        inst.id, 
        { 
            name: inst.name, 
            image: inst.photo || inst.profilePhoto || '' 
        }
    ]));
  }, [institutionsList]);

// Fetch courses first, then institutions on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadData = async () => {
      await fetchCourses();
      await fetchInstitutions();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
      if (selectedInstitution && detailsPanelRef.current) {
          detailsPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, [selectedInstitution]);

  const fetchCourses = async () => {
    const { data, error } = await getAllCourses();
    if (!error && data) {
      setCoursesList(data);
    } else if (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchInstitutions = async () => {
    setLoading(true);
    const { data, error } = await getAllInstitutions();
    
    if (!error && data) {
      // Get current courses list (will be populated if fetchCourses was called first)
      const { data: courses } = await getAllCourses();
      const coursesData = courses || coursesList;
      
      // Transform Supabase data to component format
      const transformed = data.map(inst => ({
        id: inst.institute_id,
        uuid: inst.id, // Store UUID for API calls
        name: inst.institute_name,
        location: inst.location || 'N/A',
        photo: inst.photo,
        adminNamesList: inst.admin_names && inst.admin_names.length > 0 
          ? inst.admin_names.join(', ')
          : 'N/A',
        adminIds: [],
        courseIds: inst.course_ids || [],
        totalBatches: 0,
        totalStudents: 0,
        coursesList: inst.course_ids && inst.course_ids.length > 0 
          ? inst.course_ids.map(cId => {
              const course = coursesData.find(c => c.id === cId);
              return course ? course.course_name : cId;
            }).join(', ')
          : 'No Courses Found',
        rawInstData: {}
      }));
      setInstitutionsList(transformed);
    } else if (error) {
      console.error('Error fetching institutions:', error);
    }
    
    setLoading(false);
  };

  
  const handleEdit = (instRow) => {
    const inst = getInstitutionFromRow(instRow); 
    if(inst) {
        setFormModalState({ 
            isOpen: true, 
            mode: 'edition', 
            data: { 
                ...inst, 
                courseIds: inst.courseIds || [],
                profilePhoto: inst.photo // Pass existing photo to form
            } 
        });
    }
  };

  const handlePerformDelete = async (id) => {
    setLoading(true);
    
    // Find the institution to get the UUID
    const inst = institutionsList.find(i => i.id === id);
    if (!inst) return;
    
    // Get current user ID
    const userId = getUserId();
    
    // Delete from Supabase using institute_id
    const { error } = await deleteInstitution(inst.id, userId);
    
    if (!error) {
      // Update local state
      setInstitutionsList(prevList => prevList.filter(inst => inst.id !== id));
      handleClearDetails(); 
      
      setConfirmModalState({
          isOpen: true,
          title: 'Institution Deleted',
          message: `Institution "${inst.name}" has been successfully removed from the system.`,
          isConfirmation: false,
          confirmAction: () => {},
          confirmText: 'OK',
          targetId: null,
      });
    } else {
      setConfirmModalState({
          isOpen: true,
          title: 'Delete Failed',
          message: `Failed to delete institution: ${error.message}`,
          isConfirmation: false,
          confirmAction: () => {},
          confirmText: 'OK',
          targetId: null,
      });
    }
    
    setLoading(false);
  };

  const handleDelete = (instRow) => {
    const inst = getInstitutionFromRow(instRow); 
    if(!inst) return;
    
    setConfirmModalState({
        isOpen: true,
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${inst.name}" (ID: ${inst.id})? This action cannot be undone.`,
        isConfirmation: true,
        confirmAction: handlePerformDelete, 
        confirmText: 'Delete Institution',
        targetId: inst.id,
    });
  };
  
  // --- Handlers ---
  
  const handleSaveInstitution = async (formData, mode) => {
    setLoading(true);
    
    // Get current user ID
    const userId = getUserId();
    
    let message, title;
    const isEdit = mode === 'edition';
    
    if (isEdit) {
        // Update in Supabase
        const updateData = {
            institute_name: formData.name,
            location: formData.location,
            photo: formData.profilePhoto || null,
            course_ids: formData.courseIds || []
        };
        
        const { error } = await updateInstitution(formData.id, updateData, userId);
        
        if (!error) {
            // Update local state
            const coursesText = formData.courseIds && formData.courseIds.length > 0
                ? formData.courseIds.map(cId => {
                    const course = coursesList.find(c => c.id === cId);
                    return course ? course.course_name : cId;
                  }).join(', ')
                : 'No Courses Found';
            
            setInstitutionsList(prevList => 
                prevList.map(inst => 
                    inst.id === formData.id
                        ? {
                            ...inst,
                            name: formData.name,
                            location: formData.location,
                            photo: formData.profilePhoto,
                            courseIds: formData.courseIds || [],
                            coursesList: coursesText
                          }
                        : inst
                )
            );
            title = 'Update Successful';
            message = `The institution "${formData.name}" has been updated successfully.`;
        } else {
            title = 'Update Failed';
            message = `Failed to update institution: ${error.message}`;
        }
    } else {
        // Institute ID is now mandatory, use the provided ID
        const finalId = formData.id;

        // Create in Supabase
        const newInstData = {
            institute_id: finalId,
            institute_name: formData.name,
            location: formData.location,
            photo: formData.profilePhoto || null,
            course_ids: formData.courseIds || []
        };
        
        const { data, error } = await createInstitution(newInstData, userId);
        
        if (!error && data) {
            const coursesText = formData.courseIds && formData.courseIds.length > 0
                ? formData.courseIds.map(cId => {
                    const course = coursesList.find(c => c.id === cId);
                    return course ? course.course_name : cId;
                  }).join(', ')
                : 'No Courses Found';
            
            const newInstitution = {
                id: data.institute_id,
                name: data.institute_name,
                location: data.location,
                photo: data.photo,
                courseIds: data.course_ids || [],
                adminNamesList: 'N/A',
                coursesList: coursesText,
                totalBatches: 0, 
                totalStudents: 0
            };
            setInstitutionsList([newInstitution, ...institutionsList]);
            title = 'Institution Added';
            message = `New institution "${formData.name}" has been added with ID: ${data.institute_id}.`;
        } else {
            title = 'Creation Failed';
            message = `Failed to create institution: ${error.message}`;
        }
    }
    
    setLoading(false);
    
    setConfirmModalState({
        isOpen: true,
        title: title,
        message: message,
        isConfirmation: false, 
        confirmAction: () => {},
        confirmText: 'OK',
        targetId: null,
    });
  };
  
  const handleAddNewInstitution = () => {
      setFormModalState({ 
          isOpen: true, 
          mode: 'creation', 
          // ID is now mandatory, user must provide it
          data: { courseIds: [] } 
      });
  };

  const handleDynamicTableSearch = (query) => {
      setSearchTerm(query);
  };

  const handleViewBatches = (institution) => {
    if (selectedInstitution && selectedInstitution.id === institution.id) {
        setSelectedInstitution(null);
    } else {
        setSelectedInstitution(institution);
    }
  };

  const handleSliderSelect = (instId) => {
      if(!instId) {
          setSearchTerm('');
          setSelectedInstitution(null);
          return;
      }
      const inst = institutionsList.find(i => i.id === instId);
      if(inst) {
          handleViewBatches(inst);
      }
  };
  
  const handleClearDetails = () => {
      setSelectedInstitution(null);
  };

  const filteredInstitutions = useMemo(() => {
    if (!searchTerm) return institutionsList;
    const lowerCaseSearch = searchTerm.toLowerCase();

    return institutionsList.filter(inst => 
      inst.name.toLowerCase().includes(lowerCaseSearch) ||
      inst.location.toLowerCase().includes(lowerCaseSearch) ||
      inst.id.toLowerCase().includes(lowerCaseSearch) ||
      inst.coursesList.toLowerCase().includes(lowerCaseSearch) ||
      inst.adminNamesList.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, institutionsList]);

  const totalInstitutions = institutionsList.length;
  
  const handleRowClick = (instId) => {
      const inst = getInstitutionFromRow({ id: instId }); 
      if(inst) {
        handleViewBatches(inst);
      }
  };


  return (
    <>
        <div className="inst_dashboard_container">
            <header className="inst_dashboard_header">
                <h1 className="inst_main_title">Institutions<FaUniversity /></h1>
                <p className="inst_total_count">
                    Total Institutions: <span className="inst_count_value">{totalInstitutions}</span>
                </p>
            </header>

            {loading && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading institutions...
                </div>
            )}

             {/* --- SLIDER --- */}
             <CardSlider 
                title="Institutions" 
                institutes={institutionsForSlider}
                onSelectInstitute={handleSliderSelect} 
                icon_title="Institutions"
                searchBar={false} 
            />

             <DynamicTable
                    data={filteredInstitutions}
                    columnOrder={INSTITUTIONS_COLUMN_ORDER}
                    title="Institutions"
                    userRole={userRole}
                    
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    
                    onSearch={handleDynamicTableSearch}
                    onAddNew={handleAddNewInstitution}
                    
                    unfilteredData={institutionsList}  
                    
                    onRowClickable={true}
                    onRowClick={handleRowClick}
                    selectedRowId={selectedInstitution ? selectedInstitution.id : null}
                    
                    pillColumns={['adminNamesList', 'coursesList']}
                />
            
            <InstitutionDetailsPanel
                ref={detailsPanelRef}
                institution={selectedInstitution}
                institutionUUID={selectedInstitution?.uuid}
                onClear={handleClearDetails}
            />

            {/* --- FORM MODAL --- */}
            {formModalState.isOpen && (
                <DynamicForm
                    isOpen={formModalState.isOpen}
                    mode={formModalState.mode}
                    // Pass mode and course options
                    fieldsConfig={getInstitutionFormConfig(
                        formModalState.mode,
                        coursesList.map(c => ({ label: c.course_name, value: c.id }))
                    )}
                    initialData={formModalState.data}
                    onClose={() => setFormModalState({ isOpen: false, mode: 'creation', data: null })}
                    onSubmit={handleSaveInstitution}
                />
            )}
            
            <ConfirmationModal 
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModalState.confirmAction}
                title={confirmModalState.title}
                message={confirmModalState.message}
                isConfirmation={confirmModalState.isConfirmation}
                confirmText={confirmModalState.confirmText}
                institutionId={confirmModalState.targetId}
            />

        </div>
    </>
  );
};

export default InstitutionsDashboard;