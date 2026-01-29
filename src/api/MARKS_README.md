# Marks Management System

## Overview
Excel-based bulk marks upload system with grade calculation, pass/fail tracking, and analytics support.

## Features

### 1. Excel Import
- Bulk upload student marks from Excel files
- Automatic validation of roll numbers and subject codes
- Handles absent students (AB/Absent notation)
- Calculates percentage, grade, and grade points automatically
- Conflict resolution for duplicate entries

### 2. Grade System
- **A+**: 90-100% (10 points)
- **A**: 80-89% (9 points)
- **B+**: 70-79% (8 points)
- **B**: 60-69% (7 points)
- **C+**: 50-59% (6 points)
- **C**: 40-49% (5 points)
- **F**: <40% (0 points)

### 3. Status Workflow
- **Draft**: Initial upload status, editable
- **Published**: Final status, visible to students, cannot be deleted

### 4. Role-Based Access
- **Super Admin/Admin**: Full access to all classes
- **Teacher**: Access to assigned classes only
- **Student**: View only published marks for their class

## Excel Template Format

### Required Columns
| Column Name | Description | Example |
|------------|-------------|---------|
| Roll Number | Student's roll number | CS2024001 |
| Subject Code | Subject code from database | CS101 |
| Marks Obtained | Marks scored (or AB/Absent) | 85 |
| Max Marks | Maximum marks for exam | 100 |
| Passing Marks | Minimum marks to pass | 40 |

### Optional Columns
| Column Name | Description | Purpose |
|------------|-------------|---------|
| Student Name | Student's name | Reference only |
| Subject Name | Subject name | Reference only |
| Remarks | Comments | Additional notes |

### Example Excel Data
```
Roll Number | Student Name    | Subject Code | Marks Obtained | Max Marks | Passing Marks | Remarks
CS2024001   | John Doe        | CS101       | 85            | 100       | 40           | Good
CS2024002   | Jane Smith      | CS101       | AB            | 100       | 40           | Absent
CS2024003   | Bob Johnson     | CS101       | 42            | 100       | 40           | Pass
```

## Usage Instructions

### 1. Download Template
1. Click **"Download Template"** button
2. Open the downloaded Excel file
3. Fill in student marks following the format
4. Save the file

### 2. Upload Marks
1. Click **"Upload Marks"** button
2. Fill in metadata form:
   - **Class**: Select the class
   - **Exam Type**: Internal-1, Internal-2, Mid-Term, Final, etc.
   - **Exam Name**: e.g., "Mid Term Exam 2025"
   - **Exam Date**: Date of the exam
   - **Academic Year**: e.g., "2025-2026"
   - **Term**: Term-1, Term-2, Semester-1, etc.
   - **Passing Marks**: Default is 40
3. Select Excel file
4. Click **"Upload & Process"**
5. Review upload summary (success/failed counts)
6. Fix any errors and re-upload if needed

### 3. Publish Marks
1. Select marks records (checkboxes)
2. Click **"Publish Selected"** button
3. Confirm the action
4. Marks become visible to students

### 4. Export Marks
1. Apply filters (optional)
2. Click **"Export Marks"** button
3. Download Excel file with filtered marks

### 5. Delete Marks
1. Click delete icon on a marks record
2. **Note**: Only Draft marks can be deleted
3. Confirm deletion

## Validation Rules

### During Upload
1. **Roll Number**: Must exist in the selected class
2. **Subject Code**: Must exist in subjects table
3. **Marks Obtained**: Must be ≤ Max Marks (or AB/Absent)
4. **Max Marks**: Must be > 0
5. **Passing Marks**: Must be ≤ Max Marks

### Error Handling
- Invalid roll numbers are skipped with error message
- Invalid subject codes are skipped with error message
- Marks exceeding max marks are rejected
- Duplicate entries are updated (upsert behavior)

## Database Structure

### Marks Table
```sql
CREATE TABLE marks (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    institution_id UUID REFERENCES institutions(id),
    course_id UUID,
    level_id UUID,
    programme_id UUID,
    batch_id UUID,
    
    exam_type VARCHAR(50),
    exam_name VARCHAR(100),
    exam_date DATE,
    academic_year VARCHAR(20),
    term VARCHAR(20),
    
    marks_obtained DECIMAL(5,2),
    max_marks DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    grade_point DECIMAL(3,2),
    
    passing_marks DECIMAL(5,2) DEFAULT 40,
    is_passed BOOLEAN,
    is_absent BOOLEAN DEFAULT FALSE,
    
    class_rank INTEGER,
    subject_rank INTEGER,
    attendance_percentage DECIMAL(5,2),
    
    status VARCHAR(20) DEFAULT 'Draft',
    remarks TEXT,
    
    uploaded_by UUID REFERENCES "Users"(user_id),
    approved_by UUID REFERENCES "Users"(user_id),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(student_id, subject_id, exam_type, exam_name, academic_year, term)
);
```

### Views for Analytics

