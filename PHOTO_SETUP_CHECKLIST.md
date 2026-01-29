# Quick Setup Checklist for Institution Photo Upload

## ⚠️ IMPORTANT: Complete these steps before using the photo upload feature

### Step 1: Create Supabase Storage Bucket

1. Open your Supabase Dashboard
2. Go to **Storage** (left sidebar)
3. Click **"Create a new bucket"**
4. Enter these details:
   - **Name**: `institution-photos`
   - **Public bucket**: ✅ **ENABLE THIS** (required for photos to display)
   - **File size limit**: 2097152 (2MB)
   - **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`
5. Click **Create bucket**

### Step 2: Set Storage Policies

1. In Supabase Dashboard, go to **Storage** → **Policies**
2. Select the `institution-photos` bucket
3. Click **"New Policy"**
4. Run these policies:

#### Policy 1: Public Read Access (REQUIRED)
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'institution-photos' );
```

#### Policy 2: Authenticated Upload (REQUIRED)
```sql
CREATE POLICY "Authenticated users can upload institution photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'institution-photos' 
    AND auth.role() = 'authenticated'
);
```

#### Policy 3: Authenticated Update (REQUIRED)
```sql
CREATE POLICY "Authenticated users can update institution photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'institution-photos' 
    AND auth.role() = 'authenticated'
);
```

#### Policy 4: Authenticated Delete (REQUIRED)
```sql
CREATE POLICY "Authenticated users can delete institution photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'institution-photos' 
    AND auth.role() = 'authenticated'
);
```

### Step 3: Verify Database Schema

Run this in your Supabase SQL Editor:

```sql
-- Add photo column if it doesn't exist
ALTER TABLE institutions 
ADD COLUMN IF NOT EXISTS photo TEXT;
```

### Step 4: Test the Feature

1. Log in as Super Admin
2. Go to **Institutions Dashboard**
3. Click **"Add New Institution"**
4. Fill in the form
5. Upload a photo (JPG or PNG, max 2MB)
6. Click **Save**
7. Verify the photo appears in the table

## ✅ That's it! The feature is ready to use.

## 🚨 Troubleshooting

### Photos not uploading?
- Verify bucket `institution-photos` exists
- Check bucket is set to **Public**
- Verify all 4 policies are created
- Check browser console for errors

### Photos not displaying?
- Bucket must be **Public** (not Private)
- Check if photo URL is stored in database
- Verify "Public Access" policy exists

### Permission errors?
- User must be logged in (authenticated)
- User must have Super Admin role
- Verify INSERT/UPDATE/DELETE policies are set

## 📚 Full Documentation

For detailed information, see:
- `INSTITUTION_PHOTO_SETUP.md` - Complete setup guide
- `INSTITUTION_PHOTO_IMPLEMENTATION.md` - Technical implementation details

## 🎯 Quick Test

After setup, test with this checklist:
- [ ] Create institution with photo
- [ ] Create institution without photo  
- [ ] Update institution with new photo
- [ ] Photos display correctly in table
- [ ] InstitutionDetailsPanel shows on row click
