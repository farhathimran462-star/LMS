// StudentAttendance.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import '../../Styles/Student/StudentAttendance.css';
import DynamicTable from '../Reusable/DynamicTable';
import { supabase } from '../../config/supabaseClient';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  getAttendanceByStudent,
  getAttendanceSummary,
  getSubjectWiseAttendanceSummary
} from '../../api/attendanceApi';

const COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  halfDay: '#f59e0b'
};

const StudentAttendance = () => {
  // Get current user data from session
  const currentUserData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const currentUserId = currentUserData.user_id;

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [attendanceSummaryData, setAttendanceSummaryData] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [dateFilters, setDateFilters] = useState({
    from_date: '',
    to_date: ''
  });

  // Fetch student ID from user_id
  useEffect(() => {
    const fetchStudentId = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', currentUserId)
          .single();

        if (error) throw error;
        setStudentId(data.id);
      } catch (err) {
        console.error('Error fetching student ID:', err);
        setError('Unable to load student data');
      }
    };

    if (currentUserId) {
      fetchStudentId();
    }
  }, [currentUserId]);

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch attendance_summary data
      const { data: summaryData, error: summaryError } = await supabase
        .from('attendance_summary')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;
      setAttendanceSummaryData(summaryData);

      // Fetch overall summary
      const summaryResult = await getAttendanceSummary(studentId, dateFilters);
      if (summaryResult.error) throw summaryResult.error;
      setOverallSummary(summaryResult.data);

      // Fetch subject-wise summary
      const subjectResult = await getSubjectWiseAttendanceSummary(studentId, dateFilters);
      if (subjectResult.error) throw subjectResult.error;
      setSubjectData(subjectResult.data || []);

      // Set first subject as selected if available
      if (subjectResult.data && subjectResult.data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjectResult.data[0].id);
      }

      // Fetch daily attendance for selected subject
      if (selectedSubjectId) {
        const dailyResult = await getAttendanceByStudent(studentId, {
          ...dateFilters,
          subject_id: selectedSubjectId !== 'general' ? selectedSubjectId : undefined
        });
        if (dailyResult.error) throw dailyResult.error;
        setDailyAttendance(dailyResult.data || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [studentId, dateFilters, selectedSubjectId]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Handle date filter change
  const handleDateFilterChange = (field, value) => {
    setDateFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle subject selection
  const handleRowClick = (id) => {
    setSelectedSubjectId(id);
  };

  const selectedSubject = subjectData.find(sub => sub.id === selectedSubjectId);
  const selectedSubjectName = selectedSubject?.subject || 'No Subject Selected';
  
  // --- Memoized Data for DynamicTable ---
  
  // 1. Overall Summary Data
  const summaryTableData = useMemo(() => {
    if (!overallSummary) return [];
    return [{ 
      id: 'overall-summary',
      presentPercentage: `${overallSummary.percentage}%`,
      totalPresent: overallSummary.present + overallSummary.late,
      totalAbsent: overallSummary.absent,
      totalLeave: overallSummary.leave,
      totalLate: overallSummary.late,
      totalHoliday: overallSummary.holiday,
      totalRecords: overallSummary.total
    }];
  }, [overallSummary]);

  // 2. Subject-wise Data
  const subjectTableData = useMemo(() => subjectData.map(subject => ({
    id: subject.id, 
    subject: subject.subject,
    teacher: subject.teacher,
    code: subject.code,
    totalPeriods: subject.totalPeriods,
    presented: subject.periodsPresent,
    absented: subject.periodsAbsent,
    late: subject.periodsLate,
    leave: subject.periodsLeave,
    attendancePercentage: `${subject.attendancePercentage}%`,
  })), [subjectData]);

  // 3. Daily Log Data
  const dailyLogData = useMemo(() => dailyAttendance.map((record, index) => ({
    id: record.id || `log-${index}`,
    date: record.attendance_date,
    day: new Date(record.attendance_date).toLocaleDateString('en-US', { weekday: 'long' }),
    session: record.session || 'Full Day',
    status: record.status,
    subject: record.subjects ? `${record.subjects.subject_code}` : 'General',
    remarks: record.remarks || '-'
  })), [dailyAttendance]);
  
  // --- Column Definitions ---
  
  // Overall Summary Columns
  const summaryColumnOrder = [
    'presentPercentage',
    'totalPresent',
    'totalAbsent',
    'totalLate',
    'totalLeave',
    'totalHoliday',
    'totalRecords'
  ];
  const summaryColumnDisplayNameMap = {
    presentPercentage: 'Attendance %',
    totalPresent: 'Present',
    totalAbsent: 'Absent',
    totalLate: 'Late',
    totalLeave: 'Leave',
    totalHoliday: 'Holiday',
    totalRecords: 'Total Days'
  };

  // Subject Table Columns
  const subjectColumnOrder = ['subject', 'teacher', 'code', 'totalPeriods', 'presented', 'absented', 'late', 'leave', 'attendancePercentage'];
  const subjectColumnDisplayNameMap = {
    subject: 'Subject',
    teacher: 'Teacher Name',
    code: 'Subject Code',
    totalPeriods: 'Total Periods',
    presented: 'Present',
    absented: 'Absent',
    late: 'Late',
    leave: 'Leave',
    attendancePercentage: 'Attendance %',
  };
  
  // Daily Log Columns
  const dailyLogColumnOrder = ['date', 'day', 'session', 'subject', 'status', 'remarks'];
  const dailyLogColumnDisplayNameMap = {
    date: 'Date',
    day: 'Day',
    session: 'Session',
    subject: 'Subject',
    status: 'Status',
    remarks: 'Remarks'
  };

  if (loading && !overallSummary) {
    return (
      <div className="STAT_container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="STAT_container">
        <div className="error-message" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="STAT_container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Unable to load student information. Please contact administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="STAT_container">
      <h1 className="STAT_title">My Attendance Report</h1>

      {/* Attendance Summary Charts */}
      {attendanceSummaryData && (
        <div style={{ marginBottom: '40px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '30px', fontSize: '24px', color: '#333' }}>Attendance Overview</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
            {/* Summary Cards */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '25px', borderRadius: '12px', color: 'white' }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Days</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{attendanceSummaryData.total_days || 0}</div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '25px', borderRadius: '12px', color: 'white' }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Present Days</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{attendanceSummaryData.present_days || 0}</div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', padding: '25px', borderRadius: '12px', color: 'white' }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Absent Days</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{attendanceSummaryData.absent_days || 0}</div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '25px', borderRadius: '12px', color: 'white' }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Attendance %</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{attendanceSummaryData.attendance_percentage?.toFixed(1)}%</div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
            {/* Pie Chart */}
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', textAlign: 'center', color: '#555' }}>Attendance Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: attendanceSummaryData.present_days || 0 },
                      { name: 'Absent', value: attendanceSummaryData.absent_days || 0 },
                      { name: 'Half Day', value: attendanceSummaryData.half_days || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.present} />
                    <Cell fill={COLORS.absent} />
                    <Cell fill={COLORS.halfDay} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '18px', textAlign: 'center', color: '#555' }}>Days Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: 'Present', value: attendanceSummaryData.present_days || 0, fill: COLORS.present },
                    { name: 'Absent', value: attendanceSummaryData.absent_days || 0, fill: COLORS.absent },
                    { name: 'Half Day', value: attendanceSummaryData.half_days || 0, fill: COLORS.halfDay }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {[
                      { fill: COLORS.present },
                      { fill: COLORS.absent },
                      { fill: COLORS.halfDay }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Daily Attendance Log */}
      {selectedSubjectId && (
        <DynamicTable
          data={dailyLogData}
          columnOrder={dailyLogColumnOrder}
          columnDisplayNameMap={dailyLogColumnDisplayNameMap}
          title={`Daily Attendance Log - ${selectedSubjectName}`}
          pillColumns={['status']} 
          onSearch={null}
          onAddNew={null}
        />
      )}

      {subjectData.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
          <p>No attendance records found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;