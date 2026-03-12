import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfdC2i74qft6ndW8M64gA2R6iGuu6PkAQ",
  authDomain: "opulentia-web.firebaseapp.com",
  projectId: "opulentia-web",
  storageBucket: "opulentia-web.firebasestorage.app",
  messagingSenderId: "921539233171",
  appId: "1:921539233171:web:f392c0284db1f9e9db1466",
  measurementId: "G-SF23V3HF3L"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export services to be used in your Sign-In page
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;