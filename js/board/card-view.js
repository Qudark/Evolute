/* ============================================================
   board/card-view.js — рендер одной карты (.minicard): рубашкой
   вверх (вид) или лицом вверх (свойство), с кнопкой переворота
   для двусторонних карт.
   ============================================================ */
import { getType, getFace } from '../data/deck.js';
import { getSession } from '../session.js';
import { mutate } from './state.js';

export function cardEl(card, { facedown = false, locked = false } = {}){
  const el = document.createElement('div');
  el.className = 'minicard' + (facedown ? ' facedown' : '') + (locked ? ' locked' : '');

  if (facedown){
    el.innerHTML = `<div class="mi-icon">🦎</div><div class="mi-name">вид</div>`;
    return el;
  }

  const type = getType(card.typeId);
  const face = getFace(card);
  el.innerHTML = `<div class="mi-icon">${face.icon}</div><div class="mi-name">${face.name}</div>` +
    (type.faces.length > 1 ? `<div class="mi-flip" title="перевернуть карту">⟲</div>` : '');

  if (type.faces.length > 1){
    el.querySelector('.mi-flip').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      mutate(r => {
        const session = getSession();
        const me = r.players.find(p => p.id === session.playerId);
        const c = me.hand.find(c => c.uid === card.uid);
        if (c) c.face = c.face ? 0 : 1;
      });
    });
  }
  return el;
}
