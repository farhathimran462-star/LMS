import '../../Styles/Student/StudentReportsAndAnalytics.css';
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

// API Imports
import { getMarksByStudent } from '../../api/marksApi';
import { getStudentById } from '../../api/usersApi';
import { getAllSubjects } from '../../api/subjectsApi';

const StudentReportAnalytics = () => {
  // User info from session
  const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const currentUserId = currentUserData.user_id;

  // State
  const [studentData, setStudentData] = useState(null);
  const [allMarks, setAllMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        console.log('📊 Fetching marks for user_id:', currentUserId);
        
        // Fetch student data and subjects
        const [studentRes, subjectsRes] = await Promise.all([
          getStudentById(currentUserId),
          getAllSubjects()
        ]);

        console.log('👤 Student data response:', studentRes);

        if (studentRes.error) {
          throw new Error(`Failed to fetch student information: ${studentRes.error.message}`);
        }

        if (!studentRes.data) {
          throw new Error('No student record found for this user. Please contact administrator.');
        }
        
        console.log('✅ Student record found:', {
          student_id: studentRes.data.id,
          roll_number: studentRes.data.roll_number,
          user_id: studentRes.data.user_id
        });
        
        setStudentData(studentRes.data);
        setSubjects(subjectsRes.data || []);

        // Fetch marks for this student
        console.log('🔍 Querying marks for student_id:', studentRes.data.id);
        
        const { data: marksData, error: marksError } = await getMarksByStudent(
          studentRes.data.id,
          {}
        );

        console.log('📋 Marks query result:', {
          marksCount: marksData?.length || 0,
          error: marksError,
          marks: marksData
        });

        if (marksError) {
          throw new Error(marksError.message);
        }

        setAllMarks(marksData || []);
        setError(null);
      } catch (err) {
        console.error('❌ Error in fetchInitialData:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      fetchInitialData();
    }
  }, [currentUserId]);

  // Get unique subjects from marks data
  const availableSubjects = useMemo(() => {
    const subjectSet = new Map();
    allMarks.forEach(mark => {
      if (mark.subjects && !subjectSet.has(mark.subject_id)) {
        subjectSet.set(mark.subject_id, {
          id: mark.subject_id,
          name: mark.subjects.subject_name,
          code: mark.subjects.subject_code
        });
      }
    });
    return Array.from(subjectSet.values());
  }, [allMarks]);

  // Get unique academic years
  const academicYears = useMemo(() => {
    const years = new Set();
    allMarks.forEach(mark => {
      if (mark.academic_year) {
        years.add(mark.academic_year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [allMarks]);

  // Filter marks by selected subject and search term
  const filteredMarks = useMemo(() => {
    let filtered = allMarks;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(mark => mark.subject_id === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(mark =>
        mark.exam_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mark.subjects?.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mark.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allMarks, selectedSubject, searchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalExams: filteredMarks.length,
      totalPass: 0,
      totalFail: 0,
      totalAbsent: 0,
      averagePercentage: 0,
      highestMarks: 0,
      lowestMarks: 100
    };

    if (filteredMarks.length === 0) return stats;

    let totalPercentage = 0;
    let countForAverage = 0;

    filteredMarks.forEach(mark => {
      if (mark.is_absent) {
        stats.totalAbsent++;
      } else {
        if (mark.is_passed) stats.totalPass++;
        else stats.totalFail++;
        
        const percentValue = mark.percentage * 100;
        totalPercentage += percentValue;
        countForAverage++;
        
        if (percentValue > stats.highestMarks) stats.highestMarks = percentValue;
        if (percentValue < stats.lowestMarks) stats.lowestMarks = percentValue;
      }
    });

    if (countForAverage > 0) {
      stats.averagePercentage = (totalPercentage / countForAverage).toFixed(2);
    }

    return stats;
  }, [filteredMarks]);

  // Export to Excel function
  const handleExportToExcel = () => {
    if (filteredMarks.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = filteredMarks.map(mark => ({
      'Exam Name': mark.exam_name,
      'Subject': mark.subjects ? `${mark.subjects.subject_code} - ${mark.subjects.subject_name}` : 'N/A',
      'Date': new Date(mark.exam_date).toLocaleDateString(),
      'Marks Obtained': mark.is_absent ? 'AB' : mark.marks_obtained,
      'Max Marks': mark.max_marks,
      'Percentage': mark.is_absent ? 'AB' : `${(mark.percentage * 100).toFixed(2)}%`,
      'Grade': mark.is_absent ? 'AB' : mark.grade,
      'Status': mark.is_absent ? 'Absent' : (mark.is_passed ? 'Pass' : 'Fail')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grades Report');
    
    const fileName = `Grades_Report_${studentData?.roll_number || 'Student'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // UPDATED: Added 'Date' to testHeaders
  const testHeaders = ['Test Name', 'Test No', 'Date', 'Total Marks', 'Marks Obtained', 'Pass Mark', 'Status'];
  const assignmentHeaders = ['Assignment Name', 'Assignment No', 'Total Marks', 'Marks Obtained', 'Submission Date', 'Status'];

  // Table Renderer for Marks
  const renderMarksTable = () => {
    if (loading) {
      return (
        <div className="text-center p-4">
          <p>Loading your marks...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4 text-red-500">
          <p>Error: {error}</p>
        </div>
      );
    }

    if (filteredMarks.length === 0) {
      return (
        <div className="text-center p-4 text-gray-500">
          <p>
            {searchTerm 
              ? `No marks found matching "${searchTerm}"` 
              : allMarks.length === 0
                ? 'No published marks available yet. Marks will appear here once your teacher publishes them.'
                : 'No marks found for the selected filters.'
            }
          </p>
          {allMarks.length === 0 && studentData && (
            <div style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
              <p>Student ID: {studentData.id}</p>
              <p>Roll Number: {studentData.roll_number}</p>
              <p>User ID: {studentData.user_id}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="STRA_table-responsive">
        <table className="STRA_report-table">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Marks Obtained</th>
              <th>Max Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarks.map((mark) => (
              <tr key={mark.id}>
                <td>{mark.exam_name}</td>
                <td>
                  {mark.subjects ? 
                    `${mark.subjects.subject_code} - ${mark.subjects.subject_name}` : 
                    'N/A'
                  }
                </td>
                <td>{new Date(mark.exam_date).toLocaleDateString()}</td>
                <td className="text-center font-bold">
                  <span className={
                    mark.is_absent ? 'text-gray-500' : 
                    mark.is_passed ? 'text-success' : 'text-error'
                  }>
                    {mark.is_absent ? 'AB' : mark.marks_obtained}
                  </span>
                </td>
                <td className="text-center font-semibold">{mark.max_marks}</td>
                <td className="text-center font-semibold">
                  {mark.is_absent ? 'AB' : `${(mark.percentage * 100)?.toFixed(2)}%`}
                </td>
                <td className="text-center">
                  <span className={`STRA_grade-badge grade-${mark.grade?.toLowerCase().replace('+', 'plus')}`}>
                    {mark.is_absent ? 'AB' : mark.grade}
                  </span>
                </td>
                <td>
                  <span className={`STRA_status-badge ${
                    mark.is_absent ? 'absent' : 
                    mark.is_passed ? 'pass' : 'fail'
                  }`}>
                    {mark.is_absent ? 'Absent' : (mark.is_passed ? 'Pass' : 'Fail')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <header className="mb-4">
        <h1>My Grades & Reports 📊</h1>
        <p>View your exam results and academic performance</p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && filteredMarks.length > 0 && (
        <div className="STRA_stats-grid mb-4">
          <div className="STRA_stat-card">
            <div className="STRA_stat-value">{statistics.totalExams}</div>
            <div className="STRA_stat-label">Total Exams</div>
          </div>
          <div className="STRA_stat-card success">
            <div className="STRA_stat-value">{statistics.totalPass}</div>
            <div className="STRA_stat-label">Passed</div>
          </div>
          <div className="STRA_stat-card error">
            <div className="STRA_stat-value">{statistics.totalFail}</div>
            <div className="STRA_stat-label">Failed</div>
          </div>
          <div className="STRA_stat-card">
            <div className="STRA_stat-value">{statistics.averagePercentage}%</div>
            <div className="STRA_stat-label">Average</div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="STRA_filters-section mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
        <div className="STRA_filter-group" style={{ flex: '0 0 auto' }}>
          <label style={{ marginBottom: '5px', display: 'block' }}>Subject:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="STRA_filter-select"
            disabled={loading}
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportToExcel}
          disabled={loading || filteredMarks.length === 0}
          className="btn btn-sm"
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '3px 8px',
            fontSize: '12px',
            height: '28px',
            borderRadius: '4px',
            cursor: filteredMarks.length === 0 ? 'not-allowed' : 'pointer',
            opacity: filteredMarks.length === 0 ? 0.6 : 1,
            marginTop: '20px',
            marginLeft: 'auto'
          }}
        >
          📥 Export
        </button>
      </div>

      {/* Report Card */}
      <div className="STRA_report-card bg-white shadow-lg rounded-lg p-4">
        <h3 className="mb-4 text-pink">
          {selectedSubject === 'all' ? 'All Subjects' : 
            availableSubjects.find(s => s.id === selectedSubject)?.name || 'Marks Report'
          }
        </h3>

        {/* Search Bar */}
        <div className="STRA_search-and-report">
          <div className="Search-wrapper mb-4">
            <input
              type="text"
              className='search-input'
              placeholder="Search by exam name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Marks Table */}
          {renderMarksTable()}
        </div>
      </div>
    </div>
  );
};

export default StudentReportAnalytics;