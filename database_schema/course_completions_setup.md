# Course Completions Setup Guide

## Overview
Course completion tracking allows teachers to submit completion records for chapters they've taught, with approval workflow for Admins and Super Admins.

## 1. Create Database Table

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Create course_completions table
CREATE TABLE IF NOT EXISTS course_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    
    -- Completion details
    hours_taken NUMERIC(10, 2) NOT NULL CHECK (hours_taken > 0),
    completion_date DATE NOT NULL,
    notes TEXT,
    
    -- Proof document
    proof_document_url TEXT,
    proof_document_path TEXT,
    proof_document_name TEXT,
    proof_document_type TEXT,
    proof_document_size INTEGER,
    
    -- Status and approval
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'OnHold')),
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_course_completions_teacher ON course_completions(teacher_id);
CREATE INDEX idx_course_completions_institution ON course_completions(institution_id);
CREATE INDEX idx_course_completions_class ON course_completions(class_id);
CREATE INDEX idx_course_completions_status ON course_completions(status);
CREATE INDEX idx_course_completions_submitted_date ON course_completions(submitted_date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_course_completions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_completions_updated_at
    BEFORE UPDATE ON course_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_course_completions_updated_at();

-- Add comments
COMMENT ON TABLE course_completions IS 'Tracks course completion submissions by teachers with approval workflow';
COMMENT ON COLUMN course_completions.hours_taken IS 'Number of hours spent completing the chapter';
COMMENT ON COLUMN course_completions.completion_date IS 'Date when the chapter was completed';
COMMENT ON COLUMN course_completions.status IS 'Approval status: Pending, Approved, Rejected, or OnHold';
```

## 2. Create Storage Bucket

### Method 1: Using Supabase Dashboard

1. Go to **Storage** in your Supabase Dashboard
2. Click **Create a new bucket**
3. Configure the bucket:
   - **Name**: `course-completion-documents`
   - **Public bucket**: `false` (private)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/png, image/jpeg, application/pdf`
4. Click **Create bucket**

### Method 2: Using SQL

```sql
-- Insert bucket configuration (if not using dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-completion-documents',
    'course-completion-documents',
    false,
    5242880, -- 5 MB in bytes
    ARRAY['image/png', 'image/jpeg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

## 3. Set up Row Level Security (RLS) Policies

Execute the following SQL to enable RLS:

```sql
-- Enable RLS
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own completions
CREATE POLICY "Teachers can view own completions"
    ON course_completions
    FOR SELECT
    USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
        )
    );

-- Policy: Teachers can insert completions for their assigned classes
CREATE POLICY "Teachers can insert completions for assigned classes"
    ON course_completions
    FOR INSERT
    WITH CHECK (
        teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
        )
        AND
        class_id IN (
            SELECT class_id FROM class_teachers
            WHERE teacher_id IN (
                SELECT id FROM teachers WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Teachers can update their own Pending completions
CREATE POLICY "Teachers can update own pending completions"
    ON course_completions
    FOR UPDATE
    USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
        )
        AND status = 'Pending'
    )
    WITH CHECK (
        teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
        )
        AND status = 'Pending'
    );

-- Policy: Teachers can delete their own Pending completions
CREATE POLICY "Teachers can delete own pending completions"
    ON course_completions
    FOR DELETE
    USING (
        teacher_id IN (
            SELECT id FROM teachers WHERE user_id = auth.uid()
        )
        AND status = 'Pending'
    );

-- Policy: Admins can view completions from their institution
CREATE POLICY "Admins can view institution completions"
    ON course_completions
    FOR SELECT
    USING (
        institution_id IN (
            SELECT institute_id FROM admin_institutions
            WHERE admin_id IN (
                SELECT id FROM admins WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Admins can update completion status for their institution
CREATE POLICY "Admins can update institution completion status"
    ON course_completions
    FOR UPDATE
    USING (
        institution_id IN (
            SELECT institute_id FROM admin_institutions
            WHERE admin_id IN (
                SELECT id FROM admins WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        institution_id IN (
            SELECT institute_id FROM admin_institutions
            WHERE admin_id IN (
                SELECT id FROM admins WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Super Admins can view all completions
CREATE POLICY "Super Admins can view all completions"
    ON course_completions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'Super Admin'
        )
    );

-- Policy: Super Admins can update any completion
CREATE POLICY "Super Admins can update all completions"
    ON course_completions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'Super Admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'Super Admin'
        )
    );
```

## 4. Storage Policies

Configure storage bucket policies:

```sql
-- Teachers can upload to their own folder
CREATE POLICY "Teachers can upload completion documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'course-completion-documents'
        AND (storage.foldername(name))[1] = 'completions'
        AND auth.uid() IN (
            SELECT user_id FROM teachers
        )
    );

-- Teachers can view their own documents
CREATE POLICY "Teachers can view own documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'course-completion-documents'
        AND auth.uid() IN (
            SELECT user_id FROM teachers
        )
    );

-- Teachers can delete their own Pending completion documents
CREATE POLICY "Teachers can delete own pending documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'course-completion-documents'
        AND auth.uid() IN (
            SELECT user_id FROM teachers
        )
    );

-- Admins can view documents from their institution
CREATE POLICY "Admins can view institution documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'course-completion-documents'
        AND EXISTS (
            SELECT 1 FROM admin_institutions ai
            JOIN admins a ON ai.admin_id = a.id
            WHERE a.user_id = auth.uid()
        )
    );

