/* ============================================================
   board/table-gestures.js — один жест-обработчик на ряд своих
   существ (.player-table), совмещающий:
     1) свайп/протяжку для горизонтальной прокрутки ряда — работает
        всегда, даже если начали жест прямо на карточке вида, ПОКА
        не выждали долгое нажатие (см. п.2). Это специально: чтобы
        можно было быстро пролистать много существ свайпом, не
        рискуя случайно "поднять" одно из них.
     2) зажали и подержали НА КАРТОЧКЕ ВИДА достаточно долго, не
        сдвинув палец/курсор, — вид "всплывает" (ghost, как у карт
        из руки) и с этого момента ходит за пальцем; отпустили в
        новом месте — переставляется туда (см. reorderSpecies() в
        drop-handlers.js). Если вид скреплён с соседом парной картой
        свойства (Симбиоз/Взаимодействие/Сотрудничество — см.
        data/cards.js, face.pair) — снять её нельзя, поэтому
        двигаем ВЕСЬ скреплённый блок сразу, одним куском.
     3) подняли вид (п.2) и отпустили ТАМ ЖЕ, не сдвинув, — открывается
        попап "в сброс" (species-popup.js) над ИМЕННО тем видом, на
        котором начали жест (даже если он в скреплённом блоке).
   Только для своих видов (owner === 'player') — с чужими нельзя
   делать вообще ничего из этого.
   ============================================================ */
import { showSpeciesPopup, closeSpeciesPopup } from './species-popup.js';
import * as Drag from '../drag/index.js';
import { getRoom } from './state.js';
import { reorderSpecies } from './drop-handlers.js';

const LIFT_DELAY_MS = 380;  // сколько нужно продержать палец неподвижно, чтобы вид "всплыл"
const MOVE_THRESHOLD = 8;   // px — за этим порогом жест уже не считается "неподвижным"

