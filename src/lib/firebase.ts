
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";

// --- Primary Firebase Configuration (for student data, auth, bills, applications, etc.) ---
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Secondary Firebase Configuration (for gallery, notes, public content, etc.) ---
const firebaseConfigSecondary = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_SECONDARY_MEASUREMENT_ID
};


let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

let app_secondary: FirebaseApp | undefined;
let db_secondary: Firestore | undefined;


if (typeof window !== 'undefined') {
  // Initialize Primary App
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = getApps().find(a => a.name === 'primary') || initializeApp(firebaseConfig, 'primary');
      auth = getAuth(app);
      db = getFirestore(app);

      setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Error setting auth persistence: ", error);
      });

      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Primary Firestore persistence failed: another tab has it enabled.");
        } else if (err.code === 'unimplemented') {
          console.warn("Primary Firestore persistence not supported in this browser.");
        }
      });

    } catch (e) {
      console.error("Could not initialize Primary Firebase.", e);
    }
  } else {
    console.warn("Primary Firebase environment variables are not set.");
  }

  // Initialize Secondary App
  if (firebaseConfigSecondary.apiKey && firebaseConfigSecondary.projectId) {
      try {
        app_secondary = getApps().find(a => a.name === 'secondary') || initializeApp(firebaseConfigSecondary, 'secondary');
        db_secondary = getFirestore(app_secondary);
        
        enableIndexedDbPersistence(db_secondary).catch((err) => {
             if (err.code === 'failed-precondition') {
                console.warn("Secondary Firestore persistence failed: another tab has it enabled.");
            } else if (err.code === 'unimplemented') {
                console.warn("Secondary Firestore persistence not supported in this browser.");
            }
        });

      } catch(e) {
        console.error("Could not initialize Secondary Firebase.", e);
      }
  } else {
     console.warn("Secondary Firebase environment variables are not set.");
  }

}

export { app, auth, db, db_secondary };
