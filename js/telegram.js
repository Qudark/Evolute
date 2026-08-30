/* ============================================================
   Evo.TG — тонкая обвязка над Telegram WebApp SDK.
   Если сайт открыт не из Telegram (обычный браузер), все
   функции просто no-op — остальной код это не замечает.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.TG = (function(){
  const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  function init(){
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

  function suggestedName(){
    try {
      const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (u) return [u.first_name, u.last_name].filter(Boolean).join(' ');
    } catch(e){}
    return '';
  }

  function isInsideTelegram(){ return !!tg; }

  function hapticSelect(){
    try { tg && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(); } catch(e){}
  }
  function hapticImpact(style){
    try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(style || 'light'); } catch(e){}
  }

  return { init, suggestedName, isInsideTelegram, hapticSelect, hapticImpact };
})();
