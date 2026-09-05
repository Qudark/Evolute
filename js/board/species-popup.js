/* ============================================================
   board/species-popup.js — маленький попап ПРЯМО НАД конкретным
   видом на столе (не на весь экран, в отличие от facePopup) —
   появляется по долгому нажатию (см. table-gestures.js), даёт
   отправить вид (карту-вид + все прикреплённые к нему свойства)
   в отбой игрока.
   ============================================================ */
import { discardSpecies } from './drop-handlers.js';

let activeEl = null;
let outsideHandler = null;

export function closeSpeciesPopup(){
  if (!activeEl) return;
  activeEl.classList.remove('open');
  if (outsideHandler) document.removeEventListener('pointerdown', outsideHandler, true);
  activeEl = null;
  outsideHandler = null;
}

export function showSpeciesPopup(cardEl, { playerId, speciesUid }){
  closeSpeciesPopup();

  const popup = document.getElementById('speciesPopup');
  if (!popup) return;
  popup.innerHTML = '<button class="species-popup-btn" type="button">🗑️ В сброс</button>';
  popup.classList.add('open');

  // Сначала показываем (display заранее переключён классом .open),
  // чтобы offsetWidth/Height у попапа были настоящими, а не 0 —
  // иначе анкоринг "прямо над карточкой" будет мимо.
  const cardRect = cardEl.getBoundingClientRect();
  const pw = popup.offsetWidth;
  const ph = popup.offsetHeight;

  let left = cardRect.left + cardRect.width / 2 - pw / 2;
  left = Math.max(6, Math.min(left, window.innerWidth - pw - 6));

  let top = cardRect.top - ph - 8;
  if (top < 6) top = cardRect.bottom + 8; // сверху не влезает — показываем снизу

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';

  popup.querySelector('.species-popup-btn').addEventListener('click', () => {
    discardSpecies(playerId, speciesUid);
    closeSpeciesPopup();
  });

  activeEl = popup;
  outsideHandler = (e) => {
    if (popup.contains(e.target)) return;
    closeSpeciesPopup();
  };
  // Тот же самый pointerdown/click, что запустил долгое нажатие,
  // уже завершился к этому моменту — но на всякий случай откладываем
  // подписку на следующий тик, чтобы не поймать его "хвост".
  setTimeout(() => document.addEventListener('pointerdown', outsideHandler, true), 0);
}
