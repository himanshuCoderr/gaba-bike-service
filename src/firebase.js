// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, deleteDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZ_j5SA1jnzcbqEaySx7RXB8gFor1k6KM",
  authDomain: "gaba-bike-service.firebaseapp.com",
  projectId: "gaba-bike-service",
  storageBucket: "gaba-bike-service.appspot.com",
  messagingSenderId: "395160909985",
  appId: "1:395160909985:web:e5f80ae8f462e8e52e98e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

// Export everything needed
export { 
  firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  auth, 
  signInWithEmailAndPassword, 
  storage 
};
