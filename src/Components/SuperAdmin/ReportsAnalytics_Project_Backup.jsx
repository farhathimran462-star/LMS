import { styles } from './ReportsAndAnalytics'; // IMPORTANT: Import the separate styles file
import rawData from '../dummy.json'; 
import '../../Styles/SuperAdmin/ReportsAnalytics.css';

import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

// ===================================================================
// 1. DATA CONFIGURATION & CONSTANTS
// ===================================================================

const COURSE_SUBJECTS = {
    'CA': {
        'Foundation': { subjects: ['Accounting', 'Business Laws', 'Quantitative Aptitude'], totalMarks: 400 },
        'Intermediate': { subjects: ['Taxation', 'Corporate Law', 'Cost & Mgmt Acct', 'Advanced Accounts'], totalMarks: 800 },
        'Final': { subjects: ['Financial Reporting', 'Strategic Mgmt', 'Audit'], totalMarks: 800 },
    },
    'CMA': {
        'Foundation': { subjects: ['Fundamentals of Law', 'Economics', 'Business Maths'], totalMarks: 400 },
        'Intermediate': { subjects: ['Cost Accounting', 'Operations Mgmt', 'Taxation', 'Financial Accounting'], totalMarks: 800 },
        'Advanced': { subjects: ['Corporate Financial Reporting', 'Advanced Financial Mgmt', 'Strategic Performance Mgmt'], totalMarks: 800 },
    }
};

// --- CHART COLORS: Map to CSS Variables for Recharts ---
const CHART_COLORS = {
    Marks: 'var(--brand-pink)',
    Attendance: 'var(--brand-orange-dark)',
    Pass: 'var(--color-success)',
    Fail: 'var(--color-error)',
};

const PIE_COLORS = [CHART_COLORS.Pass, CHART_COLORS.Fail];

// ===================================================================
// 2. DATA SIMULATION & UTILITIES (No change)
// ===================================================================

const simulateStudentSubjectData = (subjectName, totalStudents) => {
    const studentData = [];
    for (let i = 1; i <= totalStudents; i++) {
        const studentId = `S${String(i).padStart(3, '0')}`;
        const marks = Math.round(Math.random() * 50 + 40); 
        const attendance = Math.round(Math.random() * 30 + 70); 

        studentData.push({
            studentId: studentId,
            name: `Student ${i}`,
            [subjectName + '_Marks']: marks,
            [subjectName + '_Attendance']: attendance,
            marks: marks, 
            attendance: attendance, 
        });
    }
    return studentData;
}


const simulateSubjectPerformance = (courseId, levelName, batchId, studentCount) => {
    const courseConfig = COURSE_SUBJECTS[courseId] ? COURSE_SUBJECTS[courseId][levelName] : null;
    if (!courseConfig) return null;

    const totalStudents = studentCount;
    const subjectMaxMarks = courseConfig.totalMarks / courseConfig.subjects.length;
    const basePassRate = (levelName === 'Foundation' ? 75 : levelName === 'Intermediate' ? 60 : 50); 
    const baseAttendance = 85;

    const subjectData = courseConfig.subjects.map((subject, index) => {
        const markModifier = [1.0, 0.9, 1.1, 0.95][index % 4]; 
        const passModifier = [1.0, 0.95, 1.05, 1.0][index % 4];
        
        const avgMark = Math.min(subjectMaxMarks, subjectMaxMarks * (Math.random() * 0.2 + 0.65) * markModifier); 
        const passRate = Math.min(95, basePassRate * passModifier + (Math.random() * 10 - 5)); 
        
        const studentsPassed = Math.round(totalStudents * (passRate / 100));
        
        const detailedStudentData = simulateStudentSubjectData(subject, totalStudents);

        return {
            subjectName: subject,
            maxMarks: subjectMaxMarks,
            avgMark: Math.round(avgMark),
            passRate: Math.round(passRate),
            studentsPassed: studentsPassed,
            studentsFailed: totalStudents - studentsPassed,
            studentData: detailedStudentData,
        };
    });

    const overallAvgMarks = subjectData.reduce((sum, s) => sum + s.avgMark, 0);
    const overallPassRate = subjectData.reduce((sum, s) => sum + s.passRate, 0) / subjectData.length;
    const totalPassedOverall = subjectData.reduce((sum, s) => sum + s.studentsPassed, 0);
    const avgPassed = Math.round(totalPassedOverall / subjectData.length);
    const attendanceRate = Math.min(95, baseAttendance + (Math.random() * 5));

    return {
        subjectData: subjectData,
        overallMetrics: {
            totalStudents: totalStudents,
            totalMarks: courseConfig.totalMarks,
            overallAvgMarks: Math.round(overallAvgMarks),
            overallPassRate: Math.round(overallPassRate),
            totalPassed: avgPassed,
            totalFailed: totalStudents - avgPassed,
            avgAttendanceRate: Math.round(attendanceRate),
        }
    };
};