#### 1. Student Overall Performance
```sql
CREATE VIEW vw_student_overall_performance AS
SELECT 
    s.id as student_id,
    s.roll_number,
    u.username as student_name,
    c.class_name,
    m.academic_year,
    m.term,
    COUNT(*) as total_exams,
    COUNT(CASE WHEN m.is_passed THEN 1 END) as passed_count,
    COUNT(CASE WHEN NOT m.is_passed AND NOT m.is_absent THEN 1 END) as failed_count,
    COUNT(CASE WHEN m.is_absent THEN 1 END) as absent_count,
    AVG(CASE WHEN NOT m.is_absent THEN m.percentage END) as avg_percentage,
    AVG(CASE WHEN NOT m.is_absent THEN m.grade_point END) as avg_grade_point
FROM marks m
JOIN students s ON m.student_id = s.id
JOIN "Users" u ON s.user_id = u.user_id
JOIN classes c ON m.class_id = c.id
WHERE m.status = 'Published'
GROUP BY s.id, s.roll_number, u.username, c.class_name, m.academic_year, m.term;
```

#### 2. Class Performance Report
```sql
CREATE VIEW vw_class_performance_report AS
SELECT 
    c.id as class_id,
    c.class_name,
    m.exam_type,
    m.academic_year,
    m.term,
    sub.subject_name,
    COUNT(DISTINCT m.student_id) as total_students,
    COUNT(CASE WHEN m.is_passed THEN 1 END) as passed_count,
    COUNT(CASE WHEN NOT m.is_passed AND NOT m.is_absent THEN 1 END) as failed_count,
    COUNT(CASE WHEN m.is_absent THEN 1 END) as absent_count,
    AVG(CASE WHEN NOT m.is_absent THEN m.percentage END) as avg_percentage,
    MAX(CASE WHEN NOT m.is_absent THEN m.percentage END) as highest_percentage,
    MIN(CASE WHEN NOT m.is_absent THEN m.percentage END) as lowest_percentage
FROM marks m
JOIN classes c ON m.class_id = c.id
JOIN subjects sub ON m.subject_id = sub.id
WHERE m.status = 'Published'
GROUP BY c.id, c.class_name, m.exam_type, m.academic_year, m.term, sub.subject_name;
```

## API Functions

### marksApi.js

#### uploadMarksFromExcel(file, metadata)
- **Purpose**: Upload and process Excel file with student marks
- **Parameters**:
  - `file`: Excel file object
  - `metadata`: {class_id, exam_type, exam_name, exam_date, academic_year, term, passing_marks, uploaded_by}
- **Returns**: {data, error, summary}
  - `summary`: {total, success, failed, errors: [{row, error}]}

#### getAllMarks(filters)
- **Purpose**: Fetch marks with optional filtering
- **Parameters**: 
  - `filters`: {institution_id?, class_id?, subject_id?, exam_type?, term?, academic_year?, status?}
- **Returns**: {data, error}

#### getMarksByStudent(studentId, filters)
- **Purpose**: Get marks for a specific student (published only)
- **Parameters**:
  - `studentId`: Student UUID
  - `filters`: {academic_year?, term?, exam_type?}
- **Returns**: {data, error}

#### updateMarkStatus(ids, status, approvedBy)
- **Purpose**: Bulk update marks status (Draft → Published)
- **Parameters**:
  - `ids`: Array of marks UUIDs
  - `status`: 'Published'
  - `approvedBy`: User UUID
- **Returns**: {data, error}

#### deleteMarks(ids)
- **Purpose**: Delete draft marks records
- **Parameters**: 
  - `ids`: Array of marks UUIDs
- **Returns**: {data, error}

#### downloadMarksTemplate()
- **Purpose**: Generate and download Excel template
- **Returns**: Triggers file download

#### exportMarksToExcel(marks, filename)
- **Purpose**: Export marks data to Excel
- **Parameters**:
  - `marks`: Array of marks objects
  - `filename`: Output filename
- **Returns**: Triggers file download

## Troubleshooting

### Upload Errors

#### "Roll number not found in selected class"
- **Cause**: Student with that roll number doesn't exist in the selected class
- **Solution**: Verify roll number or add student to class first

#### "Invalid subject code"
- **Cause**: Subject code doesn't exist in subjects table
- **Solution**: Check subject code spelling or add subject first

#### "Marks obtained exceeds maximum marks"
- **Cause**: Entered marks > max marks
- **Solution**: Correct the marks value in Excel

#### "Duplicate entry"
- **Cause**: Marks for same student+subject+exam already uploaded
- **Solution**: System will update existing record (upsert behavior)

### Common Issues

#### Marks not visible to students
- **Solution**: Ensure marks status is 'Published'
- Check student is in the correct class

#### Cannot delete marks
- **Solution**: Only Draft marks can be deleted
- Published marks are permanent

#### Upload taking long time
- **Cause**: Large Excel file with many rows
- **Solution**: Split into smaller batches (max 500 rows recommended)

## Future Enhancements

### Planned Features
1. **Automatic Rank Calculation**: After publishing, calculate class_rank and subject_rank
2. **Grade Distribution Charts**: Visual analytics for grade distribution
3. **Comparative Analysis**: Term-over-term performance comparison
4. **Email Notifications**: Notify students when marks are published
5. **Marks Entry Form**: Individual marks entry form (alternative to Excel)
6. **Bulk Edit**: Edit multiple marks records at once
7. **Import History**: Track all upload operations with rollback capability

## Notes

- Excel files must be .xlsx or .xls format
- Maximum recommended file size: 5 MB
- Unique constraint: student + subject + exam_type + exam_name + academic_year + term
- Absent students get marks_obtained = 0, is_absent = true, grade = 'AB'
- Published marks cannot be edited or deleted (audit trail)
- Use "AB" or "Absent" (case-insensitive) in Marks Obtained column for absent students
