/* ============================================================
   board/player-table-view.js — собственный ряд видов игрока,
   плюс подсказка, когда стол ещё пуст.
   ============================================================ */
import { createSpeciesCard } from './species-view.js';
import { markDropzone } from './dropzone-utils.js';
import { fitCardsToZone } from './fit-cards.js';
import { enableTableGestures } from './table-gestures.js';

export function renderPlayerTable(me){
  const container = document.getElementById('playerTable');
  container.innerHTML = '';
  markDropzone(container, { zoneType: 'newspecies', zonePlayer: me.id });
  enableTableGestures(container);

  const table = me.table || [];
  table.forEach((sp, idx) => {
    container.appendChild(createSpeciesCard(sp, idx, me.id, 'player'));
  });

  if (table.length === 0){
    const hint = document.createElement('div');
    hint.className = 'table-hint';
    hint.textContent = 'Перетащите карту сюда, чтобы создать новый вид';
    container.appendChild(hint);
    return;
  }

  // Паддинг .player-table (10px сверху + 6px снизу, см. 08-player-area.css) —
  // то, что clientHeight включает, но что не относится к самой карточке.
  // resetMinHeight=true: min-height у .player-table сам посчитан от
  // --card-h (calc(var(--card-h)+16px)) — без сброса мы бы мерили
  // старое (возможно завышенное) значение вместо честной доли места.
  fitCardsToZone(container, 16, true);
}
