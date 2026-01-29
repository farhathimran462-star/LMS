-- =====================================================
-- CLASSES TABLE SCHEMA FOR PERMANENT STORAGE
-- =====================================================

-- Main Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Foreign Keys
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    is_active BOOLEAN DEFAULT true,
    
    -- Indexes for better query performance
    CONSTRAINT fk_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_classes_batch_id ON classes(batch_id);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);


-- =====================================================
-- JUNCTION TABLES FOR MANY-TO-MANY RELATIONSHIPS
-- =====================================================

-- Classes-Students Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Enrollment metadata
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure unique student per class
    CONSTRAINT unique_class_student UNIQUE (class_id, student_id),
    
    -- Foreign Keys
    CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_is_active ON class_students(is_active);


-- Classes-Teachers Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Assignment metadata
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Role specification (primary teacher, assistant, etc.)
    role VARCHAR(50) DEFAULT 'primary',
    
    -- Ensure unique teacher per class (unless different roles)
    CONSTRAINT unique_class_teacher_role UNIQUE (class_id, teacher_id, role),
    
    -- Foreign Keys
    CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_teachers_class_id ON class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher_id ON class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_is_active ON class_teachers(is_active);


-- =====================================================
-- NOTE: class_subjects table NOT NEEDED!
-- Subjects are inherited from programme through this chain:
-- class → batch → programme → programme_subjects → subjects
-- =====================================================


-- =====================================================
-- UPDATED TRIGGER FOR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admin can do everything
CREATE POLICY "Super Admin full access on classes"
ON classes FOR ALL
USING (auth.jwt() ->> 'role' = 'super_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super Admin full access on class_students"
ON class_students FOR ALL
USING (auth.jwt() ->> 'role' = 'super_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super Admin full access on class_teachers"
ON class_teachers FOR ALL
USING (auth.jwt() ->> 'role' = 'super_admin')
WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- Policy: Teachers can view their assigned classes
CREATE POLICY "Teachers can view their classes"
ON classes FOR SELECT
USING (
    id IN (
        SELECT class_id FROM class_teachers 
        WHERE teacher_id = auth.uid() AND is_active = true
    )
);

-- Policy: Students can view classes they're enrolled in
CREATE POLICY "Students can view their classes"
ON classes FOR SELECT
USING (
    id IN (
        SELECT class_id FROM class_students 
        WHERE student_id = auth.uid() AND is_active = true
    )
);

-- Policy: Teachers can view students in their classes
CREATE POLICY "Teachers can view their class students"
ON class_students FOR SELECT
USING (
    class_id IN (
        SELECT class_id FROM class_teachers 
        WHERE teacher_id = auth.uid() AND is_active = true
    )
);

-- Policy: Students can view their own enrollments
CREATE POLICY "Students can view their enrollments"
ON class_students FOR SELECT
USING (student_id = auth.uid());


-- =====================================================
-- USEFUL VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Complete Class Information with Counts
CREATE OR REPLACE VIEW v_classes_complete AS
SELECT 
    c.id,
    c.class_name,
    c.description,
    c.batch_id,
    c.is_active,
    c.created_at,
    c.updated_at,
    b.batch_name,
    b.institute_id,
    b.course_id,
    b.level_id,
    b.programme_id,
    i.institution_name,
    co.course_name,
    l.level_name,
    p.programme_name,
    COUNT(DISTINCT cs.student_id) as total_students,
    COUNT(DISTINCT ct.teacher_id) as total_teachers,
    COUNT(DISTINCT csub.subject_id) as total_subjects
FROM classes c
LEFT JOIN batches b ON c.batch_id = b.id
LEFT JOIN institutions i ON b.institute_id = i.id
LEFT JOIN courses co ON b.course_id = co.id
LEFT JOIN levels l ON b.level_id = l.id
LEFT JOIN programmeps.subject_id) as total_subjects
FROM classes c
LEFT JOIN batches b ON c.batch_id = b.id
LEFT JOIN institutions i ON b.institute_id = i.id
LEFT JOIN courses co ON b.course_id = co.id
LEFT JOIN levels l ON b.level_id = l.id
LEFT JOIN programmes p ON b.programme_id = p.id
LEFT JOIN class_students cs ON c.id = cs.class_id AND cs.is_active = true
LEFT JOIN class_teachers ct ON c.id = ct.class_id AND ct.is_active = true
LEFT JOIN programme_subjects ps ON b.programme_id = ps.programme_id AND ps
-- =====================================================
-- SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================

/*
-- Get all classes for a specific batch
SELECT * FROM classes WHERE batch_id = '<batch_uuid>' AND is_active = true;

-- Get all students in a class with their details
SELECT 
    u.id,
    u.name,
    u.email,
    cs.enrolled_at,
    cs.is_active
FROM class_students cs
JOIN users u ON cs.student_id = u.id
WHERE cs.class_id = '<class_uuid>' AND cs.is_active = true;

-- Get all teachers for a class
SELECT 
    u.id,
    u.name,
    u.email,
    ct.role,
    ct.assigned_at
FROM class_teachers ct
JOIN users u ON ct.teacher_id = u.id
WHERE ct.class_id = '<class_uuid>' AND ct.is_active = true;

-- Get complete class information using view
SELECT * FROM v_classes_complete WHERE batch_id = '<batch_uuid>';

-- Count students per class in a batch
SELECT 
    c.class_name,
    COUNT(cs.student_id) as student_count
FROM classes c
LEFT JOIN class_students cs ON c.id = cs.class_id AND cs.is_active = true
WHERE c.batch_id = '<batch_uuid>' AND c.is_active = true
GROUP BY c.id, c.class_name
ORDER BY c.class_name;
*/

-- Get all subjects for a class (through programme)
SELECT s.*
FROM classes c
JOIN batches b ON c.batch_id = b.id
JOIN programme_subjects ps ON b.programme_id = ps.programme_id
JOIN subjects s ON ps.subject_id = s.id
WHERE c.id = '<class_uuid>' 
  AND c.is_active = true 
  AND ps.is_active = true;
