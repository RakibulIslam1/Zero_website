# ZERO Website

A modern olympiad and competitions website for **Zero Competitions** built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Firebase Authentication.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** for animations
- **Lucide React** for icons
- **Firebase Authentication** for real email/password auth

## Pages

- `/` — Home page (Hero, Services, Stats, CTA)
- `/about` — About ZERO (Story, Mission, Team, Values)
- `/competitions` — Competitions listing with filter tabs
- `/contact` — Contact form and company info
- `/login` — Login page with real email/password sign-up and sign-in
- `/profile` — User profile (required identity and address data)
- `/competitions/register/[id]` — Logged-in competition registration form

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set these values:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Firebase Email Auth Setup

1. Open Firebase Console and create a project.
2. Go to Project Settings → Your Apps → add a Web app.
3. Copy Firebase config values into `.env.local`.
4. Go to Authentication → Sign-in method.
5. Enable **Email/Password** provider.
6. (Optional) In Authentication → Settings → Authorized domains, add your Vercel domain.

## Deploy / Host (Vercel)

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel:
	- `NEXT_PUBLIC_FIREBASE_API_KEY`
	- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
	- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
	- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
	- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
	- `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Redeploy.

## Features

- 📱 Fully responsive (mobile-first)
- ✨ Smooth animations with Framer Motion
- 🎨 Custom branding (Zero Competitions theme colors)
- 🔐 Real Firebase email/password authentication
- 👤 User profile with identity document fields
- 🏆 Competition registration flow tied to user profile
- ♿ Accessible semantic HTML
