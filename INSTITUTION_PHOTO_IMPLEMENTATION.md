# Institutions Photo Upload Implementation Summary

## Date: December 2024

## Problem Statement
The Institutions management page had a photo upload field, but photos were not being stored in the database. Additionally, the UI needed to match the Project folder reference.

## Changes Made

### 1. API Updates (`src/api/institutionsApi.js`)

#### Added Helper Functions:

**`uploadInstitutionPhoto(file, instituteId)`**
- Validates file is a File object
- Creates unique filename: `{instituteId}_{timestamp}.{extension}`
- Uploads to Supabase Storage bucket `institution-photos`
- Returns public URL for the uploaded photo
- Handles errors gracefully

**`deleteInstitutionPhoto(photoUrl)`**
- Extracts file path from public URL
- Deletes file from storage
- Used when updating institution with new photo

#### Modified Functions:

**`createInstitution(institutionData, userId)`**
- Now extracts `photo` from institutionData
- Checks if photo is a File object
- Uploads photo to storage
- Stores public URL in database
- Continues without photo if upload fails (non-blocking)

**`updateInstitution(id, updates, userId)`**
- Extracts `photo` from updates
- Retrieves existing institution to check for old photo
- Deletes old photo if new photo is provided
- Uploads new photo to storage
- Stores new public URL in database
- Preserves old photo URL if no new photo provided

### 2. UI Updates (`src/Components/SuperAdmin/InstitutionsDashboard.jsx`)

#### Added Component:

**`InstitutionDetailsPanel`**
- Displays detailed information when a row is clicked
- Shows: ID, Location, Admins, Courses, Total Batches, Total Students
- Has close button to clear selection
- Matches the UI structure from Project folder reference
- Uses `React.forwardRef` for ref access

#### Updated Render:
- Added `<InstitutionDetailsPanel>` component to the main render
- Connected to existing `selectedInstitution` state
- Uses existing `handleClearDetails` function
- Uses existing `detailsPanelRef` reference

### 3. Documentation

#### Created `INSTITUTION_PHOTO_SETUP.md`
Comprehensive guide covering:
- Supabase Storage bucket creation steps
- Storage policies (SQL scripts)
- Database schema verification
- How the upload process works
- File naming conventions
- Update/delete behavior
- API function documentation
- Troubleshooting guide
- Testing procedures
- Security considerations
- Maintenance tasks

## Technical Details

### Storage Structure
```
Supabase Storage
└── institution-photos/
    └── institutions/
        ├── INST_1234_1703001234567.jpg
        ├── INST_5678_1703001234890.png
        └── ...
```

### Database Schema
```sql
institutions table:
- id (UUID, PK)
- institute_id (TEXT, unique)
- institute_name (TEXT)
- location (TEXT)
- photo (TEXT) ← Stores public URL
- created_at (TIMESTAMP)
```

### Flow Diagram
```
User selects photo → File validation (2MB, JPG/PNG)
                    ↓
        Upload to Supabase Storage
                    ↓
        Generate public URL
                    ↓
        Store URL in institutions.photo
                    ↓
        Display photo in UI
```

## Key Features

✅ **Automatic Photo Management**
- Old photos are automatically deleted when updating
- Photos are uploaded with unique names to prevent conflicts

✅ **Error Handling**
- Upload failures don't block institution creation
- Graceful fallback to no photo
- Console error logging for debugging

✅ **File Validation**
- 2MB size limit enforced by form
- JPG/PNG formats only
- Client-side validation in DynamicForm component

✅ **Security**
- Only authenticated Super Admins can upload
- Public read access for photo display
- Storage policies enforce permissions

✅ **UI Consistency**
- Added InstitutionDetailsPanel to match Project folder
- Photo field properly integrated in form
- Public URLs displayed correctly

## Testing Checklist

- [ ] Create new institution with photo
- [ ] Create new institution without photo
- [ ] Update existing institution with new photo
- [ ] Update existing institution without changing photo
- [ ] Delete institution (photo remains in storage)
- [ ] Verify photo URLs work in browser
- [ ] Check storage bucket in Supabase Dashboard
- [ ] Test with different file sizes
- [ ] Test with different file formats
- [ ] Verify error handling for upload failures

## Setup Requirements

### Before using this feature:

1. **Create Supabase Storage Bucket**
   ```
   Name: institution-photos
   Public: Yes
   ```

2. **Set Storage Policies** (see INSTITUTION_PHOTO_SETUP.md)
   - Public read access
   - Authenticated upload/update/delete

3. **Verify Database Schema**
   ```sql
   ALTER TABLE institutions 
   ADD COLUMN IF NOT EXISTS photo TEXT;
   ```

## Files Modified

1. ✅ `src/api/institutionsApi.js`
   - Added uploadInstitutionPhoto function
   - Added deleteInstitutionPhoto function
   - Updated createInstitution function
   - Updated updateInstitution function

2. ✅ `src/Components/SuperAdmin/InstitutionsDashboard.jsx`
   - Added InstitutionDetailsPanel component
   - Updated render to include details panel

3. ✅ `INSTITUTION_PHOTO_SETUP.md` (NEW)
   - Complete setup and usage guide

## Dependencies

- `@supabase/supabase-js` - Already installed
- Supabase Storage bucket: `institution-photos` - **NEEDS TO BE CREATED**

## Notes

- Form configuration already existed with photo upload field
- File handling is done by DynamicForm component
- Photo data is passed as File object from browser
- Public URLs are returned by Supabase Storage
- No additional npm packages required

## Next Steps

1. Create `institution-photos` storage bucket in Supabase
2. Set up storage policies (use SQL from INSTITUTION_PHOTO_SETUP.md)
3. Test photo upload functionality
4. Monitor storage usage
5. Consider adding image optimization in the future

## Known Limitations

- Photos are not automatically deleted when institution is deleted
- No image resizing/optimization (stores original)
- Maximum file size enforced by client only (no server-side validation)
- No virus scanning (consider for production)

## Future Enhancements

- [ ] Automatic cleanup of orphaned photos
- [ ] Image resizing/optimization before upload
- [ ] Server-side file validation
- [ ] Virus scanning for uploaded files
- [ ] Photo gallery/multiple photos per institution
- [ ] Drag-and-drop upload interface
- [ ] Image cropping tool
- [ ] Progress indicator for large uploads
