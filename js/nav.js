/* ============================================================
   nav.js — переключение экранов ("Меню" / "Каталог" / "Стол").
   Единая точка, которой пользуется нижняя панель вкладок.
   ============================================================ */
export function setView(name){
  document.querySelectorAll('nav.tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
}
