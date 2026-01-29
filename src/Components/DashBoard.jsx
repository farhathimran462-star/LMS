// Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import {
  FiUsers,
  FiBookOpen,
  FiLayers,
  FiBarChart2,
  FiHome,
  FiMenu,
  FiX,
  FiClock,
  FiUpload,
  FiFileText,
  FiSearch,
  FiSettings,
  FiClipboard,
  FiCheckSquare,
  FiGrid,
  FiDollarSign,
  FiPackage,
  FiAward,
  FiUser,
} from "react-icons/fi";
import { 
  LuLayoutDashboard, 
  LuUsers, 
  LuLandmark, 
  LuBookOpen, 
  LuGraduationCap, 
  LuBoxes, 
  LuCalendarClock, 
  LuUserCheck, 
  LuClipboardList, 
  LuFileStack, 
  LuMedal, 
  LuReceipt,
  LuBarcode,
  LuUserRound, 
} from "react-icons/lu";
import { HiUserCircle } from "react-icons/hi";
import UserManagement from "./SuperAdmin/UserManagement";
import CourseAndMaterial from "./SuperAdmin/CourseAndManagement";
import ReportsAnalytics from "./SuperAdmin/ReportsAnalytics";
import "../Styles/DashBoard.css";
import TeacherManagement from "./SuperAdmin/TeacherManagement";
import StudentManagement from "./SuperAdmin/StudentManagement";
import AttendanceManagement from "./SuperAdmin/AttendanceManagement";
import Batches from "./SuperAdmin/Batches";
import MaterialManagement from "./SuperAdmin/MaterialsManagement";
import Assignments from "./SuperAdmin/Assignments/Assignment";
import Ad_CardSelection from "../Components/Admin/Ad_CardSelection";
import Ad_AssignmeentManagement from "../Components/Admin/Ad_AssignmentManagement";
import InstitutionsDashboard from "./SuperAdmin/InstitutionsDashboard";
import ExpenseApprovalDashboard from "./SuperAdmin/ExpenseApproval";
import TeacherBatches from "./SuperAdmin/TeacherBatches";
import MyBatches from "./Teacher/MyBatches";
import TeacherMaterials from "./Teacher/TeacherMaterial";
import TeacherReportsAnalytics from "./Teacher/TeacherReportsAndAnalytics";
import StudentBatches from "./Student/StudentBatches";
import StudentAttendance from "./Student/StudentAttendance";
import StudentReportAnalytics from "./Student/StudentReportsAndAnalytics";
import Programme from "./SuperAdmin/PackageManagement";
import CourseCompletion from "./SuperAdmin/CourseCompletion";
import TeacherCourseCompletion from "./Teacher/TeacherCourseCompletion";
import CourseManagement from "./SuperAdmin/CourseAndManagement";
import AssignmentManagement from "./SuperAdmin/Assignments/Assignment";
import StudentMaterial from "./Student/StudentMaterial";
import DynamicProfile from "./Reusable/DynamicProfile";
import MarksManagement from "./SuperAdmin/MarksManagement";
import TimetablePage from "./SuperAdmin/Timetable";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  
  // Define valid roles for checking
  const validRoles = ["Super Admin", "Admin", "Teacher", "Student"];

  // --- START NEW LOGIC FOR ROLE DETERMINATION ---
  let initialRole = location.state?.role || 
                    sessionStorage.getItem('userRole') || 
                    localStorage.getItem('userRole');

  let userData = location.state?.user;

if (!userData) {
    const sessionData = sessionStorage.getItem('userData');
    if (sessionData) {
        userData = JSON.parse(sessionData);
    } else {
        const localData = localStorage.getItem('userData');
        if (localData) {
            userData = JSON.parse(localData);
        }
    }
}

