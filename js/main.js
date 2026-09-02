/* ============================================================
   main.js — точка входа. Инициализирует Telegram-обвязку и
   выбор бэкенда хранилища, включает верхнюю навигацию, рисует
   каталог карт и передаёт lobby.js колбэк входа в комнату.
   ============================================================ */
import * as TG from './telegram.js';
import * as Storage from './storage/index.js';
import * as Lobby from './lobby/index.js';
import * as Board from './board/index.js';
import * as Catalog from './catalog/index.js';
import { setView } from './nav.js';

function enterRoom(room){
  setView('game');
  Board.enter(room);
}

function init(){
  TG.init();
  const mode = Storage.init();

  if (mode === 'local'){
    const notice = document.getElementById('storageNotice');
    if (notice){
      notice.style.display = 'block';
      notice.textContent = 'Хранилище для мультиплеера не настроено — игра работает только на этом устройстве. Чтобы играть с другими по коду, заполните js/config.js (см. README).';
    }
  }

  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => { if (!btn.disabled) setView(btn.dataset.view); });
  });
  document.getElementById('homeLink').addEventListener('click', () => setView('home'));

  Lobby.init(enterRoom);
  Catalog.render();
}

document.addEventListener('DOMContentLoaded', init);
