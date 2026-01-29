
export const BATCH_TIMETABLE_DATA = {
  "CA Foundation": {
    "2024": {
      "classes": [
        { "id": 101, "name": "Class 1: Accounting Basics", "subject": "Financial Accounting", "instructor": "Mr. Sharma" },
        { "id": 102, "name": "Class 2: Corporate Law Intro", "subject": "Corporate Laws", "instructor": "Ms. Patel" },
        { "id": 103, "name": "Class 3: Cost Management Funda", "subject": "Cost Management", "instructor": "Dr. Rao" },
        { "id": 104, "name": "Class 4: Direct Tax Basics", "subject": "Taxation", "instructor": "Mr. Sharma" },
        { "id": 105, "name": "Class 5: Business Economics", "subject": "Economics", "instructor": "Mr. Iyer" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Iyer", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Economics", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" }
        ],
        "Friday": [
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Patel", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 301, "name": "Mr. Sharma", "subjects": ["Financial Accounting", "Taxation"], "batches": 4, "workload": "High" },
        { "id": 302, "name": "Ms. Patel", "subjects": ["Corporate Laws"], "batches": 3, "workload": "Medium" },
        { "id": 303, "name": "Dr. Rao", "subjects": ["Cost Management"], "batches": 2, "workload": "Low" },
        { "id": 304, "name": "Mr. Iyer", "subjects": ["Economics"], "batches": 1, "workload": "Low" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 106, "name": "Class 1: Accounting for Beginners", "subject": "Financial Accounting", "instructor": "Mr. Sharma" },
        { "id": 107, "name": "Class 2: Law & Ethics", "subject": "Business Law", "instructor": "Ms. Desai" },
        { "id": 108, "name": "Class 3: Quant Techniques", "subject": "Quant. Aptitude", "instructor": "Dr. Singh" },
        { "id": 109, "name": "Class 4: Direct Tax Code", "subject": "Taxation", "instructor": "Mr. Sharma" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Business Law", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Quant. Aptitude", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Study Hour", "instructor": "N/A", "type": "study" }
        ],
        "Tuesday": [
          { "subject": "Quant. Aptitude", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Business Law", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Quant. Aptitude", "instructor": "Dr. Singh", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Business Law", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Revision Session", "instructor": "Ms. Desai", "type": "revision" },
          { "subject": "Quant. Aptitude", "instructor": "Dr. Singh", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Business Law", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Quant. Aptitude", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" }
        ],
        "Friday": [
          { "subject": "Business Law", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Quant. Aptitude", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Mr. Sharma", "type": "class" },
          { "subject": "Business Law", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Sharma", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 301, "name": "Mr. Sharma", "subjects": ["Financial Accounting", "Taxation"], "batches": 5, "workload": "Very High" },
        { "id": 305, "name": "Ms. Desai", "subjects": ["Business Law", "Revision"], "batches": 3, "workload": "Medium" },
        { "id": 306, "name": "Dr. Singh", "subjects": ["Quant. Aptitude"], "batches": 4, "workload": "Medium" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 110, "name": "Class 1: Advanced Ledgers", "subject": "Advanced Accounting", "instructor": "Ms. Desai" },
        { "id": 111, "name": "Class 2: Legal Framework", "subject": "Legal Studies", "instructor": "Mr. Verma" },
        { "id": 112, "name": "Class 3: Stat & Calc", "subject": "Statistics", "instructor": "Dr. Singh" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" }
        ],
        "Friday": [
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Desai", "type": "class" },
          { "subject": "Statistics", "instructor": "Dr. Singh", "type": "class" },
          { "subject": "Legal Studies", "instructor": "Mr. Verma", "type": "class" },
          { "subject": "Doubt Session", "instructor": "Ms. Desai", "type": "revision" }
        ]
      },
      "instructors": [
        { "id": 305, "name": "Ms. Desai", "subjects": ["Advanced Accounting", "Doubt Session"], "batches": 4, "workload": "Medium" },
        { "id": 306, "name": "Dr. Singh", "subjects": ["Statistics"], "batches": 5, "workload": "High" },
        { "id": 307, "name": "Mr. Verma", "subjects": ["Legal Studies"], "batches": 3, "workload": "Medium" }
      ]
    }
  },
  "CMA Intermediate": {
    "2024": {
      "classes": [
        { "id": 201, "name": "Advanced Accounting - IFRS", "subject": "Advanced Accounting", "instructor": "Ms. Kapoor" },
        { "id": 202, "name": "Company Law - Compliance", "subject": "Corporate Laws", "instructor": "Mr. Shah" },
        { "id": 203, "name": "Costing & Budgeting", "subject": "Cost Management", "instructor": "Dr. Rao" },
        { "id": 204, "name": "Indirect Tax (GST)", "subject": "Indirect Taxation", "instructor": "Mr. Kumar" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Mr. Shah", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Indirect Taxation", "instructor": "Mr. Kumar", "type": "class" },
          { "subject": "Case Study Analysis", "instructor": "Mr. Shah", "type": "analysis" }
        ],
        "Tuesday": [
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Mr. Shah", "type": "class" },
          { "subject": "Indirect Taxation", "instructor": "Mr. Kumar", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Corporate Laws", "instructor": "Mr. Shah", "type": "class" },
          { "subject": "Indirect Taxation", "instructor": "Mr. Kumar", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Thursday": [
          { "subject": "Indirect Taxation", "instructor": "Mr. Kumar", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Mr. Shah", "type": "class" },
          { "subject": "Indirect Taxation", "instructor": "Mr. Kumar", "type": "class" }
        ],
        "Friday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Mr. Shah", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Indirect Taxation", "instructor": "Mr. Kumar", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 308, "name": "Ms. Kapoor", "subjects": ["Advanced Accounting"], "batches": 5, "workload": "High" },
        { "id": 309, "name": "Mr. Shah", "subjects": ["Corporate Laws", "Case Study"], "batches": 3, "workload": "Medium" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["Cost Management"], "batches": 4, "workload": "Medium" },
        { "id": 311, "name": "Mr. Kumar", "subjects": ["Indirect Taxation"], "batches": 2, "workload": "Low" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 205, "name": "Strategic Cost Mgt", "subject": "Cost Management", "instructor": "Dr. Rao" },
        { "id": 206, "name": "Tax Planning", "subject": "Taxation", "instructor": "Mr. Singh" },
        { "id": 207, "name": "Financial Management", "subject": "Financial Mgmt", "instructor": "Ms. Kapoor" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Test Series", "instructor": "Mr. Singh", "type": "test" }
        ],
        "Tuesday": [
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Friday": [
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Singh", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 310, "name": "Dr. Rao", "subjects": ["Cost Management"], "batches": 6, "workload": "Very High" },
        { "id": 308, "name": "Ms. Kapoor", "subjects": ["Financial Mgmt"], "batches": 5, "workload": "High" },
        { "id": 312, "name": "Mr. Singh", "subjects": ["Taxation", "Test Series"], "batches": 4, "workload": "Medium" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 208, "name": "Audit & Assurance", "subject": "Auditing", "instructor": "Mr. Reddy" },
        { "id": 209, "name": "Financial Reporting", "subject": "Reporting", "instructor": "Ms. Kapoor" },
        { "id": 210, "name": "Business Strategy", "subject": "Strategy", "instructor": "Dr. Khan" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Doubt Session", "instructor": "Dr. Khan", "type": "revision" }
        ],
        "Wednesday": [
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" }
        ],
        "Friday": [
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" },
          { "subject": "Reporting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Auditing", "instructor": "Mr. Reddy", "type": "class" },
          { "subject": "Strategy", "instructor": "Dr. Khan", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 313, "name": "Mr. Reddy", "subjects": ["Auditing"], "batches": 4, "workload": "Medium" },
        { "id": 308, "name": "Ms. Kapoor", "subjects": ["Reporting"], "batches": 5, "workload": "High" },
        { "id": 314, "name": "Dr. Khan", "subjects": ["Strategy", "Doubt Session"], "batches": 3, "workload": "Medium" }
      ]
    }
  },
  "CA Intermediate": {
    "2024": {
      "classes": [
        { "id": 401, "name": "Group 1: Advanced Accounting", "subject": "Advanced Accounting", "instructor": "Ms. Kapoor" },
        { "id": 402, "name": "Group 1: Corporate Laws", "subject": "Corporate Laws", "instructor": "Prof. Ali Khan" },
        { "id": 403, "name": "Group 1: Taxation (DT/IDT)", "subject": "Taxation", "instructor": "Mr. Vikas Gupta" },
        { "id": 404, "name": "Group 1: Cost Management", "subject": "Cost Management", "instructor": "Dr. Rao" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Taxation", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Vikas Gupta", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Corporate Laws", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Prof. Ali Khan", "type": "class" }
        ],
        "Friday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Taxation", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 308, "name": "Ms. Kapoor", "subjects": ["Advanced Accounting"], "batches": 4, "workload": "High" },
        { "id": 315, "name": "Prof. Ali Khan", "subjects": ["Corporate Laws"], "batches": 3, "workload": "Medium" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["Taxation"], "batches": 4, "workload": "High" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["Cost Management"], "batches": 5, "workload": "Very High" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 405, "name": "Group 2: Auditing & Assurance", "subject": "Auditing", "instructor": "Ms. Patel" },
        { "id": 406, "name": "Group 2: Financial Management", "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das" },
        { "id": 407, "name": "Group 2: Cost & Management Acc", "subject": "CMA", "instructor": "Dr. Rao" },
        { "id": 408, "name": "Group 2: Enterprise Information", "subject": "E.I.S.", "instructor": "Mr. Iyer" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Doubt Session (FM)", "instructor": "Ms. Sunita Das", "type": "revision" }
        ],
        "Thursday": [
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "class" }
        ],
        "Friday": [
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "class" },
          { "subject": "Revision Test", "instructor": "Ms. Patel", "type": "test" }
        ]
      },
      "instructors": [
        { "id": 302, "name": "Ms. Patel", "subjects": ["Auditing", "Test"], "batches": 3, "workload": "Medium" },
        { "id": 316, "name": "Ms. Sunita Das", "subjects": ["Financial Mgmt"], "batches": 4, "workload": "Medium" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["CMA"], "batches": 5, "workload": "Very High" },
        { "id": 304, "name": "Mr. Iyer", "subjects": ["E.I.S."], "batches": 4, "workload": "Medium" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 409, "name": "Group 1 & 2 Revision", "subject": "Multi-Subject Review", "instructor": "All Instructors" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Advanced Accounting", "instructor": "Ms. Kapoor", "type": "revision" },
          { "subject": "Corporate Laws", "instructor": "Prof. Ali Khan", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Taxation (IDT)", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Cost Management", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Auditing", "instructor": "Ms. Patel", "type": "revision" },
          { "subject": "Financial Mgmt", "instructor": "Ms. Sunita Das", "type": "revision" },
          { "subject": "CMA", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "E.I.S.", "instructor": "Mr. Iyer", "type": "revision" },
          { "subject": "Taxation (DT)", "instructor": "Mr. Vikas Gupta", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Mock Exam - G1", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G1", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G1", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G1", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam Debrief", "instructor": "Ms. Kapoor", "type": "revision" }
        ],
        "Thursday": [
          { "subject": "Mock Exam - G2", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G2", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G2", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G2", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam Debrief", "instructor": "Dr. Rao", "type": "revision" }
        ],
        "Friday": [
          { "subject": "Doubt Clearing", "instructor": "All Instructors", "type": "revision" },
          { "subject": "Strategic Planning", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Doubt Clearing", "instructor": "All Instructors", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ]
      },
      "instructors": [
        { "id": 308, "name": "Ms. Kapoor", "subjects": ["Advanced Accounting", "Debrief"], "batches": 2, "workload": "Low" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["Cost Mgt", "Debrief"], "batches": 3, "workload": "Medium" },
        { "id": 315, "name": "Prof. Ali Khan", "subjects": ["Corporate Laws", "Strategy"], "batches": 2, "workload": "Low" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["Taxation"], "batches": 2, "workload": "Low" }
      ]
    }
  },
  "CA Final (Group 1)": {
    "2024": {
      "classes": [
        { "id": 501, "name": "Financial Reporting (FR)", "subject": "FR", "instructor": "Ms. Sunita Das" },
        { "id": 502, "name": "Strategic Financial Mgmt (SFM)", "subject": "SFM", "instructor": "Mr. Singh" },
        { "id": 503, "name": "Advanced Auditing (Audit)", "subject": "Audit", "instructor": "Ms. Patel" },
        { "id": 504, "name": "Corporate & Allied Laws (Law)", "subject": "Law", "instructor": "Dr. Ravi Menon" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" }
        ],
        "Thursday": [
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" }
        ],
        "Friday": [
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Case Study (FR)", "instructor": "Ms. Sunita Das", "type": "analysis" }
        ]
      },
      "instructors": [
        { "id": 316, "name": "Ms. Sunita Das", "subjects": ["FR"], "batches": 4, "workload": "High" },
        { "id": 312, "name": "Mr. Singh", "subjects": ["SFM"], "batches": 3, "workload": "Medium" },
        { "id": 302, "name": "Ms. Patel", "subjects": ["Audit"], "batches": 3, "workload": "Medium" },
        { "id": 317, "name": "Dr. Ravi Menon", "subjects": ["Law"], "batches": 3, "workload": "Medium" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 505, "name": "Financial Reporting (FR)", "subject": "FR", "instructor": "Ms. Sunita Das" },
        { "id": 506, "name": "Strategic Financial Mgmt (SFM)", "subject": "SFM", "instructor": "Mr. Singh" },
        { "id": 507, "name": "Advanced Auditing (Audit)", "subject": "Audit", "instructor": "Ms. Patel" },
        { "id": 508, "name": "Corporate & Allied Laws (Law)", "subject": "Law", "instructor": "Dr. Ravi Menon" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Doubt Session (Law)", "instructor": "Dr. Ravi Menon", "type": "revision" }
        ],
        "Friday": [
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "class" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "class" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "class" },
          { "subject": "Test Series (FR)", "instructor": "Ms. Sunita Das", "type": "test" }
        ]
      },
      "instructors": [
        { "id": 316, "name": "Ms. Sunita Das", "subjects": ["FR", "Test"], "batches": 4, "workload": "High" },
        { "id": 312, "name": "Mr. Singh", "subjects": ["SFM"], "batches": 4, "workload": "High" },
        { "id": 302, "name": "Ms. Patel", "subjects": ["Audit"], "batches": 4, "workload": "High" },
        { "id": 317, "name": "Dr. Ravi Menon", "subjects": ["Law", "Doubt"], "batches": 3, "workload": "Medium" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 509, "name": "Financial Reporting (FR) Revision", "subject": "FR", "instructor": "Ms. Sunita Das" },
        { "id": 510, "name": "Strategic Financial Mgmt (SFM) Revision", "subject": "SFM", "instructor": "Mr. Singh" },
        { "id": 511, "name": "Advanced Auditing (Audit) Revision", "subject": "Audit", "instructor": "Ms. Patel" },
        { "id": 512, "name": "Corporate & Allied Laws (Law) Revision", "subject": "Law", "instructor": "Dr. Ravi Menon" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "revision" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "revision" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "revision" },
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Tuesday": [
          { "subject": "Audit", "instructor": "Ms. Patel", "type": "revision" },
          { "subject": "SFM", "instructor": "Mr. Singh", "type": "revision" },
          { "subject": "FR", "instructor": "Ms. Sunita Das", "type": "revision" },
          { "subject": "Law", "instructor": "Dr. Ravi Menon", "type": "revision" },
          { "subject": "Mock Exam Brief", "instructor": "Mr. Singh", "type": "revision" }
        ],
        "Wednesday": [
          { "subject": "Mock Exam - G1 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G1 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G1 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G1 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Debrief (Law)", "instructor": "Dr. Ravi Menon", "type": "revision" }
        ],
        "Thursday": [
          { "subject": "Doubt Clearing (FR)", "instructor": "Ms. Sunita Das", "type": "revision" },
          { "subject": "Doubt Clearing (SFM)", "instructor": "Mr. Singh", "type": "revision" },
          { "subject": "Doubt Clearing (Audit)", "instructor": "Ms. Patel", "type": "revision" },
          { "subject": "Doubt Clearing (Law)", "instructor": "Dr. Ravi Menon", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Friday": [
          { "subject": "FR Marathon", "instructor": "Ms. Sunita Das", "type": "revision" },
          { "subject": "SFM Marathon", "instructor": "Mr. Singh", "type": "revision" },
          { "subject": "Audit Marathon", "instructor": "Ms. Patel", "type": "revision" },
          { "subject": "Law Marathon", "instructor": "Dr. Ravi Menon", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ]
      },
      "instructors": [
        { "id": 316, "name": "Ms. Sunita Das", "subjects": ["FR"], "batches": 3, "workload": "Medium" },
        { "id": 312, "name": "Mr. Singh", "subjects": ["SFM"], "batches": 3, "workload": "Medium" },
        { "id": 302, "name": "Ms. Patel", "subjects": ["Audit"], "batches": 3, "workload": "Medium" },
        { "id": 317, "name": "Dr. Ravi Menon", "subjects": ["Law"], "batches": 3, "workload": "Medium" }
      ]
    }
  },
  "CA Final (Group 2)": {
    "2024": {
      "classes": [
        { "id": 601, "name": "Strategic Cost Mgt & Perf Evaluation (SCMPE)", "subject": "SCMPE", "instructor": "Dr. Rao" },
        { "id": 602, "name": "Elective Paper (Risk Management)", "subject": "Risk Mgt", "instructor": "Prof. Ali Khan" },
        { "id": 603, "name": "Direct Tax Laws (DT)", "subject": "DT", "instructor": "Mr. Vikas Gupta" },
        { "id": 604, "name": "Indirect Tax Laws (IDT)", "subject": "IDT", "instructor": "Ms. Priya Shah" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Risk Mgt", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Risk Mgt", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "Risk Mgt", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Risk Mgt", "instructor": "Prof. Ali Khan", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "Risk Mgt", "instructor": "Prof. Ali Khan", "type": "class" }
        ],
        "Friday": [
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Case Study (DT)", "instructor": "Mr. Vikas Gupta", "type": "analysis" }
        ]
      },
      "instructors": [
        { "id": 310, "name": "Dr. Rao", "subjects": ["SCMPE"], "batches": 4, "workload": "High" },
        { "id": 315, "name": "Prof. Ali Khan", "subjects": ["Risk Mgt"], "batches": 3, "workload": "Medium" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["DT", "Case Study"], "batches": 4, "workload": "High" },
        { "id": 319, "name": "Ms. Priya Shah", "subjects": ["IDT"], "batches": 3, "workload": "Medium" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 605, "name": "Strategic Cost Mgt & Perf Evaluation (SCMPE)", "subject": "SCMPE", "instructor": "Dr. Rao" },
        { "id": 606, "name": "Elective Paper (Int. Taxation)", "subject": "Int. Tax", "instructor": "Ms. Priya Shah" },
        { "id": 607, "name": "Direct Tax Laws (DT)", "subject": "DT", "instructor": "Mr. Vikas Gupta" },
        { "id": 608, "name": "Indirect Tax Laws (IDT)", "subject": "IDT", "instructor": "Ms. Priya Shah" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Int. Tax", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Int. Tax", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Int. Tax", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "Int. Tax", "instructor": "Ms. Priya Shah", "type": "class" }
        ],
        "Thursday": [
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Int. Tax", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Friday": [
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Int. Tax Case Study", "instructor": "Ms. Priya Shah", "type": "analysis" }
        ]
      },
      "instructors": [
        { "id": 310, "name": "Dr. Rao", "subjects": ["SCMPE"], "batches": 4, "workload": "High" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["DT"], "batches": 4, "workload": "High" },
        { "id": 319, "name": "Ms. Priya Shah", "subjects": ["IDT", "Int. Tax", "Case Study"], "batches": 5, "workload": "Very High" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 609, "name": "SCMPE Revision", "subject": "SCMPE", "instructor": "Dr. Rao" },
        { "id": 610, "name": "DT Revision", "subject": "DT", "instructor": "Mr. Vikas Gupta" },
        { "id": 611, "name": "IDT Revision", "subject": "IDT", "instructor": "Ms. Priya Shah" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "revision" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "revision" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "Doubt Session (DT)", "instructor": "Mr. Vikas Gupta", "type": "revision" }
        ],
        "Tuesday": [
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "revision" },
          { "subject": "SCMPE", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "revision" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Wednesday": [
          { "subject": "Mock Exam - G2 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G2 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G2 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G2 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Debrief (IDT)", "instructor": "Ms. Priya Shah", "type": "revision" }
        ],
        "Thursday": [
          { "subject": "Doubt Clearing (SCMPE)", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "Doubt Clearing (DT)", "instructor": "Mr. Vikas Gupta", "type": "revision" },
          { "subject": "Doubt Clearing (IDT)", "instructor": "Ms. Priya Shah", "type": "revision" },
          { "subject": "Elective Paper Drill", "instructor": "Prof. Ali Khan", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Friday": [
          { "subject": "SCMPE Marathon", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "DT Marathon", "instructor": "Mr. Vikas Gupta", "type": "revision" },
          { "subject": "IDT Marathon", "instructor": "Ms. Priya Shah", "type": "revision" },
          { "subject": "Elective Marathon", "instructor": "Prof. Ali Khan", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ]
      },
      "instructors": [
        { "id": 310, "name": "Dr. Rao", "subjects": ["SCMPE"], "batches": 3, "workload": "Medium" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["DT"], "batches": 3, "workload": "Medium" },
        { "id": 319, "name": "Ms. Priya Shah", "subjects": ["IDT"], "batches": 3, "workload": "Medium" },
        { "id": 315, "name": "Prof. Ali Khan", "subjects": ["Elective"], "batches": 2, "workload": "Low" }
      ]
    }
  },
  "CMA Foundation": {
    "2024": {
      "classes": [
        { "id": 701, "name": "Fundamentals of Economics", "subject": "Economics", "instructor": "Mr. Arjun Varma" },
        { "id": 702, "name": "Fundamentals of Accounting", "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia" },
        { "id": 703, "name": "Fundamentals of Law & Ethics", "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain" },
        { "id": 704, "name": "Fundamentals of Business Maths", "subject": "Business Maths", "instructor": "Dr. Anand Singh" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" }
        ],
        "Friday": [
          { "subject": "Revision (Maths)", "instructor": "Dr. Anand Singh", "type": "revision" },
          { "subject": "Revision (Accounts)", "instructor": "Ms. Neha Bhatia", "type": "revision" },
          { "subject": "Test Series", "instructor": "Mr. Rohit Jain", "type": "test" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 323, "name": "Mr. Arjun Varma", "subjects": ["Economics"], "batches": 4, "workload": "High" },
        { "id": 321, "name": "Ms. Neha Bhatia", "subjects": ["Financial Accounting"], "batches": 4, "workload": "High" },
        { "id": 320, "name": "Mr. Rohit Jain", "subjects": ["Law & Ethics", "Test"], "batches": 3, "workload": "Medium" },
        { "id": 322, "name": "Dr. Anand Singh", "subjects": ["Business Maths"], "batches": 3, "workload": "Medium" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 705, "name": "Fundamentals of Economics", "subject": "Economics", "instructor": "Mr. Arjun Varma" },
        { "id": 706, "name": "Fundamentals of Accounting", "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia" },
        { "id": 707, "name": "Fundamentals of Law & Ethics", "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain" },
        { "id": 708, "name": "Fundamentals of Business Maths", "subject": "Business Maths", "instructor": "Dr. Anand Singh" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" },
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Economics", "instructor": "Mr. Arjun Varma", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" },
          { "subject": "Law & Ethics", "instructor": "Mr. Rohit Jain", "type": "class" },
          { "subject": "Business Maths", "instructor": "Dr. Anand Singh", "type": "class" },
          { "subject": "Financial Accounting", "instructor": "Ms. Neha Bhatia", "type": "class" }
        ],
        "Friday": [
          { "subject": "Doubt Session (Law)", "instructor": "Mr. Rohit Jain", "type": "revision" },
          { "subject": "Test Series (Eco)", "instructor": "Mr. Arjun Varma", "type": "test" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Revision (Maths)", "instructor": "Dr. Anand Singh", "type": "revision" },
          { "subject": "Revision (Accounts)", "instructor": "Ms. Neha Bhatia", "type": "revision" }
        ]
      },
      "instructors": [
        { "id": 323, "name": "Mr. Arjun Varma", "subjects": ["Economics", "Test"], "batches": 4, "workload": "High" },
        { "id": 321, "name": "Ms. Neha Bhatia", "subjects": ["Financial Accounting"], "batches": 4, "workload": "High" },
        { "id": 320, "name": "Mr. Rohit Jain", "subjects": ["Law & Ethics", "Doubt"], "batches": 3, "workload": "Medium" },
        { "id": 322, "name": "Dr. Anand Singh", "subjects": ["Business Maths"], "batches": 3, "workload": "Medium" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 709, "name": "Foundation Revision Module 1", "subject": "Module 1", "instructor": "Mr. Arjun Varma" },
        { "id": 710, "name": "Foundation Revision Module 2", "subject": "Module 2", "instructor": "Ms. Neha Bhatia" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Module 1 (Eco)", "instructor": "Mr. Arjun Varma", "type": "revision" },
          { "subject": "Module 2 (Acct)", "instructor": "Ms. Neha Bhatia", "type": "revision" },
          { "subject": "Module 1 (Law)", "instructor": "Mr. Rohit Jain", "type": "revision" },
          { "subject": "Module 2 (Maths)", "instructor": "Dr. Anand Singh", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Tuesday": [
          { "subject": "Module 2 (Acct)", "instructor": "Ms. Neha Bhatia", "type": "revision" },
          { "subject": "Module 1 (Eco)", "instructor": "Mr. Arjun Varma", "type": "revision" },
          { "subject": "Module 2 (Maths)", "instructor": "Dr. Anand Singh", "type": "revision" },
          { "subject": "Module 1 (Law)", "instructor": "Mr. Rohit Jain", "type": "revision" },
          { "subject": "Full Mock Test", "instructor": "Proctors", "type": "test" }
        ],
        "Wednesday": [
          { "subject": "Debrief", "instructor": "Ms. Neha Bhatia", "type": "revision" },
          { "subject": "Doubt Session", "instructor": "All Instructors", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Thursday": [
          { "subject": "Module 1 (Eco)", "instructor": "Mr. Arjun Varma", "type": "revision" },
          { "subject": "Module 2 (Acct)", "instructor": "Ms. Neha Bhatia", "type": "revision" },
          { "subject": "Module 1 (Law)", "instructor": "Mr. Rohit Jain", "type": "revision" },
          { "subject": "Module 2 (Maths)", "instructor": "Dr. Anand Singh", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Friday": [
          { "subject": "Module 2 (Acct)", "instructor": "Ms. Neha Bhatia", "type": "revision" },
          { "subject": "Module 1 (Eco)", "instructor": "Mr. Arjun Varma", "type": "revision" },
          { "subject": "Module 2 (Maths)", "instructor": "Dr. Anand Singh", "type": "revision" },
          { "subject": "Module 1 (Law)", "instructor": "Mr. Rohit Jain", "type": "revision" },
          { "subject": "Final Prep Talk", "instructor": "Mr. Arjun Varma", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 323, "name": "Mr. Arjun Varma", "subjects": ["Economics", "Prep"], "batches": 3, "workload": "Medium" },
        { "id": 321, "name": "Ms. Neha Bhatia", "subjects": ["Financial Accounting", "Debrief"], "batches": 3, "workload": "Medium" },
        { "id": 320, "name": "Mr. Rohit Jain", "subjects": ["Law & Ethics"], "batches": 2, "workload": "Low" },
        { "id": 322, "name": "Dr. Anand Singh", "subjects": ["Business Maths"], "batches": 2, "workload": "Low" }
      ]
    }
  },
  "CMA Final": {
    "2024": {
      "classes": [
        { "id": 801, "name": "Corporate Laws & Compliance", "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel" },
        { "id": 802, "name": "Strategic Financial Management", "subject": "SFM", "instructor": "Dr. Sameer Rao" },
        { "id": 803, "name": "Strategic Cost Management", "subject": "SCM", "instructor": "Dr. Rao" },
        { "id": 804, "name": "Direct Tax Laws", "subject": "DT", "instructor": "Mr. Vikas Gupta" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "SFM", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "SCM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "SCM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SFM", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "SCM", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SFM", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "SCM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "SFM", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "SCM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SFM", "instructor": "Dr. Sameer Rao", "type": "class" }
        ],
        "Friday": [
          { "subject": "Test Series (SCM)", "instructor": "Dr. Rao", "type": "test" },
          { "subject": "Corporate Laws", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "SFM", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "DT", "instructor": "Mr. Vikas Gupta", "type": "class" },
          { "subject": "SCM", "instructor": "Dr. Rao", "type": "class" }
        ]
      },
      "instructors": [
        { "id": 324, "name": "Ms. Pooja Patel", "subjects": ["Corporate Laws"], "batches": 4, "workload": "High" },
        { "id": 325, "name": "Dr. Sameer Rao", "subjects": ["SFM"], "batches": 3, "workload": "Medium" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["SCM", "Test"], "batches": 5, "workload": "Very High" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["DT"], "batches": 4, "workload": "High" }
      ]
    },
    "2025": {
      "classes": [
        { "id": 805, "name": "Corporate Financial Reporting", "subject": "CFR", "instructor": "Dr. Sameer Rao" },
        { "id": 806, "name": "Indirect Tax Laws", "subject": "IDT", "instructor": "Ms. Priya Shah" },
        { "id": 807, "name": "Strategic Performance Management", "subject": "SPM", "instructor": "Dr. Rao" },
        { "id": 808, "name": "Audit & Assurance", "subject": "Audit", "instructor": "Ms. Pooja Patel" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "CFR", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SPM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "CFR", "instructor": "Dr. Sameer Rao", "type": "class" }
        ],
        "Tuesday": [
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "SPM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "CFR", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" }
        ],
        "Wednesday": [
          { "subject": "SPM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "CFR", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "SPM", "instructor": "Dr. Rao", "type": "class" }
        ],
        "Thursday": [
          { "subject": "Audit", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "CFR", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "SPM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Pooja Patel", "type": "class" }
        ],
        "Friday": [
          { "subject": "CFR", "instructor": "Dr. Sameer Rao", "type": "class" },
          { "subject": "SPM", "instructor": "Dr. Rao", "type": "class" },
          { "subject": "Audit", "instructor": "Ms. Pooja Patel", "type": "class" },
          { "subject": "IDT", "instructor": "Ms. Priya Shah", "type": "class" },
          { "subject": "Case Study (SPM)", "instructor": "Dr. Rao", "type": "analysis" }
        ]
      },
      "instructors": [
        { "id": 325, "name": "Dr. Sameer Rao", "subjects": ["CFR"], "batches": 4, "workload": "High" },
        { "id": 319, "name": "Ms. Priya Shah", "subjects": ["IDT"], "batches": 4, "workload": "High" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["SPM", "Case Study"], "batches": 5, "workload": "Very High" },
        { "id": 324, "name": "Ms. Pooja Patel", "subjects": ["Audit"], "batches": 4, "workload": "High" }
      ]
    },
    "2026": {
      "classes": [
        { "id": 809, "name": "Final Full Revision", "subject": "All Subjects", "instructor": "All Instructors" }
      ],
      "timetable": {
        "Monday": [
          { "subject": "DT Revision", "instructor": "Mr. Vikas Gupta", "type": "revision" },
          { "subject": "IDT Revision", "instructor": "Ms. Priya Shah", "type": "revision" },
          { "subject": "SFM Revision", "instructor": "Dr. Sameer Rao", "type": "revision" },
          { "subject": "SCM Revision", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" }
        ],
        "Tuesday": [
          { "subject": "CFR Revision", "instructor": "Dr. Sameer Rao", "type": "revision" },
          { "subject": "Audit Revision", "instructor": "Ms. Pooja Patel", "type": "revision" },
          { "subject": "Corporate Laws Revision", "instructor": "Ms. Pooja Patel", "type": "revision" },
          { "subject": "SPM Revision", "instructor": "Dr. Rao", "type": "revision" },
          { "subject": "Mock Exam Brief", "instructor": "Dr. Sameer Rao", "type": "revision" }
        ],
        "Wednesday": [
          { "subject": "Mock Exam - G3 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G3 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G3 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Mock Exam - G3 Full", "instructor": "Proctors", "type": "test" },
          { "subject": "Debrief (SFM/CFR)", "instructor": "Dr. Sameer Rao", "type": "revision" }
        ],
        "Thursday": [
          { "subject": "Doubt Clearing (Tax)", "instructor": "Tax Faculty", "type": "revision" },
          { "subject": "Doubt Clearing (Law/Audit)", "instructor": "Law Faculty", "type": "revision" },
          { "subject": "Doubt Clearing (Cost/FM)", "instructor": "Cost/FM Faculty", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Test Series Discussion", "instructor": "Dr. Rao", "type": "revision" }
        ],
        "Friday": [
          { "subject": "Mega Marathon Session", "instructor": "All Instructors", "type": "revision" },
          { "subject": "Mega Marathon Session", "instructor": "All Instructors", "type": "revision" },
          { "subject": "Mega Marathon Session", "instructor": "All Instructors", "type": "revision" },
          { "subject": "Self-Study", "instructor": "N/A", "type": "study" },
          { "subject": "Final Prep Review", "instructor": "Ms. Pooja Patel", "type": "revision" }
        ]
      },
      "instructors": [
        { "id": 325, "name": "Dr. Sameer Rao", "subjects": ["CFR", "SFM"], "batches": 3, "workload": "Medium" },
        { "id": 319, "name": "Ms. Priya Shah", "subjects": ["IDT"], "batches": 2, "workload": "Low" },
        { "id": 310, "name": "Dr. Rao", "subjects": ["SCM", "SPM"], "batches": 3, "workload": "Medium" },
        { "id": 324, "name": "Ms. Pooja Patel", "subjects": ["Audit", "Law"], "batches": 3, "workload": "Medium" },
        { "id": 318, "name": "Mr. Vikas Gupta", "subjects": ["DT"], "batches": 2, "workload": "Low" }
      ]
    }
  }
};