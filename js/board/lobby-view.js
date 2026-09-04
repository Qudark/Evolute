/* ============================================================
   board/lobby-view.js — зал ожидания внутри вкладки "Стол":
   список игроков и запуск партии (тасовка + раздача по 6 карт).
   ============================================================ */
import { buildDeck, shuffle } from '../data/deck.js';
import { getSession } from '../session.js';
import { mutate } from './state.js';

const HAND_SIZE = 6;

export function renderLobby(room){
  const session = getSession();
  document.getElementById('lobbyCodeBig').textContent = room.code.split('').join(' ');

  const list = document.getElementById('lobbyPlayers');
  list.innerHTML = '';
  room.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `<span class="dot"></span><span class="name">${p.name}</span>`;
    if (p.id === session.playerId){
      const tag = document.createElement('span');
      tag.className = 'youtag';
      tag.textContent = 'ВЫ';
      row.appendChild(tag);
    }
    list.appendChild(row);
  });

  const placeholders = Math.max(0, room.maxPlayers - room.players.length);
  for (let i = 0; i < placeholders; i++){
    const row = document.createElement('div');
    row.className = 'player-row';
    row.style.opacity = '.4';
    row.innerHTML = `<span class="dot" style="background:#4d5f52;"></span><span class="name mono">ожидание игрока…</span>`;
    list.appendChild(row);
  }

  const startBtn = document.getElementById('btnStart');
  startBtn.disabled = room.players.length < 2;
  startBtn.onclick = startGame;
}

export function startGame(){
  mutate(r => {
    const deck = shuffle(buildDeck());
    r.players.forEach(p => {
      p.hand = []; p.table = []; p.discard = [];
      for (let i = 0; i < HAND_SIZE; i++){
        const c = deck.pop();
        if (c) p.hand.push(c);
      }
    });
    r.deck = deck;
    r.foodCount = 0;
    r.phase = 0;
    r.status = 'playing';
  });
}
