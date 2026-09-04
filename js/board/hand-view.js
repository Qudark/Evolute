/* ============================================================
   board/hand-view.js — рука игрока в виде "гармошки" внизу
   экрана (как в «Дурак Онлайн»): карты веером, каждая
   перекрывает соседнюю, видна только верхне-левая часть.

   Жест:
     1. Зажали карту — она поднимается, становится видимым имя.
     2. Не отпуская палец/кнопку, двигаем влево-вправо — меняем
        выбранную карту (та, что ближе всего к пальцу).
     3. Тянем вверх сильнее порога — карта "отрывается" и дальше
        обычным образом перетаскивается на стол/сброс.
     4. Отпустили без рывка вверх — карта просто возвращается на
        место, ничего не происходит (отмена выбора).

   Отступ между картами пересчитывается от их количества, чтобы
   рука не "уезжала" за экран: чем карт больше, тем теснее веер.
   ============================================================ */
import { getType, getFace } from '../data/deck.js';
import { createGhost, moveGhost, removeGhost } from '../drag/ghost.js';
import { zoneUnder, highlightZone, clearZoneHighlight, zoneToPayload } from '../drag/dropzone.js';
import * as Drag from '../drag/index.js';
import { markDropzone } from './dropzone-utils.js';
import { shouldAnimate } from './appear-tracker.js';

const PLAY_THRESHOLD_Y = -55; // сколько нужно потянуть вверх, чтобы начался перенос карты
const MIN_STEP_RATIO = 0.30;  // минимальный шаг между картами (доля ширины карты) — теснее некуда
const MAX_STEP_RATIO = 0.94;  // максимальный шаг — почти не перекрываются, когда карт мало
const REST_HIDE_RATIO = 0.5;  // в покое карта наполовину спрятана за нижней границей зоны руки

// Запас сверху под всплывающее имя карты — та же величина, что
// зона руки резервирует в CSS (--hand-reserve, 13-hand.css).
// Читаем из CSS, а не дублируем число, чтобы вёрстка и разметка
// карт всегда были синхронизированы.
function getReservePx(){
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hand-reserve'));
  return Number.isFinite(v) ? v : 34;
}

function buildCardEl(card){
  const type = getType(card.typeId);
  const face = getFace(card);
  const el = document.createElement('div');
  el.className = 'hand-card';
  el.dataset.uid = card.uid;
  el.dataset.typeId = card.typeId;

  const face2 = type.faces[1];
  el.innerHTML = `
    <div class="hc-name">${face.name}</div>
    <div class="hc-icon-corner">${face.icon}</div>
    ${face2 ? `<div class="hc-face2">${face2.icon} ${face2.name}</div>` : ''}
    <div class="hc-icon-main">${face.icon}</div>
  `;
  return el;
}

// restY/liftedY — вертикальное положение карты в покое (наполовину
// утоплена под низ зоны) и при выборе (поднята целиком, в зону
// запаса под имя). Считаются один раз в renderHand() от реального
// размера карты и передаются сюда, а не пересчитываются на каждый
// вызов.
function positionCard(card, x, y, lifted){
  card.dataset.baseX = x;
  card.style.transform = 'translate(' + x + 'px, ' + y + 'px)' + (lifted ? ' scale(1.06)' : '');
}

function setSelected(cards, selIdx, restY, liftedY){
  cards.forEach((c, i) => {
    const isSel = i === selIdx;
    c.classList.toggle('selected', isSel);
    c.style.zIndex = isSel ? 999 : i;
    positionCard(c, Number(c.dataset.baseX), isSel ? liftedY : restY, isSel);
  });
}

function deselectAll(cards, restY){
  cards.forEach((c, i) => {
    c.classList.remove('selected');
    c.style.zIndex = i;
    positionCard(c, Number(c.dataset.baseX), restY, false);
  });
}

