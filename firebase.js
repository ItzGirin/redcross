import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCuQdTBKJpxv2Li0PoUXZ0Z1ok_-w9q32c",
  authDomain: "redcross-d3589.firebaseapp.com",
  projectId: "redcross-d3589",
  storageBucket: "redcross-d3589.firebasestorage.app",
  messagingSenderId: "626782949345",
  appId: "1:626782949345:web:c54c58e21f5b054dd50ca0",
  measurementId: "G-EFEPG8YYCT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;