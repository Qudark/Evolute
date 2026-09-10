/* ============================================================
   drag/dropzone.js — поиск .dropzone под точкой и подсветка.
   ============================================================ */
const PAIR_EDGE_TOLERANCE = 22; // px — см. комментарий в zoneUnder ниже

export function zoneUnder(x, y, ghost){
  if (ghost) ghost.style.display = 'none';
  const el = document.elementFromPoint(x, y);
  if (ghost) ghost.style.display = '';
  if (!el) return null;

  const direct = el.closest('.dropzone');

  // Щель между двумя видами (.pair-gap, zoneType 'pair') физически
  // узкая — палец на тачскрине не настолько точен, чтобы всегда в
  // неё попадать миллиметр в миллиметр, а промахнуться в упор рядом
  // стоящую карточку вида (.species, zoneType 'attach') очень легко.
  // Поэтому если попали НЕ в саму щель, а в самый край соседней с
  // ней карточки вида, всё равно засчитываем щель, если она там
  // действительно есть (species-view.js гарантирует, что щели стоят
  // строго между видами по одной, так что достаточно посмотреть на
  // ближайшего DOM-соседа .species-элемента).
  const species = (direct && direct.classList.contains('species'))
    ? direct
    : el.closest('.species');

  if (species){
    const rect = species.getBoundingClientRect();
    if (x - rect.left <= PAIR_EDGE_TOLERANCE){
      const prev = species.previousElementSibling;
      if (prev && prev.classList.contains('pair-gap')) return prev;
    }
    if (rect.right - x <= PAIR_EDGE_TOLERANCE){
      const next = species.nextElementSibling;
      if (next && next.classList.contains('pair-gap')) return next;
    }
  }

  return direct;
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
    leftUid: zone.dataset.zoneLeftUid,
    rightUid: zone.dataset.zoneRightUid,
  };
}
