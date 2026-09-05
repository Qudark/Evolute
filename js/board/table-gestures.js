/* ============================================================
   board/table-gestures.js — один жест-обработчик на весь ряд
   существ (.opponent-table / .player-table), совмещающий:
     1) свайп/протяжку мышью для горизонтальной прокрутки ряда,
        когда видов больше, чем помещается по ширине (вместо
        видимого скроллбара — просто перетаскивание пальцем/мышью);
     2) долгое нажатие на конкретной карточке вида — открывает
        над ней попап "в сброс" (species-popup.js). Только для
        своих видов (owner === 'player') — сбрасывать чужие нельзя.
   Оба жеста начинаются одинаково (pointerdown), поэтому решают,
   что именно происходит, по тому, как ведёт себя палец дальше:
   заметно сдвинулся по горизонтали — это скролл, замер на месте
   дольше LONG_PRESS_MS — это долгое нажатие.
   ============================================================ */
import { showSpeciesPopup } from './species-popup.js';

const DRAG_THRESHOLD = 6;   // px, после которого жест точно считается протяжкой
const LONG_PRESS_MS = 450;

export function enableTableGestures(container){
  if (!container || container.dataset.gesturesBound) return;
  container.dataset.gesturesBound = '1';

  let pointerId = null;
  let startX = 0, startY = 0, startScrollLeft = 0;
  let dragging = false;
  let longPressTimer = null;
  let pressedCard = null;

  function clearLongPress(){
    if (longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
  }

  container.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startScrollLeft = container.scrollLeft;
    dragging = false;
    pressedCard = e.target.closest('.species');

    clearLongPress();
    if (pressedCard && pressedCard.classList.contains('player-species')){
      const uid = pressedCard.dataset.speciesUid;
      const playerId = pressedCard.dataset.zonePlayer;
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        // За время удержания стол мог перерисоваться (ход другого
        // игрока и т.п.) — тогда исходный узел уже отсоединён от
        // документа, и getBoundingClientRect() у него вернёт нули
        // (попап улетал бы в левый верхний угол). Поэтому берём
        // ЖИВОЙ узел с тем же uid вида на момент показа, а не тот,
        // что был зажат в начале жеста.
        let liveCard = pressedCard.isConnected ? pressedCard : null;
        if (!liveCard){
          liveCard = container.querySelector('.species[data-species-uid="' + CSS.escape(uid) + '"]');
        }
        if (liveCard){
          showSpeciesPopup(liveCard, { playerId, speciesUid: uid });
        }
        pressedCard = null; // попап уже показан — отпускание не должно ничего доделывать
      }, LONG_PRESS_MS);
    }
  });

  container.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!dragging && Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)){
      dragging = true;
      clearLongPress();
      container.classList.add('dragging');
      try { container.setPointerCapture(pointerId); } catch(_){}
    }

    if (dragging){
      container.scrollLeft = startScrollLeft - dx;
      e.preventDefault();
    } else if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD){
      clearLongPress(); // палец поехал не для скролла и недостаточно горизонтально — не считаем зажатием
    }
  });

  function endGesture(e){
    if (e.pointerId !== pointerId) return;
    clearLongPress();
    if (dragging){
      try { container.releasePointerCapture(pointerId); } catch(_){}
    }
    container.classList.remove('dragging');
    dragging = false;
    pointerId = null;
    pressedCard = null;
  }

  container.addEventListener('pointerup', endGesture);
  container.addEventListener('pointercancel', endGesture);
}
