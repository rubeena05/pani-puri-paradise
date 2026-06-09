import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Check environment variables first
const envConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasEnvConfig = !!(envConfig.apiKey && envConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (hasEnvConfig) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(envConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase with environment variables:", error);
  }
}

// Helper to initialize Firebase dynamically (from dynamic admin config)
export function initDynamicFirebase(config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}) {
  try {
    // If apps exist, we might need to delete or reuse
    const apps = getApps();
    let dynamicApp: FirebaseApp;
    
    if (apps.length > 0) {
      dynamicApp = getApp();
    } else {
      dynamicApp = initializeApp(config);
    }
    
    const dynamicDb = getFirestore(dynamicApp);
    const dynamicAuth = getAuth(dynamicApp);
    
    return { app: dynamicApp, db: dynamicDb, auth: dynamicAuth, success: true };
  } catch (error) {
    console.error("Dynamic Firebase initialization failed:", error);
    return { app: null, db: null, auth: null, success: false, error };
  }
}

export { app, db, auth, hasEnvConfig, envConfig };
