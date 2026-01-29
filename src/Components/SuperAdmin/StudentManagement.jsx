import React, { useState, useEffect } from "react";
import { PlusCircle, X, CheckCircle, Pencil, Trash2, Save } from "lucide-react"; 
import { FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdBlock } from "react-icons/md"; 
import { RiUserForbidFill } from "react-icons/ri"; 
import { HiUserCircle } from "react-icons/hi"; 
import '../../Styles/SuperAdmin/StudentManagement.css'; 

// --- CA/CMA Specific Options ---
const PROGRAM_OPTIONS = ["CA Foundation", "CA Intermediate", "CMA Foundation", "CMA Intermediate"];
const COURSES_OPTIONS = [ // These are the Subjects
  "Financial Accounting",
  "Corporate Laws",
  "Cost Management",
  "Taxation (Direct & Indirect)",
  "Auditing & Assurance",
  "Strategic Management"
];
const BATCHES_OPTIONS = ["Batch 2024-A", "Batch 2024-B", "Batch 2025-A", "Batch 2025-B"];
const ROLES_OPTIONS = ["Student", "Parent"]; 

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

// Helper function to calculate date one week from now
const getOneWeekFromNow = (startDate = new Date()) => {
    const nextWeek = new Date(startDate);
    nextWeek.setDate(startDate.getDate() + 7);
    return formatDate(nextWeek);
};

// Initial state reflecting the Student fields
const initialNewStudentState = {
  fullName: "",
  rollNumber: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  role: "Student",
  program: "", // NEW: Main program (e.g., CA Intermediate)
  courses: [], // Subjects
  batch: "",
  admissionDate: "",
  status: "Active",
  suspensionReason: "",
  suspensionStart: "", 
  suspensionEnd: "",
  profile_image: null 
};

