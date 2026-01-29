import '../../Styles/Student/StudentBatches.css';
import React, { useState, useEffect } from 'react';
import DynamicGrid from "../Reusable/DynamicGrid";
import { supabase } from '../../config/supabaseClient';


// --- Function to map raw data to the required structured format for DynamicGrid ---
const mapToGridContent = (dataArray) => {
    return dataArray.map((subject, index) => ({
        no: index + 1,
        cellTitle: subject.subject_name,
        data: [
            { key: 'Code', value: subject.subject_code },
            { key: 'Estimated Hours', value: `${subject.estimated_hours || 0} hrs` },
        ],
        metadata: [
            `Course: ${subject.course_name || 'N/A'}`,
            `Level: ${subject.level_name || 'N/A'}`,
        ],
        pill: {
            active: true,
            color: 'var(--brand-pink)',
        }
    }));
};
// --------------------------------------------------------------------------------


const StudentBatches = () => {
    const [loading, setLoading] = useState(true);
    const [batchData, setBatchData] = useState(null);
    const [subjectsData, setSubjectsData] = useState([]);
    const [timetableData, setTimetableData] = useState(null);

    useEffect(() => {
        fetchStudentBatchData();
    }, []);

    const fetchStudentBatchData = async () => {
        setLoading(true);
        try {
            // Get current student's user_id from session
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            const userId = userData?.user_id;

            if (!userId) {
                console.error('User ID not found');
                setLoading(false);
                return;
            }

            console.log('✅ Fetching data for student user:', userId);

            // Fetch student record
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select(`
                    *,
                    batches(
                        *,
                        institutions(id, institute_name, location),
                        courses(id, course_name),
                        levels(id, level_name),
                        programmes(
                            *,
                            programme_subjects(
                                subjects(*)
                            )
                        )
                    ),
                    classes(id, class_name)
                `)
                .eq('user_id', userId)
                .single();

            if (studentError) throw studentError;

            console.log('✅ Student data:', studentData);

            // Extract batch information
            const batch = studentData?.batches;
            if (batch) {
                setBatchData({
                    batchName: batch.batch_name || 'N/A',
                    startDate: batch.start_time ? new Date(batch.start_time).toLocaleDateString() : 'N/A',
                    endDate: batch.end_time ? new Date(batch.end_time).toLocaleDateString() : 'N/A',
                    schedule: `${batch.mode || 'N/A'} Mode`,
                    totalStudents: 0, // Will need separate query if needed
                    mode: batch.mode || 'N/A',
                    location: batch.location || batch.institutions?.location || 'N/A',
                    institution: batch.institutions?.institute_name || 'N/A',
                    course: batch.courses?.course_name || 'N/A',
                    level: batch.levels?.level_name || 'N/A',
                    programme: batch.programmes?.programme_name || 'N/A',
                });

                // Extract subjects from programme_subjects
                const subjects = batch.programmes?.programme_subjects?.map(ps => ({
                    ...ps.subjects,
                    course_name: batch.courses?.course_name,
                    level_name: batch.levels?.level_name
                })) || [];
                setSubjectsData(subjects);
                console.log('✅ Subjects:', subjects);
            }

            // Fetch latest timetable for student's class
            if (studentData?.class_id) {
                const { data: timetableRecords, error: timetableError } = await supabase
                    .from('timetables')
                    .select('*')
                    .eq('class_id', studentData.class_id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (timetableError) {
                    console.error('Timetable error:', timetableError);
                } else if (timetableRecords && timetableRecords.length > 0) {
                    setTimetableData(timetableRecords[0]);
                    console.log('✅ Latest Timetable:', timetableRecords[0]);
                }
            }

        } catch (error) {
            console.error('Error fetching student batch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTimetable = () => {
        if (timetableData?.file_url) {
            window.open(timetableData.file_url, '_blank');
        }
    };

  const mainSubjectGridContent = mapToGridContent(subjectsData);
  
  // Calculate dynamic rows and cols based on subject count
  const subjectCount = subjectsData.length;
  const cols = 3;
  const rows = Math.ceil(subjectCount / cols);

  if (loading) {
    return (
      <div className="container student-batches-container fade-in">
        <h1 className="mt-4 mb-8 font-bold text-center text-pink">Loading...</h1>
      </div>
    );
  }

  if (!batchData) {
    return (
      <div className="container student-batches-container fade-in">
        <h1 className="mt-4 mb-8 font-bold text-center text-pink">No Batch Assigned</h1>
        <p className="text-center">You have not been assigned to any batch yet. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="container student-batches-container fade-in">
      <h1 className="mt-4 mb-8 font-bold text-center text-pink">Batch Curriculum Overview</h1>

      <BatchDetailsCard data={batchData} />

      {/* Replaced SubjectsCard with SubjectsGridSection using DynamicGrid */}
      <SubjectsGridSection
        content={mainSubjectGridContent}
        rows={rows}
        cols={cols}
        batchName={batchData.batchName}
      />

      {timetableData && <TimetableCard timetable={timetableData} onDownload={handleDownloadTimetable} />}
    </div>
  );
};


const BatchDetailsCard = ({ data }) => (
  <div className="card batch-details-card shadow-lg rounded-lg slide-down">
    
    <div className="card-body p-6">

      {/* 1. Batch Info Box */}
      <div className="batch-info-box shadow rounded-lg p-5">
        <p className="text-brand-pink mb-4 font-semibold">Batch Information</p>

        <div className="batch-info-grid">
            <p className="m-0">Batch Name : <strong> <span className="text-gray-700">{data.batchName}</span></strong></p>
            <p>Institution : <strong> <span className="text-gray-700">{data.institution}</span></strong></p>
            <p>Course : <strong> <span className="text-gray-700">{data.course}</span></strong></p>
            <p>Level : <strong> <span className="text-gray-700">{data.level}</span></strong></p>
            <p>Programme : <strong> <span className="text-gray-700">{data.programme}</span></strong></p>
            <p>Start Date : <strong> <span className="text-gray-700">{data.startDate}</span></strong></p>
            <p>End Date : <strong> <span className="text-gray-700">{data.endDate}</span></strong></p>
            <p>Mode : <strong>
                <span>
                    {data.mode}
                </span>
                </strong>
            </p>
            <p className="m-0">Location : <strong> <span className="text-gray-700">{data.location}</span></strong></p>
        </div>
      </div>
    </div>
  </div>
);

// --- NEW COMPONENT using DynamicGrid for Subjects ---
const SubjectsGridSection = ({ content, rows, cols, batchName }) => (
      <div className="card-body p-0">
          <DynamicGrid
              rowCount={rows}
              secondaryTitle="Subject & Instructors"
              colCount={cols}
              content={content}
              outerBorderStyles={true}
          />
      </div>
);

const TimetableCard = ({ timetable, onDownload }) => {
    console.log('Timetable data:', timetable);
    console.log('File URL:', timetable?.file_url);
    
    const isPDF = timetable?.file_type?.includes('pdf') || timetable?.file_name?.toLowerCase().endsWith('.pdf');
    const isImage = timetable?.file_type?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(timetable?.file_name);

    return (
        <div className="card timetable-card shadow-lg rounded-lg mt-8 slide-down">
            <div className="card-header bg-brand-pink-dark">
                <h2 className="text-center">Timetable</h2>
            </div>
            <div className="card-body p-6">
                <div className="timetable-info-box shadow rounded-lg p-5">
                    <p className="text-brand-pink mb-4 font-semibold">Timetable Information</p>
                    
                    <div className="batch-info-grid">
                        <p className="m-0">Timetable Name : <strong> <span className="text-gray-700">{timetable.timetable_name || 'N/A'}</span></strong></p>
                        <p>File Name : <strong> <span className="text-gray-700">{timetable.file_name || 'N/A'}</span></strong></p>
                        <p>File Type : <strong> <span className="text-gray-700">{timetable.file_type || 'N/A'}</span></strong></p>
                        <p>Start Date : <strong> <span className="text-gray-700">{timetable.start_date ? new Date(timetable.start_date).toLocaleDateString() : 'N/A'}</span></strong></p>
                        <p>End Date : <strong> <span className="text-gray-700">{timetable.end_date ? new Date(timetable.end_date).toLocaleDateString() : 'N/A'}</span></strong></p>
                        <p>Uploaded : <strong> <span className="text-gray-700">{timetable.created_at ? new Date(timetable.created_at).toLocaleDateString() : 'N/A'}</span></strong></p>
                    </div>

                    <div className="mt-4 text-center">
                        <button 
                            onClick={onDownload}
                            className="btn btn-primary"
                            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#e91e63', color: 'white', border: 'none', borderRadius: '5px' }}
                        >
                            Download Timetable
                        </button>
                    </div>

                    {/* Display the timetable file content */}
                    {timetable.file_url ? (
                        <div className="mt-6">
                            <p className="text-center mb-4" style={{ fontWeight: '600', fontSize: '18px', color: '#e91e63' }}>Timetable Preview</p>
                            {isPDF ? (
                                <div style={{ 
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden',
                                    border: '3px solid #e91e63'
                                }}>
                                    <iframe
                                        src={timetable.file_url}
                                        style={{ width: '100%', height: '700px', border: 'none', display: 'block' }}
                                        title="Timetable PDF"
                                    />
                                </div>
                            ) : isImage ? (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 30px rgba(233, 30, 99, 0.2)'
                                }}>
                                    <img
                                        src={timetable.file_url}
                                        alt="Timetable"
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '800px', 
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                                            border: '3px solid white'
                                        }}
                                    />
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">
                                    Preview not available for this file type. Please download to view.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="mt-6 text-center">
                            <p style={{ color: 'red' }}>No timetable file available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentBatches;