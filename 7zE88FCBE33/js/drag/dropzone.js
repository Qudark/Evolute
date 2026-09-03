/* ============================================================
   drag/dropzone.js — поиск .dropzone под точкой и подсветка.
   ============================================================ */
export function zoneUnder(x, y, ghost){
  if (ghost) ghost.style.display = 'none';
  const el = document.elementFromPoint(x, y);
  if (ghost) ghost.style.display = '';
  if (!el) return null;
  return el.closest('.dropzone');
}

export function highlightZone(zone){
  clearZoneHighlight();
  if (zone) zone.classList.add('dropzone-active');
}

export function clearZoneHighlight(){
  document.querySelectorAll('.dropzone-active').forEach(z => z.classList.remove('dropzone-active'));
}

export function zoneToPayload(zone){
  return {
    type: zone.dataset.zoneType,
    playerId: zone.dataset.zonePlayer,
    speciesIdx: zone.dataset.zoneSpecies,
  };
}
