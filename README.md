# QAWAM | قَوَام

Personal finance planning platform. Bilingual (English / Arabic with full RTL), mobile-first, built with React + Vite + TypeScript + Tailwind + Supabase.

---

## Current State

### ✅ What Is Ready

**Backend (Supabase) — Already Live**
- Project: `uumofgotjfbzojlyovst`
- Tables: `profiles`, `budgets`, `page_views` (all created with RLS)
- RPCs: `is_admin`, `admin_list_profiles`, `admin_update_role`, `admin_delete_user`, `increment_page_views`
- Auto-create-profile trigger on new auth user
- All RLS policies active

**Frontend (This Codebase)**
- Vite + React 18 + TypeScript scaffold
- Authentication (sign in, sign up, sign out)
- Bilingual i18n (English / Arabic, full RTL)
- Sticky header with language toggle, page views, role badge, reset, manage users, sign out
- Mobile overflow menu
- Wizard flow: salary → guided expenses (16 categories) → custom expenses → rule selection (4 rules + custom)
- Mobile-first responsive design (44px touch targets, safe-area insets, no iOS zoom)
- Reset confirmation modal
- Custom rule modal with sliders and 100% validation

### 🔜 Chunk 2 (Next Session)
- Advisor analysis engine
- Full dashboard (allocation charts, advisor recommendations)
- Editable expense table
- Full admin panel (user list, role management, password reset, delete users)

---

## Deployment Steps

### 1. Upload Code to GitHub

Option A — From the GitHub website:
1. Go to https://github.com/abuabdullah311/QAWAM
2. Delete all existing files (or create a new branch)
3. Upload all files from this folder
4. Commit to `main` branch

Option B — From your terminal (cleaner):
```bash
# Clone your repo
git clone https://github.com/abuabdullah311/QAWAM.git
cd QAWAM

# Remove old files (keep .git)
find . -mindepth 1 ! -path './.git*' -delete

# Copy new files from this folder into the cloned repo
cp -r /path/to/this/folder/* .
cp /path/to/this/folder/.gitignore .
cp /path/to/this/folder/.env.example .

# Commit and push
git add .
git commit -m "Fresh build: QAWAM platform (Chunk 1)"
git push origin main --force
```

### 2. Set Environment Variables in Vercel

**This is the most important step.** The previous deployment showed a white screen because env vars were missing.

Go to: **https://vercel.com/abuabdullah311/qawam/settings/environment-variables**

Add these two variables for **all environments** (Production, Preview, Development):

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://uumofgotjfbzojlyovst.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_xhcGWpIED-E8N8xsf3f1Vw_An66ncs4` |

Click **Save** for each one.

### 3. Trigger Deployment

If you pushed to GitHub in Step 1, Vercel will auto-deploy. Watch the deployment at: https://vercel.com/abuabdullah311/qawam/deployments

If env vars were added **after** the push, you must redeploy:
1. Go to https://vercel.com/abuabdullah311/qawam/deployments
2. Click the most recent deployment
3. Click `...` (three dots) > **Redeploy**
4. **Uncheck** "Use existing Build Cache"
5. Click **Redeploy**

The site will be live at:
- https://qawamapp.online
- https://qawam-abuabdullah311.vercel.app

---

## After First Successful Deployment: Create Admin User

1. Open the deployed site
2. Sign up with your email (e.g., `abu.abdullah.1989@gmail.com`)
3. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/uumofgotjfbzojlyovst/sql
4. Run:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

5. Sign out and sign in again. You now have admin access.

---

## Local Development (Optional)

```bash
npm install

# Create .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=https://uumofgotjfbzojlyovst.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xhcGWpIED-E8N8xsf3f1Vw_An66ncs4
EOF

npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
qawam/
├── src/
│   ├── components/
│   │   ├── auth/          ProtectedRoute
│   │   ├── layout/        Header, AppLayout
│   │   ├── ui/            Button, Input, Card, Modal, ProgressBar, CurrencySelect
│   │   └── wizard/        SalaryStep, ExpenseWizardStep, CustomExpensesStep, RuleSelectionStep
│   ├── contexts/          I18nContext, AuthContext, BudgetContext
│   ├── hooks/             usePageViews
│   ├── lib/               utils, supabase, budgetRules, categories
│   ├── locales/           en, ar
│   ├── pages/             AuthPage, WizardPage, DashboardPage, AdminPage
│   ├── styles/            globals.css
│   ├── types/             index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/        0001_initial_schema.sql (already applied to Supabase)
├── public/                favicon.svg
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── .gitignore
└── .env.example
```

---

## Troubleshooting

**White screen after deployment**
→ Env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) not set in Vercel. See Step 2.

**Build fails on Vercel with "Missing Supabase environment variables"**
→ Same root cause. Set env vars in Vercel dashboard, then redeploy without cache.

**Sign-up succeeds but profile is not created**
→ The `on_auth_user_created` trigger should run automatically. Check Supabase Database > Triggers.

**RTL layout broken in Arabic**
→ The `I18nContext` sets `document.documentElement.dir` automatically. Hard refresh (Ctrl+Shift+R) to clear cache.

**Page views counter shows nothing**
→ Check browser console. RPC `increment_page_views` should be callable by `anon` role.

---

## Security Notes

- The Supabase **anon key** in this README is safe to include in client code. It is paired with Row Level Security policies that prevent unauthorized access.
- Never commit `.env.local` (already in `.gitignore`).
- Admin operations are protected by the `is_admin()` function inside each RPC, not just by client-side checks.
- Delete the Vercel personal access token you created (the one starting with `vcp_`) once deployment is verified.

---

## Tech Stack

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3
- **Routing**: react-router-dom 6
- **Icons**: lucide-react
- **Backend**: Supabase (PostgreSQL 17, Auth, RLS)
- **Hosting**: Vercel (auto-deploy from GitHub `main`)
