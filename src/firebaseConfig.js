import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { setLogLevel } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Log all firestore debug statements
setLogLevel('debug'); 

const firebaseConfig = {
 apiKey: "AIzaSyBEHnNpIfnVyqpcbA5ysFPa-ku87VdMYV0",
  authDomain: "bsss-dating.firebaseapp.com",
  projectId: "bsss-dating",
  storageBucket: "bsss-dating.firebasestorage.app",
  messagingSenderId: "186492166278",
  appId: "1:186492166278:web:92b9d24a2830fb7d97b107",
  measurementId: "G-Z3CCD9ZPMJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 
export const realtimeDB = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope("email");

export default app;