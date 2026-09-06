/* ============================================================
   board/controls.js — разовая настройка интерактива стола:
   стрелки/свайп соперников, всплывающее меню (кормовая база) и
   разметка зоны сброса как drop-цели. Переключение вкладок
   (Меню/Каталог/Стол) теперь только через нижнюю панель —
   дублирующих кнопок в этом попапе больше нет.
   ============================================================ */
import { getRoom } from './state.js';
import { getSession } from '../session.js';
import { renderGame } from './render.js';
import { foodAdjust } from './drop-handlers.js';
import { markDropzone } from './dropzone-utils.js';
import * as Opponents from './opponents-view.js';

function currentOpponents(){
  const room = getRoom();
  const session = getSession();
  return room ? room.players.filter(p => p.id !== session.playerId) : [];
}

export function setupControls(){
  document.getElementById('oppArrowLeft').addEventListener('click', () => {
    if (Opponents.arrowLeft()) renderGame();
  });
  document.getElementById('oppArrowRight').addEventListener('click', () => {
    if (Opponents.arrowRight(currentOpponents().length)) renderGame();
  });

  document.getElementById('menuDots').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('controlsPopup').classList.toggle('open');
  });
  document.addEventListener('click', () => {
    document.getElementById('controlsPopup').classList.remove('open');
  });

  // Единственное место, где навешиваются обработчики кормовой
  // базы — раньше main.js дублировал их, из-за чего клик
  // изменял счётчик сразу на 2.
  document.getElementById('foodMinus').addEventListener('click', () => foodAdjust(-1));
  document.getElementById('foodPlus').addEventListener('click', () => foodAdjust(1));

  // Стопка сброса — теперь настоящая drop-цель (раньше карту
  // некуда было физически перетащить, хотя обработчик уже был).
  const discardPile = document.getElementById('discardPile');
  if (discardPile) markDropzone(discardPile, { zoneType: 'discard' });

  // Режим карусели соперников (стрелки+фиксированное имя вместо
  // рядного показа) выбирается по window.innerWidth и раньше
  // пересчитывался только при обычной перерисовке стола (ход,
  // обновление руки и т.п.). Если сменить размер окна/повернуть
  // телефон БЕЗ игрового события — стрелки и имя оставались в
  // прежнем режиме до следующего рендера. Пересчитываем отдельно,
  // с дебаунсом, чтобы не дёргать перерисовку на каждый пиксель.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const room = getRoom();
      if (!room || room.status === 'lobby') return;
      Opponents.renderOpponents(currentOpponents());
    }, 150);
  });

  // Шрифты (Fraunces/Inter/IBM Plex Mono) подключены с font-display:swap
  // (см. index.html) — то есть сперва рисуются fallback-шрифтом, а
  // настоящий шрифт подставляется чуть позже. От его метрик зависит
  // ширина подписи вида, а значит и scrollWidth ряда — на нём завязаны
  // fitCardsToZone/alignScrollableRow (js/board/fit-cards.js). Если стол
  // отрисовался ДО подмены шрифта, размер карт и выравнивание (центр/край)
  // посчитаны по временной геометрии; когда шрифт догружается, содержимое
  // чуть меняется в размере, и ряд визуально уезжает в сторону, переставая
  // совпадать с уже выставленным выравниванием. Пересчитываем всё один раз,
  // когда шрифты точно готовы — аналогично тому, как это уже сделано выше
  // для resize.
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => {
      const room = getRoom();
      if (!room || room.status === 'lobby') return;
      renderGame();
    });
  }
}
