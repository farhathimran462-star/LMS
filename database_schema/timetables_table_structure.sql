-- ============================================
-- TIMETABLES TABLE STRUCTURE
-- ============================================
-- Purpose: Store uploaded timetable files with hierarchical filters
-- Files stored in Supabase Storage, metadata stored here

CREATE TABLE timetables (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Timetable Details
    timetable_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchical Filters (Foreign Keys)
    institute_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- NULL = batch-level timetable
    
    -- File Information
    file_url TEXT NOT NULL, -- Full Supabase Storage URL
    file_path TEXT NOT NULL, -- Storage path: 'timetables/{institute_id}/{batch_id}/{filename}'
    file_name VARCHAR(255) NOT NULL, -- Original filename
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'png', 'jpg', 'jpeg', 'xlsx', etc.
    file_size INTEGER, -- Size in bytes
    
    -- Time Period (Optional)
    start_date DATE, -- When this timetable becomes effective
    end_date DATE, -- When this timetable expires
    academic_year VARCHAR(50), -- e.g., '2025-2026'
    
    -- Upload Metadata
    uploaded_by UUID REFERENCES Users(user_id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    -- Status & Notes
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_timetables_institute ON timetables(institute_id);
CREATE INDEX idx_timetables_course ON timetables(course_id);
CREATE INDEX idx_timetables_level ON timetables(level_id);
CREATE INDEX idx_timetables_programme ON timetables(programme_id);
CREATE INDEX idx_timetables_batch ON timetables(batch_id);
CREATE INDEX idx_timetables_class ON timetables(class_id);
CREATE INDEX idx_timetables_active ON timetables(is_active);
CREATE INDEX idx_timetables_uploaded_by ON timetables(uploaded_by);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE timetables IS 'Stores uploaded timetable files with hierarchical filtering';
COMMENT ON COLUMN timetables.class_id IS 'NULL means timetable applies to entire batch';
COMMENT ON COLUMN timetables.file_url IS 'Public URL from Supabase Storage';
COMMENT ON COLUMN timetables.file_path IS 'Storage bucket path for file operations';
COMMENT ON COLUMN timetables.is_active IS 'Soft delete flag - false means archived';

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all active timetables for a specific batch
-- SELECT * FROM timetables 
-- WHERE batch_id = 'uuid-here' AND is_active = true 
-- ORDER BY uploaded_at DESC;

-- Get timetables for a specific class
-- SELECT t.*, u.full_name as uploaded_by_name
-- FROM timetables t
-- LEFT JOIN Users u ON t.uploaded_by = u.user_id
-- WHERE t.class_id = 'uuid-here' AND t.is_active = true;

-- Get all timetables with full hierarchy details
-- SELECT 
--     t.*,
--     i.institution_name,
--     c.course_name,
--     l.level_name,
--     p.programme_name,
--     b.batch_name,
--     cl.class_name,
--     u.full_name as uploaded_by_name
-- FROM timetables t
-- JOIN institutions i ON t.institute_id = i.id
-- JOIN courses c ON t.course_id = c.id
-- JOIN levels l ON t.level_id = l.id
-- JOIN programmes p ON t.programme_id = p.id
-- JOIN batches b ON t.batch_id = b.id
-- LEFT JOIN classes cl ON t.class_id = cl.id
-- LEFT JOIN Users u ON t.uploaded_by = u.user_id
-- WHERE t.is_active = true
-- ORDER BY t.uploaded_at DESC;
