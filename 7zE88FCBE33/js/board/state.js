/* ============================================================
   board/state.js — текущая комната в памяти вкладки, поиск
   "себя" среди игроков и mutate() — read-modify-write в
   storage с последующим автоматическим перерисовыванием.
   render.js регистрируется через setRenderCallback() из
   board/index.js при входе в комнату, чтобы избежать
   циклического импорта state.js <-> render.js.
   ============================================================ */
import * as Storage from '../storage/index.js';
import { getSession } from '../session.js';

let room = null;
let renderCallback = () => {};

export function getRoom(){ return room; }

export function setRoom(next){ room = next; }

export function setRenderCallback(fn){ renderCallback = fn; }

export function myPlayer(){
  const session = getSession();
  return room.players.find(p => p.id === session.playerId);
}

export async function mutate(mutatorFn){
  const session = getSession();
  const updated = await Storage.updateRoom(session.code, mutatorFn);
  if (updated){
    room = updated;
    renderCallback();
  }
}
