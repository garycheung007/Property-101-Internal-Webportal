
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Replace these placeholders with the config from your Firebase Console
// Project Settings > General > Your Apps > Web App
const firebaseConfig = {
  apiKey: "AIzaSyDHWrCNbPPL3f0v0l3qxrs0Zx0Rl9uI-hY",
  authDomain: "property-101-internal-portal.firebaseapp.com",
  projectId: "property-101-internal-portal",
  storageBucket: "property-101-internal-portal.firebasestorage.app",
  messagingSenderId: "119814471164",
  appId: "1:119814471164:web:bfb34b3b425730649bc679",
  measurementId: "G-GNNFBWZJKG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
