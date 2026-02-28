# ZERO Website

A modern olympiad and competitions website for **Zero Competitions** built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and NextAuth.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** for animations
- **Lucide React** for icons
- **NextAuth** for real Google OAuth sign-in

## Pages

- `/` — Home page (Hero, Services, Stats, CTA)
- `/about` — About ZERO (Story, Mission, Team, Values)
- `/competitions` — Competitions listing with filter tabs
- `/contact` — Contact form and company info
- `/login` — Login page with social sign-in UI
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

- `NEXTAUTH_URL` (local: `http://localhost:3000`, production: your real domain)
- `NEXTAUTH_SECRET` (a long random string)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Generate a secret quickly:

```bash
npx auth secret
```

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

## Google OAuth Setup

1. Open Google Cloud Console and create/select a project.
2. Configure OAuth consent screen.
3. Create OAuth 2.0 Client ID (Web application).
4. Add Authorized redirect URI:
	- Local: `http://localhost:3000/api/auth/callback/google`
	- Production: `https://YOUR_DOMAIN/api/auth/callback/google`
5. Copy client ID/secret into `.env.local` (and Vercel env vars for production).

## Deploy / Host (Vercel)

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel:
	- `NEXTAUTH_URL=https://YOUR_DOMAIN`
	- `NEXTAUTH_SECRET`
	- `GOOGLE_CLIENT_ID`
	- `GOOGLE_CLIENT_SECRET`
4. Redeploy.
5. Add the Vercel callback URL to Google OAuth redirect URIs.

## Features

- 📱 Fully responsive (mobile-first)
- ✨ Smooth animations with Framer Motion
- 🎨 Custom branding (Zero Competitions theme colors)
- 🔐 Real Google OAuth sign-in
- 👤 User profile with identity document fields
- 🏆 Competition registration flow tied to user profile
- ♿ Accessible semantic HTML
