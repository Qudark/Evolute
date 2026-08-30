/* ============================================================
   Evo.Drag — перетаскивание карт указателем (мышь и палец).
   Нативный HTML5 drag-and-drop плохо работает на телефонах,
   поэтому тут всё сделано на Pointer Events вручную:
   зажали карту -> она "приклеивается" к пальцу -> отпустили
   над зоной с классом .dropzone -> вызывается колбэк.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.Drag = (function(){
  let ghost = null;
  let originEl = null;
  let payload = null;
  let onDropCb = null;
  let active = false;

  function isDragging(){ return active; }

  function makeDraggable(el, data, onDrop){
    el.setAttribute('data-draggable', 'true');
    el.addEventListener('pointerdown', (e)=> startDrag(e, el, data, onDrop));
  }

  function startDrag(e, el, data, onDrop){
    if (e.button === 2) return; // правая кнопка мыши — игнор
    e.preventDefault();
    active = true;
    originEl = el;
    payload = data;
    onDropCb = onDrop;

    const rect = el.getBoundingClientRect();
    ghost = el.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.zIndex = 9999;
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.pointerEvents = 'none';
    ghost.style.transform = 'scale(1.08) rotate(-3deg)';
    ghost.style.transition = 'none';
    ghost.style.boxShadow = '0 18px 34px rgba(0,0,0,.45)';
    ghost.classList.add('drag-ghost');
    document.body.appendChild(ghost);

    el.style.opacity = '0.35';

    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;

    function move(ev){
      ghost.style.left = (ev.clientX - offX) + 'px';
      ghost.style.top = (ev.clientY - offY) + 'px';
      clearZoneHighlight();
      const zone = zoneUnder(ev.clientX, ev.clientY);
      if (zone) zone.classList.add('dropzone-active');
    }

    function up(ev){
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      clearZoneHighlight();

      const zone = zoneUnder(ev.clientX, ev.clientY);
      cleanup();

      if (zone && onDropCb){
        onDropCb(payload, {
          type: zone.dataset.zoneType,
          playerId: zone.dataset.zonePlayer,
          speciesIdx: zone.dataset.zoneSpecies,
        });
      }
      active = false;
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function zoneUnder(x, y){
    if (ghost) ghost.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (ghost) ghost.style.display = '';
    if (!el) return null;
    return el.closest('.dropzone');
  }

  function clearZoneHighlight(){
    document.querySelectorAll('.dropzone-active').forEach(z => z.classList.remove('dropzone-active'));
  }

  function cleanup(){
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    if (originEl) originEl.style.opacity = '';
    originEl = null;
    payload = null;
    onDropCb = null;
  }

  return { makeDraggable, isDragging };
})();
