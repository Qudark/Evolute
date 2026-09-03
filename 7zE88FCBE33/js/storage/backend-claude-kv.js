/* ============================================================
   storage/backend-claude-kv.js — бэкенд поверх window.storage,
   встроенного key-value хранилища артефактов Claude. Удобно
   для теста прямо в этом чате, без своего Firebase-проекта.
   ============================================================ */
export function isAvailable(){
  return !!(window.storage && typeof window.storage.get === 'function');
}

export async function getRoom(key){
  try {
    const res = await window.storage.get(key, true);
    return res ? JSON.parse(res.value) : null;
  } catch(e){
    return null;
  }
}

export async function saveRoom(key, room){
  try {
    await window.storage.set(key, JSON.stringify(room), true);
    return true;
  } catch(e){
    return false;
  }
}