console.log("User Data in Dashboard:", userData);

  const userRole = validRoles.includes(initialRole) ? initialRole : undefined;
  useEffect(() => {
    if (!userRole) {
      console.log("No valid role or session found. Navigating to login page.");
      navigate("/", { replace: true }); // Navigate to the root path
    }
  }, [userRole, navigate]); // Depend on userRole and navigate

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleBasedMenus = {
 "Super Admin": [
    { id: "Dashboard", label: "Dashboard", icon: LuLayoutDashboard }, // Better than Home for apps
    { id: "Users", label: "User Management", icon: LuUsers},
    { id: "Institutions", label: "Institutions", icon: LuLandmark }, // Represents a building/authority
    { id: "Courses", label: "Courses & Subjects", icon: LuBookOpen }, // Specific to learning
    { id: "Programme", label: "Programme", icon: LuGraduationCap }, // Specific to degrees
    { id: "Batches", label: "Batches", icon: LuBoxes}, // Represents groups/collections
    { id: "TimeTable", label: "Timetable", icon: LuCalendarClock }, // Visualizes Time + Date
    { id: "Attendance", label: "Attendance", icon: LuUserCheck}, // Visualizes checking a person
    { id: "Marks", label: "Marks", icon: LuClipboardList }, // Visualizes a grade sheet
    { id: "Reports & Analytics", label: "Reports & Analytics", icon: LuBarcode },
    { id: "Materials", label: "Materials", icon: LuFileStack }, // Represents multiple files
    { id: "Course Completion", label: "Course Completion", icon: LuMedal },
    { id: "ExpenseApprovals", label: "Expense Approvals", icon: LuReceipt }, // Better than Dollar for general expenses
    { id: "Profile", label: "Profile", icon: LuUserRound},
],
    Admin: [
      { id: "Dashboard", label: "Dashboard", icon: FiHome },
      { id: "Teachers", label: "Teachers", icon: FiUsers },
      { id: "Students", label: "Students", icon: FiUsers },
      { id: "Programme", label: "Programme", icon: FiPackage },
      { id: "Batches", label: "Batches", icon: FiLayers },
      { id: "Marks", label: "Marks", icon: FiUser },
     { id: "Attendance", label: "Attendance", icon: FiCheckSquare },
     { id: "Materials", label: "Materials", icon: FiClipboard },
     { id: "TimeTable", label: "Timetable", icon: FiLayers },
      { id: "Course Completion", label: "Course Completion", icon: FiAward },
      { id: "ExpenseApprovals", label: "Expense Approvals", icon: FiDollarSign },
      { id: "Reports & Analytics", label: "Reports (Limited Scope)", icon: FiBarChart2 },
       { id: "Profile", label: "Profile", icon: FiUser },
    ],
    Teacher: [
      { id: "Dashboard", label: "Dashboard", icon: FiHome },
      { id: "MyBatches", label: "My Batches", icon: FiLayers },
      { id: "Attendance", label: "Attendance", icon: FiCheckSquare },
      { id: "Materials", label: "Materials", icon: FiClipboard },
      { id: "TimeTable", label: "Timetable", icon: FiLayers },
      { id: "Course Completions", label: "Course Completions", icon: FiAward },
      { id: "Reports", label: "Reports (Batch-level)", icon: FiBarChart2 },
      { id: "ExpenseClaim", label: "Expense Claim", icon: FiDollarSign },
       { id: "Profile", label: "Profile", icon: FiUser },
    ],
    Student: [
      { id: "Dashboard", label: "Dashboard", icon: FiHome },
      { id: "MyBatch", label: "My Batch", icon: FiLayers },
      { id: "Notes", label: "Notes", icon: FiClipboard },
      { id: "Attendances", label: "Attendance", icon: FiCheckSquare },
      { id: "GradesReports", label: "Grades & Reports", icon: FiBarChart2 },
      { id: "Profile", label: "Profile", icon: FiUser },
    ],
  };

  const menuItems = userRole ? roleBasedMenus[userRole] : []; 
  
  if (!userRole) {
    return null; // Don't render anything while redirecting
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "UserManagement":
      case "Users":
        return <UserManagement />;
      case "Teachers":
        return <TeacherManagement />;
      case "ExpenseApprovals":
        return <ExpenseApprovalDashboard userRole={userRole}/>;
      case "ExpenseClaim":
        return <ExpenseApprovalDashboard userRole={userRole}/>;
      case "Students":
        // return <StudentManagement />;
        return <Ad_CardSelection/>;
      case "Materials":
        // Route to appropriate material component based on role
        if (userRole === "Teacher") {
          return <TeacherMaterials userRole={userRole} />;
        } else if (userRole === "Super Admin" || userRole === "Admin") {
          return <MaterialManagement userRole={userRole} />;
        }
        return null;a
      case "Material":
         return <AssignmentManagement/>;
      case "StudyMaterials":
        return <TeacherMaterials />;
      case "Attendance":
        return <AttendanceManagement userRole={userRole} />;
      case "Attendances":
        return <StudentAttendance />;
      case "Programme":
        return <Programme userRole={userRole}/>
      case "Assignment":
        return <AssignmentManagement/>;
      case "Notes":
        return <StudentMaterial/>;
      case "Courses":
        return <CourseManagement userRole={userRole}/>;
      case "Course Completion":
        return userRole === 'Teacher' ? <TeacherCourseCompletion userRole={userRole}/> : <CourseCompletion userRole={userRole}/>
      case "Course Completions":
        return userRole === 'Teacher' ? <TeacherCourseCompletion userRole={userRole}/> : <CourseCompletion userRole={userRole}/>
      case "CourseMaterial":
        return <CourseAndMaterial />;
      case "TimeTable":
        return <TimetablePage userRole={userRole}/>;

      case "GradesReports":
        return <StudentReportAnalytics />;
      case "Assignments":
         return <Assignments userRole={userRole} />;
      case "BatchEnrollment":
      case "Batches":
        return <Batches userRole={userRole}/>;
      case "MyBatches":
        return <MyBatches/>;
      case "MyBatch":
        return <StudentBatches/>;
      case "Reports":
        return <TeacherReportsAnalytics/>;
      case "Marks":
        return <MarksManagement userRole={userRole}/>;
      case "Reports & Analytics":
        return <ReportsAnalytics />;
        
      case "Institutions":
        return <InstitutionsDashboard  userRole={userRole}/>;
      case "Profile":
        return <DynamicProfile userRole={userRole}/>;
      case "Dashboard":
        return <DashboardOverview setActiveMenu={setActiveMenu} />;
      default:
        return <PlaceholderContent title={activeMenu} />;
    }
  };

  return (
    <div className="dashboard-container">

      <nav className="top-navbar">
        <div className="navbar-left">
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>

          <div className="navbar-logo-wrapper">
            <img
              src="/logo/logo.jpg"
              alt="My Career Point Logo"
              className="navbar-logo"
              onError={(e) => {
                e.target.src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="%23E91E63"/></svg>';
              }}
            />
          </div>
          <h1 className="navbar-title">My Career Point</h1>
        </div>

        <div className="navbar-right">
          <div className="user-profile">
            <span className="user-role">{userData?.username}</span>
            <div className="user-avatar">
              <HiUserCircle />
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <nav className="sidebar-nav">
          <h3 className="sidebar-role-title">{userRole}</h3>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-item ${
                  activeMenu === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveMenu(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="sidebar-icon" />
                <span className="sidebar-text">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">{renderContent()}</main>
    </div>
  );
};

// ===================== Dashboard Overview =====================
const DashboardOverview = ({ setActiveMenu }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy Data
  const kpis = [
    { label: "Total Students", value: 1250, icon: <FiUsers />, color: "stat-icon-pink" },
    { label: "Active Batches", value: 42, icon: <FiLayers />, color: "stat-icon-orange" },
    { label: "Active Teachers", value: 28, icon: <FiBookOpen />, color: "stat-icon-success" },
    { label: "Pending Approvals", value: 6, icon: <FiClock />, color: "stat-icon-info" },
  ];

  const actions = [
    { text: "New student enrolled: Sarah Johnson", time: "2 hours ago" },
    { text: "Teacher approved batch A1", time: "5 hours ago" },
    { text: "Material uploaded: Machine Learning Basics", time: "1 day ago" },
    { text: "Batch Spring 2025 created", time: "2 days ago" },
  ];

  const reports = [
    { title: "Pass % (Last Month)", value: "87%" },
    { title: "Average Attendance", value: "92%" },
  ];

  const quickLinks = [
    { label: "Create User", icon: <FiUsers />, menu: "UserManagement" },
    { label: "Create Batch", icon: <FiLayers />, menu: "BatchEnrollment" },
    { label: "Upload Material", icon: <FiUpload />, menu: "CourseMaterial" },
  ];

  const filteredActions = actions.filter((a) =>
    a.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-overview">
      <h2 className="page-title">Dashboard Overview</h2>

      {/* KPI Cards */}
      <div className="stats-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon ${kpi.color}`}>{kpi.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{kpi.label}</p>
              <h3 className="stat-value">{kpi.value}</h3>
              <p className="stat-change positive">Updated recently</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Filter */}
      <div className="search-bar" style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "var(--color-white)",
            borderRadius: "12px",
            padding: "10px 18px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <FiSearch style={{ color: "var(--color-gray-600)" }} />
          <input
            type="text"
            placeholder="Search recent actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              border: "transparent",
              outline: "none !Important",
              background: "transparent",
              fontSize: "var(--font-size-base)",
            }}
          />
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="dashboard-card">
          <h3 className="card-title">Recent Actions</h3>
          <div className="activity-list">
            {filteredActions.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon">
                  <FiClock />
                </div>
                <div className="activity-content">
                  <p className="activity-text">{a.text}</p>
                  <p className="activity-time">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Quick Links</h3>
          <div className="quick-actions">
            {quickLinks.map((q, i) => (
              <button
                key={i}
                className="quick-action-btn"
                onClick={() => setActiveMenu(q.menu)}
              >
                {q.icon}
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Reports Quick View</h3>
          <div className="activity-list">
            {reports.map((r, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon">
                  <FiFileText />
                </div>
                <div className="activity-content">
                  <p className="activity-text">{r.title}</p>
                  <p className="activity-time">{r.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlaceholderContent = ({ title }) => (
  <div className="placeholder-content">
    <h2 className="page-title">{title}</h2>
    <div className="placeholder-card">
      <p>This section is under development.</p>
      <p>Content will be added soon.</p>
    </div>
  </div>
);

export default Dashboard;