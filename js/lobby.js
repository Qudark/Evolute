/* ============================================================
   Evo.Lobby — экран "Меню": создать комнату / войти по коду.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.Session = null; // { code, playerId, name } — только в памяти вкладки

Evo.Lobby = (function(){

  function genCode(){
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = ''; for (let i=0;i<4;i++) c += chars[Math.floor(Math.random()*chars.length)];
    return c;
  }
  function genId(){ return Math.random().toString(36).slice(2,10); }

  function init(){
    const nameField = document.getElementById('createName');
    const suggested = Evo.TG.suggestedName();
    if (suggested && nameField) nameField.value = suggested;
    const joinNameField = document.getElementById('joinName');
    if (suggested && joinNameField) joinNameField.value = suggested;

    document.getElementById('btnCreate').addEventListener('click', onCreate);
    document.getElementById('btnJoin').addEventListener('click', onJoin);
  }

  async function onCreate(){
    const name = document.getElementById('createName').value.trim();
    const max = Number(document.getElementById('createMax').value);
    const err = document.getElementById('createErr');
    err.textContent = '';
    if (!name){ err.textContent = 'Введите имя.'; return; }

    const code = genCode();
    const playerId = genId();
    const room = {
      code, maxPlayers: max, status: 'lobby',
      players: [{ id: playerId, name, hand: [], table: [], discard: [] }],
      deck: [], foodCount: 0, phase: 0, createdAt: Date.now(),
    };
    const ok = await Evo.Storage.saveRoom(code, room);
    if (!ok){ err.textContent = 'Не удалось создать комнату, попробуйте ещё раз.'; return; }

    Evo.Session = { code, playerId, name };
    Evo.Main.enterRoom(room);
  }

  async function onJoin(){
    const code = document.getElementById('joinCode').value.trim().toUpperCase();
    const name = document.getElementById('joinName').value.trim();
    const err = document.getElementById('joinErr');
    err.textContent = '';
    if (!code || code.length !== 4){ err.textContent = 'Введите 4-значный код комнаты.'; return; }
    if (!name){ err.textContent = 'Введите имя.'; return; }

    const room = await Evo.Storage.getRoom(code);
    if (!room){ err.textContent = 'Комната с таким кодом не найдена.'; return; }

    const existing = room.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing){
      Evo.Session = { code, playerId: existing.id, name };
      Evo.Main.enterRoom(room);
      return;
    }
    if (room.status !== 'lobby'){ err.textContent = 'Игра уже началась, подключиться новым игроком нельзя.'; return; }
    if (room.players.length >= room.maxPlayers){ err.textContent = 'Комната заполнена.'; return; }

    const playerId = genId();
    room.players.push({ id: playerId, name, hand: [], table: [], discard: [] });
    const ok = await Evo.Storage.saveRoom(code, room);
    if (!ok){ err.textContent = 'Не удалось подключиться, попробуйте ещё раз.'; return; }

    Evo.Session = { code, playerId, name };
    Evo.Main.enterRoom(room);
  }

  return { init };
})();
