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
   роль симбионта. Если игрок тыкнет мимо кнопок (в затемнённый фон,
   не поняв, что от него ждут выбора) — попап просто закрывается без
   выбора; карта при этом остаётся в руке нетронутой (её ещё не
   убрали — см. commitPairProperty в drop-handlers.js, он делает это
   только ПОСЛЕ выбора), так что "зависшего" состояния не бывает. */
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
    overlay.removeEventListener('click', onBackdropClick);
  }
  function onClick(e){
    const side = e.currentTarget.dataset.side;
    cleanup();
    onChoose(side);
  }
  function onBackdropClick(e){
    if (e.target === overlay) cleanup(); // клик мимо .pair-popup-box — отмена
  }
  box.querySelectorAll('.pair-choice-btn').forEach(b => b.addEventListener('click', onClick));
  overlay.addEventListener('click', onBackdropClick);
}
