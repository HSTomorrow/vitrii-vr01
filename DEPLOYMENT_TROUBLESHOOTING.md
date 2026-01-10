# Deployment Troubleshooting: Admin Manage Ads 500 Error

## Problem

The `/admin/anuncios` (Admin Manage Ads) page returns a **500 Internal Server Error** on the production deployment (Fly.io), even though the page works perfectly in the local development environment.

## Root Cause Analysis

The error is happening because:

1. The API endpoint `/api/anuncios` is returning a 500 error on production
2. The local development server works fine with the exact same code
3. This indicates an **environment configuration issue on Fly.io**

## Diagnosis Checklist

### Step 1: Check Environment Variables on Fly.io

The production deployment needs the `DATABASE_URL` environment variable to connect to the Supabase database.

**To verify:**

1. Open your Fly.io dashboard at https://fly.io
2. Navigate to your app
3. Go to **Variables** section
4. Check that `DATABASE_URL` is set with your Supabase connection string

**To get your Supabase connection string:**

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Database** → **Connection Pooling** or **Connection Strings**
4. Copy the PostgreSQL connection string
5. Make sure it includes: `postgresql://[user]:[password]@[host]:[port]/[database]`

### Step 2: Check Fly.io Health Endpoint

The app now has a `/api/health` endpoint to check deployment status:

```bash
curl https://your-fly-app-url.fly.dev/api/health
```

This should return:

```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "environment": {
    "node_env": "production",
    "has_database_url": true,
    "database_configured": "yes"
  }
}
```

If `database_configured` is `"no"`, the `DATABASE_URL` is not set.

### Step 3: Check Deployment Logs

To see detailed error logs on Fly.io:

```bash
flyctl logs -a your-app-name
```

Look for messages starting with `[getAnuncios]` to see what's happening.

### Step 4: Set Missing Environment Variables

If `DATABASE_URL` is missing, add it via Fly.io CLI:

```bash
flyctl secrets set DATABASE_URL="postgresql://user:password@host:port/database" -a your-app-name
```

Or through the Fly.io dashboard:

1. Go to your app → **Variables**
2. Click **+ Add Variable**
3. Set key: `DATABASE_URL`
4. Set value: your Supabase connection string
5. Click **Save and Deploy**

### Step 5: Redeploy

After setting the environment variables, redeploy your app:

```bash
git push
# or
flyctl deploy -a your-app-name
```

## Additional Environment Variables Needed

Make sure these are also set on Fly.io:

| Variable       | Purpose                           | Example                        |
| -------------- | --------------------------------- | ------------------------------ |
| `DATABASE_URL` | Supabase connection               | `postgresql://...`             |
| `DIRECT_URL`   | Direct DB connection (migrations) | `postgresql://...`             |
| `APP_URL`      | Base URL for email links          | `https://your-fly-app.fly.dev` |
| `MAIL_FROM`    | Email sender address              | `noreply@vitrii.com`           |
| `SMTP_HOST`    | Email server                      | `smtp.gmail.com`               |
| `SMTP_PORT`    | Email port                        | `587`                          |
| `SMTP_USER`    | Email username                    | `your-email@gmail.com`         |
| `SMTP_PASS`    | Email password                    | `app-specific-password`        |

## After Fixing

1. The `/admin/anuncios` page should load without errors
2. The admin will be able to view, edit, and manage all ads
3. All ad status changes, activation/deactivation, and deletions should work

## Additional Safety Features Added

The admin page now has:

1. ✅ **Admin-only access** - Non-admin users see a "Access Restricted" message
2. ✅ **Better error messages** - Shows actual API errors instead of generic messages
3. ✅ **Improved logging** - Server logs detailed information about what's happening
4. ✅ **Health check endpoint** - `/api/health` to diagnose deployment issues

## Still Having Issues?

If the problem persists after these steps:

1. Check Fly.io logs: `flyctl logs -a your-app-name`
2. Verify database connectivity: `flyctl ssh console -a your-app-name` then run `psql $DATABASE_URL`
3. Check that all required tables exist in the database
4. Ensure Prisma migrations have been applied: Look for tables in the `public` schema
