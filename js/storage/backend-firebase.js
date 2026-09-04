/* ============================================================
   storage/backend-firebase.js — бэкенд комнаты поверх Firebase
   Realtime Database. Настоящий realtime: subscribe отдаёт
   изменения мгновенно через встроенный listener firebase.
   ============================================================ */
import { FIREBASE_CONFIG } from '../config.js';

let db = null;

export function tryInit(){
  if (!FIREBASE_CONFIG.apiKey || !window.firebase) return false;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    return true;
  } catch(e){
    console.warn('Firebase init failed, falling back', e);
    return false;
  }
}

export async function getRoom(key){
  const snap = await db.ref(key).get();
  return snap.exists() ? snap.val() : null;
}

export async function saveRoom(key, room){
  await db.ref(key).set(room);
  return true;
}

export function subscribe(key, onChange){
  const ref = db.ref(key);
  const handler = snap => { if (snap.exists()) onChange(snap.val()); };
  ref.on('value', handler);
  return () => ref.off('value', handler);
}
