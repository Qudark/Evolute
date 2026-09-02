/* ============================================================
   drag/ghost.js — визуальный "призрак" перетаскиваемой карты:
   клон исходного элемента, приклеенный к указателю.
   ============================================================ */
export function createGhost(el, rect){
  const ghost = el.cloneNode(true);
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
  return ghost;
}

export function moveGhost(ghost, x, y){
  ghost.style.left = x + 'px';
  ghost.style.top = y + 'px';
}

export function removeGhost(ghost){
  if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
}
