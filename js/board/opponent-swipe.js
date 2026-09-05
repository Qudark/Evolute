/* ============================================================
   board/opponent-swipe.js — свайп по ряду существ ОДНОГО
   соперника, увязанный с переключением МЕЖДУ соперниками:
     - пока в ряду есть куда скроллить в сторону, куда тянет
       палец, — просто скроллим ряд (листаем его существ);
     - как только упёрлись в край ряда, СЛЕДУЮЩАЯ порция того же
       по направлению движения (после порога) переключает на
       соседнего соперника — как в галереях, где сначала долистываешь
       фото до края, и только потом свайп переключает альбом.
   Раньше это было ДВА независимых обработчика на разных уровнях
   (свайп между соперниками — на #opponentStrip, скролл ряда — на
   .opponent-table), которые конфликтовали за один и тот же жест.
   Теперь это один жест на .opponent-table, вызывающий колбэк
   onEdgeSwipe(dir) только когда реально уперлись в край.
   ============================================================ */
const DRAG_THRESHOLD = 6;     // px, после которого жест точно считается протяжкой
const OVERSCROLL_THRESHOLD = 46; // px "перетяжки" за край ряда, чтобы это засчиталось как переключение

export function enableOpponentEdgeSwipe(el, onEdgeSwipe){
  let pointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let dragging = false;
  let overscroll = 0;
  let fired = false;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startScrollLeft = el.scrollLeft;
    dragging = false;
    overscroll = 0;
    fired = false;
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;

    if (!dragging && Math.abs(dx) > DRAG_THRESHOLD){
      dragging = true;
      el.classList.add('dragging');
      try { el.setPointerCapture(pointerId); } catch(_){}
    }
    if (!dragging) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    let target = startScrollLeft - dx;

    if (target < 0){
      overscroll = -target;
      target = 0;
    } else if (target > maxScroll){
      overscroll = target - maxScroll;
      target = maxScroll;
    } else {
      overscroll = 0;
    }
    el.scrollLeft = target;
    e.preventDefault();

    if (!fired && overscroll > OVERSCROLL_THRESHOLD){
      fired = true;
      // Тянем влево (dx < 0, "хотим следующее") — переключаем вперёд.
      onEdgeSwipe(dx < 0 ? 1 : -1);
    }
  });

  function end(e){
    if (e.pointerId !== pointerId) return;
    if (dragging){
      try { el.releasePointerCapture(pointerId); } catch(_){}
    }
    el.classList.remove('dragging');
    dragging = false;
    pointerId = null;
    overscroll = 0;
  }

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
