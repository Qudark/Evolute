/* ============================================================
   board/sync-tag.js — строка статуса синхронизации
   (Firebase / тест в чате / офлайн) под лобби и под столом.
   ============================================================ */
import * as Storage from '../storage/index.js';

export function renderSyncTag(room){
  const mode = Storage.getMode();
  const label = mode === 'firebase' ? 'синхронизация: мгновенная'
              : mode === 'claude'   ? 'синхронизация: тест в чате (опрос)'
              : 'офлайн-режим: только это устройство';
  const text = label + ' · обновлено ' + new Date(room.updatedAt || Date.now()).toLocaleTimeString();
  ['lobbySync', 'lobbySync2'].forEach(id => {
    const tag = document.getElementById(id);
    if (tag) tag.textContent = text;
  });
}
