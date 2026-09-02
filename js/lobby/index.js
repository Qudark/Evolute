/* ============================================================
   lobby/index.js — экран "Меню": подключает DOM-поля формы
   создания/входа к lobby/actions.js. Принимает enterRoom как
   параметр (вместо прямого импорта main.js), чтобы не создавать
   циклическую зависимость между модулями.
   ============================================================ */
import * as TG from '../telegram.js';
import { onCreate, onJoin } from './actions.js';

export function init(enterRoom){
  const nameField = document.getElementById('createName');
  const suggested = TG.suggestedName();
  if (suggested && nameField) nameField.value = suggested;
  const joinNameField = document.getElementById('joinName');
  if (suggested && joinNameField) joinNameField.value = suggested;

  document.getElementById('btnCreate').addEventListener('click', () => handleCreate(enterRoom));
  document.getElementById('btnJoin').addEventListener('click', () => handleJoin(enterRoom));
}

async function handleCreate(enterRoom){
  const name = document.getElementById('createName').value.trim();
  const maxPlayers = Number(document.getElementById('createMax').value);
  const err = document.getElementById('createErr');
  err.textContent = '';

  await onCreate({
    name, maxPlayers,
    onError: msg => { err.textContent = msg; },
    onSuccess: room => enterRoom(room),
  });
}

async function handleJoin(enterRoom){
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value.trim();
  const err = document.getElementById('joinErr');
  err.textContent = '';

  await onJoin({
    code, name,
    onError: msg => { err.textContent = msg; },
    onSuccess: room => enterRoom(room),
  });
}
