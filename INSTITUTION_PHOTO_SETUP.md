# Institution Photo Upload Setup Guide

## Overview
This guide explains how to set up the Supabase Storage bucket for institution photo uploads.

## Supabase Storage Setup

### 1. Create Storage Bucket

1. Log in to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `institution-photos`
   - **Public**: ✅ Enable (so photos can be accessed via public URLs)
   - **File size limit**: 2MB (recommended)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`

### 2. Set Storage Policies

After creating the bucket, set up the following policies:

#### Policy 1: Allow Public Read Access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'institution-photos' );
```

#### Policy 2: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload institution photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'institution-photos' 
    AND auth.role() = 'authenticated'
);
```

#### Policy 3: Allow Authenticated Users to Update
```sql
CREATE POLICY "Authenticated users can update institution photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'institution-photos' 
    AND auth.role() = 'authenticated'
);
```

#### Policy 4: Allow Authenticated Users to Delete
```sql
CREATE POLICY "Authenticated users can delete institution photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'institution-photos' 
    AND auth.role() = 'authenticated'
);
```

### 3. Verify Database Schema

Ensure your `institutions` table has a `photo` column:

```sql
-- Check if photo column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'institutions' AND column_name = 'photo';

-- If not exists, add it:
ALTER TABLE institutions 
ADD COLUMN IF NOT EXISTS photo TEXT;
```

## How It Works

### File Upload Process

1. **User selects a photo** in the Institution form (max 2MB, JPG/PNG)
2. **Photo is uploaded** to Supabase Storage bucket `institution-photos`
3. **Public URL is generated** for the uploaded photo
4. **URL is stored** in the `institutions.photo` column
5. **Photo is displayed** in the UI using the public URL

### File Naming Convention

Photos are stored with the following naming pattern:
```
institutions/{institute_id}_{timestamp}.{extension}
```

Example: `institutions/INST_1234_1703001234567.jpg`

### Update/Delete Behavior

- **When updating**: Old photo is deleted from storage, new photo is uploaded
- **When deleting institution**: Photo remains in storage (manual cleanup may be needed)
- **When updating without new photo**: Existing photo URL is preserved

## API Functions

### Upload Photo
```javascript
uploadInstitutionPhoto(file, instituteId)
```
- Uploads file to storage
- Returns public URL
- Handles errors gracefully

### Delete Photo
```javascript
deleteInstitutionPhoto(photoUrl)
```
- Extracts file path from URL
- Removes file from storage
- Called automatically on update

### Create Institution (with photo)
```javascript
createInstitution({
  institute_id: 'INST001',
  institute_name: 'ABC College',
  location: 'New York',
  photo: File, // Browser File object
  course_ids: [...]
}, userId)
```

### Update Institution (with photo)
```javascript
updateInstitution('INST001', {
  institute_name: 'ABC College Updated',
  location: 'New York',
  photo: File, // New File object (optional)
  course_ids: [...]
}, userId)
```

## Troubleshooting

### Photos not uploading
1. Check if `institution-photos` bucket exists
2. Verify storage policies are set correctly
3. Check browser console for errors
4. Ensure file size is under 2MB
5. Verify file type is JPG or PNG

### Photos not displaying
1. Check if bucket is set to **Public**
2. Verify photo URL is stored in database
3. Check browser network tab for 404 errors
4. Ensure read policy allows public access

### Permission errors
1. Verify user is authenticated
2. Check if user has Super Admin role
3. Review storage policies in Supabase dashboard

## Testing

### Manual Test Steps

1. **Upload Test**:
   - Go to Institutions Dashboard
   - Click "Add New Institution"
   - Fill form and select a photo
   - Save and verify photo appears in table

2. **Update Test**:
   - Edit an existing institution
   - Change the photo
   - Save and verify new photo appears

3. **Storage Verification**:
   - Go to Supabase Dashboard → Storage
   - Open `institution-photos` bucket
   - Verify files are uploaded with correct naming

## Security Considerations

- ✅ Only authenticated users can upload/update/delete
- ✅ Public can view photos (necessary for display)
- ✅ File size limited to 2MB
- ✅ Only image types allowed (JPG, PNG)
- ⚠️ Consider adding virus scanning for production
- ⚠️ Consider adding image optimization/resizing

## Maintenance

### Cleanup Orphaned Files

Periodically check for photos in storage that don't have corresponding database records:

```sql
-- Find institutions with photo URLs
SELECT institute_id, photo 
FROM institutions 
WHERE photo IS NOT NULL;
```

Compare with files in Storage bucket and remove orphaned files manually.

### Storage Limits

Monitor storage usage in Supabase Dashboard:
- Free tier: 1GB storage
- Pro tier: 100GB storage

## Related Files

- `src/api/institutionsApi.js` - API functions with photo upload logic
- `src/Components/SuperAdmin/InstitutionsDashboard.jsx` - UI component
- `src/Components/Reusable/DynamicForm.jsx` - Form handling with file upload
