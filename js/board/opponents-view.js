/* ============================================================
   board/opponents-view.js — полоса соперников: на широких
   экранах все рядом (каждый со своим именем над столом), на
   мобильных — карусель по одному сопернику. В режиме карусели
   имя вынесено в ОТДЕЛЬНЫЙ фиксированный элемент над каруселью
   (#opponentNameFixed) — оно не едет вместе со слайдом, а просто
   быстро перекрашивается fade'ом при переключении (см.
   updateCarousel). Стрелки — тоже вне слайда, зафиксированы по
   бокам всей зоны (CSS: position:absolute на .opponent-strip).
   currentOppIdx хранится здесь же — это чисто локальное состояние
   отображения, не часть комнаты.
   ============================================================ */
import { createSpeciesCard } from './species-view.js';
import { markDropzone } from './dropzone-utils.js';
import { fitCardsToZone } from './fit-cards.js';
import { enableOpponentEdgeSwipe } from './opponent-swipe.js';

let currentOppIdx = 0;
let lastOpponents = [];

export function renderOpponents(opponents, rerender){
  lastOpponents = opponents;
  const carousel = document.getElementById('opponentCarousel');
  const strip = document.getElementById('opponentStrip');
  carousel.innerHTML = '';

  if (currentOppIdx > opponents.length - 1) currentOppIdx = Math.max(0, opponents.length - 1);

  if (opponents.length === 0){
    carousel.innerHTML = '<div class="empty-opponent">Ожидание соперников…</div>';
    updateCarousel(0, false);
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

    // Свайп по ряду вида этого соперника: сначала листает ЕГО СОБСТВЕННЫХ
    // существ по горизонтали, и только когда упёрлись в край ряда —
    // ещё один свайп в ту же сторону переключает на другого соперника
    // (см. opponent-swipe.js). Это и есть развязка с конфликтом,
    // из-за которого свайп между соперниками ломался.
    enableOpponentEdgeSwipe(tableRow, (dir) => {
      const total = opponents.length;
      const changed = dir > 0 ? arrowRight(total) : arrowLeft();
      if (changed && rerender) rerender();
    });

    const table = p.table || [];
    table.forEach((sp, sIdx) => {
      tableRow.appendChild(createSpeciesCard(sp, sIdx, p.id, 'opponent'));
    });

    slot.appendChild(tableRow);
    carousel.appendChild(slot);
  });

  updateCarousel(opponents.length, true);

  // Паддинг .opponent-strip (12px сверху + 6px снизу, см. 07-game-table.css)
  // плюс высота ИМЕНИ — то, что clientHeight включает, но что не
  // относится к самой карточке вида. В режиме карусели имя показывает
  // #opponentNameFixed (у .opponent-name внутри слайда display:none,
  // offsetHeight будет 0) — берём высоту того, что реально видно.
  const nameFixed = document.getElementById('opponentNameFixed');
  const visibleName = (nameFixed && nameFixed.classList.contains('visible'))
    ? nameFixed
    : strip.querySelector('.opponent-name');
  const nameH = visibleName?.offsetHeight || 0;
  fitCardsToZone(strip, 18 + nameH);
}

export function updateCarousel(total, animateName){
  const carousel = document.getElementById('opponentCarousel');
  const left = document.getElementById('oppArrowLeft');
  const right = document.getElementById('oppArrowRight');
  const nameFixed = document.getElementById('opponentNameFixed');

  const isCarouselMode = window.innerWidth <= 900 && total > 1;

  if (!isCarouselMode){
    carousel.classList.remove('carousel-mode');
    left.style.display = 'none';
    right.style.display = 'none';
    carousel.style.transform = '';
    if (nameFixed) nameFixed.classList.remove('visible');
    return;
  }

  carousel.classList.add('carousel-mode');
  left.style.display = 'flex';
  right.style.display = 'flex';
  left.disabled = currentOppIdx === 0;
  right.disabled = currentOppIdx >= total - 1;

  carousel.style.transform = `translateX(-${currentOppIdx * 100}%)`;

  if (nameFixed){
    nameFixed.classList.add('visible');
    const newName = lastOpponents[currentOppIdx]?.name || '';
    if (nameFixed.textContent !== newName){
      nameFixed.textContent = newName;
      if (animateName){
        // Быстрый "исчезновение-появление": снимаем класс, форсируем
        // reflow (иначе браузер схлопнет снятие+добавление в одно
        // и анимация не переиграется), навешиваем заново.
        nameFixed.classList.remove('fade');
        void nameFixed.offsetWidth;
        nameFixed.classList.add('fade');
      }
    }
  }
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
