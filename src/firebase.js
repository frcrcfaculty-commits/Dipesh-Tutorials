import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ─── User / Auth ───────────────────────────────────────────────────

export async function signInWithEmail(email, password) {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email, password, displayName, role = 'admin') {
  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  // Create user profile in Firestore
  await addDoc(collection(db, 'users'), {
    uid: credential.user.uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
  });
  return credential;
}

export async function signInWithGoogle() {
  const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logout() {
  const { signOut } = await import('firebase/auth');
  return signOut(auth);
}

export async function getUserProfile(uid) {
  const q = query(collection(db, 'users'), where('uid', '==', uid));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  return null;
}

// ─── Students ──────────────────────────────────────────────────────

export function subscribeStudents(callback) {
  const q = query(collection(db, 'students'), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(students);
  });
}

export async function addStudent(studentData) {
  return addDoc(collection(db, 'students'), {
    ...studentData,
    createdAt: serverTimestamp(),
  });
}

export async function updateStudent(id, data) {
  return updateDoc(doc(db, 'students', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudent(id) {
  return deleteDoc(doc(db, 'students', id));
}

// ─── Attendance ────────────────────────────────────────────────────

export function subscribeAttendance(date, callback) {
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', date)
  );
  return onSnapshot(q, (snapshot) => {
    const records = {};
    snapshot.docs.forEach(d => { records[d.data().studentId] = { id: d.id, ...d.data() }; });
    callback(records);
  });
}

export async function markAttendance(date, studentId, status, standard) {
  const q = query(
    collection(db, 'attendance'),
    where('date', '==', date),
    where('studentId', '==', studentId)
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    const docId = existing.docs[0].id;
    return updateDoc(doc(db, 'attendance', docId), { status });
  } else {
    return addDoc(collection(db, 'attendance'), {
      date,
      studentId,
      standard,
      status,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getAttendanceReport(standard, startDate, endDate) {
  const q = query(
    collection(db, 'attendance'),
    where('standard', '==', standard),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Billing / Fees ────────────────────────────────────────────────

export function subscribeFees(callback) {
  return onSnapshot(collection(db, 'fees'), (snapshot) => {
    const fees = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(fees);
  });
}

export async function addFeeRecord(record) {
  return addDoc(collection(db, 'fees'), {
    ...record,
    createdAt: serverTimestamp(),
  });
}

export async function updateFeeRecord(id, data) {
  return updateDoc(doc(db, 'fees', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFeeRecord(id) {
  return deleteDoc(doc(db, 'fees', id));
}

// ─── Test Results ──────────────────────────────────────────────────

export function subscribeTestResults(callback) {
  const q = query(collection(db, 'testResults'), orderBy('testDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(results);
  });
}

export async function addTestResult(result) {
  return addDoc(collection(db, 'testResults'), {
    ...result,
    createdAt: serverTimestamp(),
  });
}

export async function updateTestResult(id, data) {
  return updateDoc(doc(db, 'testResults', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Resources ──────────────────────────────────────────────────────

export function subscribeResources(callback) {
  return onSnapshot(collection(db, 'resources'), (snapshot) => {
    const resources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(resources);
  });
}

export async function addResource(resource) {
  return addDoc(collection(db, 'resources'), {
    ...resource,
    createdAt: serverTimestamp(),
  });
}

// ─── Notifications ──────────────────────────────────────────────────

export function subscribeNotifications(userId, callback) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notifications);
  });
}

export async function addNotification(notification) {
  return addDoc(collection(db, 'notifications'), {
    ...notification,
    createdAt: serverTimestamp(),
    read: false,
  });
}

// ─── Standards / Subjects ─────────────────────────────────────────

export async function getStandards() {
  const snapshot = await getDocs(collection(db, 'config'));
  const config = {};
  snapshot.docs.forEach(d => { config[d.id] = d.data(); });
  return config;
}
