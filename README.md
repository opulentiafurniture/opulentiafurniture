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

1. Go to https://console.firebase.google.com and create a new Firebase project.
2. In Project Settings → General → Your apps, add a Web app and copy the Firebase config values.
3. Enable Authentication:
   - Go to Authentication → Get started.
   - Enable Email/Password provider.
4. Enable Firestore:
   - Go to Firestore Database → Create database.
   - Start in production mode (recommended) and choose your location.
5. Configure Firestore collections (optional but recommended for first run):
   - Collection `users` (document ID = `uid`): store user profile data.
   - Collection `designs` (document ID = auto-generated): includes `userId` and design metadata.

Create a file called `.env.local` in the project root with values from the web app settings:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> These are exposed to the browser via `NEXT_PUBLIC_*`, so keep them out of source control.

### 3.1) Firestore structure guidance

Expected document structure:

- `users/{uid}`:
  - `name`, `email`, `createdAt`, etc.
- `designs/{designId}`:
  - `userId` (uid string), `title`, `description`, `createdAt`, etc.

This aligns with the security rules below so each user can only access their own documents.

### 3.2) Firestore index settings (asc/desc)

The app queries designs with:

- `where('userId', '==', userId)`
- `orderBy('createdAt', 'desc')`

Firestore may prompt you to create a composite index for this pattern. If so:

1. Open Firestore Console.
2. Go to Indexes → Composite.
3. Add index on collection `designs` with:
   - `userId` = Ascending
   - `createdAt` = Descending
4. Deploy index.

This avoids errors like `PERMISSION_DENIED` or `FAILED_PRECONDITION` during query execution.

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

## Firestore Security Rules

Configure Firestore rules in the Firebase Console under Firestore → Rules.

Use this rule set to ensure each user can only access their own profile and designs:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Allow each user to read/write only their own profile document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /designs/{designId} {
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;

      allow update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;

      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

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
