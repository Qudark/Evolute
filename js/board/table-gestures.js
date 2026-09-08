/* ============================================================
   board/table-gestures.js — один жест-обработчик на ряд своих
   существ (.player-table), совмещающий:
     1) свайп/протяжку мышью для горизонтальной прокрутки ряда,
        когда зажали НЕ на карточке вида (пустое место ряда), а
        видов больше, чем помещается по ширине;
     2) зажали и потянули КОНКРЕТНУЮ карточку вида — вид
        "отрывается" от ряда (тот же ghost, что и у остальных
        перетаскиваний) и следует за пальцем/курсором; отпустили —
        вид переставляется на новую позицию в ряду под точкой
        отпускания (см. reorderSpecies() в drop-handlers.js);
     3) зажали на карточке вида и отпустили ТАМ ЖЕ, не сдвинув её —
        значит, перетаскивать не собирались, это "тап" на существо:
        открывается попап "в сброс" прямо над ней (species-popup.js).
   Только для своих видов (owner === 'player') — с чужими нельзя
   делать вообще ничего из этого.
   Жесты 2 и 3 различаются по факту движения, а не по времени
   удержания: сдвинулись больше DRAG_THRESHOLD — это перетаскивание,
   не сдвинулись — тап. Жест 1 начинается так же (pointerdown), но
   срабатывает только если под пальцем НЕ было карточки вида.
   ============================================================ */
import { showSpeciesPopup, closeSpeciesPopup } from './species-popup.js';
import { createGhost, moveGhost, removeGhost } from '../drag/ghost.js';
import * as Drag from '../drag/index.js';
import { reorderSpecies } from './drop-handlers.js';

const DRAG_THRESHOLD = 6; // px, после которого жест точно считается протяжкой (скроллом или переносом вида)

export function enableTableGestures(container){
  if (!container || container.dataset.gesturesBound) return;
  container.dataset.gesturesBound = '1';

  let pointerId = null;
  let startX = 0, startY = 0, startScrollLeft = 0;
  let scrolling = false;      // протяжка пустого места ряда (старое поведение)
  let reordering = false;     // перетаскивание конкретного вида
  let pressedCard = null;     // карточка .species, на которой начался жест
  let ghost = null;
  let offX = 0, offY = 0;

  function resetState(){
    scrolling = false;
    reordering = false;
    pressedCard = null;
    pointerId = null;
    if (ghost){ removeGhost(ghost); ghost = null; }
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (Drag.isDragging()) return; // не мешаем другому уже идущему перетаскиванию (например, из руки)

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScrollLeft = container.scrollLeft;
    scrolling = false;
    reordering = false;

    const card = e.target.closest('.species');
    pressedCard = (card && card.classList.contains('player-species')) ? card : null;
  });

  container.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!scrolling && !reordering){
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

      if (pressedCard){
        // Зажали на своём виде и сдвинули достаточно — это перенос
        // вида, а не прокрутка ряда: дальше ряд не скроллится, вид
        // "отрывается" и следует за пальцем/курсором.
        reordering = true;
        closeSpeciesPopup();
        const rect = pressedCard.getBoundingClientRect();
        ghost = createGhost(pressedCard, rect);
        offX = e.clientX - rect.left;
        offY = e.clientY - rect.top;
        pressedCard.style.opacity = '0.35';
        Drag.setActive(true); // блокируем перерисовку стола опросом storage на время жеста
        try { container.setPointerCapture(pointerId); } catch(_){}
      } else if (Math.abs(dx) > Math.abs(dy)){
        // Зажали на пустом месте ряда и потянули горизонтально —
        // старое поведение: прокрутка ряда протяжкой.
        scrolling = true;
        try { container.setPointerCapture(pointerId); } catch(_){}
      }
    }

    if (reordering && ghost){
      moveGhost(ghost, e.clientX - offX, e.clientY - offY);
      highlightInsertTarget(container, e.clientX, e.clientY, pressedCard);
      e.preventDefault();
    } else if (scrolling){
      container.scrollLeft = startScrollLeft - dx;
      e.preventDefault();
    }
  });

  function endGesture(e){
    if (e.pointerId !== pointerId) return;

    if (reordering){
      try { container.releasePointerCapture(pointerId); } catch(_){}
      clearInsertHighlight(container);
      const insertIndex = resolveInsertIndex(container, e.clientX, e.clientY, pressedCard);
      const uid = pressedCard.dataset.speciesUid;
      const playerId = pressedCard.dataset.zonePlayer;
      pressedCard.style.opacity = '';
      if (insertIndex !== null){
        reorderSpecies(playerId, uid, insertIndex);
      }
      Drag.setActive(false);
    } else if (scrolling){
      try { container.releasePointerCapture(pointerId); } catch(_){}
    } else if (pressedCard){
      // Ни прокрутки, ни переноса не было — значит, зажали существо
      // и отпустили там же: открываем попап "в сброс" над ним.
      const uid = pressedCard.dataset.speciesUid;
      const playerId = pressedCard.dataset.zonePlayer;
      showSpeciesPopup(pressedCard, { playerId, speciesUid: uid });
    }

    resetState();
  }

  container.addEventListener('pointerup', endGesture);
  container.addEventListener('pointercancel', () => resetState());
}

/* Куда встанет перетаскиваемый вид, если отпустить в точке (x, y).
   Считается по СОСЕДЯМ БЕЗ самого перетаскиваемого вида — половина
   наведённой карточки слева/справа решает "перед ней" или "после".
   Возвращает индекс в этом урезанном списке (то есть уже готовый
   индекс для splice ПОСЛЕ того, как вид убран из массива — см.
   reorderSpecies()), либо null, если точка отпускания вне ряда
   вообще (тогда перенос отменяется, вид остаётся на месте). */
function resolveInsertIndex(container, x, y, draggedCard){
  const elAtPoint = document.elementFromPoint(x, y);
  if (!elAtPoint) return null;
  if (elAtPoint !== container && !container.contains(elAtPoint)) return null;

  const siblings = Array.from(container.querySelectorAll('.species'))
    .filter(el => el !== draggedCard);

  if (siblings.length === 0) return 0;

  const hovered = elAtPoint.closest('.species');
  if (hovered && hovered !== draggedCard && siblings.includes(hovered)){
    const rect = hovered.getBoundingClientRect();
    const idx = siblings.indexOf(hovered);
    return x < rect.left + rect.width / 2 ? idx : idx + 1;
  }

  // Отпустили не прямо над карточкой (например, в пустом хвосте
  // ряда) — определяем позицию по ближайшему соседу по X.
  for (let i = 0; i < siblings.length; i++){
    const rect = siblings[i].getBoundingClientRect();
    if (x < rect.left + rect.width / 2) return i;
  }
  return siblings.length;
}

function highlightInsertTarget(container, x, y, draggedCard){
  clearInsertHighlight(container);
  const elAtPoint = document.elementFromPoint(x, y);
  const hovered = elAtPoint && elAtPoint.closest('.species');
  if (hovered && hovered !== draggedCard && container.contains(hovered)){
    const rect = hovered.getBoundingClientRect();
    hovered.classList.add(x < rect.left + rect.width / 2 ? 'reorder-before' : 'reorder-after');
  }
}

function clearInsertHighlight(container){
  container.querySelectorAll('.reorder-before, .reorder-after').forEach(el => {
    el.classList.remove('reorder-before', 'reorder-after');
  });
}
