/* ============================================================
   board/species-view.js — один "вид" на столе: карта-вид со
   свойствами прямо на ней (карта их не растягивает, см.
   card-view.js/10-cards.css) + подпись "вид №N" под картой.
   ============================================================ */
import { cardEl } from './card-view.js';
import { markDropzone } from './dropzone-utils.js';
import { shouldAnimate } from './appear-tracker.js';

export function createSpeciesCard(sp, idx, playerId, owner){
  const props = sp.props || [];
  const wrap = document.createElement('div');
  wrap.className = 'species ' + (owner === 'player' ? 'player-species' : 'opponent-species');
  markDropzone(wrap, { zoneType: 'attach', zonePlayer: playerId, zoneSpecies: idx, speciesUid: sp.card.uid });

  // Анимация появления — только если этот вид (по uid его карты)
  // ещё не был показан ни разу, иначе рендер просто перерисовывает
  // существующую карточку без "мигания" (см. appear-tracker.js).
  // Важно: сама .species и .minicard больше НЕ имеют встроенной
  // безусловной CSS-анимации (10-cards.css) — только эта, inline,
  // добавляемая через JS именно тогда, когда она нужна.
  if (shouldAnimate(sp.card.uid)){
    wrap.style.animation = 'cardAppear 0.4s ease ' + (idx * 0.06) + 's both';
  }

  wrap.appendChild(cardEl(props));

  return wrap;
}
