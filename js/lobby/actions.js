/* ============================================================
   lobby/actions.js — «Создать комнату» / «Войти в комнату»:
   валидация полей, запись в storage, обновление сессии.
   ============================================================ */
import * as Storage from '../storage/index.js';
import { setSession } from '../session.js';
import { genCode, genId } from './codegen.js';

function newPlayer(id, name){
  return { id, name, hand: [], table: [], discard: [] };
}

export async function onCreate({ name, maxPlayers, onError, onSuccess }){
  if (!name){ onError('Введите имя.'); return; }

  const code = genCode();
  const playerId = genId();
  const room = {
    code, maxPlayers, status: 'lobby',
    players: [newPlayer(playerId, name)],
    deck: [], foodCount: 0, phase: 0, createdAt: Date.now(),
  };
  const ok = await Storage.saveRoom(code, room);
  if (!ok){ onError('Не удалось создать комнату, попробуйте ещё раз.'); return; }

  setSession({ code, playerId, name });
  onSuccess(room);
}

export async function onJoin({ code, name, onError, onSuccess }){
  if (!code || code.length !== 4){ onError('Введите 4-значный код комнаты.'); return; }
  if (!name){ onError('Введите имя.'); return; }

  const room = await Storage.getRoom(code);
  if (!room){ onError('Комната с таким кодом не найдена.'); return; }

  const existing = room.players.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing){
    setSession({ code, playerId: existing.id, name });
    onSuccess(room);
    return;
  }
  if (room.status !== 'lobby'){ onError('Игра уже началась, подключиться новым игроком нельзя.'); return; }
  if (room.players.length >= room.maxPlayers){ onError('Комната заполнена.'); return; }

  const playerId = genId();
  room.players.push(newPlayer(playerId, name));
  const ok = await Storage.saveRoom(code, room);
  if (!ok){ onError('Не удалось подключиться, попробуйте ещё раз.'); return; }

  setSession({ code, playerId, name });
  onSuccess(room);
}
