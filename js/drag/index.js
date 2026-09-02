/* ============================================================
   drag/index.js — перетаскивание карт указателем (мышь и палец).
   Нативный HTML5 drag-and-drop плохо работает на телефонах,
   поэтому тут всё сделано на Pointer Events вручную:
   зажали карту -> она "приклеивается" к пальцу -> отпустили
   над зоной с классом .dropzone -> вызывается колбэк.
   ============================================================ */
import { createGhost, moveGhost, removeGhost } from './ghost.js';
import { zoneUnder, highlightZone, clearZoneHighlight, zoneToPayload } from './dropzone.js';

let active = false;

export function isDragging(){ return active; }

export function makeDraggable(el, data, onDrop){
  el.setAttribute('data-draggable', 'true');
  el.addEventListener('pointerdown', (e) => startDrag(e, el, data, onDrop));
}

function startDrag(e, el, payload, onDropCb){
  if (e.button === 2) return; // правая кнопка мыши — игнор
  e.preventDefault();
  active = true;

  const rect = el.getBoundingClientRect();
  const ghost = createGhost(el, rect);
  el.style.opacity = '0.35';

  const offX = e.clientX - rect.left;
  const offY = e.clientY - rect.top;

  function move(ev){
    moveGhost(ghost, ev.clientX - offX, ev.clientY - offY);
    const zone = zoneUnder(ev.clientX, ev.clientY, ghost);
    highlightZone(zone);
  }

  function up(ev){
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    clearZoneHighlight();

    const zone = zoneUnder(ev.clientX, ev.clientY, ghost);

    // Сначала вызываем колбэк, ПОТОМ чистим ghost/opacity.
    if (zone && onDropCb) onDropCb(payload, zoneToPayload(zone));

    removeGhost(ghost);
    el.style.opacity = '';
    active = false;
  }

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}