const StudentManagement = ({ courseId }) => {
    console.log(courseId)
  const [showForm, setShowForm] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  // Filter state updated to include 'program'
  const [filter, setFilter] = useState({ batch: "", status: "", subject: "", program: "" });
  
  // Dummy data for students (updated with CA/CMA data)
  
const BATCHES_DATA = [
    { id: 101, courseName: "CA Foundation - Apr 2025 Regular", batchPrefix: "CAF-Apr25R", stream: "CA", level: "Foundation" },
    { id: 102, courseName: "CA Foundation - Dec 2025 Fast Track", batchPrefix: "CAF-Dec25FT", stream: "CA", level: "Foundation" },
    { id: 105, courseName: "CA Foundation - Nov 2025 Weekend", batchPrefix: "CAF-Nov25W", stream: "CA", level: "Foundation" },
    { id: 108, courseName: "CA Foundation - May 2026 Full", batchPrefix: "CAF-May26F", stream: "CA", level: "Foundation" },
    { id: 110, courseName: "CA Foundation - July 2026 Crash", batchPrefix: "CAF-Jul26C", stream: "CA", level: "Foundation" },

    { id: 103, courseName: "CA Intermediate - Apr 2025 Group 1", batchPrefix: "CAI-Apr25G1", stream: "CA", level: "Intermediate" },
    { id: 104, courseName: "CA Intermediate - Dec 2025 Group 2", batchPrefix: "CAI-Dec25G2", stream: "CA", level: "Intermediate" },
    { id: 106, courseName: "CA Intermediate - May 2026 Combined", batchPrefix: "CAI-May26C", stream: "CA", level: "Intermediate" },
    { id: 107, courseName: "CA Intermediate - July 2025 Weekend", batchPrefix: "CAI-Jul25W", stream: "CA", level: "Intermediate" },

    { id: 201, courseName: "CMA Foundation - Apr 2025 Batch A", batchPrefix: "CMF-Apr25A", stream: "CMA", level: "Foundation" },
    { id: 202, courseName: "CMA Foundation - Nov 2025 Batch B", batchPrefix: "CMF-Nov25B", stream: "CMA", level: "Foundation" },
    { id: 205, courseName: "CMA Foundation - May 2026 Exclusive", batchPrefix: "CMF-May26E", stream: "CMA", level: "Foundation" },
    { id: 203, courseName: "CMA Intermediate - Apr 2025 Term 1", batchPrefix: "CMI-Apr25T1", stream: "CMA", level: "Intermediate" },
    { id: 204, courseName: "CMA Intermediate - Dec 2025 Term 2", batchPrefix: "CMI-Dec25T2", stream: "CMA", level: "Intermediate" },
];
const targetCourse = courseId 
    ? BATCHES_DATA.find(batch => batch.id === Number(courseId))
    : null;
    const targetCourseName = targetCourse ? targetCourse.courseName : null;
  const [students, setStudents] = useState([
    // ----------------------------------------------------
    // CA Foundation - Apr 2025 Regular (5 Students)
    // -----------------------------------------------
    // -----
    {
        id: 1,
        fullName: "Aarav K. Patel",
        rollNumber: "CAF-Apr25R-1001",
        email: "aarav.patel.1@lms.com",
        phone: "+91-9876543210",
        username: "aarav.p",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Apr 2025 Regular",
        admissionDate: "2024-11-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 2,
        fullName: "Bhavna P. Shah",
        rollNumber: "CAF-Apr25R-1002",
        email: "bhavna.shah.2@lms.com",
        phone: "+91-9876543211",
        username: "bhavna.s",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Apr 2025 Regular",
        admissionDate: "2024-11-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 3,
        fullName: "Chirag M. Gupta",
        rollNumber: "CAF-Apr25R-1003",
        email: "chirag.gupta.3@lms.com",
        phone: "+91-9876543212",
        username: "chirag.g",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Apr 2025 Regular",
        admissionDate: "2024-11-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 4,
        fullName: "Deepika R. Nair",
        rollNumber: "CAF-Apr25R-1004",
        email: "deepika.nair.4@lms.com",
        phone: "+91-9876543213",
        username: "deepika.n",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Apr 2025 Regular",
        admissionDate: "2024-11-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 5,
        fullName: "Eshaan V. Iyer",
        rollNumber: "CAF-Apr25R-1005",
        email: "eshaan.iyer.5@lms.com",
        phone: "+91-9876543214",
        username: "eshaan.i",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Apr 2025 Regular",
        admissionDate: "2024-11-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Foundation - Dec 2025 Fast Track (5 Students)
    // ----------------------------------------------------
    {
        id: 6,
        fullName: "Falak S. Singh",
        rollNumber: "CAF-Dec25FT-2001",
        email: "falak.singh.6@lms.com",
        phone: "+91-9876543215",
        username: "falak.s",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - Dec 2025 Fast Track",
        admissionDate: "2025-06-10",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 7,
        fullName: "Gaurav H. Yadav",
        rollNumber: "CAF-Dec25FT-2002",
        email: "gaurav.yadav.7@lms.com",
        phone: "+91-9876543216",
        username: "gaurav.y",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - Dec 2025 Fast Track",
        admissionDate: "2025-06-11",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 8,
        fullName: "Heena B. Reddy",
        rollNumber: "CAF-Dec25FT-2003",
        email: "heena.reddy.8@lms.com",
        phone: "+91-9876543217",
        username: "heena.r",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - Dec 2025 Fast Track",
        admissionDate: "2025-06-12",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 9,
        fullName: "Ishaan T. Verma",
        rollNumber: "CAF-Dec25FT-2004",
        email: "ishaan.verma.9@lms.com",
        phone: "+91-9876543218",
        username: "ishaan.v",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - Dec 2025 Fast Track",
        admissionDate: "2025-06-13",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 10,
        fullName: "Jiya C. Menon",
        rollNumber: "CAF-Dec25FT-2005",
        email: "jiya.menon.10@lms.com",
        phone: "+91-9876543219",
        username: "jiya.m",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - Dec 2025 Fast Track",
        admissionDate: "2025-06-14",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Foundation - Nov 2025 Weekend (5 Students)
    // ----------------------------------------------------
    {
        id: 11,
        fullName: "Karan B. Joshi",
        rollNumber: "CAF-Nov25W-3001",
        email: "karan.joshi.11@lms.com",
        phone: "+91-9776543210",
        username: "karan.j",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Nov 2025 Weekend",
        admissionDate: "2025-03-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 12,
        fullName: "Latika H. Saxena",
        rollNumber: "CAF-Nov25W-3002",
        email: "latika.saxena.12@lms.com",
        phone: "+91-9776543211",
        username: "latika.s",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Nov 2025 Weekend",
        admissionDate: "2025-03-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 13,
        fullName: "Manish R. Aggarwal",
        rollNumber: "CAF-Nov25W-3003",
        email: "manish.aggarwal.13@lms.com",
        phone: "+91-9776543212",
        username: "manish.a",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Nov 2025 Weekend",
        admissionDate: "2025-03-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 14,
        fullName: "Nidhi S. Tiwari",
        rollNumber: "CAF-Nov25W-3004",
        email: "nidhi.tiwari.14@lms.com",
        phone: "+91-9776543213",
        username: "nidhi.t",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Nov 2025 Weekend",
        admissionDate: "2025-03-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 15,
        fullName: "Omkar A. Singh",
        rollNumber: "CAF-Nov25W-3005",
        email: "omkar.singh.15@lms.com",
        phone: "+91-9776543214",
        username: "omkar.s",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - Nov 2025 Weekend",
        admissionDate: "2025-03-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Foundation - May 2026 Full (5 Students)
    // ----------------------------------------------------
    {
        id: 16,
        fullName: "Pooja V. Kumar",
        rollNumber: "CAF-May26F-4001",
        email: "pooja.kumar.16@lms.com",
        phone: "+91-9666543210",
        username: "pooja.k",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - May 2026 Full",
        admissionDate: "2025-09-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 17,
        fullName: "Qasim Z. Khan",
        rollNumber: "CAF-May26F-4002",
        email: "qasim.khan.17@lms.com",
        phone: "+91-9666543211",
        username: "qasim.k",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - May 2026 Full",
        admissionDate: "2025-09-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 18,
        fullName: "Rhea L. Sharma",
        rollNumber: "CAF-May26F-4003",
        email: "rhea.sharma.18@lms.com",
        phone: "+91-9666543212",
        username: "rhea.s",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - May 2026 Full",
        admissionDate: "2025-09-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 19,
        fullName: "Samar D. Kapoor",
        rollNumber: "CAF-May26F-4004",
        email: "samar.kapoor.19@lms.com",
        phone: "+91-9666543213",
        username: "samar.k",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - May 2026 Full",
        admissionDate: "2025-09-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 20,
        fullName: "Tanisha G. Jain",
        rollNumber: "CAF-May26F-4005",
        email: "tanisha.jain.20@lms.com",
        phone: "+91-9666543214",
        username: "tanisha.j",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Economics", "Quant. Aptitude"],
        batch: "CA Foundation - May 2026 Full",
        admissionDate: "2025-09-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Foundation - July 2026 Crash (5 Students)
    // ----------------------------------------------------
    {
        id: 21,
        fullName: "Uday P. Varma",
        rollNumber: "CAF-Jul26C-5001",
        email: "uday.varma.21@lms.com",
        phone: "+91-9556543210",
        username: "uday.v",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - July 2026 Crash",
        admissionDate: "2026-04-15",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 22,
        fullName: "Vanya A. Malhotra",
        rollNumber: "CAF-Jul26C-5002",
        email: "vanya.malhotra.22@lms.com",
        phone: "+91-9556543211",
        username: "vanya.m",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - July 2026 Crash",
        admissionDate: "2026-04-16",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 23,
        fullName: "Wasiq M. Qureshi",
        rollNumber: "CAF-Jul26C-5003",
        email: "wasiq.qureshi.23@lms.com",
        phone: "+91-9556543212",
        username: "wasiq.q",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - July 2026 Crash",
        admissionDate: "2026-04-17",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 24,
        fullName: "Xenia D. Fernandez",
        rollNumber: "CAF-Jul26C-5004",
        email: "xenia.fernandez.24@lms.com",
        phone: "+91-9556543213",
        username: "xenia.f",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - July 2026 Crash",
        admissionDate: "2026-04-18",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 25,
        fullName: "Yuvraj G. Deshmukh",
        rollNumber: "CAF-Jul26C-5005",
        email: "yuvraj.deshmukh.25@lms.com",
        phone: "+91-9556543214",
        username: "yuvraj.d",
        password: "password123",
        role: "Student",
        program: "CA Foundation",
        courses: ["Accounting", "Business Laws"],
        batch: "CA Foundation - July 2026 Crash",
        admissionDate: "2026-04-19",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Intermediate - Apr 2025 Group 1 (5 Students)
    // ----------------------------------------------------
    {
        id: 26,
        fullName: "Zoya H. Chawla",
        rollNumber: "CAI-Apr25G1-6001",
        email: "zoya.chawla.26@lms.com",
        phone: "+91-9446543210",
        username: "zoya.c",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Accounting", "Corp. Laws", "Costing", "Taxation"],
        batch: "CA Intermediate - Apr 2025 Group 1",
        admissionDate: "2024-10-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 27,
        fullName: "Ayaan P. Mehta",
        rollNumber: "CAI-Apr25G1-6002",
        email: "ayaan.mehta.27@lms.com",
        phone: "+91-9446543211",
        username: "ayaan.m",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Accounting", "Corp. Laws", "Costing", "Taxation"],
        batch: "CA Intermediate - Apr 2025 Group 1",
        admissionDate: "2024-10-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 28,
        fullName: "Bela R. Singh",
        rollNumber: "CAI-Apr25G1-6003",
        email: "bela.singh.28@lms.com",
        phone: "+91-9446543212",
        username: "bela.s",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Accounting", "Corp. Laws", "Costing", "Taxation"],
        batch: "CA Intermediate - Apr 2025 Group 1",
        admissionDate: "2024-10-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 29,
        fullName: "Chetan L. Bose",
        rollNumber: "CAI-Apr25G1-6004",
        email: "chetan.bose.29@lms.com",
        phone: "+91-9446543213",
        username: "chetan.b",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Accounting", "Corp. Laws", "Costing", "Taxation"],
        batch: "CA Intermediate - Apr 2025 Group 1",
        admissionDate: "2024-10-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 30,
        fullName: "Divya T. Das",
        rollNumber: "CAI-Apr25G1-6005",
        email: "divya.das.30@lms.com",
        phone: "+91-9446543214",
        username: "divya.d",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Accounting", "Corp. Laws", "Costing", "Taxation"],
        batch: "CA Intermediate - Apr 2025 Group 1",
        admissionDate: "2024-10-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Intermediate - Dec 2025 Group 2 (5 Students)
    // ----------------------------------------------------
    {
        id: 31,
        fullName: "Eklavya S. Yadav",
        rollNumber: "CAI-Dec25G2-7001",
        email: "eklavya.yadav.31@lms.com",
        phone: "+91-9336543210",
        username: "eklavya.y",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - Dec 2025 Group 2",
        admissionDate: "2025-05-15",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 32,
        fullName: "Farah J. Momin",
        rollNumber: "CAI-Dec25G2-7002",
        email: "farah.momin.32@lms.com",
        phone: "+91-9336543211",
        username: "farah.m",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - Dec 2025 Group 2",
        admissionDate: "2025-05-16",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 33,
        fullName: "Girish K. Hegde",
        rollNumber: "CAI-Dec25G2-7003",
        email: "girish.hegde.33@lms.com",
        phone: "+91-9336543212",
        username: "girish.h",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - Dec 2025 Group 2",
        admissionDate: "2025-05-17",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 34,
        fullName: "Hansa D. Rao",
        rollNumber: "CAI-Dec25G2-7004",
        email: "hansa.rao.34@lms.com",
        phone: "+91-9336543213",
        username: "hansa.r",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - Dec 2025 Group 2",
        admissionDate: "2025-05-18",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 35,
        fullName: "Irfan M. Shaikh",
        rollNumber: "CAI-Dec25G2-7005",
        email: "irfan.shaikh.35@lms.com",
        phone: "+91-9336543214",
        username: "irfan.s",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - Dec 2025 Group 2",
        admissionDate: "2025-05-19",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Intermediate - May 2026 Combined (5 Students)
    // ----------------------------------------------------
    {
        id: 36,
        fullName: "Jahnvi R. Kulkarni",
        rollNumber: "CAI-May26C-8001",
        email: "jahnvi.kulkarni.36@lms.com",
        phone: "+91-9226543210",
        username: "jahnvi.k",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["All Subjects"],
        batch: "CA Intermediate - May 2026 Combined",
        admissionDate: "2025-11-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 37,
        fullName: "Kabir S. Gill",
        rollNumber: "CAI-May26C-8002",
        email: "kabir.gill.37@lms.com",
        phone: "+91-9226543211",
        username: "kabir.g",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["All Subjects"],
        batch: "CA Intermediate - May 2026 Combined",
        admissionDate: "2025-11-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 38,
        fullName: "Leela D. Mathew",
        rollNumber: "CAI-May26C-8003",
        email: "leela.mathew.38@lms.com",
        phone: "+91-9226543212",
        username: "leela.m",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["All Subjects"],
        batch: "CA Intermediate - May 2026 Combined",
        admissionDate: "2025-11-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 39,
        fullName: "Manoj B. Pillai",
        rollNumber: "CAI-May26C-8004",
        email: "manoj.pillai.39@lms.com",
        phone: "+91-9226543213",
        username: "manoj.p",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["All Subjects"],
        batch: "CA Intermediate - May 2026 Combined",
        admissionDate: "2025-11-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 40,
        fullName: "Neena V. Shetty",
        rollNumber: "CAI-May26C-8005",
        email: "neena.shetty.40@lms.com",
        phone: "+91-9226543214",
        username: "neena.s",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["All Subjects"],
        batch: "CA Intermediate - May 2026 Combined",
        admissionDate: "2025-11-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CA Intermediate - July 2025 Weekend (5 Students)
    // ----------------------------------------------------
    {
        id: 41,
        fullName: "Ojas G. Trivedi",
        rollNumber: "CAI-Jul25W-9001",
        email: "ojas.trivedi.41@lms.com",
        phone: "+91-9116543210",
        username: "ojas.t",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - July 2025 Weekend",
        admissionDate: "2025-01-20",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 42,
        fullName: "Pooja K. Wagh",
        rollNumber: "CAI-Jul25W-9002",
        email: "pooja.wagh.42@lms.com",
        phone: "+91-9116543211",
        username: "pooja.w",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - July 2025 Weekend",
        admissionDate: "2025-01-21",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 43,
        fullName: "Quentin F. Dsouza",
        rollNumber: "CAI-Jul25W-9003",
        email: "quentin.dsouza.43@lms.com",
        phone: "+91-9116543212",
        username: "quentin.d",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - July 2025 Weekend",
        admissionDate: "2025-01-22",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 44,
        fullName: "Reena H. Iyer",
        rollNumber: "CAI-Jul25W-9004",
        email: "reena.iyer.44@lms.com",
        phone: "+91-9116543213",
        username: "reena.i",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - July 2025 Weekend",
        admissionDate: "2025-01-23",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 45,
        fullName: "Siddharth B. Menon",
        rollNumber: "CAI-Jul25W-9005",
        email: "siddharth.menon.45@lms.com",
        phone: "+91-9116543214",
        username: "siddharth.m",
        password: "password123",
        role: "Student",
        program: "CA Intermediate",
        courses: ["Audit", "FM & Eco.", "SM & EIS"],
        batch: "CA Intermediate - July 2025 Weekend",
        admissionDate: "2025-01-24",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CMA Foundation - Apr 2025 Batch A (5 Students)
    // ----------------------------------------------------
    {
        id: 46,
        fullName: "Tanvi M. Shah",
        rollNumber: "CMF-Apr25A-10001",
        email: "tanvi.shah.46@lms.com",
        phone: "+91-9006543210",
        username: "tanvi.s.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Fundamentals of Accounting", "Laws and Ethics"],
        batch: "CMA Foundation - Apr 2025 Batch A",
        admissionDate: "2024-11-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 47,
        fullName: "Umesh A. Patil",
        rollNumber: "CMF-Apr25A-10002",
        email: "umesh.patil.47@lms.com",
        phone: "+91-9006543211",
        username: "umesh.p.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Fundamentals of Accounting", "Laws and Ethics"],
        batch: "CMA Foundation - Apr 2025 Batch A",
        admissionDate: "2024-11-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 48,
        fullName: "Veena P. Iyer",
        rollNumber: "CMF-Apr25A-10003",
        email: "veena.iyer.48@lms.com",
        phone: "+91-9006543212",
        username: "veena.i.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Fundamentals of Accounting", "Laws and Ethics"],
        batch: "CMA Foundation - Apr 2025 Batch A",
        admissionDate: "2024-11-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 49,
        fullName: "Wasim B. Ansari",
        rollNumber: "CMF-Apr25A-10004",
        email: "wasim.ansari.49@lms.com",
        phone: "+91-9006543213",
        username: "wasim.a.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Fundamentals of Accounting", "Laws and Ethics"],
        batch: "CMA Foundation - Apr 2025 Batch A",
        admissionDate: "2024-11-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 50,
        fullName: "Yamini J. Pillai",
        rollNumber: "CMF-Apr25A-10005",
        email: "yamini.pillai.50@lms.com",
        phone: "+91-9006543214",
        username: "yamini.p.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Fundamentals of Accounting", "Laws and Ethics"],
        batch: "CMA Foundation - Apr 2025 Batch A",
        admissionDate: "2024-11-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CMA Foundation - Nov 2025 Batch B (5 Students)
    // ----------------------------------------------------
    {
        id: 51,
        fullName: "Zakir S. Khan",
        rollNumber: "CMF-Nov25B-11001",
        email: "zakir.khan.51@lms.com",
        phone: "+91-8906543210",
        username: "zakir.k.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Business Maths", "Economics"],
        batch: "CMA Foundation - Nov 2025 Batch B",
        admissionDate: "2025-05-10",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 52,
        fullName: "Alia R. Bhatia",
        rollNumber: "CMF-Nov25B-11002",
        email: "alia.bhatia.52@lms.com",
        phone: "+91-8906543211",
        username: "alia.b.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Business Maths", "Economics"],
        batch: "CMA Foundation - Nov 2025 Batch B",
        admissionDate: "2025-05-11",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 53,
        fullName: "Bhuvan D. Arora",
        rollNumber: "CMF-Nov25B-11003",
        email: "bhuvan.arora.53@lms.com",
        phone: "+91-8906543212",
        username: "bhuvan.a.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Business Maths", "Economics"],
        batch: "CMA Foundation - Nov 2025 Batch B",
        admissionDate: "2025-05-12",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 54,
        fullName: "Charu T. Sharma",
        rollNumber: "CMF-Nov25B-11004",
        email: "charu.sharma.54@lms.com",
        phone: "+91-8906543213",
        username: "charu.s.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Business Maths", "Economics"],
        batch: "CMA Foundation - Nov 2025 Batch B",
        admissionDate: "2025-05-13",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 55,
        fullName: "Dev V. Goswami",
        rollNumber: "CMF-Nov25B-11005",
        email: "dev.goswami.55@lms.com",
        phone: "+91-8906543214",
        username: "dev.g.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Business Maths", "Economics"],
        batch: "CMA Foundation - Nov 2025 Batch B",
        admissionDate: "2025-05-14",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CMA Foundation - May 2026 Exclusive (5 Students)
    // ----------------------------------------------------
    {
        id: 56,
        fullName: "Esha S. Menon",
        rollNumber: "CMF-May26E-12001",
        email: "esha.menon.56@lms.com",
        phone: "+91-8806543210",
        username: "esha.m.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Laws and Ethics", "Economics"],
        batch: "CMA Foundation - May 2026 Exclusive",
        admissionDate: "2025-09-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 57,
        fullName: "Farooq K. Hussain",
        rollNumber: "CMF-May26E-12002",
        email: "farooq.hussain.57@lms.com",
        phone: "+91-8806543211",
        username: "farooq.h.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Laws and Ethics", "Economics"],
        batch: "CMA Foundation - May 2026 Exclusive",
        admissionDate: "2025-09-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 58,
        fullName: "Gitali A. Reddy",
        rollNumber: "CMF-May26E-12003",
        email: "gitali.reddy.58@lms.com",
        phone: "+91-8806543212",
        username: "gitali.r.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Laws and Ethics", "Economics"],
        batch: "CMA Foundation - May 2026 Exclusive",
        admissionDate: "2025-09-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 59,
        fullName: "Harsh L. Garg",
        rollNumber: "CMF-May26E-12004",
        email: "harsh.garg.59@lms.com",
        phone: "+91-8806543213",
        username: "harsh.g.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Laws and Ethics", "Economics"],
        batch: "CMA Foundation - May 2026 Exclusive",
        admissionDate: "2025-09-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 60,
        fullName: "Indu R. Kapoor",
        rollNumber: "CMF-May26E-12005",
        email: "indu.kapoor.60@lms.com",
        phone: "+91-8806543214",
        username: "indu.k.cma",
        password: "password123",
        role: "Student",
        program: "CMA Foundation",
        courses: ["Laws and Ethics", "Economics"],
        batch: "CMA Foundation - May 2026 Exclusive",
        admissionDate: "2025-09-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CMA Intermediate - Apr 2025 Term 1 (5 Students)
    // ----------------------------------------------------
    {
        id: 61,
        fullName: "Jeevan P. Varma",
        rollNumber: "CMI-Apr25T1-13001",
        email: "jeevan.varma.61@lms.com",
        phone: "+91-8706543210",
        username: "jeevan.v.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Financial Accounting", "Direct Taxation", "Cost Accounting"],
        batch: "CMA Intermediate - Apr 2025 Term 1",
        admissionDate: "2024-10-01",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 62,
        fullName: "Kavya A. Nair",
        rollNumber: "CMI-Apr25T1-13002",
        email: "kavya.nair.62@lms.com",
        phone: "+91-8706543211",
        username: "kavya.n.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Financial Accounting", "Direct Taxation", "Cost Accounting"],
        batch: "CMA Intermediate - Apr 2025 Term 1",
        admissionDate: "2024-10-02",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 63,
        fullName: "Lokesh T. Rao",
        rollNumber: "CMI-Apr25T1-13003",
        email: "lokesh.rao.63@lms.com",
        phone: "+91-8706543212",
        username: "lokesh.r.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Financial Accounting", "Direct Taxation", "Cost Accounting"],
        batch: "CMA Intermediate - Apr 2025 Term 1",
        admissionDate: "2024-10-03",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 64,
        fullName: "Meera H. Reddy",
        rollNumber: "CMI-Apr25T1-13004",
        email: "meera.reddy.64@lms.com",
        phone: "+91-8706543213",
        username: "meera.r.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Financial Accounting", "Direct Taxation", "Cost Accounting"],
        batch: "CMA Intermediate - Apr 2025 Term 1",
        admissionDate: "2024-10-04",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 65,
        fullName: "Nikhil B. Verma",
        rollNumber: "CMI-Apr25T1-13005",
        email: "nikhil.verma.65@lms.com",
        phone: "+91-8706543214",
        username: "nikhil.v.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Financial Accounting", "Direct Taxation", "Cost Accounting"],
        batch: "CMA Intermediate - Apr 2025 Term 1",
        admissionDate: "2024-10-05",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

    // ----------------------------------------------------
    // CMA Intermediate - Dec 2025 Term 2 (5 Students)
    // ----------------------------------------------------
    {
        id: 66,
        fullName: "Priya C. Sharma",
        rollNumber: "CMI-Dec25T2-14001",
        email: "priya.sharma.66@lms.com",
        phone: "+91-8606543210",
        username: "priya.s.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Indirect Taxation", "Corporate Accounting", "Auditing"],
        batch: "CMA Intermediate - Dec 2025 Term 2",
        admissionDate: "2025-04-10",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 67,
        fullName: "Rajesh S. Gupta",
        rollNumber: "CMI-Dec25T2-14002",
        email: "rajesh.gupta.67@lms.com",
        phone: "+91-8606543211",
        username: "rajesh.g.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Indirect Taxation", "Corporate Accounting", "Auditing"],
        batch: "CMA Intermediate - Dec 2025 Term 2",
        admissionDate: "2025-04-11",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 68,
        fullName: "Sana M. Qureshi",
        rollNumber: "CMI-Dec25T2-14003",
        email: "sana.qureshi.68@lms.com",
        phone: "+91-8606543212",
        username: "sana.q.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Indirect Taxation", "Corporate Accounting", "Auditing"],
        batch: "CMA Intermediate - Dec 2025 Term 2",
        admissionDate: "2025-04-12",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 69,
        fullName: "Tarun V. Aggarwal",
        rollNumber: "CMI-Dec25T2-14004",
        email: "tarun.aggarwal.69@lms.com",
        phone: "+91-8606543213",
        username: "tarun.a.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Indirect Taxation", "Corporate Accounting", "Auditing"],
        batch: "CMA Intermediate - Dec 2025 Term 2",
        admissionDate: "2025-04-13",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },
    {
        id: 70,
        fullName: "Uma L. Narayan",
        rollNumber: "CMI-Dec25T2-14005",
        email: "uma.narayan.70@lms.com",
        phone: "+91-8606543214",
        username: "uma.n.cma",
        password: "password123",
        role: "Student",
        program: "CMA Intermediate",
        courses: ["Indirect Taxation", "Corporate Accounting", "Auditing"],
        batch: "CMA Intermediate - Dec 2025 Term 2",
        admissionDate: "2025-04-14",
        status: "Active",
        suspensionReason: "",
        suspensionStart: "",
        suspensionEnd: "",
        profile_image: null,
    },

  ]);

  const [newStudent, setNewStudent] = useState(initialNewStudentState);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); 
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [editStudent, setEditStudent] = useState(null); 
  
  const [suspendPopup, setSuspendPopup] = useState({ 
    open: false, 
    student: null, 
    reason: '', 
    status: 'Suspended',
    start_date: formatDate(new Date()),
    end_date: getOneWeekFromNow(new Date()) 
  }); 

  const [deletePopup, setDeletePopup] = useState({ open: false, student: null });
  
  useEffect(() => {
    if (editStudent) {
      setNewStudent(editStudent);
    } else {
      setNewStudent(initialNewStudentState);
    }
  }, [editStudent]);

  // --- Selection Logic (kept same) ---
  const isSelected = (id) => selectedStudents.includes(id);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredStudents.map(t => t.id);
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  // --- Filter and Form Logic ---
  const handleCloseForm = () => {
    setNewStudent(initialNewStudentState);
    setEditStudent(null); 
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e, key) => {
    const { value, checked } = e.target;
    setNewStudent((prev) => {
      const currentValues = prev[key];
      if (checked) {
        return { ...prev, [key]: [...currentValues, value] };
      } else {
        return { ...prev, [key]: currentValues.filter((v) => v !== value) };
      }
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const newId = students.reduce((maxId, student) => Math.max(student.id || 0, maxId), 0) + 1;
    setStudents((prev) => [...prev, {...newStudent, id: newId, rollNumber: newStudent.rollNumber || `STD${newId}`}]);
    
    handleCloseForm();
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000); 
  };
  
  const handleUpdate = (e) => {
    e.preventDefault();
    setStudents(prev => prev.map(t => t.id === newStudent.id ? newStudent : t));
    
    setEditStudent(null); 
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000); 
  };
  
  // --- Action Handlers (kept same) ---
  const handleEdit = (student) => {
    setEditStudent(student); 
  };

  const handleDelete = (student) => {
    setDeletePopup({ open: true, student });
  };

  const handleSuspendClick = (student) => {
    const isSuspended = student.status === 'Suspended';
    const today = formatDate(new Date());

    setSuspendPopup({ 
        open: true, 
        student: student, 
        reason: student.suspensionReason || '', 
        status: isSuspended ? 'Active' : 'Suspended', 
        start_date: isSuspended ? today : (student.suspensionStart || today), 
        end_date: isSuspended ? '' : (student.suspensionEnd || getOneWeekFromNow(new Date())) 
    });
  };

  const handleSuspendConfirm = (e) => {
    e.preventDefault();
    const isSuspending = suspendPopup.status === 'Suspended';
    let finalStart = suspendPopup.start_date;
    let finalEnd = suspendPopup.end_date;
    
    if (isSuspending) {
        if (!finalStart) finalStart = formatDate(new Date());
        if (!finalEnd) finalEnd = getOneWeekFromNow(new Date(finalStart));
    } else {
        finalStart = '';
        finalEnd = '';
    }

    setStudents(prev => prev.map(t => 
        t.id === suspendPopup.student.id 
        ? { 
            ...t, 
            status: suspendPopup.status, 
            suspensionReason: isSuspending ? suspendPopup.reason : '',
            suspensionStart: finalStart,
            suspensionEnd: finalEnd
          }
        : t
    ));
    
    setSuspendPopup({ open: false, student: null, reason: '', status: 'Suspended', start_date: formatDate(new Date()), end_date: getOneWeekFromNow(new Date()) });
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000); 
  };
  
  // --- Filtering and Styling ---
  const filterPills = Object.keys(filter)
    .filter(key => filter[key])
    .map(key => ({
      key: key,
      value: filter[key],
      label: key === 'program' 
             ? `Program: ${filter[key]}` 
             : `${key.charAt(0).toUpperCase() + key.slice(1)}: ${filter[key]}`,
    }));
  
  const handleRemoveFilter = (key) => {
    setFilter(prev => ({ ...prev, [key]: "" }));
  };
  
  const handleFilterChange = (e, key) => {
    setFilter(prev => ({ ...prev, [key]: e.target.value }));
  };

  const filteredStudents = students.filter((t) => {
    // 1. ADDED: Condition to filter by the courseId prop via targetCourseName
    // If targetCourseName is set, the student's batch must match it.
    // Otherwise, it returns true, allowing all students through.
    const matchesCourseId = targetCourseName ? t.batch === targetCourseName : true;
    
    // Existing Search Filter (Unchanged)
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Existing UI Filters (Unchanged)
    const matchesBatch =
      !filter.batch || t.batch === filter.batch; 
    const matchesStatus = !filter.status || t.status === filter.status;
    const matchesSubject =
      !filter.subject || t.courses.includes(filter.subject);
    const matchesProgram =
      !filter.program || t.program === filter.program;
      
    // 2. MODIFIED: matchesCourseId must be included in the final return check.
    return matchesCourseId && matchesSearch && matchesBatch && matchesStatus && matchesSubject && matchesProgram;
});

  const getStatusClassName = (status) => {
    switch (status) {
      case "Active":
        return "sm_status-badge sm_status-active";
      case "Suspended":
        return "sm_status-badge sm_status-suspended";
      default:
        return "sm_status-badge";
    }
  };

  // --- Reusable Form Component (Used for Create & Edit) ---
  const StudentForm = ({ onSubmit, isEdit }) => (
    <form className="sm_user-form" onSubmit={onSubmit}>
        <div className="sm_form-row">
            <div className="sm_form-group">
                <label>Full Name<span className="sm_required">*</span></label>
                <input name="fullName" placeholder="Full Name" value={newStudent.fullName} onChange={handleChange} required />
            </div>
            <div className="sm_form-group">
                <label>Roll Number<span className="sm_required">*</span></label>
                <input name="rollNumber" placeholder="Roll Number" value={newStudent.rollNumber} onChange={handleChange} required disabled={isEdit} />
            </div>
        </div>
        <div className="sm_form-row">
            <div className="sm_form-group">
                <label>Email<span className="sm_required">*</span></label>
                <input type="email" name="email" placeholder="Email" value={newStudent.email} onChange={handleChange} required />
            </div>
            <div className="sm_form-group">
                <label>Phone</label>
                <input name="phone" placeholder="Phone" value={newStudent.phone} onChange={handleChange} required />
            </div>
        </div>
        {!isEdit && ( 
        <div className="sm_form-row">
            <div className="sm_form-group">
                <label>Username</label>
                <input name="username" placeholder="Username" value={newStudent.username} onChange={handleChange} />
            </div>
            <div className="sm_form-group">
                <label>Password<span className="sm_required">*</span></label>
                <input type="password" name="password" placeholder="Password" value={newStudent.password} onChange={handleChange} required={!isEdit} />
            </div>
        </div>
        )}
        <div className="sm_form-row">
             <div className="sm_form-group">
                <label>Program (Course)<span className="sm_required">*</span></label>
                <select name="program" value={newStudent.program} onChange={handleChange} required>
                    <option value="">Select Program</option>
                    {PROGRAM_OPTIONS.map(prog => (<option key={prog} value={prog}>{prog}</option>))}
                </select>
            </div>
            <div className="sm_form-group">
                <label>Role</label>
                <select name="role" value={newStudent.role} onChange={handleChange} required>
                    {ROLES_OPTIONS.map(role => (<option key={role} value={role}>{role}</option>))}
                </select>
            </div>
        </div>
        <div className="sm_form-row">
            <div className="sm_form-group">
                <label>Batch</label>
                <select name="batch" value={newStudent.batch} onChange={handleChange} required>
                    <option value="">Select Batch</option>
                    {BATCHES_OPTIONS.map(batch => (<option key={batch} value={batch}>{batch}</option>))}
                </select>
            </div>
            <div className="sm_form-group">
                <label>Admission Date</label>
                <input type="date" name="admissionDate" value={newStudent.admissionDate} onChange={handleChange} />
            </div>
        </div>
        <div className="sm_form-group">
            <label>Courses Enrolled (Subjects)</label>
            <div className="sm_checkbox-group">
                {COURSES_OPTIONS.map((course) => (
                    <label key={course} className="sm_checkbox-label">
                        <input
                            type="checkbox"
                            value={course}
                            checked={newStudent.courses.includes(course)}
                            onChange={(e) => handleCheckboxChange(e, "courses")}
                        />
                        {course}
                    </label>
                ))}
            </div>
        </div>
        <div className="sm_form-row">
            <div className="sm_form-group">
                <label>Status</label>
                <select name="status" value={newStudent.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                </select>
            </div>
        </div>
        
        {newStudent.status === "Suspended" && (
            <div className="sm_form-group">
                <label>Suspension Reason</label>
                <input name="suspensionReason" placeholder="Suspension Reason" value={newStudent.suspensionReason} onChange={handleChange} />
            </div>
        )}
        
        <div className="sm_form-actions">
            <button type="submit" className="btn btn-primary">
                <Save size={20} style={{marginRight: '8px'}}/> {isEdit ? 'Update Student' : 'Save Student'}
            </button>
        </div>
    </form>
  );

  // --- JSX Render ---
  return (
    <div className="sm_user-management">
      <div className="ad_cs_batch-pro-course-slider-group">

              <h3>Students</h3>
      <div className="sm_search-wrapper">
                  <FiSearch className="sm_search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, roll number or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="sm_search-input"
                  />
      

              </div>
            </div>
      
      

      {/* Create Form - Inline */}
      {showForm && !editStudent && (
        <div className="sm_user-form-card fade-in">
           <div className="sm_form-header">
              <h3>Create New Student</h3>
              <button type="button" className="sm_form-close-btn" onClick={handleCloseForm}>
                <X size={20} />
              </button>
            </div>
          <StudentForm onSubmit={handleCreate} isEdit={false} />
        </div>
      )}

      {/* Student Table */}
      <div className="sm_table-wrapper">
        <table className="sm_users-table">
          <thead>
            <tr>
              <th className="sm_checkbox-col">
                <input
                  type="checkbox"
                  className="sm_table-checkbox"
                  onChange={handleSelectAll}
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                />
              </th>
              <th className="sm_name-cell">Full Name</th> 
              <th>Roll Number</th>
              <th>Program (Course)</th> {/* NEW Header */}
              <th>Email</th>
              <th>Subjects</th> {/* Changed Header */}
              <th>Batch</th> 
              <th>Admission Date</th>
              <th>Status</th>
              <th className="sm_actions-col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((t) => (
                <tr key={t.id}>
                  <td className="sm_checkbox-col">
                    <input type="checkbox" className="sm_table-checkbox" checked={isSelected(t.id)} onChange={() => handleSelectStudent(t.id)} />
                  </td>
                  <td className="sm_name-cell"> 
                        <div className="user-avatar-wrapper">
                        {t.profile_image ? (
                            <img
                                src={t.profile_image}
                                alt={t.username || t.fullName}
                                className="user-avatar"
                            />
                        ) : (
                            <div className="user-avatar-placeholder">
                                <HiUserCircle size={20} />
                            </div>
                        )}
                    </div>
                        <span className="sm_user-full-name">{t.fullName}</span> 
                   
                    
                  </td>
                  <td>{t.rollNumber}</td>
                  <td>{t.program}</td> {/* NEW Data */}
                  <td>{t.email}</td>
                  <td>{t.courses.join(", ")}</td>
                  <td>{t.batch}</td>
                  <td className="sm_date-cell">{t.admissionDate}</td>
                  <td>
                    <span className={getStatusClassName(t.status)}>{t.status}</span>
                  </td>
                  <td className="sm_actions-col">
                    <div className="sm_action-buttons">
                      <button className="sm_action-btn sm_action-edit" title="Edit Student" onClick={() => handleEdit(t)}>
                        <FiEdit2 size={16} />
                      </button>
                      <button className="sm_action-btn sm_action-delete" title="Delete Student" onClick={() => handleDelete(t)}>
                        <FiTrash2 size={16} />
                      </button>
                      <button
                        className={`sm_action-btn ${t.status === "Suspended" ? "sm_action-unsuspend" : "sm_action-suspend"}`}
                        title={t.status === "Suspended" ? "Reactivate" : "Suspend"}
                        onClick={() => handleSuspendClick(t)}
                      >
                        {t.status === "Suspended" ? (<MdBlock size={18} />) : (<RiUserForbidFill size={18} />)}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    {/* Colspan is now 10 */}
                    <td colSpan="10" className="sm_empty-state"> 
                        <p>No students found matching the criteria</p>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL (kept same) */}
      {editStudent && (
        <div className="sm_modal-overlay fade-in">
          <div className="sm_success-modal sm_modal-content-form">
            <div className="sm_form-header" style={{border: 'none', paddingBottom: 0}}>
              <h3 style={{fontSize: 'var(--font-size-xl)'}}>Edit Student: {editStudent.fullName}</h3>
              <button type="button" className="sm_form-close-btn" onClick={handleCloseForm}>
                <X size={20} />
              </button>
            </div>
            <StudentForm onSubmit={handleUpdate} isEdit={true} />
          </div>
        </div>
      )}

      {/* SUSPEND/REACTIVATE MODAL (kept same) */}
      {suspendPopup.open && (
        <div className="sm_modal-overlay fade-in">
          <div className="sm_success-modal" style={{ maxWidth: '500px' }}>
            {suspendPopup.status === 'Suspended' ? (
                <RiUserForbidFill size={48} style={{color: 'var(--brand-orange)'}} className="sm_success-icon" />
            ) : (
                <CheckCircle size={48} className="sm_success-icon" />
            )}
            
            <h3 className="sm_success-title" style={{color: suspendPopup.status === 'Suspended' ? 'var(--brand-orange-dark)' : 'var(--color-success-dark)'}}>
                {suspendPopup.status === 'Suspended' ? 'Confirm Suspension' : 'Confirm Reactivation'}
            </h3>
            
            <p className="sm_success-message" style={{marginBottom: 'var(--space-4)'}}>
                {suspendPopup.status === 'Suspended' ? 
                    `Apply suspension for ${suspendPopup.student.fullName}.` : 
                    `Reactivate ${suspendPopup.student.fullName}. Suspension reason/dates will be cleared.`
                }
            </p>

            <form onSubmit={handleSuspendConfirm} style={{width: '100%'}}>
              <div className="sm_form-group">
                <label style={{textAlign: 'left'}}>Status<span className="sm_required">*</span></label>
                <select 
                  name="status" 
                  value={suspendPopup.status} 
                  onChange={(e) => {
                      setSuspendPopup(prev => ({ 
                          ...prev, 
                          status: e.target.value,
                      }));
                  }}
                  required
                  className="sm_search-input" 
                  style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {suspendPopup.status === 'Suspended' && (
                <>
                  <div className="sm_form-group" style={{marginBottom: 'var(--space-4)'}}>
                      <label style={{textAlign: 'left'}}>Reason for Suspension<span className="sm_required">*</span></label>
                      <input 
                          name="reason" 
                          placeholder="Enter reason..." 
                          value={suspendPopup.reason} 
                          onChange={(e) => setSuspendPopup(prev => ({ ...prev, reason: e.target.value }))}
                          required
                          className="sm_search-input" 
                          style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                      />
                  </div>
                  
                  <div className="sm_form-group">
                      <label style={{textAlign: 'left'}}>Suspension Timeline (Start to End)</label>
                      <div className="sm_form-row" style={{gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)'}}>
                          <input 
                              type="date"
                              name="start_date" 
                              value={suspendPopup.start_date} 
                              onChange={(e) => {
                                  let end = suspendPopup.end_date;
                                  if (!end || new Date(end) <= new Date(e.target.value)) {
                                      end = getOneWeekFromNow(new Date(e.target.value || formatDate(new Date())));
                                  }
                                  setSuspendPopup(prev => ({ ...prev, start_date: e.target.value, end_date: end }));
                              }}
                              className="sm_search-input" 
                              style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                          />
                          <input 
                              type="date"
                              name="end_date" 
                              value={suspendPopup.end_date} 
                              onChange={(e) => setSuspendPopup(prev => ({ ...prev, end_date: e.target.value }))}
                              min={suspendPopup.start_date || formatDate(new Date())} 
                              className="sm_search-input" 
                              style={{paddingLeft: 'var(--space-4)', minWidth: 'unset'}}
                          />
                      </div>
                      <small style={{textAlign: 'left', marginTop: '5px', color: 'var(--color-gray-600)'}}>
                          *Default end date is 1 week from start date if left empty.
                      </small>
                  </div>
                </>
              )}

              <button 
                type="submit"
                className="btn btn-primary" 
                style={{backgroundColor: suspendPopup.status === 'Suspended' ? 'var(--brand-orange)' : 'var(--color-success)', width: '100%', marginTop: 'var(--space-6)', marginBottom: '10px'}}
              >
                {suspendPopup.status === 'Suspended' ? 'Confirm Suspend' : 'Confirm Reactivate'}
              </button>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => setSuspendPopup({open: false, student: null, reason: '', status: 'Suspended', start_date: formatDate(new Date()), end_date: getOneWeekFromNow(new Date())})}
                style={{width: '100%', color: 'var(--color-gray-700)', borderColor: 'var(--color-gray-300)'}}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Success Popup Modal (kept same) */}
      {showSuccessPopup && (
        <div className="sm_modal-overlay fade-in">
          <div className="sm_success-modal">
            <CheckCircle size={48} className="sm_success-icon" />
            <h3 className="sm_success-title">Success!</h3>
            <p className="sm_success-message">Student updated successfully!</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowSuccessPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal (kept same) */}
      {deletePopup.open && (
        <div className="sm_modal-overlay fade-in">
          <div className="sm_success-modal" style={{background: 'var(--color-white)'}}>
            <Trash2 size={48} style={{color: 'var(--color-error)'}} className="sm_success-icon" />
            <h3 className="sm_success-title" style={{color: 'var(--color-error-dark)'}}>Confirm Deletion</h3>
            <p className="sm_success-message">Are you sure you want to delete **{deletePopup.student.fullName}**?</p>
            <button 
              className="btn btn-primary" 
              style={{backgroundColor: 'var(--color-error)', width: '100%', marginBottom: '10px'}}
              onClick={() => {console.log(`Student ${deletePopup.student.fullName} deleted.`); setStudents(prev => prev.filter(t => t.id !== deletePopup.student.id)); setDeletePopup({open: false, student: null});}}
            >
              Confirm Delete
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setDeletePopup({open: false, student: null})}
              style={{width: '100%'}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;