const instituteMap = rawData.institutions_reference.reduce((acc, inst) => {
  acc[inst.institution_id] = inst.name;
  return acc;
}, {});

const processedData = [];
const courseLevelOptions = [];

rawData.data.forEach(instData => {
  const institutionName = instituteMap[instData.institution_id];
  instData.courses.forEach(course => {
    course.levels.forEach(level => {
      const courseLevelKey = `${course.course_id} - ${level.level_name}`;
      if (!courseLevelOptions.includes(courseLevelKey)) {
        courseLevelOptions.push(courseLevelKey);
      }

      level.batches.forEach(batch => {
        let totalStudents = 0;
        batch.classes.forEach(cls => {
          totalStudents += cls.students_ids.length;
        });

        const metrics = simulateSubjectPerformance(course.course_id, level.level_name, batch.batch_id, totalStudents);

        if (metrics) {
            processedData.push({
              institutionId: instData.institution_id,
              institution: institutionName,
              course: course.course_id,
              level: level.level_name,
              courseLevelKey: courseLevelKey,
              batchName: rawData.batches_reference.find(b => b.batch_id === batch.batch_id)?.batch_name || batch.batch_id,
              batchId: batch.batch_id,
              ...metrics.overallMetrics,
              subjectData: metrics.subjectData,
            });
        }
      });
    });
  });
});

const instituteOptions = [
    { id: 'ALL', name: 'All Institutes (Comparison View)' },
    ...rawData.institutions_reference.map(inst => ({
        id: inst.institution_id,
        name: inst.name,
    })),
];

// ===================================================================
// 3. REACT COMPONENT & DYNAMIC DATA GENERATION
// ===================================================================

