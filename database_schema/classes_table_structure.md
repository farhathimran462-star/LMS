# Classes Database Tables - Complete Structure

## Table 1: `classes`
**Purpose:** Core table storing class information

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each class |
| `class_name` | `VARCHAR(255)` | NOT NULL | Name of the class |
| `description` | `TEXT` | NULL | Detailed description of the class |
| `batch_id` | `UUID` | NOT NULL, FOREIGN KEY | Reference to batches table |
| `is_active` | `BOOLEAN` | DEFAULT true | Whether the class is currently active |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW() | When the class was created |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW() | Last update timestamp |

### Foreign Keys:
- `batch_id` → `batches(id)` ON DELETE CASCADE

### Indexes:
- PRIMARY KEY on `id`
- INDEX on `batch_id`
- INDEX on `is_active`
- INDEX on `created_at`

### How to Get Subjects:
Subjects for a class are inherited from the programme through this relationship chain:
```
class → batch → programme → programme_subjects → subjects
```
No need for a separate `class_subjects` table!

---

## Table 2: `class_students`
**Purpose:** Junction table linking classes to students (Many-to-Many relationship)

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each enrollment |
| `class_id` | `UUID` | NOT NULL, FOREIGN KEY | Reference to classes table |
| `student_id` | `UUID` | NOT NULL, FOREIGN KEY | Reference to users table (students) |
| `enrolled_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW() | When the student was enrolled |
| `is_active` | `BOOLEAN` | DEFAULT true | Whether the enrollment is currently active |

### Foreign Keys:
- `class_id` → `classes(id)` ON DELETE CASCADE
- `student_id` → `users(id)` ON DELETE CASCADE

### Unique Constraints:
- UNIQUE(`class_id`, `student_id`) - Prevents duplicate enrollments

### Indexes:
- PRIMARY KEY on `id`
- INDEX on `class_id`
- INDEX on `student_id`
- INDEX on `is_active`
- UNIQUE INDEX on (`class_id`, `student_id`)

---

## Table 3: `class_teachers`
**Purpose:** Junction table linking classes to teachers (Many-to-Many relationship)

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for each assignment |
| `class_id` | `UUID` | NOT NULL, FOREIGN KEY | Reference to classes table |
| `teacher_id` | `UUID` | NOT NULL, FOREIGN KEY | Reference to users table (teachers) |
| `assigned_at` | `TIMESTAMP WITH TIME ZONE` | DEFAULT NOW() | When the teacher was assigned |
| `is_active` | `BOOLEAN` | DEFAULT true | Whether the assignment is currently active |
| `role` | `VARCHAR(50)` | DEFAULT 'primary' | Teacher's role (primary, assistant, substitute, etc.) |

### Foreign Keys:
- `class_id` → `classes(id)` ON DELETE CASCADE
- `teacher_id` → `users(id)` ON DELETE CASCADE

### Unique Constraints:
- UNIQUE(`class_id`, `teacher_id`, `role`) - Prevents duplicate assignments for same role

### Indexes:
- PRIMARY KEY on `id`
- INDEX on `class_id`
- INDEX on `teacher_id`
- INDEX on `is_active`
- UNIQUE INDEX on (`class_id`, `teacher_id`, `role`)

---

## Related Tables (Must Exist)

### Table: `batches`
Required fields referenced:
- `id` (UUID) - Primary key referenced by classes.batch_id
- `programme_id` (UUID) - Used to link to programme_subjects

### Table: `users`
Required fields referenced:
- `id` (UUID) - Primary key referenced by class_students.student_id and class_teachers.teacher_id
- Should have a `role` field to distinguish between students and teachers

### Table: `programme_subjects`
Used to get subjects for a class:
- `programme_id` (UUID) - Links to batches.programme_id
- `subject_id` (UUID) - References subjects.id

### Table: `subjects`
Referenced through programme_subjects:
- `id` (UUID) - Primary key
- Likely has: `subject_name`, `subject_code`, etc.

---

## Summary of All Fields

### classes (7 fields)
```
id              UUID PRIMARY KEY
class_name      VARCHAR(255) NOT NULL
description     TEXT
batch_id        UUID NOT NULL FK → batches(id)
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### class_students (5 fields)
```
id              UUID PRIMARY KEY
class_id        UUID NOT NULL FK → classes(id)
student_id      UUID NOT NULL FK → users(id)
enrolled_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
is_active       BOOLEAN DEFAULT true
```

### class_teachers (6 fields)
```
id              UUID PRIMARY KEY
class_id        UUID NOT NULL FK → classes(id)
teacher_id      UUID NOT NULL FK → users(id)
assigned_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
is_active       BOOLEAN DEFAULT true
role            VARCHAR(50) DEFAULT 'primary'
```

---

## Getting Subjects for a Class

**No `class_subjects` table needed!** Get subjects through the programme relationship:

```sql
-- Get all subjects for a class
SELECT s.*
FROM classes c
JOIN batches b ON c.batch_id = b.id
JOIN programme_subjects ps ON b.programme_id = ps.programme_id
JOIN subjects s ON ps.subject_id = s.id
WHERE c.id = '<class_uuid>' 
  AND c.is_active = true 
  AND ps.is_active = true;
```

---

## CASCADE DELETE Behavior

When a **class** is deleted:
- All associated records in `class_students` are automatically deleted
- All associated records in `class_teachers` are automatically deleted

When a **batch** is deleted:
- All associated `classes` records are automatically deleted
- This triggers cascade delete on class_students and class_teachers

When a **user** (student/teacher) is deleted:
- All associated records in `class_students` or `class_teachers` are automatically deleted

---

## Data Type Notes

- **UUID**: Universally Unique Identifier (128-bit, typically displayed as 36 characters with hyphens)
- **VARCHAR(n)**: Variable-length character string with maximum length n
- **TEXT**: Variable-length character string with no specified maximum
- **BOOLEAN**: True/false values
- **TIMESTAMP WITH TIME ZONE**: Date and time with timezone information

---

## Required Parent Tables

Before creating these tables, ensure the following exist:

1. ✅ `batches` table with `id` UUID field
2. ✅ `users` table with `id` UUID field
3. ✅ `subjects` table with `id` UUID field
