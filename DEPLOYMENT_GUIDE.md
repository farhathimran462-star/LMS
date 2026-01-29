# Deployment Guide

## Project Architecture

**Backend**: Supabase (Already hosted)
- Database and authentication managed by Supabase
- Backend API: `https://my-career-point-updated.onrender.com`

**Frontend**: React + Vite (To be deployed)
- Can be deployed to Vercel, Netlify, or GitHub Pages

---

## Step 1: Push to GitHub

### Initialize Git and Push to GitHub

```bash
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit: Career Point LMS"

# 4. Create a new repository on GitHub (https://github.com/new)
#    - Name it: my-career-point-lms (or any name you prefer)
#    - Don't initialize with README (since you already have files)

# 5. Link to your GitHub repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/my-career-point-lms.git

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend

### Option A: Deploy to Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"

**Your frontend will be live at**: `https://your-project-name.vercel.app`

### Option B: Deploy to Netlify

1. Go to [netlify.com](https://www.netlify.com) and sign in with GitHub
2. Click "Add new site" → "Import an existing project"
3. Select your GitHub repository
4. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add Environment Variables in Site Settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy

---

## Step 3: Verify Everything Works

### Backend (Already Running)
✅ Supabase is already configured and hosted
✅ Backend API is at `https://my-career-point-updated.onrender.com`
✅ Database tables are set up

### Frontend (After Deployment)
✅ Login functionality should work with Supabase auth
✅ All CRUD operations will work through Supabase API
✅ Role-based dashboards will function correctly

---

## Environment Variables Checklist

Make sure to add these environment variables in your deployment platform:

```
VITE_SUPABASE_URL=your_actual_supabase_url
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
```

**⚠️ IMPORTANT**: Never commit your `.env` file to GitHub. The `.gitignore` file prevents this.

---

## Post-Deployment Configuration

### Update CORS Settings (If Needed)
If you encounter CORS errors after deployment:
1. Go to your Supabase Dashboard
2. Settings → API → URL Configuration
3. Add your deployed frontend URL to allowed origins

### Update Backend URL (If Using Different Backend)
If you need to change the backend URL, update `src/Components/LoginPage.jsx`:
```javascript
const backendUrl = 'https://your-new-backend-url.com';
```

---

## Troubleshooting

### Issue: "Environment variables not loading"
- **Solution**: Ensure all env vars start with `VITE_` prefix
- Rebuild and redeploy after adding variables

### Issue: "Login not working"
- **Solution**: Check Supabase console for authentication errors
- Verify environment variables are set correctly

### Issue: "API calls failing"
- **Solution**: Check browser console for CORS errors
- Verify Supabase URL and keys are correct

---

## Continuous Deployment

Once set up, any push to your `main` branch will automatically:
1. Trigger a new build on Vercel/Netlify
2. Deploy the updated version
3. Keep your app always up-to-date

---

## Local Development

To run locally after cloning:
```bash
npm install
cp .env.example .env
# Edit .env with your actual values
npm run dev
```

---

## Support

For issues:
- Check the [README.md](README.md) for project documentation
- Review [Supabase docs](https://supabase.com/docs)
- Check deployment platform docs (Vercel/Netlify)