export function enableTableGestures(container){
  if (!container || container.dataset.gesturesBound) return;
  container.dataset.gesturesBound = '1';

  let pointerId = null;
  let startX = 0, startY = 0, startScrollLeft = 0;
  let scrolling = false;    // протяжка ряда (старое поведение — скролл)
  let lifted = false;       // вид(ы) "всплыли" и следуют за пальцем
  let pressedCard = null;   // карточка .species, на которой начался жест
  let liftTimer = null;
  let block = null;         // { uids, ghost } — см. liftBlock()

  function clearLiftTimer(){
    if (liftTimer){ clearTimeout(liftTimer); liftTimer = null; }
  }

  function resetState(){
    clearLiftTimer();
    scrolling = false;
    lifted = false;
    pressedCard = null;
    pointerId = null;
    block = null;
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (Drag.isDragging()) return; // не мешаем другому уже идущему перетаскиванию (например, из руки)

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScrollLeft = container.scrollLeft;
    scrolling = false;
    lifted = false;
    block = null;

    const card = e.target.closest('.species');
    pressedCard = (card && card.classList.contains('player-species')) ? card : null;

    if (pressedCard){
      liftTimer = setTimeout(() => {
        liftTimer = null;
        liftBlock();
      }, LIFT_DELAY_MS);
    }
  });

  function liftBlock(){
    const uid = pressedCard.dataset.speciesUid;
    const playerId = pressedCard.dataset.zonePlayer;
    const room = getRoom();
    const owner = room && room.players.find(p => p.id === playerId);
    const table = (owner && owner.table) || [];
    const idx = table.findIndex(sp => sp.card.uid === uid);
    if (idx < 0) return;

    const [lo, hi] = getBondedRange(table, idx);
    const uids = table.slice(lo, hi + 1).map(sp => sp.card.uid);
    const elements = getBlockElements(container, uids);
    if (elements.length === 0) return;

    closeSpeciesPopup();
    lifted = true;
    Drag.setActive(true); // блокируем перерисовку стола опросом storage на время жеста
    try { container.setPointerCapture(pointerId); } catch(_){}

    const ghost = createBlockGhost(elements);
    elements.forEach(el => { if (el.classList && el.classList.contains('species')) el.style.opacity = '0.35'; });

    block = {
      uids,
      playerId,
      ghost,
      offX: startX - ghost.left,
      offY: startY - ghost.top,
    };
  }

  container.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (lifted && block){
      moveBlockGhost(block.ghost, e.clientX - block.offX, e.clientY - block.offY);
      highlightInsertTarget(container, e.clientX, e.clientY, block.uids);
      e.preventDefault();
      return;
    }

    if (scrolling){
      container.scrollLeft = startScrollLeft - dx;
      e.preventDefault();
      return;
    }

    // Ещё ждём (таймер подъёма не сработал) — сдвинулись достаточно,
    // чтобы это точно было НЕ "неподвижное" долгое нажатие: отменяем
    // подъём и, если движение горизонтальное, скроллим ряд как
    // обычно (в том числе если жест начался прямо на карточке —
    // это и есть "свайп, чтобы посмотреть все существа").
    if (Math.abs(dx) >= MOVE_THRESHOLD || Math.abs(dy) >= MOVE_THRESHOLD){
      clearLiftTimer();
      if (Math.abs(dx) > Math.abs(dy)){
        scrolling = true;
        try { container.setPointerCapture(pointerId); } catch(_){}
        container.scrollLeft = startScrollLeft - dx;
        e.preventDefault();
      }
    }
  });

  function endGesture(e){
    if (e.pointerId !== pointerId) return;
    clearLiftTimer();

    if (lifted && block){
      clearInsertHighlight(container);
      try { container.releasePointerCapture(pointerId); } catch(_){}
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const stayedInPlace = Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD;

      if (stayedInPlace){
        // Подняли и отпустили там же, не сдвинув, — попап "в сброс"
        // именно для того вида, на котором начали жест.
        const uid = pressedCard.dataset.speciesUid;
        const playerId = pressedCard.dataset.zonePlayer;
        restoreBlockOpacity(block);
        removeBlockGhost(block.ghost);
        showSpeciesPopup(pressedCard, { playerId, speciesUid: uid });
      } else {
        const insertIndex = resolveInsertIndex(container, e.clientX, e.clientY, block.uids);
        restoreBlockOpacity(block);
        removeBlockGhost(block.ghost);
        if (insertIndex !== null){
          reorderSpecies(block.playerId, block.uids, insertIndex);
        }
      }
      Drag.setActive(false);
    } else if (scrolling){
      try { container.releasePointerCapture(pointerId); } catch(_){}
    }
    // Иначе — обычный быстрый тап/отпускание до срабатывания таймера
    // подъёма: ничего не происходит (см. заголовок файла, п.1).

    resetState();
  }

  container.addEventListener('pointerup', endGesture);
  container.addEventListener('pointercancel', (e) => {
    if (e.pointerId !== pointerId) return;
    if (lifted && block){
      clearInsertHighlight(container);
      try { container.releasePointerCapture(pointerId); } catch(_){}
      restoreBlockOpacity(block);
      removeBlockGhost(block.ghost);
      Drag.setActive(false);
    }
    resetState();
  });
}

function restoreBlockOpacity(block){
  block.ghost.elements.forEach(el => {
    if (el.classList && el.classList.contains('species')) el.style.opacity = '';
  });
}

/* Соседние виды считаются скреплёнными, если у одного из них среди
   props есть парная карта свойства с pairWith на uid другого (см.
   drop-handlers.js/commitPairProperty) — такую карту снять нельзя,
   значит эти двое навсегда остаются рядом. getBondedRange находит
   границы целого скреплённого блока вокруг индекса idx, раздвигая
   их влево/вправо, пока соседи связаны. Ряд species-view.js всегда
   держит скреплённых соседей физически рядом (перетаскивание — тоже
   только целым блоком, см. ниже), поэтому блок гарантированно
   непрерывен и такого простого расширения диапазона достаточно —
   полный обход графа не нужен. */
function isBonded(spA, spB){
  return (spA.props || []).some(pc => pc.pairWith === spB.card.uid);
}

function getBondedRange(table, idx){
  let lo = idx, hi = idx;
  while (lo > 0 && isBonded(table[lo - 1], table[lo])) lo--;
  while (hi < table.length - 1 && isBonded(table[hi], table[hi + 1])) hi++;
  return [lo, hi];
}

/* DOM-элементы одного скреплённого блока — от первой до последней
   карточки вида из uids включительно, ПЛЮС всё, что лежит между
   ними (щели-коннекторы, см. species-view.js) — они отрисованы как
   раз в этом же порядке, так что достаточно вырезать непрерывный
   кусок children контейнера. */
