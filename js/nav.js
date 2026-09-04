/* ============================================================
   nav.js — переключение экранов ("Меню" / "Каталог" / "Стол").
   Единая точка, которой пользуются и верхняя навигация, и
   всплывающее меню на столе — раньше эта логика была продублирована
   в main.js и board.js по отдельности.
   ============================================================ */
export function setView(name){
  document.querySelectorAll('nav.tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
}
