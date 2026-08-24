# Vercel Deployment - Quick Setup Guide

## ✅ Database Setup Complete

Your Turso database has been set up successfully with:
- ✅ 75 tables created
- ✅ All initial data seeded
- ✅ Products, categories, brands, and users ready

## 🚀 Deploy to Vercel

### Step 1: Add Environment Variables to Vercel

Go to your Vercel project settings and add these environment variables:

```
TURSO_DATABASE_URL=libsql://voltage-dhruvkumar2107.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc1ODYwODksImlkIjoiMDFhMDM0NmUtNzQwMS03MWNkLThlYmEtYmEyMjFmZGQ4ZTVmIiwia2lkIjoiOHBfRmRYMHNVV2FMRjJRYkpKZ0drd2JtNjRHR3NLV0hNVjRrQkFYeFFjOCIsInJpZCI6ImJiOTM1YzI4LTVjZjAtNGYzZS05NjQ2LTk5NjA0NGZjODYwZSJ9.NqSsfvBWz8_PiLFbWNHYR6mrApZlDtC6r9PagDQrfohLvMVwnHIz8jSKiM-upeMQ0bAB78K4z_MzLEKTwSaNAw
AUTH_SECRET=606c87feb82fc743111da1989453bbe9eba061849de79ce9b173253868abc3cb
```

#### How to add environment variables:

1. Go to https://vercel.com/dashboard
2. Select your project: **mobile-ecom**
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. Add each variable:
   - Key: `TURSO_DATABASE_URL`
   - Value: `libsql://voltage-dhruvkumar2107.aws-ap-south-1.turso.io`
   - Environment: **Production**, **Preview**, **Development** (check all)
   - Click **Save**
6. Repeat for `TURSO_AUTH_TOKEN` and `AUTH_SECRET`

### Step 2: Redeploy

After adding the environment variables, trigger a new deployment:

**Option A: From Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Check "Use existing Build Cache"
5. Click **Redeploy**

**Option B: Push to GitHub**
```bash
git commit --allow-empty -m "trigger vercel redeploy"
git push origin main
```

### Step 3: Verify Deployment

Once deployed, visit your site and verify:

1. Homepage loads without errors
2. Products page shows all items
3. Product detail pages work
4. Cart functionality works
5. Login/signup works

## 📋 Test Accounts

Your database is pre-seeded with these test accounts:

**Admin Accounts:**
- Email: `admin@voltage.store`
- Password: `Voltage@2024`

**Customer Account:**
- Email: `aarav.sharma@gmail.com`
- Password: `Voltage@2024`

## 🎉 That's It!

Your app is now using a persistent Turso database that will:
- ✅ Maintain data between deployments
- ✅ Work on all Vercel regions
- ✅ Scale automatically
- ✅ Provide fast SQLite-compatible queries

## 🔧 Troubleshooting

### If you see "Server Components render" errors:

1. Check that environment variables are set in Vercel
2. Make sure you redeployed AFTER adding the variables
3. Check Vercel Function logs for detailed error messages

### To reset/reseed the database:

```bash
TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npm run setup:turso
```

Then redeploy to Vercel.