function getBlockElements(container, uids){
  const children = Array.from(container.children);
  const idxs = [];
  children.forEach((el, i) => {
    if (el.classList.contains('species') && uids.includes(el.dataset.speciesUid)) idxs.push(i);
  });
  if (idxs.length === 0) return [];
  return children.slice(idxs[0], idxs[idxs.length - 1] + 1);
}

/* "Призрак" для перетаскивания сразу НЕСКОЛЬКИХ элементов ряда одним
   куском (обычный createGhost() из drag/ghost.js клонирует только
   один элемент) — клонирует всю переданную DOM-полосу и держит её
   вместе в общем flex-контейнере с тем же промежутком, что и у
   настоящего ряда (08-player-area.css/.player-table), чтобы клон
   выглядел как вырезанный кусок стола, а не как отдельные карточки.
   Класс .drag-ghost (10-cards.css) даёт стандартный вид перетаскивания
   (масштаб/поворот/тень) — тот же, что и у карт из руки. */
function createBlockGhost(elements){
  const rects = elements.map(el => el.getBoundingClientRect());
  const left = Math.min(...rects.map(r => r.left));
  const top = Math.min(...rects.map(r => r.top));
  const right = Math.max(...rects.map(r => r.right));
  const bottom = Math.max(...rects.map(r => r.bottom));

  const root = document.createElement('div');
  root.className = 'drag-ghost drag-ghost-block';
  root.style.position = 'fixed';
  root.style.zIndex = 9999;
  root.style.left = left + 'px';
  root.style.top = top + 'px';
  root.style.width = (right - left) + 'px';
  root.style.height = (bottom - top) + 'px';
  root.style.pointerEvents = 'none';
  root.style.display = 'flex';
  root.style.alignItems = 'flex-end';
  root.style.gap = '16px';

  elements.forEach(el => {
    const clone = el.cloneNode(true);
    clone.style.margin = '0';
    root.appendChild(clone);
  });

  document.body.appendChild(root);
  return { root, left, top, elements };
}

function moveBlockGhost(ghost, x, y){
  ghost.root.style.left = x + 'px';
  ghost.root.style.top = y + 'px';
}

function removeBlockGhost(ghost){
  if (ghost && ghost.root.parentNode) ghost.root.parentNode.removeChild(ghost.root);
}

/* Куда встанет перетаскиваемый блок, если отпустить в точке (x, y).
   Считается по СОСЕДЯМ БЕЗ самого блока (excludeUids) — половина
   наведённой карточки слева/справа решает "перед ней" или "после".
   Возвращает индекс уже готовый для reorderSpecies() (см. её
   комментарий — он считается ПОСЛЕ мысленного изъятия блока из
   ряда), либо null, если точка отпускания вообще вне ряда (тогда
   перенос отменяется, блок остаётся на месте). */
function resolveInsertIndex(container, x, y, excludeUids){
  const elAtPoint = document.elementFromPoint(x, y);
  if (!elAtPoint) return null;
  if (elAtPoint !== container && !container.contains(elAtPoint)) return null;

  const siblings = Array.from(container.querySelectorAll('.species'))
    .filter(el => !excludeUids.includes(el.dataset.speciesUid));

  if (siblings.length === 0) return 0;

  const hovered = elAtPoint.closest('.species');
  if (hovered && siblings.includes(hovered)){
    const rect = hovered.getBoundingClientRect();
    const idx = siblings.indexOf(hovered);
    return x < rect.left + rect.width / 2 ? idx : idx + 1;
  }

  for (let i = 0; i < siblings.length; i++){
    const rect = siblings[i].getBoundingClientRect();
    if (x < rect.left + rect.width / 2) return i;
  }
  return siblings.length;
}

function highlightInsertTarget(container, x, y, excludeUids){
  clearInsertHighlight(container);
  const elAtPoint = document.elementFromPoint(x, y);
  const hovered = elAtPoint && elAtPoint.closest('.species');
  if (hovered && !excludeUids.includes(hovered.dataset.speciesUid) && container.contains(hovered)){
    const rect = hovered.getBoundingClientRect();
    hovered.classList.add(x < rect.left + rect.width / 2 ? 'reorder-before' : 'reorder-after');
  }
}

function clearInsertHighlight(container){
  container.querySelectorAll('.reorder-before, .reorder-after').forEach(el => {
    el.classList.remove('reorder-before', 'reorder-after');
  });
}