function attachGesture(card, idx, allCards, handleDropCb, restY, liftedY){
  card.addEventListener('pointerdown', (e) => {
    if (e.button === 2) return;
    e.preventDefault();

    const pointerId = e.pointerId;
    try { card.setPointerCapture(pointerId); } catch(err){ /* не критично */ }

    let selIdx = idx;
    let mode = 'select'; // 'select' | 'drag'
    let ghost = null;
    let offX = 0, offY = 0;
    const startX = e.clientX, startY = e.clientY;
    const rects = allCards.map(c => c.getBoundingClientRect());

    Drag.setActive(true); // блокируем перерисовку стола на время всего жеста
    setSelected(allCards, selIdx, restY, liftedY);

    function nearestIndex(clientX){
      let best = 0, bestDist = Infinity;
      rects.forEach((r, i) => {
        const cx = (r.left + r.right) / 2;
        const d = Math.abs(cx - clientX);
        if (d < bestDist){ bestDist = d; best = i; }
      });
      return best;
    }

    function move(ev){
      if (ev.pointerId !== pointerId) return; // не мешаем другим пальцам/жестам
      const dy = ev.clientY - startY;

      if (mode === 'select'){
        if (dy < PLAY_THRESHOLD_Y){
          mode = 'drag';
          const liftedCard = allCards[selIdx];
          const rect = liftedCard.getBoundingClientRect();
          ghost = createGhost(liftedCard, rect);
          offX = ev.clientX - rect.left;
          offY = ev.clientY - rect.top;
          liftedCard.style.visibility = 'hidden';
        } else {
          const ni = nearestIndex(ev.clientX);
          if (ni !== selIdx){
            selIdx = ni;
            setSelected(allCards, selIdx, restY, liftedY);
          }
        }
      }

      if (mode === 'drag' && ghost){
        moveGhost(ghost, ev.clientX - offX, ev.clientY - offY);
        highlightZone(zoneUnder(ev.clientX, ev.clientY, ghost));
      }
    }

    function up(ev){
      if (ev.pointerId !== pointerId) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      try { card.releasePointerCapture(pointerId); } catch(err){ /* не критично */ }
      clearZoneHighlight();

      if (mode === 'drag'){
        const zone = zoneUnder(ev.clientX, ev.clientY, ghost);
        const liftedCard = allCards[selIdx];
        const payload = { kind: 'hand', uid: liftedCard.dataset.uid, typeId: liftedCard.dataset.typeId };
        if (zone && handleDropCb) handleDropCb(payload, zoneToPayload(zone));
        removeGhost(ghost);
        liftedCard.style.visibility = '';
      }

      deselectAll(allCards, restY);
      Drag.setActive(false);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}

export function renderHand(hand, handleDropCb){
  const strip = document.getElementById('handRow');
  markDropzone(strip, { zoneType: 'hand' });
  strip.innerHTML = '';

  if (hand.length === 0){
    const empty = document.createElement('div');
    empty.className = 'hand-empty';
    empty.textContent = 'Пусто';
    strip.appendChild(empty);
    return;
  }

  const cards = hand.map(buildCardEl);
  cards.forEach(c => strip.appendChild(c));

  const containerWidth = strip.clientWidth;
  const cardW = cards[0].offsetWidth;
  const cardH = cards[0].offsetHeight;
  const minStep = cardW * MIN_STEP_RATIO;
  const maxStep = cardW * MAX_STEP_RATIO;
  const step = cards.length > 1
    ? Math.min(maxStep, Math.max(minStep, (containerWidth - cardW) / (cards.length - 1)))
    : 0;
  const totalWidth = cardW + step * (cards.length - 1);
  const startX = Math.max(0, (containerWidth - totalWidth) / 2);

  // В покое карта сдвинута вниз настолько, что её нижняя половина
  // уходит за overflow:hidden зоны руки (см. 13-hand.css) — как
  // будто спрятана за нижней границей зоны. При выборе (liftedY)
  // карта поднимается до самого верха зоны и становится видна целиком.
  const reservePx = getReservePx();
  const liftedY = reservePx;
  const restY = reservePx + cardH * REST_HIDE_RATIO;

  cards.forEach((card, i) => {
    const x = startX + i * step;
    positionCard(card, x, restY, false);
    card.style.zIndex = i;

    // Анимация появления — только для карт, которых мы ещё не видели
    // (иначе она бы проигрывалась заново при каждом обновлении руки).
    if (shouldAnimate(card.dataset.uid)){
      card.classList.add('enter');
      card.style.setProperty('--enter-delay', (i * 0.04) + 's');
    }

    attachGesture(card, i, cards, handleDropCb, restY, liftedY);
  });
}
