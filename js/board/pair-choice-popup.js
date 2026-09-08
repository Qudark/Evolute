/* ============================================================
   board/pair-choice-popup.js — попапы для карт парных свойств
   (Симбиоз/Взаимодействие/Сотрудничество, см. data/cards.js —
   у них face.pair === true). Такую карту нельзя положить просто
   на один вид: нужно выбрать ВТОРОЙ вид из того же стола, а для
   Симбиоза (face.symbiontChoice === true) — ещё и то, какая из
   двух сторон будет симбионтом. Переиспользует ту же полноэкранную
   plашку-оверлей, что и face-choice-popup.js, только свой узел в
   разметке (#pairPopup) и свой набор шагов внутри одного попапа.
   ============================================================ */

/* candidates: [{ uid, label }] — все виды на столе игрока, КРОМЕ
   того, на который карту изначально бросили. Если кандидат ровно
   один — попап пропускается, он выбирается автоматически (незачем
   переспрашивать очевидное). onChoose(uid) вызывается с uid
   выбранного второго вида, либо не вызывается вовсе, если попап
   закрыли не выбрав (клик мимо/повторный дроп — тут такого пути
   нет, но на всякий случай не молчим руками пользователя). */
export function choosePartner(candidates, onChoose){
  if (candidates.length === 1){
    onChoose(candidates[0].uid);
    return;
  }

  const overlay = document.getElementById('pairPopup');
  const box = overlay.querySelector('.pair-popup-box');

  box.innerHTML = '<div class="pair-popup-title">С каким ещё видом сыграть карту?</div>' +
    candidates.map(c =>
      `<button class="pair-choice-btn" data-uid="${c.uid}"><span class="pc-icon">🦎</span><span class="pc-name">${c.label}</span></button>`
    ).join('');

  overlay.classList.add('open');

  function cleanup(){
    overlay.classList.remove('open');
    box.querySelectorAll('.pair-choice-btn').forEach(b => b.removeEventListener('click', onClick));
  }
  function onClick(e){
    const uid = e.currentTarget.dataset.uid;
    cleanup();
    onChoose(uid);
  }
  box.querySelectorAll('.pair-choice-btn').forEach(b => b.addEventListener('click', onClick));
}

/* labelA/labelB — подписи двух уже выбранных видов (тот, на который
   бросили карту, и выбранный партнёр). onChoose(uid) вызывается с
   uid того вида, который игрок назначил симбионтом. */
export function chooseSymbiont(a, b, onChoose){
  const overlay = document.getElementById('pairPopup');
  const box = overlay.querySelector('.pair-popup-box');

  box.innerHTML = '<div class="pair-popup-title">Какая сторона — симбионт?</div>' +
    [a, b].map(s =>
      `<button class="pair-choice-btn" data-uid="${s.uid}"><span class="pc-icon">🐠</span><span class="pc-name">${s.label}</span></button>`
    ).join('');

  overlay.classList.add('open');

  function cleanup(){
    overlay.classList.remove('open');
    box.querySelectorAll('.pair-choice-btn').forEach(b => b.removeEventListener('click', onClick));
  }
  function onClick(e){
    const uid = e.currentTarget.dataset.uid;
    cleanup();
    onChoose(uid);
  }
  box.querySelectorAll('.pair-choice-btn').forEach(b => b.addEventListener('click', onClick));
}
