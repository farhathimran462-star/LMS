import '../../Styles/SuperAdmin/ReportsAnalytics.css';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

// API Imports
import { getAdminReportData, processReportData } from '../../api/reportsApi';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getAllLevels } from '../../api/levelsApi';
import { getAllBatches } from '../../api/batchesApi';
import { getAllSubjects } from '../../api/subjectsApi';
import { getAllStudents } from '../../api/usersApi';
import { getAllClasses } from '../../api/classesApi';
import { supabase } from '../../config/supabaseClient';

// --- CHART COLORS: Map to CSS Variables for Recharts ---
const CHART_COLORS = {
    Marks: 'var(--brand-pink)',
    Attendance: 'var(--brand-orange-dark)',
    Pass: 'var(--color-success)',
    Fail: 'var(--color-error)',
};

const PIE_COLORS = [CHART_COLORS.Pass, CHART_COLORS.Fail];

// ===================================================================
// REACT COMPONENT WITH DATABASE API INTEGRATION
// ===================================================================

const ReportsAnalytics = ({ userRole }) => {
  // Get user data
  const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawMarksData, setRawMarksData] = useState([]);
  const [rawAttendanceData, setRawAttendanceData] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allLevels, setAllLevels] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [institutionCourses, setInstitutionCourses] = useState([]);
  
  // Filter State
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState('ALL');
  const [selectedLevelId, setSelectedLevelId] = useState('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState('ALL');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('ALL');
  const [allClasses, setAllClasses] = useState([]);

  // Fetch institutions on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch institutions
        const { data: institutionsData, error: instError } = await getAllInstitutions();
        if (!instError && institutionsData) {
          setInstitutions(institutionsData);
        }

        // Fetch all courses
        const { data: coursesData, error: coursesError } = await getAllCourses();
        if (!coursesError && coursesData) {
          setAllCourses(coursesData);
        }

        // Fetch all levels
        const { data: levelsData, error: levelsError } = await getAllLevels();
        if (!levelsError && levelsData) {
          setAllLevels(levelsData);
        }

        // Fetch all batches
        const { data: batchesData, error: batchesError } = await getAllBatches();
        if (!batchesError && batchesData) {
          setAllBatches(batchesData);
        }

        // Fetch all subjects
        const { data: subjectsData, error: subjectsError } = await getAllSubjects();
        if (!subjectsError && subjectsData) {
          setAllSubjects(subjectsData);
        }

        // Fetch all students
        const { data: studentsData, error: studentsError } = await getAllStudents();
        if (!studentsError && studentsData) {
          setAllStudents(studentsData);
        }

        // Fetch all classes
        const { data: classesData, error: classesError } = await getAllClasses();
        if (!classesError && classesData) {
          setAllClasses(classesData);
        }

        // Fetch institution_courses junction table
        const { data: junctionData, error: junctionError } = await supabase
          .from('institution_courses')
          .select('*');
        
        if (!junctionError && junctionData) {
          setInstitutionCourses(junctionData);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch report data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters = {};
        // Only filter if a specific institute is selected
        if (selectedInstituteId !== 'ALL') {
          filters.institution_id = selectedInstituteId;
        }
        // If 'ALL', fetch all data (no filter)
        
        console.log('📊 Fetching data with filters:', filters);
        const { data, error } = await getAdminReportData(filters);
        
        console.log('📊 API Response - data:', data);
        console.log('📊 API Response - error:', error);
        
        if (error) throw error;
        
        console.log('📊 Marks data received:', data?.marks?.length || 0);
        console.log('📊 Sample mark:', data?.marks?.[0]);
        console.log('📊 Attendance data received:', data?.attendance?.length || 0);
        
        setRawMarksData(data?.marks || []);
        setRawAttendanceData(data?.attendance || []);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedInstituteId]);

  // Process data based on current view level
  const { processedData, groupByLevel } = useMemo(() => {
    let groupBy = 'institution';
    let filteredMarks = rawMarksData;
    let filteredAttendance = rawAttendanceData;

    console.log('📊 Processing data - Total marks:', rawMarksData.length);
    console.log('📊 Selected filters:', { selectedInstituteId, selectedCourseId, selectedLevelId, selectedBatchId, selectedClassId, selectedSubjectId, selectedStudentId });

    // Filter by institution
    if (selectedInstituteId !== 'ALL') {
      filteredMarks = filteredMarks.filter(m => m.institution_id === selectedInstituteId);
      filteredAttendance = filteredAttendance.filter(a => a.institute_id === selectedInstituteId);
      groupBy = 'course';
      
      // Filter by course
      if (selectedCourseId !== 'ALL') {
        filteredMarks = filteredMarks.filter(m => m.course_id === selectedCourseId);
        filteredAttendance = filteredAttendance.filter(a => a.course_id === selectedCourseId);
        groupBy = 'level';
        
        // Filter by level
        if (selectedLevelId !== 'ALL') {
          filteredMarks = filteredMarks.filter(m => m.level_id === selectedLevelId);
          filteredAttendance = filteredAttendance.filter(a => a.level_id === selectedLevelId);
          groupBy = 'batch';
          
          // Filter by batch
          if (selectedBatchId !== 'ALL') {
            filteredMarks = filteredMarks.filter(m => m.batch_id === selectedBatchId);
            filteredAttendance = filteredAttendance.filter(a => a.batch_id === selectedBatchId);
            groupBy = 'class';
            
            // Filter by class
            if (selectedClassId !== 'ALL') {
              filteredMarks = filteredMarks.filter(m => m.class_id === selectedClassId);
              filteredAttendance = filteredAttendance.filter(a => a.class_id === selectedClassId);
              groupBy = 'subject';
              
              // Filter by subject
              if (selectedSubjectId !== 'ALL') {
                filteredMarks = filteredMarks.filter(m => m.subject_id === selectedSubjectId);
                filteredAttendance = filteredAttendance.filter(a => a.subject_id === selectedSubjectId);
                groupBy = 'student';
                
                // Filter by student
                if (selectedStudentId !== 'ALL') {
                  filteredMarks = filteredMarks.filter(m => m.student_id === selectedStudentId);
                  filteredAttendance = filteredAttendance.filter(a => a.student_id === selectedStudentId);
                  groupBy = 'student';
                }
              }
            }
          }
        }
      }
    }

    console.log('📊 Filtered marks:', filteredMarks.length);
    console.log('📊 Group by:', groupBy);

    // Pass reference data to processReportData
    const referenceData = {
      institutions,
      courses: allCourses,
      levels: allLevels,
      batches: allBatches,
      classes: allClasses,
      subjects: allSubjects,
      students: allStudents,
    };

    const processed = processReportData(filteredMarks, filteredAttendance, groupBy, referenceData);
    console.log('📊 Processed data:', processed);
    
    return { processedData: processed, groupByLevel: groupBy };
  }, [rawMarksData, rawAttendanceData, institutions, allCourses, allLevels, allBatches, allClasses, allSubjects, allStudents, selectedInstituteId, selectedCourseId, selectedLevelId, selectedBatchId, selectedClassId, selectedSubjectId, selectedStudentId]);

  // Get available filter options based on data
  const {availableCourses, availableLevels, availableBatches, availableClasses, availableSubjects, availableStudents} = useMemo(() => {
    const courses = new Set(['ALL']);
    const levels = new Set(['ALL']);
    const batches = new Set(['ALL']);
    const classes = new Set(['ALL']);
    const subjects = new Set(['ALL']);
    const students = new Set(['ALL']);

    console.log('📊 Computing available students - selectedSubjectId:', selectedSubjectId);
    console.log('📊 Raw marks data length:', rawMarksData.length);
    console.log('📊 Sample mark:', rawMarksData[0]);

    // Get courses for selected institution from junction table
    if (selectedInstituteId !== 'ALL') {
      const institutionCoursesIds = institutionCourses
        .filter(ic => ic.institution_id === selectedInstituteId)
        .map(ic => ic.course_id);
      
      allCourses.forEach(course => {
        if (institutionCoursesIds.includes(course.id)) {
          courses.add(JSON.stringify({ id: course.id, name: course.course_name, code: course.course_id }));
        }
      });
    }

    // Get levels for selected course
    if (selectedCourseId !== 'ALL') {
      // Filter levels by course_id from levels table
      allLevels.forEach(level => {
        if (level.course_id === selectedCourseId) {
          levels.add(JSON.stringify({ id: level.id, name: level.level_name, level_id: level.level_id }));
        }
      });
    }

    // Get batches for selected level
    if (selectedLevelId !== 'ALL' && selectedCourseId !== 'ALL' && selectedInstituteId !== 'ALL') {
      // Filter batches from batches table using institute_id, course_id, and level_id
      allBatches.forEach(batch => {
        if (batch.institute_id === selectedInstituteId && 
            batch.course_id === selectedCourseId && 
            batch.level_id === selectedLevelId) {
          batches.add(JSON.stringify({ id: batch.id, name: batch.batch_name }));
        }
      });
    }

    // Get classes for selected batch
    if (selectedBatchId !== 'ALL' && selectedInstituteId !== 'ALL' && selectedCourseId !== 'ALL' && selectedLevelId !== 'ALL') {
      // Filter classes from classes table using institute_id, course_id, level_id, and batch_id
      allClasses.forEach(cls => {
        if (cls.institute_id === selectedInstituteId && 
            cls.course_id === selectedCourseId && 
            cls.level_id === selectedLevelId && 
            cls.batch_id === selectedBatchId) {
          classes.add(JSON.stringify({ id: cls.id, name: cls.class_name }));
        }
      });
    }

    // Get subjects for selected level (subjects are linked to level_id in subjects table)
    if (selectedLevelId !== 'ALL') {
      // Filter subjects from subjects table using level_id
      allSubjects.forEach(subject => {
        if (subject.level_id === selectedLevelId) {
          subjects.add(JSON.stringify({ id: subject.id, name: subject.subject_name, code: subject.subject_code }));
        }
      });
    }

    // Get students - show all students if class is selected, or filter by subject
    if (selectedClassId !== 'ALL' && selectedInstituteId !== 'ALL') {
      // Show all students from the selected class
      console.log('📊 Selected Class ID:', selectedClassId);
      console.log('📊 Selected Institute ID:', selectedInstituteId);
      console.log('📊 Filtering students by class:', selectedClassId, 'and institute:', selectedInstituteId);
      console.log('📊 All students data:', allStudents);
      
      allStudents.forEach(student => {
        console.log('📊 Checking student:', student.id, 'class_id:', student.class_id, 'institute_id:', student.institute_id);
        if (student.class_id === selectedClassId && student.institute_id === selectedInstituteId) {
          students.add(JSON.stringify({ id: student.id, name: student.name || student.username || 'Unknown Student' }));
          console.log('📊 Added student:', student.name);
        }
      });
      console.log('📊 Students filtered by class:', Array.from(students));
    } else if (selectedSubjectId !== 'ALL') {
      // Filter by subject and marks data
      console.log('📊 Filtering students by subject:', selectedSubjectId);
      const uniqueStudentIds = new Set();
      rawMarksData.forEach(mark => {
        if (mark.subject_id === selectedSubjectId && mark.student_id) {
          uniqueStudentIds.add(mark.student_id);
        }
      });
      
      console.log('📊 Unique student IDs from marks:', Array.from(uniqueStudentIds));
      console.log('📊 All students available:', allStudents);
      
      allStudents.forEach(student => {
        if (uniqueStudentIds.has(student.id)) {
          students.add(JSON.stringify({ id: student.id, name: student.name || student.username || 'Unknown Student' }));
        }
      });
      
      console.log('📊 Students added to dropdown:', Array.from(students));
    } else {
      console.log('📊 No class or subject selected, showing only ALL');
    }

    return {
      availableCourses: Array.from(courses).map(c => c === 'ALL' ? 'ALL' : JSON.parse(c)),
      availableLevels: Array.from(levels).map(l => l === 'ALL' ? 'ALL' : JSON.parse(l)),
      availableBatches: Array.from(batches).map(b => b === 'ALL' ? 'ALL' : JSON.parse(b)),
      availableClasses: Array.from(classes).map(c => c === 'ALL' ? 'ALL' : JSON.parse(c)),
      availableSubjects: Array.from(subjects).map(s => s === 'ALL' ? 'ALL' : JSON.parse(s)),
      availableStudents: Array.from(students).map(s => s === 'ALL' ? 'ALL' : JSON.parse(s))
    };
  }, [institutionCourses, allCourses, allLevels, allBatches, allClasses, allSubjects, allStudents, rawMarksData, selectedInstituteId, selectedCourseId, selectedLevelId, selectedBatchId, selectedClassId, selectedSubjectId]);

  // Calculate overall summary
  const overallSummary = useMemo(() => {
    const totalStudents = processedData.reduce((sum, d) => sum + d.totalStudents, 0);
    const totalBatches = processedData.reduce((sum, d) => sum + d.totalBatches, 0);
    const totalSubjects = processedData.reduce((sum, d) => sum + d.totalSubjects, 0);
    const avgMarks = processedData.reduce((sum, d) => sum + d.avgMarks, 0) / (processedData.length || 1);
    const avgAttendance = processedData.reduce((sum, d) => sum + d.attendanceRate, 0) / (processedData.length || 1);
    const totalPassed = processedData.reduce((sum, d) => sum + d.passedCount, 0);
    const totalFailed = processedData.reduce((sum, d) => sum + d.failedCount, 0);

    return {
      totalStudents: Math.max(totalStudents, 0),
      totalBatches: Math.max(totalBatches, 0),
      totalSubjects: Math.max(totalSubjects, 0),
      avgMarks: Math.round(avgMarks) || 0,
      avgAttendance: Math.round(avgAttendance) || 0,
      totalPassed,
      totalFailed,
      passRate: (totalPassed + totalFailed) > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0
    };
  }, [processedData]);

  // Chart data
  const chartMarksData = useMemo(() => {
    return processedData.map(d => ({
      name: d.name,
      'Avg Marks': d.avgMarks,
      'Pass Rate (%)': d.passRate
    }));
  }, [processedData]);

  const chartAttendanceData = useMemo(() => {
    return processedData.map(d => ({
      name: d.name,
      'Attendance (%)': d.attendanceRate
    }));
  }, [processedData]);

  const passFailPieData = [
    { name: 'Passed', value: overallSummary.totalPassed },
    { name: 'Failed', value: overallSummary.totalFailed }
  ].filter(d => d.value > 0);

  // Filter handlers
  const clearCourseFilter = useCallback(() => {
    setSelectedCourseId('ALL');
    setSelectedLevelId('ALL');
    setSelectedBatchId('ALL');
    setSelectedClassId('ALL');
    setSelectedSubjectId('ALL');
    setSelectedStudentId('ALL');
  }, []);

  const clearLevelFilter = useCallback(() => {
    setSelectedLevelId('ALL');
    setSelectedBatchId('ALL');
    setSelectedClassId('ALL');
    setSelectedSubjectId('ALL');
    setSelectedStudentId('ALL');
  }, []);

  const clearBatchFilter = useCallback(() => {
    setSelectedBatchId('ALL');
    setSelectedClassId('ALL');
    setSelectedSubjectId('ALL');
    setSelectedStudentId('ALL');
  }, []);

  const clearClassFilter = useCallback(() => {
    setSelectedClassId('ALL');
    setSelectedSubjectId('ALL');
    setSelectedStudentId('ALL');
  }, []);

  const clearSubjectFilter = useCallback(() => {
    setSelectedSubjectId('ALL');
    setSelectedStudentId('ALL');
  }, []);

  const clearStudentFilter = useCallback(() => {
    setSelectedStudentId('ALL');
  }, []);

  const instituteOptions = [
    { id: 'ALL', name: 'All Institutes (Comparison View)' },
    ...institutions.map(inst => ({
      id: inst.id,
      name: inst.institute_name
    }))
  ];

  const isAllInstitutes = selectedInstituteId === 'ALL';
  const isAllCourses = selectedCourseId === 'ALL';
  const isAllLevels = selectedLevelId === 'ALL';
  const isAllBatches = selectedBatchId === 'ALL';
  const isAllClasses = selectedClassId === 'ALL';
  const isAllSubjects = selectedSubjectId === 'ALL';
  const isAllStudents = selectedStudentId === 'ALL';

  if (loading) {
    return (
      <div className="SARA_dashboard-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="SARA_dashboard-container">
        <div className="error-message" style={{ padding: '20px', color: 'red' }}>
          Error loading reports: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="SARA_dashboard-container">
      <h1 className="SARA_dashboard-title">Analytics and Reports</h1>

      {/* FILTER BOX */}
      <div className="SARA_filter-box">
        <div className="SARA_filter-row">
          {/* 1. Institute Filter */}
          <div className="SARA_filter-group">
            <label htmlFor="institute-select" className="SARA_filter-label">Institute:</label>
            <select
              id="institute-select"
              value={selectedInstituteId}
              onChange={(e) => {
                setSelectedInstituteId(e.target.value);
                clearCourseFilter();
              }}
              className="SARA_filter-select"
            >
              {instituteOptions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Course Filter */}
          {!isAllInstitutes && (
            <div className="SARA_filter-group">
              <label htmlFor="course-select" className="SARA_filter-label">Course:</label>
              <select
                id="course-select"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  clearLevelFilter();
                }}
                className="SARA_filter-select"
              >
                {availableCourses.map(course => (
                  <option key={course === 'ALL' ? 'ALL' : course.id} value={course === 'ALL' ? 'ALL' : course.id}>
                    {course === 'ALL' ? 'All Courses' : `${course.code} - ${course.name}`}
                  </option>
                ))}
              </select>
              {!isAllCourses && (
                <button className="SARA_clear-button" onClick={clearCourseFilter} title="Clear Course Filter">
                  &times;
                </button>
              )}
            </div>
          )}

          {/* 3. Level Filter */}
          {!isAllInstitutes && !isAllCourses && (
            <div className="SARA_filter-group">
              <label htmlFor="level-select" className="SARA_filter-label">Level:</label>
              <select
                id="level-select"
                value={selectedLevelId}
                onChange={(e) => {
                  setSelectedLevelId(e.target.value);
                  clearBatchFilter();
                }}
                className="SARA_filter-select"
              >
                {availableLevels.map(level => (
                  <option key={level === 'ALL' ? 'ALL' : level.id} value={level === 'ALL' ? 'ALL' : level.id}>
                    {level === 'ALL' ? 'All Levels' : level.name}
                  </option>
                ))}
              </select>
              {!isAllLevels && (
                <button className="SARA_clear-button" onClick={clearLevelFilter} title="Clear Level Filter">
                  &times;
                </button>
              )}
            </div>
          )}

          {/* 4. Batch Filter */}
          {!isAllInstitutes && !isAllCourses && !isAllLevels && (
            <div className="SARA_filter-group">
              <label htmlFor="batch-select" className="SARA_filter-label">Batch:</label>
              <select
                id="batch-select"
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  clearClassFilter();
                }}
                className="SARA_filter-select"
              >
                {availableBatches.map(batch => (
                  <option key={batch === 'ALL' ? 'ALL' : batch.id} value={batch === 'ALL' ? 'ALL' : batch.id}>
                    {batch === 'ALL' ? 'All Batches' : batch.name}
                  </option>
                ))}
              </select>
              {!isAllBatches && (
                <button className="SARA_clear-button" onClick={clearBatchFilter} title="Clear Batch Filter">
                  &times;
                </button>
              )}
            </div>
          )}

          {/* 5. Class Filter */}
          {!isAllInstitutes && !isAllCourses && !isAllLevels && !isAllBatches && (
            <div className="SARA_filter-group">
              <label htmlFor="class-select" className="SARA_filter-label">Class:</label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  clearSubjectFilter();
                }}
                className="SARA_filter-select"
              >
                {availableClasses.map(cls => (
                  <option key={cls === 'ALL' ? 'ALL' : cls.id} value={cls === 'ALL' ? 'ALL' : cls.id}>
                    {cls === 'ALL' ? 'All Classes' : cls.name}
                  </option>
                ))}
              </select>
              {!isAllClasses && (
                <button className="SARA_clear-button" onClick={clearClassFilter} title="Clear Class Filter">
                  &times;
                </button>
              )}
            </div>
          )}

          {/* 6. Subject Filter */}
          {!isAllInstitutes && !isAllClasses && (
            <div className="SARA_filter-group">
              <label htmlFor="subject-select" className="SARA_filter-label">Subject:</label>
              <select
                id="subject-select"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  clearStudentFilter();
                }}
                className="SARA_filter-select"
              >
                {availableSubjects.map(subject => (
                  <option key={subject === 'ALL' ? 'ALL' : subject.id} value={subject === 'ALL' ? 'ALL' : subject.id}>
                    {subject === 'ALL' ? 'All Subjects' : subject.name}
                  </option>
                ))}
              </select>
              {!isAllSubjects && (
                <button className="SARA_clear-button" onClick={clearSubjectFilter} title="Clear Subject Filter">
                  &times;
                </button>
              )}
            </div>
          )}

          {/* 7. Student Filter */}
          {!isAllInstitutes && !isAllSubjects && (
            <div className="SARA_filter-group">
              <label htmlFor="student-select" className="SARA_filter-label">Student:</label>
              <select
                id="student-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="SARA_filter-select"
              >
                {availableStudents.map(student => (
                  <option key={student === 'ALL' ? 'ALL' : student.id} value={student === 'ALL' ? 'ALL' : student.id}>
                    {student === 'ALL' ? 'All Students' : student.name}
                  </option>
                ))}
              </select>
              {!isAllStudents && (
                <button className="SARA_clear-button" onClick={clearStudentFilter} title="Clear Student Filter">
                  &times;
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="SARA_two-column-grid">
        <div className="SARA_chart-card">
          <h3 className="SARA_card-title">1. Overall Aggregated Metrics</h3>
          <p className="SARA_card-subtitle">Summary indicators based on currently filtered data</p>
          <div className="SARA_summary-metrics-row">
            <div>
              <div className="SARA_summary-value SARA_marks-value">{overallSummary.avgMarks}</div>
              <div className="SARA_summary-label">Avg Marks</div>
            </div>
            <div>
              <div className="SARA_summary-value SARA_attendance-value">{overallSummary.avgAttendance}%</div>
              <div className="SARA_summary-label">Avg Attendance</div>
            </div>
            <div>
              <div className="SARA_summary-value SARA_students-value">{overallSummary.totalStudents}</div>
              <div className="SARA_summary-label">Total Students</div>
            </div>
          </div>
        </div>

        <div className="SARA_chart-card">
          <h3 className="SARA_card-title">2. Overall Passed vs Failed Students</h3>
          <p className="SARA_card-subtitle">Pass rate: {overallSummary.passRate}%</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={passFailPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {passFailPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} Students`} />
              <Legend layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* HORIZONTAL CHARTS */}
      <div className="SARA_horizontal-report-grid">
        <div className="SARA_chart-card">
          <h3 className="SARA_card-title">3. Marks & Pass Rate Report</h3>
          <p className="SARA_card-subtitle">Grouped by {groupByLevel}</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartMarksData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} style={{ fontSize: '11px' }} />
              <YAxis label={{ value: 'Marks', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Avg Marks" fill={CHART_COLORS.Marks} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pass Rate (%)" fill={CHART_COLORS.Pass} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="SARA_chart-card">
          <h3 className="SARA_card-title">4. Attendance Report</h3>
          <p className="SARA_card-subtitle">Grouped by {groupByLevel}</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartAttendanceData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} style={{ fontSize: '11px' }} />
              <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Attendance (%)" fill={CHART_COLORS.Attendance} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default ReportsAnalytics;
