// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwixVN6hLU42HThwYaC69A7dH4W50qVg0",
  authDomain: "task-master-c9fda.firebaseapp.com",
  projectId: "task-master-c9fda",
  storageBucket: "task-master-c9fda.firebasestorage.app",
  messagingSenderId: "188275689036",
  appId: "1:188275689036:web:6e9df289dcc4c3dfe896e9",
  measurementId: "G-3L01QT6NRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);