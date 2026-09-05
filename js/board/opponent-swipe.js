/* ============================================================
   board/opponent-swipe.js — протяжка (мышью/пальцем) для
   горизонтального скролла ряда существ ОДНОГО соперника.

   Раньше здесь была другая, более хитрая идея: во время протяжки
   считался "оверскролл" за край ряда, и после порога это должно
   было переключать на другого соперника — сделать один жест сразу
   и скроллом ряда, и переключателем столов. На практике это
   ломалось: нативный тач-скролл браузера (нужен из-за touch-action,
   иначе скролл дёрганый) выполнялся ПАРАЛЛЕЛЬНО с нашим ручным
   overscroll-подсчётом и физически раскачивал родителя
   (.opponent-strip, у которого было overflow-y:auto) — из-за этого
   "фиксированные" стрелки/имя (лежавшие в том же скролле) уезжали,
   а сам порог переключения срабатывал неровно.

   Теперь развязка проще и надёжнее: этот жест ВСЕГДА только
   скроллит ряд — и ничего больше. Переключение между соперниками —
   отдельными кнопками ‹ › (см. controls.js, они не трогают
   .opponent-table и никогда не задействуют этот же жест, поэтому
   конфликтовать физически нечему).
   ============================================================ */
const DRAG_THRESHOLD = 6; // px, после которого жест считается протяжкой

export function enableOpponentTableScroll(el){
  let pointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let dragging = false;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startScrollLeft = el.scrollLeft;
    dragging = false;
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

    el.scrollLeft = startScrollLeft - dx;
    e.preventDefault();
  });

  function end(e){
    if (e.pointerId !== pointerId) return;
    if (dragging){
      try { el.releasePointerCapture(pointerId); } catch(_){}
    }
    el.classList.remove('dragging');
    dragging = false;
    pointerId = null;
  }

  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
