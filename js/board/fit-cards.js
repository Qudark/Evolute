/* ============================================================
   board/fit-cards.js — автоподгонка размера карт-видов под
   РЕАЛЬНО доступное место в зоне (стол соперника / стол игрока).

   Раньше размер карты (--card-w/--card-h) считался только от
   vh/vw всего экрана (01-tokens.css) — это не учитывало, сколько
   именно места этой конкретной зоне оставили её соседи (шапка,
   колода/сброс, рука). Из-за этого на зону могло просто не
   хватать места, и подпись/теги под картой обрезались.

   Здесь мы вместо гадания меряем DOM напрямую: берём уже
   отрисованные карточки вида, узнаём, сколько места у них
   реально съедают подпись+теги+отступы (то, что НЕ сама
   картинка карты), и от фактической высоты зоны вычитаем именно
   это — остаток и есть честный размер карты. Найденный размер
   пишем в CSS-переменные прямо на контейнере зоны — они
   каскадом уходят вниз, на .minicard и на min-height самой
   зоны (07-game-table.css / 08-player-area.css).
   ============================================================ */

const CARD_ASPECT = 82 / 112; // ширина/высота — как у клампов в 01-tokens.css
const MIN_CARD_H = 44;
const MAX_CARD_H = 132;

/**
 * @param {HTMLElement} zoneEl — контейнер зоны (например #opponentStrip
 *   или #playerTable), на который будут записаны --card-w/--card-h.
 * @param {number} extraReserve — доп. отступы контейнера, которые
 *   clientHeight включает, но которые не относятся ни к одной
 *   карточке (padding самой зоны).
 * @param {boolean} resetMinHeight — если min-height САМОЙ зоны
 *   тоже посчитан через calc(var(--card-h) + ...) (как у
 *   .player-table, 08-player-area.css), то clientHeight будет
 *   отражать не честную долю места от flex-раскладки, а старый
 *   (возможно завышенный) min-height — из-за этого зона может
 *   "выбивать" себе больше места, чем реально осталось, и отжимать
 *   соседей (например руку) за границу видимости. Чтобы измерить
 *   честно, на секунду убираем min-height, меряем настоящую высоту
 *   от flex, и возвращаем min-height обратно (CSS сам пересчитает
 *   его от нового, уже подогнанного --card-h).
 */
export function fitCardsToZone(zoneEl, extraReserve = 0, resetMinHeight = false){
  if (!zoneEl) return;

  const speciesEls = zoneEl.querySelectorAll('.species');
  if (speciesEls.length === 0) return; // стол пуст — трогать нечего, оставляем как есть

  // Сколько места вокруг картинки карты реально съедают подпись
  // и список тегов у самой "тяжёлой" карточки — на неё и ровняемся,
  // чтобы ни одна карточка в зоне не обрезалась.
  let maxReserve = 0;
  speciesEls.forEach(sp => {
    const card = sp.querySelector('.minicard');
    if (!card) return;
    const reserve = sp.offsetHeight - card.offsetHeight;
    if (reserve > maxReserve) maxReserve = reserve;
  });

  let clientH = zoneEl.clientHeight;
  if (resetMinHeight){
    const prevMinHeight = zoneEl.style.minHeight;
    zoneEl.style.minHeight = '0px';
    clientH = zoneEl.clientHeight;
    zoneEl.style.minHeight = prevMinHeight;
  }

  const available = clientH - extraReserve - maxReserve;
  const h = Math.max(MIN_CARD_H, Math.min(MAX_CARD_H, available));
  const w = Math.round(h * CARD_ASPECT);

  zoneEl.style.setProperty('--card-h', h + 'px');
  zoneEl.style.setProperty('--card-w', w + 'px');
}
