/* ============================================================
   board/deck-view.js — колода в сайдбаре: стопка из 1–3
   визуальных карт рубашкой вверх, верхняя — кликабельна и
   перетаскиваема в руку.
   ============================================================ */
import * as Drag from '../drag/index.js';
import { getRoom, mutate } from './state.js';
import { getSession } from '../session.js';

const VISIBLE_MAX = 3;

export function drawCard(){
  mutate(r => {
    if (!r.deck || r.deck.length === 0) return;
    const session = getSession();
    const me = r.players.find(p => p.id === session.playerId);
    if (!me) return;
    if (!me.hand) me.hand = [];
    me.hand.push(r.deck.pop());
  });
}

export function renderDeck(handleDropCb){
  const room = getRoom();
  const pile = document.getElementById('drawPile');
  pile.innerHTML = '';

  const deckCount = room.deck ? room.deck.length : 0;
  const visibleCards = Math.min(VISIBLE_MAX, Math.max(1, deckCount));

  for (let i = 0; i < visibleCards; i++){
    const card = document.createElement('div');
    card.className = 'minicard facedown';
    card.innerHTML = `<div class="mi-icon">🂠</div><div class="mi-name">колода</div>`;
    card.style.position = 'absolute';
    card.style.top = (i * 2) + 'px';
    card.style.left = (i * 2) + 'px';
    card.style.zIndex = visibleCards - i;
    card.style.transform = `rotate(${(i - 1) * 1.2}deg)`;

    if (i === 0){
      card.style.cursor = 'pointer';
      card.addEventListener('click', drawCard);
      Drag.makeDraggable(card, { kind: 'deck' }, handleDropCb);
    } else {
      card.style.pointerEvents = 'none';
      card.style.opacity = (0.9 - i * 0.08).toString();
    }
    pile.appendChild(card);
  }
}
