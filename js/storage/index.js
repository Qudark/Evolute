/* ============================================================
   storage/index.js — единая точка доступа к "серверу" комнаты.
   Под капотом может быть Firebase (для реального деплоя),
   встроенное хранилище Claude (для теста прямо в этом чате)
   или локальная память (офлайн-заглушка на одном устройстве).
   Остальной код всегда вызывает одни и те же функции и не знает,
   какой бэкенд используется.
   ============================================================ */
import * as Firebase from './backend-firebase.js';
import * as ClaudeKV from './backend-claude-kv.js';
import * as Local from './backend-local.js';

const POLL_INTERVAL_MS = 2500;

let mode = 'local'; // 'firebase' | 'claude' | 'local'

function roomKey(code){ return 'evo_room_' + code; }

export function init(){
  if (Firebase.tryInit()){
    mode = 'firebase';
  } else if (ClaudeKV.isAvailable()){
    mode = 'claude';
  } else {
    mode = 'local';
  }
  return mode;
}

export function getMode(){ return mode; }

export async function getRoom(code){
  const key = roomKey(code);
  if (mode === 'firebase') return Firebase.getRoom(key);
  if (mode === 'claude') return ClaudeKV.getRoom(key);
  return Local.getRoom(key);
}

export async function saveRoom(code, room){
  room.updatedAt = Date.now();
  const key = roomKey(code);
  if (mode === 'firebase') return Firebase.saveRoom(key, room);
  if (mode === 'claude') return ClaudeKV.saveRoom(key, room);
  return Local.saveRoom(key, room);
}

/* Читает свежую копию, применяет мутатор, сохраняет.
   На «firebase»/«claude» это read-modify-write без блокировок —
   при одновременных действиях двух игроков в одну миллисекунду
   возможна гонка (последний write побеждает). Для игры с
   друзьями по очереди это не проблема. */
export async function updateRoom(code, mutatorFn){
  const room = await getRoom(code);
  if (!room) return null;
  mutatorFn(room);
  await saveRoom(code, room);
  return room;
}

/* Подписка на изменения комнаты.
   Firebase — настоящий realtime (мгновенно).
   Claude/local — обычный опрос раз в 2.5 сек.
   Возвращает функцию отписки. */
export function subscribe(code, onChange){
  if (mode === 'firebase'){
    return Firebase.subscribe(roomKey(code), onChange);
  }
  let lastTs = 0;
  const timer = setInterval(async () => {
    const room = await getRoom(code);
    if (room && room.updatedAt !== lastTs){
      lastTs = room.updatedAt;
      onChange(room);
    }
  }, POLL_INTERVAL_MS);
  return () => clearInterval(timer);
}
