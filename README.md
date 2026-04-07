# TaxLK — Sri Lankan Income Tax Assistant 🇱🇰

A modern, full-featured web application for calculating, tracking, and managing Sri Lankan personal income tax. Built with institutional-grade design, real-time computation, and Firebase-powered persistence.

🚀 **Live:** [https://taxlk-13159.web.app](https://taxlk-13159.web.app)

---

## ✨ Features

### 🧮 Tax Calculation Engine
- **Real-time Progressive Tax Calculation** based on 2024/25 Sri Lankan IRD slabs
- **APIT Breakdown** — monthly Advance Personal Income Tax per employment income source
- **Multi-Income Support** — Employment, Business, and Investment income streams
- **Multiple Employer Support** — aggregate income across all employers..

### 📊 Dashboard & History
- **Tax History** — save and compare calculations across time periods
- **Income Tracker** — manage and categorize income sources
- **Profile Management** — personal and financial profile with persistent storage

### 🗂️ Tax Return Assistant
- **E-Filing Guidance** — structured assistant for IRD RAMIS portal filing
- **Return Summary** — pre-filled form data aligned with RAMIS field structure
- **Research-backed** — compliance logic based on IRD publications and PDPA No. 9 of 2022

### 🔐 Authentication & Security
- **Firebase Auth** — Email/Password and Google Sign-In
- **Role-based Access Control** — User and Admin roles enforced via Firestore rules
- **Persistent Sessions** — `browserLocalPersistence` keeps users logged in
- **Protected Routes** — all app routes require authentication; admin routes require `role: 'admin'`

### 🛡️ Admin Panel
- **User Management** — view and manage registered users
- **Tax Configuration** — configure tax slabs and rates
- **Analytics & Reports** — platform usage statistics
- **Audit Logs** — track system events
- **Sandbox** — test tax calculations in isolation

### 🌐 Public Marketing Site
- Landing Page with hero section and feature highlights
- Features, Pricing, Tax Guide, and Contact pages
- Optimized SEO with JSON-LD structured data

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS + Shadcn/UI |
| Animations | Framer Motion |
| State | React Context API + localStorage |
| Backend | Firebase (Auth, Firestore, Hosting, Analytics) |
| Routing | React Router v6 |
| Forms | React Hook Form |
| Data | TanStack Query |
| Deployment | Firebase Hosting |

---

## 🏗️ Project Structure

```
src/
├── components/         # Shared layout and UI components
│   ├── admin/          # Admin-only layout and navigation
│   ├── ui/             # Shadcn/UI component library
│   ├── AppLayout.tsx   # Authenticated user shell
│   ├── PublicLayout.tsx# Public marketing shell
│   ├── ProtectedRoute.tsx
│   └── AdminRoute.tsx
├── context/
│   ├── AuthContext.tsx  # Firebase auth state + Firestore user sync
│   └── AppContext.tsx   # App-level state (income, calculations)
├── pages/
│   ├── public/         # Landing, Features, Tax Guide, Pricing, Contact
│   ├── auth/           # Login, Register
│   ├── admin/          # Admin dashboard and management pages
│   ├── Dashboard.tsx
│   ├── IncomePage.tsx
│   ├── CalculatorPage.tsx
│   ├── HistoryPage.tsx
│   ├── ProfilePage.tsx
│   └── TaxReturnPage.tsx
├── services/
│   └── firebase/       # authService, userService, taxRecordService
├── lib/
│   └── firebase.ts     # Firebase initialization
└── types/
    └── auth.ts         # FirestoreUser, UserRole, AuthProvider types
Research/               # IRD compliance research documents
public/assets/          # Logo, hero images
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Clone the repository
git clone https://github.com/piumal96/TAXLK.git
cd TAXLK

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment
Firebase is configured in `src/lib/firebase.ts`. Update the `firebaseConfig` object with your own Firebase project credentials.

**AI Assistant (OpenRouter):** Copy `.env.example` to `.env` and set `VITE_OPENROUTER_API_KEY` to your [OpenRouter API key](https://openrouter.ai/keys). Vite injects this at **build time** only — there is no separate “submit” step in Firebase for static hosting. Before each production deploy, ensure `.env` exists locally (or export the variable) so `npm run build` includes it:

```bash
cp .env.example .env
# edit .env and paste your key
```

### Build & Deploy

```bash
# Production build (reads VITE_* from .env)
npm run build

# Deploy to Firebase Hosting + Firestore rules
firebase deploy
```

For CI (e.g. GitHub Actions), store `VITE_OPENROUTER_API_KEY` as a **secret** and set it in the environment before `npm run build`.

---

## 🔒 Firestore Security Rules

The app enforces server-side role-based security:
- Users can only **read/update their own document** (cannot self-escalate `role`)
- Admins can **read/update any user document**
- New users are always created with `role: "user"` — role must be elevated manually via Firebase Console or the Admin Panel

---

## 📚 Research

The `/Research` directory contains:
- **IRD RAMIS filing guides** — official IRD documents on e-filing procedures
- **E-Tax Filing Automation Framework** — legal compliance analysis under CCA 2007 & PDPA 2022
- **Form Automation Engine Design** — Manifest V3 browser extension architecture for RAMIS autofill

---

## ⚖️ Legal Notice

This application is an **educational and computational tool**. It does not constitute certified financial or legal advice. All tax calculations must be verified against official IRD publications. The user bears sole legal responsibility for the accuracy of their tax return under the Sri Lanka Inland Revenue Act No. 24 of 2017.

---

© 2025 TaxLK. Built for Sri Lankan taxpayers. 🇱🇰
