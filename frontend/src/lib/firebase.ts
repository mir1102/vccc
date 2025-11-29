import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCI0Xpc6bDdPPWJp7RF0gc6WHp96eq_zTo",
  authDomain: "vccc-2a621.firebaseapp.com",
  projectId: "vccc-2a621",
  storageBucket: "vccc-2a621.firebasestorage.app",
  messagingSenderId: "576701208408",
  appId: "1:576701208408:web:78122cb187e253dc66372d",
  measurementId: "G-XFBT9RWBZG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (브라우저 환경에서만)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

