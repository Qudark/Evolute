/* ============================================================
   storage/backend-local.js — офлайн-заглушка: комнаты живут
   только в памяти этой вкладки. Используется, когда нет ни
   Firebase-ключей, ни доступа к window.storage.
   ============================================================ */
const rooms = {};

export async function getRoom(key){
  return rooms[key] || null;
}

export async function saveRoom(key, room){
  rooms[key] = JSON.parse(JSON.stringify(room));
  return true;
}
