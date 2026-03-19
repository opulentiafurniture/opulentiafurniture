# Opulentia Furniture

A modern Next.js storefront demo with Firebase auth, product cart, and 3D product visualization.

## Quick Start

### 1) Clone the repo

```bash
git clone <repo-url> opulentiafurniture
cd opulentiafurniture
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure Firebase (required)

This project uses Firebase Authentication + Firestore.
Create a Firebase project and add a Web App to obtain the config values.

Create a file called `.env.local` in the project root with the following values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> These are exposed to the browser via `NEXT_PUBLIC_*`, so keep them out of source control.

### 4) Run in development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Common Commands

- `npm run dev` — start development server
- `npm run build` — build for production
- `npm run start` — start production server (after build)
- `npm run lint` — run ESLint
- `npm run test` — run Jest unit tests
- `npm run test:watch` — run Jest in watch mode

## Project Structure

- `app/` — Next.js App Router pages and UI
- `app/component/` — shared components (navbar, footer, chatbot)
- `lib/` — helpers (Firebase, auth, cart, products, utils)
- `public/` — static assets (3D models, images)
- `__tests__/` — Jest + React Testing Library tests

## Notes

- 3D product visualization uses `@react-three/fiber` + `three`
- UI styling is powered by Tailwind CSS
- Firebase config is read from environment variables (`process.env.NEXT_PUBLIC_*`)

## Testing

Run the full test suite:

```bash
npm test
```

## Deployment

This is a standard Next.js application and can be deployed to Vercel, Netlify, or any Node.js host.

For Vercel, just connect the repo and set the same environment variables in the Vercel dashboard.

---

If you need help setting up Firebase or have questions about the project structure, open an issue in the repo or reach out to the maintainer.
