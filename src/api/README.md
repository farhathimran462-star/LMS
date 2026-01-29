# Supabase API Documentation

## Setup

1. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Import the API functions in your components:
```javascript
import { getAllInstitutions, createInstitution } from '../api/institutionsApi';
```

## Usage Examples

### Institutions

```javascript
// Get all institutions
const { data, error } = await getAllInstitutions();

// Create institution
const newInstitution = {
  institute_id: 'INST001',
  institute_name: 'ABC Institute',
  photo: 'https://example.com/photo.jpg',
  location: 'New York'
};
const { data, error } = await createInstitution(newInstitution);

// Update institution
const { data, error } = await updateInstitution(id, {
  location: 'Boston'
});

// Delete institution
const { error } = await deleteInstitution(id);
```

### Courses & Levels

```javascript
// Get all courses
const { data, error } = await getAllCourses();

// Get levels by course
const { data, error } = await getLevelsByCourse(courseId);

// Create course
const { data, error } = await createCourse({
  course_id: 'CS101',
  course_name: 'Computer Science',
  description: 'Intro to CS'
});
```

### Subjects & Chapters

```javascript
// Get subject with chapters
const { data, error } = await getSubjectById(subjectId);

// Create subject with chapters
const subjectData = {
  subject_code: 'MATH101',
  subject_name: 'Mathematics',
  level_id: 'level-uuid',
  estimated_periods: 40
};
const { data: subject } = await createSubject(subjectData);

// Add chapters
const chapters = [
  { subject_code: 'MATH101', chapter_number: 1, chapter_name: 'Algebra' },
  { subject_code: 'MATH101', chapter_number: 2, chapter_name: 'Geometry' }
];
await createMultipleChapters(chapters);
```

### Programmes

```javascript
// Create programme with subjects
const programmeData = {
  programme_id: 'PROG001',
  programme_name: 'Full Stack Development',
  course_id: 'course-uuid',
  level_id: 'level-uuid',
  description: 'Complete web dev course'
};
const subjectIds = ['subject1-uuid', 'subject2-uuid'];
const { data, error } = await createProgrammeWithSubjects(programmeData, subjectIds);

// Update programme subjects
await updateProgrammeSubjects(programmeId, newSubjectIds);
```

### Batches

```javascript
// Create batch
const batchData = {
  batch_id: 'BATCH-2025-001',
  batch_name: 'Morning Batch',
  institute_id: 'inst-uuid',
  course_id: 'course-uuid',
  level_id: 'level-uuid',
  programme_id: 'prog-uuid',
  mode: 'Hybrid',
  start_time: '09:00:00',
  end_time: '13:00:00',
  location: 'Room 201',
  description: 'Morning session',
  status: 'Active'
};
const { data, error } = await createBatch(batchData);

// Get active batches
const { data, error } = await getActiveBatches();
```

### Classes & Teacher Assignments

```javascript
// Create class
const classData = {
  class_id: 'CLASS-001',
  class_name: 'Section A',
  institute_id: 'inst-uuid',
  course_id: 'course-uuid',
  level_id: 'level-uuid',
  programme_id: 'prog-uuid',
  batch_id: 'batch-uuid',
  description: 'Morning section'
};
const { data: newClass } = await createClass(classData);

// Assign teachers to subjects
const assignments = [
  {
    class_id: newClass.id,
    subject_id: 'math-uuid',
    teacher_id: 'teacher1-uuid',
    is_primary_teacher: true,
    teaching_hours_per_week: 10
  },
  {
    class_id: newClass.id,
    subject_id: 'math-uuid',
    teacher_id: 'teacher2-uuid',
    is_primary_teacher: false,
    teaching_hours_per_week: 5
  }
];
await assignMultipleTeachers(assignments);

// Get class with all teachers
const { data, error } = await getClassById(classId);
```

### Users (Students, Teachers, Admins, Super Admins)

```javascript
// Create student
const userData = {
  username: 'john.doe',
  email: 'john@example.com',
  password_hash: 'hashed_password',
  full_name: 'John Doe',
  phone: '1234567890',
  account_status: 'Active'
};
const studentData = {
  roll_number: 'STU2025001',
  institute_id: 'inst-uuid',
  course_id: 'course-uuid',
  level_id: 'level-uuid',
  programme_id: 'prog-uuid',
  batch_id: 'batch-uuid',
  class_id: 'class-uuid'
};
const { data, error } = await createStudent(userData, studentData);

// Create teacher with subjects
const teacherData = {
  employee_id: 'EMP001',
  specialization: 'Mathematics'
};
const subjectIds = ['math-uuid', 'physics-uuid'];
const { data, error } = await createTeacher(userData, teacherData, subjectIds);

// Get all students in a class
const { data, error } = await getStudentsByClass(classId);

// Suspend user
await suspendUser(userId, 'Violation of rules', '2025-01-01', '2025-01-31');

// Activate user
await activateUser(userId);
```

## Error Handling

All API functions return an object with `{ data, error }`:

```javascript
const { data, error } = await getAllInstitutions();

if (error) {
  console.error('Error:', error.message);
  // Handle error
} else {
  console.log('Data:', data);
  // Use data
}
```

## Complete Component Example

```javascript
import React, { useState, useEffect } from 'react';
import { getAllInstitutions, createInstitution } from '../api/institutionsApi';

const InstitutionsPage = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    const { data, error } = await getAllInstitutions();
    if (!error) {
      setInstitutions(data);
    }
    setLoading(false);
  };

  const handleCreate = async (formData) => {
    const { data, error } = await createInstitution(formData);
    if (!error) {
      alert('Institution created successfully!');
      fetchInstitutions(); // Refresh list
    } else {
      alert('Error: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Institutions</h1>
      {institutions.map(inst => (
        <div key={inst.id}>{inst.institute_name}</div>
      ))}
    </div>
  );
};

export default InstitutionsPage;
```
