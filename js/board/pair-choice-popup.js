/* ============================================================
   board/pair-choice-popup.js — единственный оставшийся попап для
   парных карт свойств: "кто симбионт?" при розыгрыше Симбиоза
   (единственная парная карта с направлением — см. face.symbiontChoice
   в data/cards.js). Партнёра выбирать больше не нужно: карту кладут
   прямо в щель МЕЖДУ двумя конкретными соседями (см. species-view.js/
   buildGap, drag/dropzone.js), она и так уже знает оба uid. Устроен
   как facePopup — тот же полноэкранный оверлей, свой узел #pairPopup.
   ============================================================ */

/* onChoose('left' | 'right') — за какой из двух сторон щели остаётся
   роль симбионта. */
export function chooseSymbiontSide(onChoose){
  const overlay = document.getElementById('pairPopup');
  const box = overlay.querySelector('.pair-popup-box');

  box.innerHTML = `
    <div class="pair-popup-title">Выберите симбионта</div>
    <div class="pair-popup-arrows">
      <button class="pair-choice-btn" data-side="left">⬅️</button>
      <button class="pair-choice-btn" data-side="right">➡️</button>
    </div>
  `;

  overlay.classList.add('open');

  function cleanup(){
    overlay.classList.remove('open');
    box.querySelectorAll('.pair-choice-btn').forEach(b => b.removeEventListener('click', onClick));
  }
  function onClick(e){
    const side = e.currentTarget.dataset.side;
    cleanup();
    onChoose(side);
  }
  box.querySelectorAll('.pair-choice-btn').forEach(b => b.addEventListener('click', onClick));
}
