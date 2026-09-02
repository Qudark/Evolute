/* ============================================================
   board/player-table-view.js — собственный ряд видов игрока,
   плюс подсказка, когда стол ещё пуст.
   ============================================================ */
import { createSpeciesCard } from './species-view.js';
import { markDropzone } from './dropzone-utils.js';

export function renderPlayerTable(me){
  const container = document.getElementById('playerTable');
  container.innerHTML = '';
  markDropzone(container, { zoneType: 'newspecies', zonePlayer: me.id });

  const table = me.table || [];
  table.forEach((sp, idx) => {
    container.appendChild(createSpeciesCard(sp, idx, me.id, 'player'));
  });

  if (table.length === 0){
    const hint = document.createElement('div');
    hint.className = 'table-hint';
    hint.textContent = 'Перетащите карту сюда, чтобы создать новый вид';
    container.appendChild(hint);
  }
}
