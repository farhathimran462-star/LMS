// TeacherReportsAndAnalytics.jsx - Teacher Reports with Real Database Data
// Last Updated: 2026-01-19 (Using Real Database API)
import '../../Styles/Teacher/TeacherReportsAndAnalytics.css'; 
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { getTeacherReportData, processReportData } from '../../api/reportsApi';

// --- NEW IMPORTS FOR EXPORT ---
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CHART COLORS ---
const CHART_COLORS = {
    Marks: '#e91e63',
    Assignment: '#ff9800', 
    Attendance: '#4caf50',
    Pass: '#4caf50', 
    Fail: '#f44336', 
};

const PIE_COLORS = [CHART_COLORS.Pass, CHART_COLORS.Fail];

// ===================================================================
// REACT COMPONENT
// ===================================================================

const TeacherReportsAnalytics = ({ userId }) => {
  // State for data from API
  const [rawMarksData, setRawMarksData] = useState([]);
  const [rawAttendanceData, setRawAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('ALL'); 
  const [selectedBatchName, setSelectedBatchName] = useState('ALL');
  const [selectedSubjectName, setSelectedSubjectName] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('ALL'); 
  
  // Export state
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch teacher report data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get current user's ID from sessionStorage if not passed as prop
        const teacherId = userId || JSON.parse(sessionStorage.getItem('userData'))?.id;
        
        if (!teacherId) {
          throw new Error('Teacher ID not found. Please log in again.');
        }

        const filters = {};
        if (selectedInstituteId !== 'ALL') {
          filters.institution_id = selectedInstituteId;
        }

        const { data, error } = await getTeacherReportData(teacherId, filters);
        
        if (error) throw error;
        
        setRawMarksData(data.marks || []);
        setRawAttendanceData(data.attendance || []);
      } catch (err) {
        console.error('Error fetching teacher report data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, selectedInstituteId]);

  // Extract unique institutions from data
  const availableInstitutions = useMemo(() => {
    const institutions = new Set();
    rawMarksData.forEach(mark => {
      if (mark.institutions?.id) {
        institutions.add(JSON.stringify({
          id: mark.institutions.id,
          name: mark.institutions.institution_name
        }));
      }
    });
    
    const instArray = Array.from(institutions).map(str => JSON.parse(str));
    return [
      { id: 'ALL', name: 'All Institutes' },
      ...instArray.sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, [rawMarksData]);

  // Process and filter data based on selections
  const { processedData, groupByLevel } = useMemo(() => {
    let groupBy = 'institution';
    let filteredMarks = rawMarksData;
    let filteredAttendance = rawAttendanceData;

    // Apply institute filter
    if (selectedInstituteId !== 'ALL') {
      filteredMarks = filteredMarks.filter(m => m.institutions?.id === selectedInstituteId);
      filteredAttendance = filteredAttendance.filter(a => a.classes?.institute_id === selectedInstituteId);
      
      // If institute selected, check for course/level filter
      if (selectedCourseLevel !== 'ALL') {
        const [courseCode, levelName] = selectedCourseLevel.split(' - ');
        filteredMarks = filteredMarks.filter(m => 
          m.courses?.course_code === courseCode && m.levels?.level_name === levelName
        );
        filteredAttendance = filteredAttendance.filter(a => 
          a.classes && 
          rawMarksData.some(m => 
            m.classes?.id === a.classes.id && 
            m.courses?.course_code === courseCode && 
            m.levels?.level_name === levelName
          )
        );
        
        // If course/level selected, check for batch filter
        if (selectedBatchName !== 'ALL') {
          filteredMarks = filteredMarks.filter(m => m.batches?.batch_name === selectedBatchName);
          filteredAttendance = filteredAttendance.filter(a => 
            a.classes && 
            rawMarksData.some(m => 
              m.classes?.id === a.classes.id && 
              m.batches?.batch_name === selectedBatchName
            )
          );
          
          // If batch selected, check for subject filter
          if (selectedSubjectName !== 'ALL') {
            filteredMarks = filteredMarks.filter(m => m.subjects?.subject_name === selectedSubjectName);
            
            // If subject selected, check for student filter
            if (selectedStudentId !== 'ALL') {
              groupBy = 'student';
              filteredMarks = filteredMarks.filter(m => m.students?.id === selectedStudentId);
              filteredAttendance = filteredAttendance.filter(a => a.students?.id === selectedStudentId);
            } else {
              groupBy = 'student'; // Show all students in subject
            }
          } else {
            groupBy = 'subject'; // Show all subjects in batch
          }
        } else {
          groupBy = 'batch'; // Show all batches in course
        }
      } else {
        groupBy = 'course'; // Show all courses in institution
      }
    }

    const processed = processReportData(filteredMarks, filteredAttendance, groupBy);
    return { processedData: processed, groupByLevel: groupBy };
  }, [rawMarksData, rawAttendanceData, selectedInstituteId, selectedCourseLevel, selectedBatchName, selectedSubjectName, selectedStudentId]);

  // Extract available courses/levels from filtered data
  const availableCourseLevels = useMemo(() => {
    if (selectedInstituteId === 'ALL') return ['ALL'];
    
    const courseLevels = new Set();
    rawMarksData
      .filter(m => m.institutions?.id === selectedInstituteId)
      .forEach(mark => {
        if (mark.courses && mark.levels) {
          courseLevels.add(`${mark.courses.course_code} - ${mark.levels.level_name}`);
        }
      });
    
    return ['ALL', ...Array.from(courseLevels).sort()];
  }, [rawMarksData, selectedInstituteId]);

  // Extract available batches
  const availableBatches = useMemo(() => {
    if (selectedCourseLevel === 'ALL') return ['ALL'];
    
    const [courseCode, levelName] = selectedCourseLevel.split(' - ');
    const batches = new Set();
    rawMarksData
      .filter(m => 
        m.institutions?.id === selectedInstituteId &&
        m.courses?.course_code === courseCode &&
        m.levels?.level_name === levelName
      )
      .forEach(mark => {
        if (mark.batches?.batch_name) {
          batches.add(mark.batches.batch_name);
        }
      });
    
    return ['ALL', ...Array.from(batches).sort()];
  }, [rawMarksData, selectedInstituteId, selectedCourseLevel]);

  // Extract available subjects
  const availableSubjects = useMemo(() => {
    if (selectedBatchName === 'ALL') return ['ALL'];
    
    const subjects = new Set();
    rawMarksData
      .filter(m => m.batches?.batch_name === selectedBatchName)
      .forEach(mark => {
        if (mark.subjects?.subject_name) {
          subjects.add(mark.subjects.subject_name);
        }
      });
    
    return ['ALL', ...Array.from(subjects).sort()];
  }, [rawMarksData, selectedBatchName]);

  // Extract available students
  const availableStudents = useMemo(() => {
    if (selectedSubjectName === 'ALL') return ['ALL'];
    
    const students = new Set();
    rawMarksData
      .filter(m => 
        m.batches?.batch_name === selectedBatchName &&
        m.subjects?.subject_name === selectedSubjectName
      )
      .forEach(mark => {
        if (mark.students) {
          students.add(JSON.stringify({
            id: mark.students.id,
            name: mark.students.Users?.username || `Student ${mark.students.roll_number}`
          }));
        }
      });
    
    const studentArray = Array.from(students).map(str => JSON.parse(str));
    return ['ALL', ...studentArray.sort((a, b) => a.name.localeCompare(b.name))];
  }, [rawMarksData, selectedBatchName, selectedSubjectName]); 
        });
    }
    return studentData;
}

const simulateSubjectPerformance = (courseId, levelName, teacherAssignment) => {
    const { subjects: teacherSubjects, totalStudents } = teacherAssignment;
    const courseConfig = COURSE_SUBJECTS[courseId] ? COURSE_SUBJECTS[courseId][levelName] : null;
    if (!courseConfig) return null;

    const subjectMaxMarks = courseConfig.totalMarks / courseConfig.subjects.length;
    const basePassRate = (levelName === 'Foundation' ? 75 : levelName === 'Intermediate' ? 60 : 50); 
    const baseAttendance = 85;

    const subjectsToSimulate = courseConfig.subjects.filter(subject => teacherSubjects.includes(subject));

    const subjectData = subjectsToSimulate.map((subject) => {
        const markModifier = Math.random() * 0.2 + 0.9; 
        const avgMark = Math.min(subjectMaxMarks, subjectMaxMarks * (Math.random() * 0.2 + 0.65) * markModifier); 
        const avgAssignmentMark = Math.min(subjectMaxMarks * 0.5, subjectMaxMarks * (Math.random() * 0.15 + 0.3) * markModifier);
        const passRate = Math.min(95, basePassRate * 1.0 + (Math.random() * 10 - 5)); 
        const studentsPassed = Math.round(totalStudents * (passRate / 100));
        const detailedStudentData = simulateStudentSubjectData(totalStudents);

        return {
            subjectName: subject,
            maxMarks: subjectMaxMarks,
            avgMark: Math.round(avgMark),
            avgAssignmentMark: Math.round(avgAssignmentMark),
            passRate: Math.round(passRate),
            studentsPassed: studentsPassed,
            studentsFailed: totalStudents - studentsPassed,
            studentData: detailedStudentData,
        };
    });
    
    // Calculate overall metrics for the batch
    const overallAvgMarks = subjectData.reduce((sum, s) => sum + s.avgMark, 0) / (subjectData.length || 1);
    const overallAvgAssignmentMarks = subjectData.reduce((sum, s) => sum + s.avgAssignmentMark, 0) / (subjectData.length || 1);
    const totalPassedOverall = subjectData.reduce((sum, s) => sum + s.studentsPassed, 0);
    const avgPassed = Math.round(totalPassedOverall / (subjectData.length || 1));
    const attendanceRate = Math.min(95, baseAttendance + (Math.random() * 5));

    return {
        subjectData: subjectData,
        overallMetrics: {
            totalStudents: totalStudents,
            overallAvgMarks: Math.round(overallAvgMarks),
            overallAvgAssignmentMarks: Math.round(overallAvgAssignmentMarks),
            totalPassed: avgPassed,
            totalFailed: totalStudents - avgPassed,
            avgAttendanceRate: Math.round(attendanceRate),
        }
    };
};

// --- Core Data Processing ---
const instituteMap = INSTITUTIONS_REF.reduce((acc, inst) => {
  acc[inst.institution_id] = { name: inst.name, location: inst.location };
  return acc;
}, {});

const teacherScopeData = [];

TEACHER_ASSIGNMENTS.forEach(assignment => {
    const { instId, course, level, batchName } = assignment;
    const institutionName = instituteMap[instId]?.name || `Unknown Institute ${instId}`;
    const metrics = simulateSubjectPerformance(course, level, assignment);

    if (metrics && metrics.subjectData.length > 0) {
        const courseLevelKey = `${course} - ${level}`;
        teacherScopeData.push({
            institutionId: instId,
            institution: institutionName,
            course: course,
            level: level,
            courseLevelKey: courseLevelKey,
            batchName: batchName,
            ...metrics.overallMetrics,
            subjectData: metrics.subjectData,
        });
    }
});

const instituteOptions = [
    { id: 'ALL', name: 'All Institutes (Comparison View)' },
    ...INSTITUTIONS_REF.filter(inst => teacherScopeData.some(d => d.institutionId === inst.institution_id))
        .map(inst => ({
            id: inst.institution_id,
            name: `${inst.name} (${inst.location})`,
        })),
];


// ===================================================================
// 3. REACT COMPONENT
// ===================================================================

const TeacherReportsAnalytics = () => {
  const [selectedInstituteId, setSelectedInstituteId] = useState('ALL');
  const [selectedCourseLevel, setSelectedCourseLevel] = useState('ALL'); 
  const [selectedBatchName, setSelectedBatchName] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('ALL'); 
  const [selectedSubjectName, setSelectedSubjectName] = useState('ALL');
  
  // --- Export State ---
  const [showExportModal, setShowExportModal] = useState(false);

  // --- 1. Filter Data Hierarchy ---

  // Level 1: Institute
  const instituteFilteredData = useMemo(() => {
    if (selectedInstituteId === 'ALL') { return teacherScopeData; }
    return teacherScopeData.filter(d => d.institutionId === selectedInstituteId);
  }, [selectedInstituteId]);

  // Level 2: Course
  const availableCourses = useMemo(() => {
    const courses = instituteFilteredData.map(d => d.courseLevelKey);
    const uniqueCourses = [...new Set(courses)].sort();
    return ['ALL', ...uniqueCourses];
  }, [instituteFilteredData]);

  const courseFilteredData = useMemo(() => {
    if (selectedCourseLevel === 'ALL') { return instituteFilteredData; }
    return instituteFilteredData.filter(d => d.courseLevelKey === selectedCourseLevel);
  }, [selectedCourseLevel, instituteFilteredData]);

  // Level 3: Batch
  const availableBatches = useMemo(() => {
    const batches = courseFilteredData.map(d => d.batchName);
    const uniqueBatches = [...new Set(batches)].sort();
    return ['ALL', ...uniqueBatches];
  }, [courseFilteredData]);

  const batchFilteredData = useMemo(() => {
    if (selectedBatchName === 'ALL') { return courseFilteredData; }
    return courseFilteredData.filter(d => d.batchName === selectedBatchName);
  }, [selectedBatchName, courseFilteredData]);

  // Level 4: Student 
  const availableStudents = useMemo(() => {
      if (selectedBatchName === 'ALL' || batchFilteredData.length === 0) return ['ALL'];
      const firstSubject = batchFilteredData[0].subjectData[0];
      if(!firstSubject) return ['ALL'];
      const roster = firstSubject.studentData.map(s => ({ id: s.studentId, name: s.name }));
      return ['ALL', ...roster];
  }, [batchFilteredData, selectedBatchName]);

  // Level 5: Subject
  const availableSubjects = useMemo(() => {
    if (selectedBatchName !== 'ALL' && batchFilteredData.length > 0) {
        return ['ALL', ...batchFilteredData[0].subjectData.map(s => s.subjectName)];
    }
    return ['ALL'];
  }, [batchFilteredData, selectedBatchName]);


  // --- Helper States ---
  const isAllInstitutes = selectedInstituteId === 'ALL';
  const isAllCourses = selectedCourseLevel === 'ALL';
  const isAllBatches = selectedBatchName === 'ALL';
  const isAllStudents = selectedStudentId === 'ALL';
  const isAllSubjects = selectedSubjectName === 'ALL';
  const selectedInstituteName = instituteOptions.find(opt => opt.id === selectedInstituteId)?.name || 'All Institutes';

  // --- Clear Filters ---
  const clearCourseFilter = useCallback(() => { setSelectedCourseLevel('ALL'); setSelectedBatchName('ALL'); setSelectedStudentId('ALL'); setSelectedSubjectName('ALL'); }, []);
  const clearBatchFilter = useCallback(() => { setSelectedBatchName('ALL'); setSelectedStudentId('ALL'); setSelectedSubjectName('ALL'); }, []);
  const clearStudentFilter = useCallback(() => { setSelectedStudentId('ALL'); }, []); 
  const clearSubjectFilter = useCallback(() => { setSelectedSubjectName('ALL'); }, []);

  // --- Summary Metrics Calculation ---
  const summaryMetrics = useMemo(() => {
    const data = batchFilteredData;
    let totalStudents = 0, uniqueBatches = new Set(data.map(d => d.batchName)).size, uniqueSubjects = 0;
    let sumMarks = 0, sumAssignment = 0, sumAttendance = 0, countItems = 0, passedCount = 0, failedCount = 0;

    if (!isAllStudents && data.length === 1) { // Single Student
        const batch = data[0];
        totalStudents = 1; 
        const relevantSubjects = isAllSubjects ? batch.subjectData : batch.subjectData.filter(s => s.subjectName === selectedSubjectName);
        uniqueSubjects = relevantSubjects.length;
        relevantSubjects.forEach(sub => {
            const studentRecord = sub.studentData.find(s => s.studentId === selectedStudentId);
            if (studentRecord) {
                sumMarks += studentRecord.marks; sumAssignment += studentRecord.assignmentMarks; sumAttendance += studentRecord.attendance; countItems++;
                if (studentRecord.marks >= 40) passedCount++; else failedCount++;
            }
        });
    } else if (!isAllSubjects && data.length === 1) { // Single Subject
        const batch = data[0];
        const subject = batch.subjectData.find(s => s.subjectName === selectedSubjectName);
        if (subject) {
            totalStudents = batch.totalStudents; uniqueSubjects = 1;
            sumMarks = subject.avgMark; sumAssignment = subject.avgAssignmentMark; sumAttendance = batch.avgAttendanceRate; 
            countItems = 1; passedCount = subject.studentsPassed; failedCount = subject.studentsFailed;
        }
    } else { // Overall
        totalStudents = data.reduce((sum, d) => sum + d.totalStudents, 0);
        const allSubjects = data.flatMap(d => d.subjectData.map(s => s.subjectName));
        uniqueSubjects = new Set(allSubjects).size;
        sumMarks = data.reduce((sum, d) => sum + d.overallAvgMarks, 0);
        sumAssignment = data.reduce((sum, d) => sum + d.overallAvgAssignmentMarks, 0);
        sumAttendance = data.reduce((sum, d) => sum + d.avgAttendanceRate, 0);
        countItems = data.length || 1;
        passedCount = data.reduce((sum, d) => sum + d.totalPassed, 0);
        failedCount = data.reduce((sum, d) => sum + d.totalFailed, 0);
    }

    const totalStudentsCounted = passedCount + failedCount; 
    const avgMarks = countItems ? sumMarks / countItems : 0;
    const avgAssignment = countItems ? sumAssignment / countItems : 0;
    const avgAttendance = countItems ? sumAttendance / countItems : 0;

    return {
        totalStudents, uniqueBatches, uniqueSubjects, 
        totalAvgMarks: Math.round(avgMarks), 
        totalAvgAssignmentMarks: Math.round(avgAssignment),
        totalAttendanceRate: Math.round(avgAttendance),
        totalPassed: passedCount, totalFailed: failedCount,
        passRate: totalStudentsCounted > 0 ? Math.round((passedCount / totalStudentsCounted) * 100) : 0,
        failRate: totalStudentsCounted > 0 ? Math.round((failedCount / totalStudentsCounted) * 100) : 0,
    };
  }, [isAllStudents, isAllSubjects, selectedStudentId, selectedSubjectName, batchFilteredData]);

  // --- Chart Data Logic (Simplified for readability, same as before) ---
  const overallPassFailData = useMemo(() => ([{ name: `Passed (${summaryMetrics.passRate}%)`, value: summaryMetrics.passRate }, { name: `Failed (${summaryMetrics.failRate}%)`, value: summaryMetrics.failRate }]), [summaryMetrics]);
  
  const subjectPassFailData = useMemo(() => {
      if (!isAllStudents && batchFilteredData.length > 0) {
          const batch = batchFilteredData[0];
          const relevantSubjects = isAllSubjects ? batch.subjectData : batch.subjectData.filter(s => s.subjectName === selectedSubjectName);
          return relevantSubjects.map(sub => {
              const rec = sub.studentData.find(s => s.studentId === selectedStudentId);
              return { name: sub.subjectName, Passed: (rec && rec.marks >= 40) ? 1 : 0, Failed: (rec && rec.marks >= 40) ? 0 : 1 };
          });
      }
      const data = batchFilteredData; 
      const subjectsToProcess = isAllSubjects ? data.flatMap(b => b.subjectData) : data.flatMap(b => b.subjectData.filter(s => s.subjectName === selectedSubjectName));
      const groupedData = subjectsToProcess.reduce((acc, item) => {
          if (!acc[item.subjectName]) { acc[item.subjectName] = { name: item.subjectName, Passed: 0, Failed: 0 }; }
          acc[item.subjectName].Passed += item.studentsPassed; acc[item.subjectName].Failed += item.studentsFailed; return acc;
      }, {});
      return Object.values(groupedData).sort((a, b) => a.name.localeCompare(b.name));
  }, [isAllStudents, isAllSubjects, selectedStudentId, selectedSubjectName, batchFilteredData]);

  const { chartMarksData, chartAttendanceData, chartXAxis, chartTitle, xAxisConfig } = useMemo(() => {
    let marksData = [], attendanceData = [], chartTitle = 'Overall Performance', chartXAxis = 'name', config = { angle: 0, textAnchor: 'middle', height: 30, style: { fontSize: '11px' } };

    if (!isAllStudents && batchFilteredData.length === 1) { // Single Student
        const batch = batchFilteredData[0];
        const subjects = isAllSubjects ? batch.subjectData : batch.subjectData.filter(s => s.subjectName === selectedSubjectName);
        marksData = subjects.map(sub => ({ name: sub.subjectName, 'Exam Marks': sub.studentData.find(std => std.studentId === selectedStudentId)?.marks || 0, 'Assignment Marks': sub.studentData.find(std => std.studentId === selectedStudentId)?.assignmentMarks || 0 }));
        attendanceData = subjects.map(sub => ({ name: sub.subjectName, 'Attendance (%)': sub.studentData.find(std => std.studentId === selectedStudentId)?.attendance || 0 }));
        chartTitle = `Performance: ${availableStudents.find(s => s.id === selectedStudentId)?.name || selectedStudentId}`;
    } else if (!isAllSubjects && batchFilteredData.length === 1) { // Single Subject
        const subject = batchFilteredData[0].subjectData.find(s => s.subjectName === selectedSubjectName);
        if(subject) {
            marksData = subject.studentData.map(s => ({ name: s.name, 'Exam Marks': s.marks, 'Assignment Marks': s.assignmentMarks }));
            attendanceData = subject.studentData.map(s => ({ name: s.name, 'Attendance (%)': s.attendance }));
            chartTitle = `Subject Details: ${selectedSubjectName}`;
            config = { angle: -90, textAnchor: 'end', height: 80, style: { fontSize: '10px' } };
        }
    } else if (!isAllBatches && batchFilteredData.length === 1) { // Batch (All Students)
        const batch = batchFilteredData[0];
        if(batch.subjectData.length > 0) {
             const studentMap = {}; 
             batch.subjectData.forEach(sub => sub.studentData.forEach(s => {
                 if(!studentMap[s.studentId]) studentMap[s.studentId] = { name: s.name, totalMarks: 0, totalAssignment: 0, totalAttendance: 0, count: 0 };
                 studentMap[s.studentId].totalMarks += s.marks; studentMap[s.studentId].totalAssignment += s.assignmentMarks; studentMap[s.studentId].totalAttendance += s.attendance; studentMap[s.studentId].count += 1;
             }));
             marksData = Object.values(studentMap).map(s => ({ name: s.name, 'Exam Marks': Math.round(s.totalMarks / s.count), 'Assignment Marks': Math.round(s.totalAssignment / s.count) }));
             attendanceData = Object.values(studentMap).map(s => ({ name: s.name, 'Attendance (%)': Math.round(s.totalAttendance / s.count) }));
             chartTitle = `Batch Performance: ${selectedBatchName}`;
             config = { angle: -90, textAnchor: 'end', height: 80, style: { fontSize: '10px' } };
        }
    } else { // Aggregates (Course/Institute)
        // Simplified fallback for higher levels
        const data = !isAllCourses ? batchFilteredData : (!isAllInstitutes ? instituteFilteredData : teacherScopeData);
        const groupBy = !isAllCourses ? 'batchName' : (!isAllInstitutes ? 'courseLevelKey' : 'institution');
        const agg = data.reduce((acc, d) => {
            if (!acc[d[groupBy]]) acc[d[groupBy]] = { name: d[groupBy], tm: 0, tam: 0, ta: 0, c: 0 };
            acc[d[groupBy]].tm += d.overallAvgMarks; acc[d[groupBy]].tam += d.overallAvgAssignmentMarks; acc[d[groupBy]].ta += d.avgAttendanceRate; acc[d[groupBy]].c++; return acc;
        }, {});
        marksData = Object.values(agg).map(d => ({ name: d.name, 'Avg Exam Marks': Math.round(d.tm/d.c), 'Avg Assignment Marks': Math.round(d.tam/d.c) }));
        attendanceData = Object.values(agg).map(d => ({ name: d.name, 'Avg Attendance (%)': Math.round(d.ta/d.c) }));
        chartTitle = `Overall Comparison`;
    }
    return { chartMarksData: marksData, chartAttendanceData: attendanceData, chartXAxis, chartTitle, xAxisConfig: config };
  }, [isAllSubjects, isAllStudents, isAllCourses, isAllInstitutes, selectedBatchName, selectedStudentId, selectedSubjectName, batchFilteredData, instituteFilteredData, teacherScopeData, availableStudents]);

  const chartWidthStyle = useMemo(() => ((!isAllBatches && isAllStudents && batchFilteredData.length === 1 && batchFilteredData[0].totalStudents > 0) ? { width: batchFilteredData[0].totalStudents * 45 } : { width: '100%' }), [batchFilteredData, isAllBatches, isAllStudents]);
  const barWidth = (!isAllBatches && isAllStudents && batchFilteredData.length === 1) ? 15 : 25;


  // ===================================================================
  // 4. EXPORT LOGIC
  // ===================================================================

  // --- Helper: Flatten Data ---
  const getFlattenedData = (scope) => {
      const sourceData = scope === 'FILTERED' ? batchFilteredData : teacherScopeData;
      let rows = [];

      sourceData.forEach(batch => {
          batch.subjectData.forEach(subject => {
              // Apply subject filter if active and scope is FILTERED
              if (scope === 'FILTERED' && !isAllSubjects && subject.subjectName !== selectedSubjectName) return;

              subject.studentData.forEach(student => {
                  // Apply student filter if active and scope is FILTERED
                  if (scope === 'FILTERED' && !isAllStudents && student.studentId !== selectedStudentId) return;

                  rows.push({
                      'Institution': batch.institution,
                      'Course': batch.course,
                      'Batch': batch.batchName,
                      'Student ID': student.studentId,
                      'Student Name': student.name,
                      'Subject': subject.subjectName,
                      'Exam Marks': student.marks,
                      'Assignment Marks': student.assignmentMarks,
                      'Attendance %': student.attendance,
                      'Status': student.marks >= 40 ? 'Pass' : 'Fail'
                  });
              });
          });
      });
      return rows;
  };

  // --- A. Generate Student Report Card (Special PDF) ---
  const generateStudentReportCard = (studentId) => {
      const studentName = availableStudents.find(s => s.id === studentId)?.name || 'Student';
      const batch = batchFilteredData[0];
      const institutionName = instituteMap[batch.institutionId]?.name || 'Institute';
      
      const doc = new jsPDF();

      // 1. Header Design
      doc.setFillColor(63, 81, 181); // Brand Blue
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(institutionName.toUpperCase(), 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text("OFFICIAL STUDENT PERFORMANCE REPORT", 105, 25, { align: 'center' });

      // 2. Student Details Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      
      doc.text(`Student Name: ${studentName}`, 14, 55);
      doc.text(`Student ID: ${studentId}`, 14, 62);
      doc.text(`Batch: ${batch.batchName}`, 140, 55);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 62);

      // 3. Subject Table
      const tableData = batch.subjectData.map(sub => {
          const rec = sub.studentData.find(s => s.studentId === studentId);
          return [
              sub.subjectName,
              rec?.marks || 0,
              rec?.assignmentMarks || 0,
              (rec?.marks || 0) + (rec?.assignmentMarks || 0),
              (rec?.marks >= 40 ? 'PASS' : 'FAIL')
          ];
      });

      autoTable(doc, {
          startY: 70,
          head: [['Subject', 'Exam Marks (100)', 'Assign. Marks (50)', 'Total', 'Status']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
              4: { fontStyle: 'bold' } // Status column
          },
          didParseCell: (data) => {
              // Color the Status Text
              if (data.section === 'body' && data.column.index === 4) {
                  if (data.cell.raw === 'FAIL') {
                      data.cell.styles.textColor = [220, 53, 69]; // Red
                  } else {
                      data.cell.styles.textColor = [40, 167, 69]; // Green
                  }
              }
          }
      });

      // 4. Footer / Summary
      const finalY = doc.lastAutoTable.finalY + 20;
      
      // Calculate Aggregate
      const totalExam = tableData.reduce((acc, curr) => acc + curr[1], 0);
      const avgExam = Math.round(totalExam / tableData.length);
      const isOverallPass = !tableData.some(row => row[4] === 'FAIL');

      // Visual Stamp
      doc.setDrawColor(isOverallPass ? 40 : 220, isOverallPass ? 167 : 53, 69); // Green or Red Border
      doc.setLineWidth(1);
      doc.rect(130, finalY, 60, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("FINAL RESULT", 160, finalY + 8, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isOverallPass ? 40 : 220, isOverallPass ? 167 : 53, 69);
      doc.text(isOverallPass ? "PASSED" : "FAILED", 160, finalY + 18, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      doc.setFont('helvetica', 'normal');
      doc.text(`Teacher Signature: ${TEACHER_NAME}`, 14, finalY + 25);

      doc.save(`${studentName}_ReportCard.pdf`);
  };

  // --- B. Generic Export Handlers ---
  const handleExport = (scope, format) => {
      // SPECIAL CASE: Single Student + PDF = Report Card
      if (scope === 'FILTERED' && !isAllStudents && format === 'PDF') {
          generateStudentReportCard(selectedStudentId);
          setShowExportModal(false);
          return;
      }

      // STANDARD EXPORT
      const data = getFlattenedData(scope);
      if (data.length === 0) {
          alert("No data available to export.");
          return;
      }

      const fileName = `Export_${scope}_${new Date().toISOString().slice(0,10)}`;

      if (format === 'EXCEL') {
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Report Data");
          XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else {
          // Generic PDF Table
          const doc = new jsPDF('l'); // Landscape for lots of columns
          doc.text(`Report Export (${scope})`, 14, 15);
          
          const tableColumn = Object.keys(data[0]);
          const tableRows = data.map(obj => Object.values(obj));

          autoTable(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: 20,
              styles: { fontSize: 8 },
              headStyles: { fillColor: [63, 81, 181] }
          });
          doc.save(`${fileName}.pdf`);
      }
      setShowExportModal(false);
  };

  return (
    <div className="TARA_dashboard-container">
      <h1 className="TARA_dashboard-title">Reports & Analytics </h1>

      {/* FILTER BOX */}
      <div className="TARA_filter-box">
        <div className="TARA_filter-row">
            
            {/* 1. INSTITUTE */}
            <div className="TARA_filter-group">
                <label htmlFor="institute-select" className="TARA_filter-label">Institute:</label>
                <select id="institute-select" value={selectedInstituteId} onChange={(e) => { setSelectedInstituteId(e.target.value); clearCourseFilter(); }} className="TARA_filter-select">
                {instituteOptions.map(inst => (<option key={inst.id} value={inst.id}>{inst.name}</option>))}
                </select>
            </div>

            {/* 2. COURSE */}
            {!isAllInstitutes && (
                <div className="TARA_filter-group">
                    <label htmlFor="course-select" className="TARA_filter-label">Courses</label>
                    <select id="course-select" value={selectedCourseLevel} onChange={(e) => { setSelectedCourseLevel(e.target.value); clearBatchFilter(); }} className="TARA_filter-select">
                        {availableCourses.map(key => (<option key={key} value={key}>{key === 'ALL' ? 'All Courses (Comparison)' : key}</option>))}
                    </select>
                    {!isAllCourses && (<button className="TARA_clear-button" onClick={clearCourseFilter}>&times;</button>)}
                </div>
            )}

            {/* 3. BATCH */}
            {!isAllCourses && (
                <div className="TARA_filter-group">
                    <label htmlFor="batch-select" className="TARA_filter-label">Batch:</label>
                    <select id="batch-select" value={selectedBatchName} onChange={(e) => { setSelectedBatchName(e.target.value); setSelectedStudentId('ALL'); setSelectedSubjectName('ALL'); }} className="TARA_filter-select">
                        {availableBatches.map(batch => (<option key={batch} value={batch}>{batch === 'ALL' ? 'All Batches (Comparison)' : batch}</option>))}
                    </select>
                    {!isAllBatches && ( <button className="TARA_clear-button" onClick={clearBatchFilter}>&times;</button>)}
                </div>
            )}

            {/* 4. STUDENT */}
            {!isAllBatches && (
                 <div className="TARA_filter-group">
                    <label htmlFor="student-select" className="TARA_filter-label">Student:</label>
                    <select id="student-select" value={selectedStudentId} onChange={(e) => { setSelectedStudentId(e.target.value); }} className="TARA_filter-select">
                        {availableStudents.map(s => {
                            const val = typeof s === 'string' ? s : s.id;
                            const label = typeof s === 'string' ? 'All Students (Batch Avg)' : s.name;
                            return <option key={val} value={val}>{label}</option>
                        })}
                    </select>
                    {!isAllStudents && (<button className="TARA_clear-button" onClick={clearStudentFilter}>&times;</button>)}
                </div>
            )}

            {/* 5. SUBJECT */}
            {!isAllBatches && availableSubjects.length > 2 && (
                <div className="TARA_filter-group">
                    <label htmlFor="subject-select" className="TARA_filter-label">Subject:</label>
                    <select id="subject-select" value={selectedSubjectName} onChange={(e) => setSelectedSubjectName(e.target.value)} className="TARA_filter-select">
                        {availableSubjects.map(subject => (<option key={subject} value={subject}>{subject === 'ALL' ? 'All Subjects' : subject}</option>))}
                    </select>
                    {!isAllSubjects && (<button className="TARA_clear-button" onClick={clearSubjectFilter}>&times;</button>)}
                </div>
            )}

            {/* --- EXPORT BUTTON --- */}
            <div className="TARA_filter-group" style={{ marginLeft: 'auto' }}>
                <button 
                    className="TARA_export-btn"
                    onClick={() => setShowExportModal(true)}
                    style={{
                        backgroundColor: '#28a745', color: 'white', border: 'none', 
                        padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Export Data
                </button>
            </div>
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {showExportModal && (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', minWidth: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>Export Options</h3>
                <p>What data would you like to export?</p>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button onClick={() => {}} style={{ flex: 1, padding: '10px', backgroundColor: '#e9ecef', border: '1px solid #ced4da', cursor: 'default' }}>
                         Scope:
                    </button>
                    {/* SCOPE SELECTION */}
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>1. With Current Filters</p>
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Exports only what you see on screen.</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={() => handleExport('FILTERED', 'EXCEL')} style={{ flex: 1, padding: '8px', background: '#217346', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Excel</button>
                            <button onClick={() => handleExport('FILTERED', 'PDF')} style={{ flex: 1, padding: '8px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>PDF {(!isAllStudents && ' (Report Card)')}</button>
                        </div>
                    </div>

                    <div>
                        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>2. Without Filters (All Data)</p>
                        <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>Exports entire dataset for all institutes.</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                             <button onClick={() => handleExport('ALL', 'EXCEL')} style={{ flex: 1, padding: '8px', background: '#217346', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Excel</button>
                             <button onClick={() => handleExport('ALL', 'PDF')} style={{ flex: 1, padding: '8px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>PDF</button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowExportModal(false)}
                    style={{ marginTop: '20px', width: '100%', padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Cancel
                </button>
            </div>
        </div>
      )}
      
      {/* 4-CARD SUMMARY GRID */}
      <div className="TARA_summary-grid">
        <div className="TARA_chart-card TARA_small-card">
            <h3 className="TARA_card-title">Current Scope Counts</h3>
            <p className="TARA_card-subtitle">{isAllStudents ? 'Total entities covered by current filter.' : 'Viewing single student record.'}</p>
            <div className="TARA_summary-metrics-row TARA_count-metrics-row">
                <div><div className="TARA_summary-value TARA_students-value">{summaryMetrics.totalStudents}</div><div className="TARA_summary-label">Students</div></div>
                <div><div className="TARA_summary-value TARA_batch-value">{summaryMetrics.uniqueBatches}</div><div className="TARA_summary-label">Batches</div></div>
                <div><div className="TARA_summary-value TARA_subject-value">{summaryMetrics.uniqueSubjects}</div><div className="TARA_summary-label">Subjects</div></div>
            </div>
        </div>
        <div className="TARA_chart-card TARA_small-card">
            <h3 className="TARA_card-title"> Performance Metrics</h3>
            <p className="TARA_card-subtitle">{isAllStudents ? 'Aggregated average metrics.' : 'Specific student metrics.'}</p>
            <div className="TARA_summary-metrics-row">
                <div><div className="TARA_summary-value TARA_marks-value">{summaryMetrics.totalAvgMarks}</div><div className="TARA_summary-label">Exam Marks</div></div>
                <div><div className="TARA_summary-value TARA_assignment-value">{summaryMetrics.totalAvgAssignmentMarks}</div><div className="TARA_summary-label">Assignment</div></div>
                <div><div className="TARA_summary-value TARA_attendance-value">{summaryMetrics.totalAttendanceRate}%</div><div className="TARA_summary-label">Attendance</div></div>
            </div>
        </div>
        <div className="TARA_chart-card TARA_rate-card TARA_pie-card">
            <h3 className="TARA_card-title">Success Rate (%)</h3>
            <p className="TARA_card-subtitle">{isAllStudents ? 'Aggregated Pass vs Fail.' : 'Student Subjects Passed vs Failed.'}</p>
            <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Pie data={overallPassFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} fill="#8884d8" paddingAngle={5} label>
                        {overallPassFailData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" /> 
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="TARA_chart-card TARA_bar-card-subject">
          <h3 className="TARA_card-title">Subject-wise Result</h3>
          <p className="TARA_card-subtitle">{isAllStudents ? 'Count of students Passed/Failed.' : 'This Student\'s Pass/Fail Status per Subject.'}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={subjectPassFailData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={0} textAnchor="middle" height={30} style={{ fontSize: '11px' }} />
              <YAxis allowDecimals={false} label={{ value: isAllStudents ? 'Student Count' : 'Status (1=T,0=F)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Passed" fill={CHART_COLORS.Pass} stackId="a" radius={[4, 4, 0, 0]} barSize={35} />
              <Bar dataKey="Failed" fill={CHART_COLORS.Fail} stackId="a" radius={[4, 4, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* MAIN CHARTS GRID */}
      <div className="TARA_horizontal-report-grid">
        <div className="TARA_chart-card">
            <h3 className="TARA_card-title">Marks Report (Exam & Assignment)</h3>
            <p className="TARA_card-subtitle">{chartTitle}</p>
            <ResponsiveContainer width={chartWidthStyle.width} height={300}>
                <BarChart data={chartMarksData} margin={{ top: 10, right: 30, left: 20, bottom: xAxisConfig.height + 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartXAxis} angle={xAxisConfig.angle} textAnchor={xAxisConfig.textAnchor} height={xAxisConfig.height} style={xAxisConfig.style} interval="preserveStartEnd"/>
                    <YAxis label={{ value: 'Marks', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {!isAllStudents ? (
                       <>
                        <Bar dataKey="Assignment Marks" fill={CHART_COLORS.Assignment} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        <Bar dataKey="Exam Marks" fill={CHART_COLORS.Marks} radius={[4, 4, 0, 0]} barSize={barWidth} />
                       </>
                    ) : (
                       <>
                        <Bar dataKey="Assignment Marks" fill={CHART_COLORS.Assignment} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        <Bar dataKey="Exam Marks" fill={CHART_COLORS.Marks} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        <Bar dataKey="Avg Assignment Marks" fill={CHART_COLORS.Assignment} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        <Bar dataKey="Avg Exam Marks" fill={CHART_COLORS.Marks} radius={[4, 4, 0, 0]} barSize={barWidth} />
                       </>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="TARA_chart-card">
            <h3 className="TARA_card-title">Attendance & Performance Rate</h3>
            <p className="TARA_card-subtitle">{isAllStudents ? 'Tracking Pass Rates & Attendance.' : 'Tracking specific Student Attendance.'}</p>
            <ResponsiveContainer width={chartWidthStyle.width} height={280}>
                <BarChart data={chartAttendanceData} margin={{ top: 18, right: 30, left: 20, bottom: xAxisConfig.height + 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartXAxis} angle={xAxisConfig.angle} textAnchor={xAxisConfig.textAnchor} height={xAxisConfig.height} style={xAxisConfig.style} interval="preserveStartEnd"/>
                    <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    {!isAllStudents ? (
                        <Bar dataKey="Attendance (%)" fill={CHART_COLORS.Attendance} radius={[4, 4, 0, 0]} barSize={barWidth} />
                    ) : (
                        <>
                        <Bar dataKey="Avg Attendance (%)" fill={CHART_COLORS.Attendance} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        <Bar dataKey="Pass Rate (%)" fill={CHART_COLORS.Pass} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        <Bar dataKey="Attendance (%)" fill={CHART_COLORS.Attendance} radius={[4, 4, 0, 0]} barSize={barWidth} />
                        </>
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TeacherReportsAnalytics;