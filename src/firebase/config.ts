import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbi4wzn4ANHLr_lby1tT5nO67uY6N9yiA",
  authDomain: "got-nan-wedding.firebaseapp.com",
  databaseURL: "https://got-nan-wedding-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "got-nan-wedding",
  storageBucket: "got-nan-wedding.firebasestorage.app",
  messagingSenderId: "701857898874",
  appId: "1:701857898874:web:b0de56ddd892980e11f6c3",
  measurementId: "G-G0TQYFE9XN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// ใช้ Local persistence เพื่อให้สถานะการล็อกอินอยู่ต่อหลังรีเฟรชหน้า
// ไม่ block การทำงานหาก browser ไม่รองรับ
setPersistence(auth, browserLocalPersistence).catch(() => {});

export default app;

