/* ============================================================
   Evo.Main — точка входа: инициализация и переключение вкладок.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.Main = (function(){

  function setView(name){
    document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
  }

  function enterRoom(room){
    setView('game');
    Evo.Board.enter(room);
  }

  function init(){
    Evo.TG.init();
    const mode = Evo.Storage.init();

    if (mode === 'local'){
      const notice = document.getElementById('storageNotice');
      if (notice){
        notice.style.display = 'block';
        notice.textContent = 'Хранилище для мультиплеера не настроено — игра работает только на этом устройстве. Чтобы играть с другими по коду, заполните js/config.js (см. README).';
      }
    }

    document.querySelectorAll('nav.tabs button').forEach(btn=>{
      btn.addEventListener('click', ()=> { if (!btn.disabled) setView(btn.dataset.view); });
    });
    document.getElementById('homeLink').addEventListener('click', ()=> setView('home'));

    document.getElementById('foodPlus').addEventListener('click', ()=> Evo.Board.foodAdjust(1));
    document.getElementById('foodMinus').addEventListener('click', ()=> Evo.Board.foodAdjust(-1));

    Evo.Lobby.init();
    Evo.Catalog.render();
  }

  return { init, setView, enterRoom };
})();

document.addEventListener('DOMContentLoaded', Evo.Main.init);