-- Super Admins can view all documents
CREATE POLICY "Super Admins can view all completion documents"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'course-completion-documents'
        AND EXISTS (
            SELECT 1 FROM users
            WHERE user_id = auth.uid() AND role = 'Super Admin'
        )
    );
```

## 5. Verify Installation

Execute these queries to verify everything is set up correctly:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'course_completions'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'course_completions';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'course_completions';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'course-completion-documents';

-- Check storage policies
SELECT policyname, definition
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%completion%';
```

## 6. Testing

### Test Data Insertion

```sql
-- Insert a test completion (replace UUIDs with actual values from your database)
INSERT INTO course_completions (
    teacher_id,
    institution_id,
    course_id,
    level_id,
    programme_id,
    batch_id,
    class_id,
    subject_id,
    chapter_id,
    hours_taken,
    completion_date,
    notes
) VALUES (
    'teacher-uuid-here',
    'institution-uuid-here',
    'course-uuid-here',
    'level-uuid-here',
    'programme-uuid-here',
    'batch-uuid-here',
    'class-uuid-here',
    'subject-uuid-here',
    'chapter-uuid-here',
    5.5,
    '2024-01-15',
    'Test completion submission'
);

-- Verify insertion
SELECT * FROM course_completions ORDER BY created_at DESC LIMIT 1;
```

## 7. File Upload Path Structure

Files will be uploaded to:
```
course-completion-documents/
└── completions/
    └── {institution_id}/
        └── {teacher_id}/
            └── {timestamp}_{original_filename}
```

Example: `completions/abc123-def456/xyz789-abc012/1705324800000_proof.pdf`

## 8. API Endpoints Ready

The following API functions are available in `src/api/courseCompletionApi.js`:

- `createCourseCompletion(completionData, file)` - Create new completion
- `getAllCourseCompletions(filters)` - Get all completions with optional filters
- `getCourseCompletionsByTeacher(teacherId)` - Get teacher's completions
- `getCourseCompletionsByInstitution(institutionId)` - Get institution completions
- `getCourseCompletionById(id)` - Get single completion
- `updateCourseCompletionStatus(id, status, approvedBy, rejectionReason)` - Approve/Reject
- `updateCourseCompletion(id, completionData, newFile)` - Update completion
- `deleteCourseCompletion(id)` - Delete completion
- `downloadCourseCompletionDocument(filePath, fileName)` - Download document
- `getCourseCompletionStatistics(filters)` - Get summary statistics

## 9. Integration with Dashboard

The course completion feature is already integrated in `DashBoard.jsx`. To access it:

1. **Teachers**: Navigate to "Course Completion" menu → Submit completions for assigned classes
2. **Admins**: Navigate to "Course Completion" menu → Approve/reject institution completions
3. **Super Admins**: Navigate to "Course Completion" menu → Approve/reject any completion

## Troubleshooting

### Issue: RLS prevents access
- Check user role in `users` table
- Verify teacher/admin records exist with correct `user_id`
- Check admin_institutions linkage for admins

### Issue: File upload fails
- Verify bucket exists and is configured
- Check file size (max 5 MB)
- Verify file type (PDF, PNG, JPG only)
- Check storage policies are active

### Issue: Cannot find teacher classes
- Verify `class_teachers` table has entries for teacher
- Check teacher `id` matches entry in `teachers` table
- Verify classes exist in `classes` table

### Issue: Subject/Chapter dropdowns empty
- Verify programme_subjects links exist for selected class's programme
- Check subjects have chapters in `chapters` table
- Verify foreign keys: chapters.subject_id → subjects.id
