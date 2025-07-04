
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCzB_WUQ_0KQq3Ax3JdAoV6O3J1sfjF310",
  authDomain: "jti-goddax.firebaseapp.com",
  projectId: "jti-goddax",
  storageBucket: "jti-goddax.firebasestorage.app",
  messagingSenderId: "318958229300",
  appId: "1:318958229300:web:eb969dcf573bcc2acb7761",
  measurementId: "G-C2S1FKELW9"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Set Auth persistence to keep users logged in across sessions.
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Error setting auth persistence: ", error);
      });

    // Enable Firestore offline persistence
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a time.
          console.warn("Firestore persistence failed: another tab has it enabled.");
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          console.warn("Firestore persistence not supported in this browser.");
        }
      });

  } catch (e) {
    console.error("Could not initialize Firebase. Please check your .env.local file.", e);
  }
} else if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("Firebase environment variables are not set. Firebase-dependent features will be disabled. Please create a .env.local file with your Firebase config.");
}


export { app, auth, db };
