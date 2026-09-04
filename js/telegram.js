/* ============================================================
   telegram.js — тонкая обвязка над Telegram WebApp SDK.
   Если сайт открыт не из Telegram (обычный браузер), все
   функции просто no-op — остальной код это не замечает.
   ============================================================ */
const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

export function init(){
  if (!tg) return null;
  tg.ready();
  tg.expand();
  try {
    // подстраиваемся под тему Telegram, если она задана
    if (tg.themeParams && tg.themeParams.bg_color){
      document.documentElement.style.setProperty('--tg-bg', tg.themeParams.bg_color);
    }
  } catch(e){ /* тема не критична */ }
  return tg;
}

export function suggestedName(){
  try {
    const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (u) return [u.first_name, u.last_name].filter(Boolean).join(' ');
  } catch(e){}
  return '';
}

export function isInsideTelegram(){ return !!tg; }

export function hapticSelect(){
  try { tg && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(); } catch(e){}
}

export function hapticImpact(style){
  try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(style || 'light'); } catch(e){}
}
