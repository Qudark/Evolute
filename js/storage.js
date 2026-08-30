/* ============================================================
   Evo.Storage — единая точка доступа к "серверу" комнаты.
   Под капотом может быть Firebase (для реального деплоя),
   встроенное хранилище Claude (для теста прямо в этом чате)
   или локальная память (офлайн-заглушка на одном устройстве).
   Остальной код всегда вызывает одни и те же методы и не знает,
   какой бэкенд используется.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.Storage = (function(){
  let mode = 'local';   // 'firebase' | 'claude' | 'local'
  let db = null;
  const localRooms = {}; // используется только в режиме 'local'

  function init(){
    const cfg = window.FIREBASE_CONFIG || {};
    if (cfg.apiKey && window.firebase){
      try {
        firebase.initializeApp(cfg);
        db = firebase.database();
        mode = 'firebase';
        return mode;
      } catch(e){ console.warn('Firebase init failed, falling back', e); }
    }
    if (window.storage && typeof window.storage.get === 'function'){
      mode = 'claude';
      return mode;
    }
    mode = 'local';
    return mode;
  }

  function key(code){ return 'evo_room_' + code; }

  async function getRoom(code){
    if (mode === 'firebase'){
      const snap = await db.ref(key(code)).get();
      return snap.exists() ? snap.val() : null;
    }
    if (mode === 'claude'){
      try {
        const res = await window.storage.get(key(code), true);
        return res ? JSON.parse(res.value) : null;
      } catch(e){ return null; }
    }
    return localRooms[code] || null;
  }

  async function saveRoom(code, room){
    room.updatedAt = Date.now();
    if (mode === 'firebase'){
      await db.ref(key(code)).set(room);
      return true;
    }
    if (mode === 'claude'){
      try {
        await window.storage.set(key(code), JSON.stringify(room), true);
        return true;
      } catch(e){ return false; }
    }
    localRooms[code] = JSON.parse(JSON.stringify(room));
    return true;
  }

  /* Читает свежую копию, применяет мутатор, сохраняет.
     На «firebase»/«claude» это read-modify-write без блокировок —
     при одновременных действиях двух игроков в одну миллисекунду
     возможна гонка (последний write побеждает). Для игры с
     друзьями по очереди это не проблема. */
  async function updateRoom(code, mutatorFn){
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
  function subscribe(code, onChange){
    if (mode === 'firebase'){
      const ref = db.ref(key(code));
      const handler = snap => { if (snap.exists()) onChange(snap.val()); };
      ref.on('value', handler);
      return () => ref.off('value', handler);
    }
    let lastTs = 0;
    const timer = setInterval(async ()=>{
      const room = await getRoom(code);
      if (room && room.updatedAt !== lastTs){
        lastTs = room.updatedAt;
        onChange(room);
      }
    }, 2500);
    return () => clearInterval(timer);
  }

  function getMode(){ return mode; }

  return { init, getRoom, saveRoom, updateRoom, subscribe, getMode };
})();
