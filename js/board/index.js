/* ============================================================
   board/index.js — вкладка "Стол": публичная точка входа.
   Подписывается на изменения комнаты и перерисовывает экран
   при каждом обновлении (кроме случаев, когда идёт перетаскивание —
   тогда трогать DOM нельзя).
   ============================================================ */
import * as Storage from '../storage/index.js';
import * as Drag from '../drag/index.js';
import { getSession } from '../session.js';
import { setRoom, setRenderCallback } from './state.js';
import { render } from './render.js';
import { setupControls } from './controls.js';
import { reset as resetAppearTracker } from './appear-tracker.js';

let unsubscribe = null;
let controlsReady = false;

export function enter(initialRoom){
  resetAppearTracker(); // новая партия — карты снова "появляются" красиво
  setRoom(initialRoom);
  setRenderCallback(render);

  const session = getSession();
  document.getElementById('roomBadge').style.display = 'flex';
  document.getElementById('roomBadgeCode').textContent = session.code;
  document.getElementById('roomBadgeYou').textContent = '· ' + session.name;
  document.getElementById('navGame').disabled = false;

  if (unsubscribe) unsubscribe();
  unsubscribe = Storage.subscribe(session.code, (freshRoom) => {
    if (Drag.isDragging()) return; // не дёргаем DOM во время жеста
    setRoom(freshRoom);
    render();
  });

  render();
  if (!controlsReady){
    controlsReady = true;
    setupControls();
  }
}
