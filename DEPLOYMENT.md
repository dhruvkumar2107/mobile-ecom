# Deployment Guide - VOLTAGE E-commerce

## Database Setup (Turso)

This application uses Turso (LibSQL) for production deployments on Vercel.

### Why Turso?

Vercel's filesystem is ephemeral and read-only at runtime, so traditional SQLite files don't persist between requests. Turso provides a distributed SQLite-compatible database that works perfectly with serverless deployments.

### One-Time Setup

#### 1. Create a Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create voltage

# Get the database URL
turso db show voltage --url

# Create an auth token
turso db tokens create voltage
```

#### 2. Setup the Database Schema and Seed Data

Run the setup script locally to create tables and populate initial data:

```bash
# Set your Turso credentials
export TURSO_DATABASE_URL="libsql://voltage-xxxxx.turso.io"
export TURSO_AUTH_TOKEN="your-token-here"

# Run the setup script
npm run setup:turso
```

This will:
- Apply the database schema to Turso
- Seed all initial data (settings, roles, products, etc.)

#### 3. Configure Vercel

Add these environment variables in your Vercel project settings:

```
TURSO_DATABASE_URL=libsql://voltage-xxxxx.turso.io
TURSO_AUTH_TOKEN=your-token-here
AUTH_SECRET=your-secure-random-string
```

#### 4. Deploy

```bash
git push origin main
```

Vercel will automatically deploy. The build process will:
- Generate Prisma Client with Turso adapter
- Build the Next.js application
- Deploy to production

## Local Development

For local development, the app uses a local SQLite file:

```bash
# Setup local database
npm run setup

# Start development server
npm run dev
```

## Environment Variables

### Required for Production

- `TURSO_DATABASE_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso authentication token
- `AUTH_SECRET` - Session signing secret (generate with: `openssl rand -hex 32`)

### Optional

- `NEXT_PUBLIC_APP_URL` - Your production URL (default: http://localhost:3000)
- `PAYMENT_DRIVER` - Payment gateway: "mock" or "razorpay" (default: mock)
- `PAYOUT_DRIVER` - Payout provider: "mock" or "razorpay" (default: mock)
- `OTP_DRIVER` - OTP delivery: "console" or SMS provider (default: console)
- `MAIL_DRIVER` - Email delivery: "console" or email provider (default: console)

## Troubleshooting

### "No such table" errors in production

This means your Turso database hasn't been set up yet. Run:

```bash
npm run setup:turso
```

### Database out of sync

If you've made schema changes, update Turso:

```bash
# Apply schema changes
TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npx prisma db push

# Re-seed if needed
npm run setup:turso
```

### Check Turso database

```bash
# Open Turso shell
turso db shell voltage

# List tables
.tables

# Check data
SELECT * FROM "Setting" LIMIT 5;
```

## Architecture

- **Development**: Local SQLite file (`prisma/dev.db`)
- **Production**: Turso (distributed SQLite)
- **Schema**: Managed with Prisma
- **Migrations**: Development-only, production uses `prisma db push`

## Support

For issues, check:
1. Turso dashboard: https://turso.tech/app
2. Vercel deployment logs
3. Application logs in Vercel Functions tab
