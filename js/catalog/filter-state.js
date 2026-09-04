/* ============================================================
   catalog/filter-state.js — какая категория сейчас выбрана в
   чипбаре (null = "Все свойства"). Общее состояние для
   chipbar.js, grid.js и mosaic.js.
   ============================================================ */
let activeFilter = null;

export function getFilter(){ return activeFilter; }

export function setFilter(next){ activeFilter = next; }
