/* ============================================================
   catalog/mosaic.js — мозаика всей колоды (по одной плитке на
   каждую физическую карту). Клик по плитке сбрасывает фильтр и
   прокручивает к соответствующей карточке свойства.
   ============================================================ */
import { CATEGORY_META } from '../data/cards.js';
import { getType, buildDeck } from '../data/deck.js';
import { setFilter } from './filter-state.js';
import { renderChipbar } from './chipbar.js';
import { renderGrid } from './grid.js';

export function renderMosaic(){
  const mosaic = document.getElementById('mosaic');
  mosaic.innerHTML = '';
  buildDeck().forEach(card => {
    const type = getType(card.typeId);
    const face = type.faces[0];
    const meta = CATEGORY_META[face.cat];
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.background = meta.color;
    tile.title = type.faces.map(f => f.name).join(' / ');
    tile.addEventListener('click', () => {
      setFilter(null);
      renderChipbar();
      renderGrid();
      const target = document.querySelector('.propcard[data-type="' + type.id + '"]');
      if (target){
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.animate(
          [{ outline: '2px solid var(--c-growth)' }, { outline: '2px solid transparent' }],
          { duration: 900 }
        );
      }
    });
    mosaic.appendChild(tile);
  });
}
