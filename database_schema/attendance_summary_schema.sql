-- =============================================
-- ATTENDANCE SUMMARY TABLE
-- Stores cumulative attendance data per student per class
-- Supports incremental updates from multiple Excel uploads
-- =============================================

CREATE TABLE IF NOT EXISTS attendance_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign Keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
  institute_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  level_id UUID REFERENCES levels(id) ON DELETE SET NULL,
  
  -- Cumulative Attendance Counts (incremented on each upload)
  total_days INTEGER DEFAULT 0 NOT NULL CHECK (total_days >= 0),
  present_days INTEGER DEFAULT 0 NOT NULL CHECK (present_days >= 0),
  absent_days INTEGER DEFAULT 0 NOT NULL CHECK (absent_days >= 0),
  half_days INTEGER DEFAULT 0 NOT NULL CHECK (half_days >= 0),
  
  -- Auto-calculated Percentage
  -- Formula: ((present_days + half_days * 0.5) / total_days) * 100
  attendance_percentage NUMERIC(5,2) DEFAULT 0.00,
  
  -- Audit Fields
  last_updated TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one record per student per class
  UNIQUE(student_id, class_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_summary_student ON attendance_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_class ON attendance_summary(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_batch ON attendance_summary(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_institute ON attendance_summary(institute_id);

-- Function to auto-calculate percentage
CREATE OR REPLACE FUNCTION calculate_attendance_percentage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_days > 0 THEN
    NEW.attendance_percentage := ROUND(
      ((NEW.present_days::NUMERIC + NEW.half_days::NUMERIC * 0.5) / NEW.total_days::NUMERIC) * 100,
      2
    );
  ELSE
    NEW.attendance_percentage := 0.00;
  END IF;
  
  NEW.last_updated := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate percentage before insert/update
CREATE TRIGGER trigger_calculate_attendance_percentage
BEFORE INSERT OR UPDATE ON attendance_summary
FOR EACH ROW
EXECUTE FUNCTION calculate_attendance_percentage();

-- Comments
COMMENT ON TABLE attendance_summary IS 'Stores cumulative attendance summary for students. Updated incrementally on each Excel upload.';
COMMENT ON COLUMN attendance_summary.total_days IS 'Total marked days (P + A + H). Excludes null cells from Excel.';
COMMENT ON COLUMN attendance_summary.present_days IS 'Count of days marked as Present (P)';
COMMENT ON COLUMN attendance_summary.absent_days IS 'Count of days marked as Absent (A)';
COMMENT ON COLUMN attendance_summary.half_days IS 'Count of days marked as Half Day (H)';
COMMENT ON COLUMN attendance_summary.attendance_percentage IS 'Auto-calculated: ((present + half*0.5) / total) * 100';
