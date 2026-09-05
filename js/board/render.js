/* ============================================================
   board/render.js — решает, что сейчас показывать (зал ожидания
   или сам стол), и склеивает все под-рендеры игрового экрана.
   ============================================================ */
import { getRoom, myPlayer } from './state.js';
import { getSession } from '../session.js';
import { renderSyncTag } from './sync-tag.js';
import { renderLobby } from './lobby-view.js';
import { renderPhaseTrack } from './phase-track.js';
import { renderOpponents } from './opponents-view.js';
import { renderPlayerTable } from './player-table-view.js';
import { renderDeck } from './deck-view.js';
import { renderHand } from './hand-view.js';
import { handleDrop } from './drop-handlers.js';

export function render(){
  const room = getRoom();
  if (!room) return;

  renderSyncTag(room);

  if (room.status === 'lobby'){
    document.getElementById('lobbyBlock').style.display = 'block';
    document.getElementById('boardBlock').style.display = 'none';
    renderLobby(room);
  } else {
    document.getElementById('lobbyBlock').style.display = 'none';
    // ВАЖНО: именно 'flex', а не 'block' — #boardBlock объявлен в
    // 07-game-table.css как flex-колонка (display:flex;flex:1),
    // чтобы .game-table внутри него растягивалась на весь остаток
    // экрана. Инлайн-style всегда перебивает внешний CSS для того
    // же свойства, поэтому 'block' здесь сводил flex-схему на нет:
    // .game-table переставала быть flex-элементом и сжималась по
    // высоте своего контента, а не тянулась во весь экран — именно
    // это и выглядело как "игровая зона скомкалась".
    document.getElementById('boardBlock').style.display = 'flex';
    renderGame(room);
  }
}

export function renderGame(){
  const room = getRoom();
  const me = myPlayer();
  if (!me) return;

  // Защита от undefined-массивов (Firebase стирает пустые []).
  const myHand = me.hand || [];
  const myDiscard = me.discard || [];

  renderPhaseTrack(room);
  renderSyncTag(room);

  const session = getSession();
  const opponents = room.players.filter(p => p.id !== session.playerId);
  renderOpponents(opponents);

  renderPlayerTable(me);
  renderDeck(handleDrop);
  renderHand(myHand, handleDrop);

  document.getElementById('foodCount').textContent = room.foodCount || 0;
  document.getElementById('discardCount').textContent = myDiscard.length;
  document.getElementById('drawMeta').textContent = (room.deck ? room.deck.length : 0) + ' карт';
}
