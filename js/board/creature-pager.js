/* ============================================================
   board/creature-pager.js — постраничный показ существ ОДНОГО
   соперника, вместо прежнего непрерывного драг-скролла ряда
   (см. историю в opponent-swipe.js — этот модуль больше не
   используется для стола соперника).

   Почему так: раньше ряд был одним длинным флексом, который либо
   центрировался, либо (если не влезал) прижимался к левому краю —
   это решение (alignScrollableRow, fit-cards.js) считалось ОДИН
   РАЗ по факту отрисовки и переставало быть верным при любом
   последующем изменении реальной ширины контента — например, из-за
   асинхронной подстановки веб-шрифта (font-display:swap) уже ПОСЛЕ
   того как выравнивание было выставлено. Из-за этого ряд соперника
   визуально "уезжал" в сторону и переставал совпадать с краями
   стола.

   Здесь этой проблемы в принципе нет: раз ширина карточки уже
   честно посчитана (fitCardsToZone), заранее известно, сколько
   карт физически влезает в ряд БЕЗ скролла — существа режутся на
   такие страницы, и каждая показанная страница ГАРАНТИРОВАННО
   влезает целиком → её всегда можно просто центрировать
   (justify-content:center в CSS, без doп. классов). Держать что-то
   в актуальном состоянии между кадрами не нужно — каждая
   перерисовка страницы независима.

   Переключение страницы — свайпом (или протяжкой мышью на
   десктопе) поперёк ряда: не тянет карточки за пальцем, а после
   порога целиком меняет страницу через "исчезновение-появление"
   (fade, см. .opponent-table.page-fade-out в 07-game-table.css).
   Из-за этого никогда не бывает видимого промежуточного состояния,
   которое можно поймать глазом как "рассинхрон".

   currentPage хранится тут же, per player id — это чисто локальное
   состояние отображения (как currentOppIdx в opponents-view.js),
   не часть комнаты.
   ============================================================ */

const DRAG_THRESHOLD = 30; // px — свайп, а не случайный дрожащий тап
const FADE_MS = 160;

const pageByPlayer = new Map();

/** Сколько карточек влезает в ряд без скролла — по уже посчитанному
    --card-w (fitCardsToZone) и текущей ширине контейнера. */
function cardsPerPage(rowEl){
  const cs = getComputedStyle(rowEl);
  const cardW = parseFloat(cs.getPropertyValue('--card-w')) || 82;
  const gap = parseFloat(cs.gap) || 12;
  const paddingX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  const available = rowEl.clientWidth - paddingX;
  const n = Math.floor((available + gap) / (cardW + gap));
  return Math.max(1, n);
}

function clampPage(page, totalPages){
  return Math.min(Math.max(page, 0), totalPages - 1);
}

/**
 * Отрисовывает текущую страницу существ соперника в rowEl.
 * Вызывать дважды за один renderOpponents (см. opponents-view.js):
 * первый раз — черновой прогон ДО fitCardsToZone (нужны хоть
 * какие-то .minicard в разметке, чтобы было что мерить), второй —
 * финальный, сразу после, когда --card-w уже окончательный.
 * Оба прогона синхронные, до отрисовки кадра — мигания не будет.
 *
 * @param {HTMLElement} rowEl — .opponent-table
 * @param {Array} species — существа соперника целиком
 * @param {string} playerId
 * @param {(sp, idx) => HTMLElement} buildCard — то же, что раньше
 *   строил .forEach в opponents-view.js (createSpeciesCard(...))
 */
export function renderPage(rowEl, species, playerId, buildCard){
  const perPage = cardsPerPage(rowEl);
  const totalPages = Math.max(1, Math.ceil(species.length / perPage));
  const page = clampPage(pageByPlayer.get(playerId) ?? 0, totalPages);
  pageByPlayer.set(playerId, page);

  const start = page * perPage;
  rowEl.innerHTML = '';
  species.slice(start, start + perPage).forEach((sp, i) => rowEl.appendChild(buildCard(sp, start + i)));

  enableSwipe(rowEl, species, playerId, buildCard);
}

function goToPage(rowEl, species, playerId, buildCard, delta){
  const perPage = cardsPerPage(rowEl);
  const totalPages = Math.max(1, Math.ceil(species.length / perPage));
  const current = pageByPlayer.get(playerId) ?? 0;
  const next = current + delta;
  if (next < 0 || next > totalPages - 1) return; // на краю — свайпать дальше некуда

  rowEl.classList.add('page-fade-out');
  setTimeout(() => {
    pageByPlayer.set(playerId, next);
    const start = next * perPage;
    rowEl.innerHTML = '';
    species.slice(start, start + perPage).forEach((sp, i) => rowEl.appendChild(buildCard(sp, start + i)));
    rowEl.classList.remove('page-fade-out');
  }, FADE_MS);
}

/* Назначаем через свойства on*, а не addEventListener — renderPage
   может быть вызван для одного и того же (не пересозданного) rowEl
   несколько раз за кадр (черновой + финальный проход), и это не
   должно плодить дублирующиеся обработчики. */
function enableSwipe(rowEl, species, playerId, buildCard){
  let pointerId = null;
  let startX = 0;
  let dragging = false;

  rowEl.onpointerdown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    dragging = false;
  };

  rowEl.onpointermove = (e) => {
    if (e.pointerId !== pointerId) return;
    if (Math.abs(e.clientX - startX) > 6) dragging = true;
  };

  const end = (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    pointerId = null;
    if (!dragging || Math.abs(dx) < DRAG_THRESHOLD) return;
    goToPage(rowEl, species, playerId, buildCard, dx < 0 ? 1 : -1);
  };

  rowEl.onpointerup = end;
  rowEl.onpointercancel = end;
}
