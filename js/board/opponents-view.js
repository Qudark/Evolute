/* ============================================================
   board/opponents-view.js — полоса соперников: на широких
   экранах все рядом, на мобильных — карусель по одному сопернику
   (стрелки/свайп). currentOppIdx хранится здесь же, так как
   это чисто локальное состояние отображения, не часть комнаты.
   ============================================================ */
import { createSpeciesCard } from './species-view.js';
import { markDropzone } from './dropzone-utils.js';

const SWIPE_THRESHOLD = 40;

let currentOppIdx = 0;

export function renderOpponents(opponents){
  const carousel = document.getElementById('opponentCarousel');
  carousel.innerHTML = '';

  if (opponents.length === 0){
    carousel.innerHTML = '<div class="empty-opponent">Ожидание соперников…</div>';
    updateCarousel(0);
    return;
  }

  opponents.forEach((p, idx) => {
    const slot = document.createElement('div');
    slot.className = 'opponent-slot';
    slot.dataset.index = idx;

    const name = document.createElement('div');
    name.className = 'opponent-name';
    name.textContent = p.name;
    slot.appendChild(name);

    const tableRow = document.createElement('div');
    tableRow.className = 'opponent-table';
    markDropzone(tableRow, { zoneType: 'newspecies', zonePlayer: p.id });

    const table = p.table || [];
    table.forEach((sp, sIdx) => {
      tableRow.appendChild(createSpeciesCard(sp, sIdx, p.id, 'opponent'));
    });

    slot.appendChild(tableRow);
    carousel.appendChild(slot);
  });

  updateCarousel(opponents.length);
}

export function updateCarousel(total){
  const carousel = document.getElementById('opponentCarousel');
  const left = document.getElementById('oppArrowLeft');
  const right = document.getElementById('oppArrowRight');

  if (window.innerWidth > 900 || total <= 1){
    carousel.classList.remove('carousel-mode');
    left.style.display = 'none';
    right.style.display = 'none';
    carousel.style.transform = '';
    return;
  }

  carousel.classList.add('carousel-mode');
  left.style.display = 'flex';
  right.style.display = 'flex';
  left.disabled = currentOppIdx === 0;
  right.disabled = currentOppIdx >= total - 1;

  carousel.style.transform = `translateX(-${currentOppIdx * 100}%)`;
}

/* Возвращают true, если индекс реально сдвинулся — вызывающая
   сторона перерисовывает стол только в этом случае. */
export function arrowLeft(){
  if (currentOppIdx > 0){ currentOppIdx--; return true; }
  return false;
}

export function arrowRight(total){
  if (currentOppIdx < total - 1){ currentOppIdx++; return true; }
  return false;
}

export function swipe(diffX, total){
  if (Math.abs(diffX) <= SWIPE_THRESHOLD) return false;
  if (diffX > 0) return arrowRight(total);
  return arrowLeft();
}