const ReportsAnalytics = () => {
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('ALL'); 
  const [selectedBatchName, setSelectedBatchName] = useState('ALL');
  const [selectedSubjectName, setSelectedSubjectName] = useState('ALL');

  // --- Filtering Logic (No change) ---

  const instituteFilteredData = useMemo(() => {
    if (selectedInstituteId === 'ALL') {
      return processedData;
    }
    return processedData.filter(d => d.institutionId === selectedInstituteId);
  }, [selectedInstituteId]);

  const availableCourses = useMemo(() => {
    const courses = instituteFilteredData.map(d => d.courseLevelKey);
    const uniqueCourses = [...new Set(courses)].sort();
    return ['ALL', ...uniqueCourses];
  }, [instituteFilteredData]);

  const courseFilteredData = useMemo(() => {
    if (selectedCourseLevel === 'ALL') {
        return instituteFilteredData;
    }
    return instituteFilteredData.filter(d => d.courseLevelKey === selectedCourseLevel);
  }, [selectedCourseLevel, instituteFilteredData]);

  const availableBatches = useMemo(() => {
    const batches = courseFilteredData.map(d => d.batchName);
    const uniqueBatches = [...new Set(batches)].sort();
    return ['ALL', ...uniqueBatches];
  }, [courseFilteredData]);

  const batchFilteredData = useMemo(() => {
    if (selectedBatchName === 'ALL') {
      return courseFilteredData;
    }
    return courseFilteredData.filter(d => d.batchName === selectedBatchName);
  }, [selectedBatchName, courseFilteredData]);

  const availableSubjects = useMemo(() => {
    if (selectedBatchName !== 'ALL' && batchFilteredData.length === 1) {
        return ['ALL', ...batchFilteredData[0].subjectData.map(s => s.subjectName)];
    }
    return ['ALL'];
  }, [batchFilteredData, selectedBatchName]);

  const finalFilteredData = useMemo(() => {
      if (selectedSubjectName !== 'ALL' && batchFilteredData.length === 1) {
          return batchFilteredData;
      }
      return batchFilteredData; 
  }, [selectedSubjectName, batchFilteredData]);


  // --- Helper States for Conditional Rendering (No change) ---
  const isAllInstitutes = selectedInstituteId === 'ALL';
  const isAllCourses = selectedCourseLevel === 'ALL';
  const isAllBatches = selectedBatchName === 'ALL';
  const isAllSubjects = selectedSubjectName === 'ALL';
  
  const selectedInstituteName = instituteOptions.find(opt => opt.id === selectedInstituteId)?.name || 'All Institutes';

  // --- Clear Filter Callbacks (No change) ---
  const clearCourseFilter = useCallback(() => {
    setSelectedCourseLevel('ALL');
    setSelectedBatchName('ALL');
    setSelectedSubjectName('ALL');
  }, []);

  const clearBatchFilter = useCallback(() => {
    setSelectedBatchName('ALL');
    setSelectedSubjectName('ALL');
  }, []);

  const clearSubjectFilter = useCallback(() => {
    setSelectedSubjectName('ALL');
  }, []);

  // --- Core Graph Data Generation (No change) ---
  const { chartMarksData, chartAttendanceData, chartXAxis, chartTitle } = useMemo(() => {
    
    // ... (Logic remains identical)
    
    // --- MODE 4: SUBJECT SELECTED (Student vs Student) ---
    if (!isAllSubjects && finalFilteredData.length === 1) {
        const batch = finalFilteredData[0];
        const subject = batch.subjectData.find(s => s.subjectName === selectedSubjectName);
        if (!subject) return { chartMarksData: [], chartAttendanceData: [], chartXAxis: 'name', chartTitle: 'Error: Subject not found' };

        const marksData = subject.studentData.map(s => ({ 
            name: s.name, 
            'Marks': s.marks 
        }));
        const attendanceData = subject.studentData.map(s => ({ 
            name: s.name, 
            'Attendance (%)': s.attendance 
        }));

        return {
            chartMarksData: marksData,
            chartAttendanceData: attendanceData,
            chartXAxis: 'name',
            chartTitle: `Marks & Attendance of Individual Students in: ${selectedSubjectName}`,
        };
    }

    // --- MODE 3: BATCH SELECTED (Subject vs Subject) ---
    if (!isAllBatches && finalFilteredData.length === 1) {
        const batch = finalFilteredData[0];
        const marksData = batch.subjectData.map(s => ({ name: s.subjectName, 'Avg Marks': s.avgMark }));
        const attendanceData = batch.subjectData.map(s => ({ name: s.subjectName, 'Pass Rate (%)': s.passRate }));
        return {
            chartMarksData: marksData,
            chartAttendanceData: attendanceData,
            chartXAxis: 'name',
            chartTitle: `Subject-wise Marks & Pass Rate for Batch: ${selectedBatchName}`,
        };
    }

    // --- MODE 2: COURSE/LEVEL SELECTED (Batch vs Batch) ---
    if (!isAllCourses) {
        const comparisonData = finalFilteredData.reduce((acc, d) => {
            if (!acc[d.batchName]) {
                acc[d.batchName] = { name: d.batchName, totalMarks: 0, totalAttendance: 0, count: 0 };
            }
            acc[d.batchName].totalMarks += d.overallAvgMarks;
            acc[d.batchName].totalAttendance += d.avgAttendanceRate;
            acc[d.batchName].count += 1;
            return acc;
        }, {});

        const marksData = Object.values(comparisonData).map(d => ({
            name: d.name,
            'Avg Marks': Math.round(d.totalMarks / d.count),
        }));
        const attendanceData = Object.values(comparisonData).map(d => ({
            name: d.name,
            'Avg Attendance (%)': Math.round(d.totalAttendance / d.count),
        }));

        return {
            chartMarksData: marksData,
            chartAttendanceData: attendanceData,
            chartXAxis: 'name',
            chartTitle: `Batch-wise Comparison for Course: ${selectedCourseLevel}`,
        };
    }

    // --- MODE 1 (DEFAULT): INSTITUTE SELECTED (Institute vs Institute or Course vs Course) ---
    const dataKey = isAllInstitutes ? 'institution' : 'courseLevelKey';
    
    const comparisonData = finalFilteredData.reduce((acc, d) => {
        const key = d[dataKey];
        if (!acc[key]) {
            acc[key] = { name: key, totalMarks: 0, totalAttendance: 0, count: 0 };
        }
        acc[key].totalMarks += d.overallAvgMarks;
        acc[key].totalAttendance += d.avgAttendanceRate;
        acc[key].count += 1;
        return acc;
    }, {});

    const marksData = Object.values(comparisonData).map(d => ({
        name: d.name,
        'Avg Marks': Math.round(d.totalMarks / d.count),
    }));
    const attendanceData = Object.values(comparisonData).map(d => ({
        name: d.name,
        'Avg Attendance (%)': Math.round(d.totalAttendance / d.count),
    }));

    return {
        chartMarksData: marksData,
        chartAttendanceData: attendanceData,
        chartXAxis: 'name',
        chartTitle: isAllInstitutes ? 'Overall Marks & Attendance: Institute Comparison' : `Course-wise Comparison for ${selectedInstituteName}`,
    };
  }, [isAllSubjects, isAllCourses, isAllInstitutes, selectedBatchName, selectedSubjectName, finalFilteredData, selectedInstituteName]);


  // --- Overall Summary Metrics (for Cards) ---
  const overallSummary = useMemo(() => {
    const data = isAllSubjects ? batchFilteredData : finalFilteredData;
    
    const totalStudents = data.reduce((sum, d) => sum + d.totalStudents, 0);
    const totalAvgMarks = data.reduce((sum, d) => sum + d.overallAvgMarks, 0) / (data.length || 1);
    const totalAttendanceRate = data.reduce((sum, d) => sum + d.avgAttendanceRate, 0) / (data.length || 1);
    const totalPassed = data.reduce((sum, d) => sum + d.totalPassed, 0);
    const totalFailed = data.reduce((sum, d) => sum + d.totalFailed, 0);

    return {
        totalStudents,
        totalAvgMarks: Math.round(totalAvgMarks),
        totalAttendanceRate: Math.round(totalAttendanceRate),
        totalPassed,
        totalFailed,
    };
  }, [isAllSubjects, finalFilteredData, batchFilteredData]);

  // DATA 2 (PASS/FAIL: Top-Right Chart)
  const passFailPieData = [
    { name: 'Passed', value: overallSummary.totalPassed },
    { name: 'Failed', value: overallSummary.totalFailed },
  ].filter(d => d.value > 0);
  
  // Set bar width and container width for horizontal scrolling in student view
  const studentCount = isAllSubjects && finalFilteredData.length === 1 ? finalFilteredData[0].totalStudents : 0;
  const barWidth = studentCount > 0 ? 15 : 25; 
  // Inline style remains for dynamic width calculation (Recharts requirement for scrolling)
  const chartWidthStyle = { width: studentCount > 0 ? studentCount * 45 : '100%' };


  return (
    <div className="SARA_dashboard-container">
      <h1 className="SARA_dashboard-title">Analytics and Reports</h1>

      {/* FILTER BOX */}
      <div className="SARA_filter-box">
        <div className="SARA_filter-row">
            {/* 1. Institute Filter (Always Visible) */}
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

            {/* 2. Course/Level Filter (Visible if ALL Institutes is NOT selected) */}
            {!isAllInstitutes && (
                <div className="SARA_filter-group">
                    <label htmlFor="course-select" className="SARA_filter-label">Course/Level:</label>
                    <select
                    id="course-select"
                    value={selectedCourseLevel}
                    onChange={(e) => {
                        setSelectedCourseLevel(e.target.value);
                        clearBatchFilter();
                    }}
                    className="SARA_filter-select"
                    >
                    {availableCourses.map(key => (
                        <option key={key} value={key}>
                            {key === 'ALL' ? 'All Courses (Comparison)' : key}
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
            
            {/* 3. Batch Filter (Visible if a specific Institute AND Course are selected) */}
            {!isAllInstitutes && !isAllCourses && (
                <div className="SARA_filter-group">
                    <label htmlFor="batch-select" className="SARA_filter-label">Batch:</label>
                    <select
                    id="batch-select"
                    value={selectedBatchName}
                    onChange={(e) => {
                        setSelectedBatchName(e.target.value);
                        clearSubjectFilter();
                    }}
                    className="SARA_filter-select"
                    >
                    {availableBatches.map(batch => (
                        <option key={batch} value={batch}>
                            {batch === 'ALL' ? 'All Batches (Comparison)' : batch}
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

             {/* 4. Subject Filter (Visible only if ONE specific Batch is selected) */}
            {!isAllInstitutes && !isAllCourses && !isAllBatches && (
                <div className="SARA_filter-group">
                    <label htmlFor="subject-select" className="SARA_filter-label">Subject:</label>
                    <select
                    id="subject-select"
                    value={selectedSubjectName}
                    onChange={(e) => setSelectedSubjectName(e.target.value)}
                    className="SARA_filter-select"
                    >
                    {availableSubjects.map(subject => (
                        <option key={subject} value={subject}>
                            {subject === 'ALL' ? 'All Students (Student-wise)' : subject}
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
        </div>
        
        
      </div>
      
      {/* ----------------------------------------------------------------- */}
      {/* 2-COLUMN (CROSS) SUMMARY CARDS */}
      {/* ----------------------------------------------------------------- */}
      <div className="SARA_two-column-grid">
        
        {/* CARD 1 (LEFT/SUMMARY METRICS) */}
        <div className="SARA_chart-card">
            <h3 className="SARA_card-title">1. Overall Aggregated Metrics</h3>
            <p className="SARA_card-subtitle">Summary indicators based on the currently filtered data set.</p>
            <div className="SARA_summary-metrics-row">
                <div>
                    <div className="SARA_summary-value SARA_marks-value">
                        {overallSummary.totalAvgMarks}
                    </div>
                    <div className="SARA_summary-label">Avg Marks (Overall)</div>
                </div>
                <div>
                    <div className="SARA_summary-value SARA_attendance-value">
                        {overallSummary.totalAttendanceRate}%
                    </div>
                    <div className="SARA_summary-label">Avg Attendance Rate</div>
                </div>
                <div>
                    <div className="SARA_summary-value SARA_students-value">
                        {overallSummary.totalStudents}
                    </div>
                    <div className="SARA_summary-label">Total Students</div>
                </div>
            </div>
        </div>

        {/* CARD 2 (RIGHT/PASS-FAIL PIE CHART) */}
        <div className="SARA_chart-card">
          <h3 className="SARA_card-title">2. Overall Passed vs Failed Students</h3>
          <p className="SARA_card-subtitle">Simulated total pass/fail counts for the current selection.</p>
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
      
      {/* ----------------------------------------------------------------- */}
      {/* FULL HORIZONTAL MARKS & ATTENDANCE REPORTS (2 Columns) */}
      {/* ----------------------------------------------------------------- */}
      <div className="SARA_horizontal-report-grid">
        
        {/* HORIZONTAL CHART 1: Marks Report */}
        <div className="SARA_chart-card">
            <h3 className="SARA_card-title">3. Marks Report</h3>
            <p className="SARA_card-subtitle">Tracking **Marks** (or Average Marks) across the relevant entities.</p>
            {/* Inline style kept for dynamic width calculation for student list scrolling */}
            <ResponsiveContainer width={chartWidthStyle.width} height={280}>
                <BarChart
                    data={chartMarksData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartXAxis} angle={-15} textAnchor="end" height={40} style={{ fontSize: '11px' }} />
                    <YAxis label={{ value: 'Marks', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => `${value} Marks`} />
                    <Legend />
                    <Bar dataKey="Avg Marks" fill={CHART_COLORS.Marks} radius={[4, 4, 0, 0]} barSize={barWidth} />
                    <Bar dataKey="Marks" fill={CHART_COLORS.Marks} radius={[4, 4, 0, 0]} barSize={barWidth} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* HORIZONTAL CHART 2: Attendance/Pass Rate Report */}
        <div className="SARA_chart-card">
            <h3 className="SARA_card-title">4. Attendance/Pass Rate Report</h3>
            <p className="SARA_card-subtitle">Tracking **Attendance** or **Pass Rate (%)** across the relevant entities.</p>
            {/* Inline style kept for dynamic width calculation for student list scrolling */}
            <ResponsiveContainer width={chartWidthStyle.width} height={280}>
                <BarChart
                    data={chartAttendanceData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartXAxis} angle={-15} textAnchor="end" height={40} style={{ fontSize: '11px' }} />
                    <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} domain={[50, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="Avg Attendance (%)" fill={CHART_COLORS.Attendance} radius={[4, 4, 0, 0]} barSize={barWidth} />
                    <Bar dataKey="Pass Rate (%)" fill={CHART_COLORS.Pass} radius={[4, 4, 0, 0]} barSize={barWidth} />
                    <Bar dataKey="Attendance (%)" fill={CHART_COLORS.Attendance} radius={[4, 4, 0, 0]} barSize={barWidth} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default ReportsAnalytics;