/* ============================================================
   lobby/codegen.js — генераторы кода комнаты и id игрока.
   ============================================================ */
export function genCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export function genId(){
  return Math.random().toString(36).slice(2, 10);
}
