/* ============================================================
   catalog/chipbar.js — фильтр-чипы по категориям свойств.
   ============================================================ */
import { CATEGORY_META } from '../data/cards.js';
import { getFilter, setFilter } from './filter-state.js';
import { renderGrid } from './grid.js';

export function renderChipbar(){
  const bar = document.getElementById('chipbar');
  bar.innerHTML = '';

  const activeFilter = getFilter();

  const allChip = document.createElement('div');
  allChip.className = 'chip' + (activeFilter === null ? ' active' : '');
  allChip.textContent = 'Все свойства';
  allChip.addEventListener('click', () => { setFilter(null); renderChipbar(); renderGrid(); });
  bar.appendChild(allChip);

  Object.entries(CATEGORY_META).forEach(([keyId, meta]) => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (activeFilter === keyId ? ' active' : '');
    chip.innerHTML = `<span class="dot" style="background:${meta.color}"></span>${meta.label}`;
    chip.addEventListener('click', () => { setFilter(keyId); renderChipbar(); renderGrid(); });
    bar.appendChild(chip);
  });
}
