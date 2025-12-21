import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCs_wEsMMhsOIjenJokxGyhb2AQK_KRLTk",
    authDomain: "l-w-app.firebaseapp.com",
    projectId: "l-w-app",
    storageBucket: "l-w-app.firebasestorage.app",
    messagingSenderId: "964026826448",
    appId: "1:964026826448:web:506c24ecab6356807ae8d5",
    measurementId: "G-QC26Z4HSM9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
