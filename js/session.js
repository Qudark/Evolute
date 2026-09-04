/* ============================================================
   session.js — данные о том, кто мы в текущей вкладке:
   { code, playerId, name }. Живёт только в памяти, не хранится
   на сервере отдельно от комнаты.
   ============================================================ */
let session = null;

export function getSession(){ return session; }

export function setSession(next){ session = next; }
