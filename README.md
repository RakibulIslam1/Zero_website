# Samurai Japanese Language Training Center

A modern Next.js website for **Samurai Japanese Language Training Center** — one of the best Japanese language learning centers and student visa consultancy firms in Bangladesh.

Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Firebase** (Authentication + Firestore).

---

## 🚀 Features

- **Public site** with Samurai branding (deep maroon theme)
- **Navigation**: Home, About Us, Japan Student Visa, SSW Visa, Working Visa, Malaysia Student Visa, Air Ticket Service, Contact Us, Login
- **Home page**: Hero, Services, Why Study in Japan?, Course Levels, Educational Requirements, CTA
- **Visa/Service pages**: Japan Student Visa, SSW Visa, Working Visa, Malaysia Student Visa, Air Ticket Service
- **Contact page**: Bangladesh office + Japan office + contact form (saves to Firestore)
- **Admin panel** (`/admin`) with Firebase Auth + Firestore role-based access:
  - Super Admins: can manage admin list, promote/demote, view all data
  - Regular Admins: can view contact messages, manage site settings
- **Responsive** and accessible design

---

## 📁 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom maroon theme (`#7A1020`)
- **Animations**: Framer Motion
- **Auth**: Firebase Authentication (email/password)
- **Database**: Cloud Firestore
- **Email**: Nodemailer + Brevo SMTP
- **Deployment**: Vercel

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- A Firebase project (free Spark plan works)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/RakibulIslam1/Zero_website.git
   cd Zero_website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual Firebase credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

---

## 🔥 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password sign-in method
4. Enable **Firestore Database** (start in test mode, then configure rules)

### 2. Get Client SDK Credentials
1. Firebase Console → Project Settings → General → Your apps → Add web app
2. Copy the Firebase config object values to your `.env.local`

### 3. Get Admin SDK Credentials
1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key**
3. Copy values to `.env.local`:
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (wrap in double quotes, keep `\n` as literal `\n`)

### 4. Firestore Security Rules
Set these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public: contact messages (write only)
    match /contactMessages/{docId} {
      allow create: if true;
      allow read, update, delete: if false; // admin only via server
    }
    // User profiles: owner read/write
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // User registrations: owner read/write
    match /userRegistrations/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Admin settings: read only for authenticated (roles loaded client-side)
    match /adminSettings/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // written via server-side admin SDK only
    }
    // Site settings: public read, server-only write
    match /siteSettings/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 5. Bootstrap Super Admin
The super admin email `rakibul.rir06@gmail.com` is bootstrapped automatically when that user first logs in. The system will create the `adminSettings/roles` document with:
```json
{
  "superAdmins": ["rakibul.rir06@gmail.com"],
  "admins": []
}
```

---

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | Optional |
| `FIREBASE_ADMIN_PROJECT_ID` | Admin SDK Project ID | ✅ |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Admin SDK Service Account Email | ✅ |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Admin SDK Private Key | ✅ |
| `SMTP_HOST` | SMTP server host | Optional |
| `SMTP_PORT` | SMTP server port | Optional |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password | Optional |
| `SMTP_FROM` | Email sender name/address | Optional |
| `CONTACT_RECEIVER_EMAIL` | Email to receive contact form submissions | Optional |
| `BREVO_API_KEY` | Brevo API key (alternative to SMTP) | Optional |

---

## 🚢 Deployment to Vercel

1. **Push to GitHub** (or fork this repository)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import the GitHub repository
   - Framework: **Next.js** (auto-detected)

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add all variables from the table above
   - For `FIREBASE_ADMIN_PRIVATE_KEY`: paste the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`, using literal `\n` for newlines

4. **Deploy**
   - Click Deploy
   - Vercel will automatically build and deploy

5. **Custom Domain** (optional)
   - Add your domain in Vercel → Domains

---

## 📋 Admin Panel

### Access
Navigate to `/admin` and log in with an admin or super admin account.

### Firestore Role Structure
```
adminSettings/roles:
  superAdmins: string[]   // emails of super admins
  admins: string[]        // emails of regular admins
```

### Super Admin Capabilities
- Add / remove regular admins
- Promote / demote super admins
- Cannot remove the last super admin
- All regular admin capabilities

### Regular Admin Capabilities
- View all contact form submissions
- Reply to contact messages
- Mark messages as read/responded
- Manage site contact settings
- Manage feature banner
- View join-us applications

---

## 🔒 Security

- All admin API routes validate Firebase ID tokens via `lib/adminAuth.ts`
- Roles checked server-side against Firestore `adminSettings/roles`
- No secrets in client-side code (only `NEXT_PUBLIC_*` vars are exposed)
- API routes run on Node.js runtime (`export const runtime = 'nodejs'`)
