/* ============================================================
   board/opponents-view.js — полоса соперников: на широких
   экранах все рядом (каждый со своим именем над столом), на
   мобильных — карусель по одному сопернику. В режиме карусели
   имя вынесено в ОТДЕЛЬНЫЙ фиксированный элемент над каруселью
   (#opponentNameFixed) — оно не едет вместе со слайдом, а просто
   быстро перекрашивается fade'ом при переключении (см.
   updateCarousel). Стрелки — тоже вне слайда. И имя, и стрелки —
   прямые дети НЕскроллящейся .opponent-strip (см. 07-game-table.css:
   скролл живёт только на вложенной .opponent-scroll), поэтому они
   физически не могут уехать при прокрутке содержимого.
   Переключение соперника на телефоне — только этими кнопками:
   свайп по столу соперника (creature-pager.js) листает страницы
   ЕГО существ, а не переключает соперника — так у двух жестов нет
   общей зоны конфликта.
   currentOppIdx хранится здесь же — это чисто локальное состояние
   отображения, не часть комнаты.

   Существа ВНУТРИ стола одного соперника (если их больше, чем
   влезает в ряд без скролла) больше не листаются непрерывным
   драг-скроллом — это резалось асинхронной подстановкой веб-шрифта
   (см. controls.js) и визуально "уезжало" в сторону. Теперь это
   постраничный показ с fade-переходом (creature-pager.js): сколько
   карт реально влезает, столько на странице и показывается, и эта
   страница всегда просто центрируется — рассинхронизироваться
   там нечему.
   ============================================================ */
import { createSpeciesCard } from './species-view.js';
import { markDropzone } from './dropzone-utils.js';
import { fitCardsToZone, alignScrollableRow } from './fit-cards.js';
import { renderPage } from './creature-pager.js';

let currentOppIdx = 0;
let lastOpponents = [];

export function renderOpponents(opponents){
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

  const tableRows = [];
  const tablesData = []; // { tableRow, species, playerId } — для второго, финального прохода ниже

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
    // Черновой прогон: нужны хоть какие-то реальные .minicard в
    // разметке, чтобы fitCardsToZone ниже честно измерил накладные
    // расходы подписи/тегов. Итоговая нарезка на страницы (она
    // зависит от финального размера карты) будет пересчитана вторым,
    // финальным проходом сразу после fitCardsToZone.
    renderPage(tableRow, table, p.id, (sp, sIdx) => createSpeciesCard(sp, sIdx, p.id, 'opponent'));

    slot.appendChild(tableRow);
    carousel.appendChild(slot);
    tableRows.push(tableRow);
    tablesData.push({ tableRow, species: table, playerId: p.id });
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

  // Финальный проход: --card-w/h на strip только что стали
  // окончательными — по ним, а не по черновой прикидке из первого
  // прохода выше, и нужно резать существ на страницы.
  tablesData.forEach(({ tableRow, species, playerId }) => {
    renderPage(tableRow, species, playerId, (sp, sIdx) => createSpeciesCard(sp, sIdx, playerId, 'opponent'));
  });

  // Подстраховка на случай, если даже одна карточка страницы вдруг
  // не влезла (очень длинное имя вида, экстремальный зум и т.п.) —
  // тогда честнее прижать её к краю, чем показать обрезанной по
  // центру. В обычном режиме это правило никогда не сработает,
  // раз страница по построению уже подобрана впритык.
  tableRows.forEach(alignScrollableRow);
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
