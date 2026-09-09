/* ============================================================
   board/species-view.js — ряд видов на столе: карточка вида
   (карта-рубашка со свойствами прямо на ней, см. card-view.js) и,
   МЕЖДУ каждыми двумя соседними видами, щель-дропзона для парных
   карт свойств (Симбиоз/Взаимодействие/Сотрудничество). Именно
   через эту щель такие карты и разыгрываются — прямо на одиночный
   вид их положить нельзя (см. drop-handlers.js dropAsProperty /
   dropAsPairProperty), поэтому и щели есть только МЕЖДУ видами, а
   не до первого/после последнего — там просто не с кем сыграть
   парную карту.
   ============================================================ */
import { cardEl } from './card-view.js';
import { markDropzone } from './dropzone-utils.js';
import { shouldAnimate } from './appear-tracker.js';
import { getFace } from '../data/deck.js';

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

/* Одна "плашка" парного свойства между двумя видами. pc — копия
   карты со стороны ЛЕВОГО вида (см. buildGap ниже — она и вызывает
   это ровно с той копией). Для Симбиоза (у копии есть pc.symbiont)
   рисуем ОДНУ стрелку в сторону симбионта: pc.symbiont===true —
   значит симбионт сам левый вид, стрелка налево, иначе направо.
   У остальных парных карт (Взаимодействие/Сотрудничество) эффект
   не привязан к стороне — стрелки в обе стороны сразу. */
function buildConnector(pc){
  const face = getFace(pc);
  const block = document.createElement('div');
  block.className = 'pair-connector';

  if (pc.symbiont !== undefined){
    const arrow = pc.symbiont ? '⬅️' : '➡️';
    block.innerHTML = `<span class="pc-arrow">${arrow}</span><span>${face.icon} ${face.name}</span>`;
  } else {
    block.innerHTML = `<span class="pc-arrow">⬅️</span><span>${face.icon} ${face.name}</span><span class="pc-arrow">➡️</span>`;
  }

  return block;
}

function buildGap(playerId, leftSp, rightSp){
  const gap = document.createElement('div');
  gap.className = 'pair-gap';
  markDropzone(gap, {
    zoneType: 'pair',
    zonePlayer: playerId,
    zoneLeftUid: leftSp.card.uid,
    zoneRightUid: rightSp.card.uid,
  });

  // Парная карта лежит копией в props ОБОИХ видов сразу (см.
  // drop-handlers.js/commitPairProperty) — рисовать обе копии не
  // нужно, достаточно одной; берём её из левого соседа.
  const pairCards = (leftSp.props || []).filter(pc => pc.pairWith === rightSp.card.uid);
  if (pairCards.length){
    gap.classList.add('has-pair');
    pairCards.forEach(pc => gap.appendChild(buildConnector(pc)));
  }

  return gap;
}

/* Собирает весь ряд: карточки видов вперемешку со щелями между
   ними. Вызывается из player-table-view.js/opponents-view.js
   вместо ручного цикла по createSpeciesCard(). */
export function buildSpeciesRow(table, playerId, owner){
  const frag = document.createDocumentFragment();
  table.forEach((sp, idx) => {
    frag.appendChild(createSpeciesCard(sp, idx, playerId, owner));
    if (idx < table.length - 1){
      frag.appendChild(buildGap(playerId, sp, table[idx + 1]));
    }
  });
  return frag;
}
