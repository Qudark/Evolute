/* ============================================================
   board/hand-view.js — рука игрока: карты лицом вверх,
   каждая перетаскиваема на стол/вид/в сброс.
   ============================================================ */
import * as Drag from '../drag/index.js';
import { cardEl } from './card-view.js';

export function renderHand(hand, handleDropCb){
  const row = document.getElementById('handRow');
  row.innerHTML = '';

  hand.forEach((card, idx) => {
    const el = cardEl(card);
    el.style.animation = 'cardAppear 0.3s ease ' + (idx * 0.04) + 's both';
    Drag.makeDraggable(el, { kind: 'hand', uid: card.uid }, handleDropCb);
    row.appendChild(el);
  });

  if (hand.length === 0){
    const empty = document.createElement('div');
    empty.className = 'hand-empty';
    empty.textContent = 'Пусто';
    row.appendChild(empty);
  }
}
