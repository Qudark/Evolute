/* ============================================================
   board/face-choice-popup.js — попап выбора стороны карты в
   момент, когда двусторонняя карта (например, «Паразит / Хищник»)
   прикрепляется к виду как свойство. Раньше сторону выбирали
   заранее кнопкой ⟲ прямо на карте в руке; теперь выбор происходит
   один раз, непосредственно в момент розыгрыша карты.
   ============================================================ */
import { getType } from '../data/deck.js';

export function chooseFace(typeId, onChoose){
  const type = getType(typeId);
  const overlay = document.getElementById('facePopup');
  const box = overlay.querySelector('.face-popup-box');

  box.innerHTML = '<div class="face-popup-title">Каким свойством сыграть карту?</div>' +
    type.faces.map((f, i) =>
      `<button class="face-choice-btn" data-face="${i}"><span class="fc-icon">${f.icon}</span><span class="fc-name">${f.name}</span></button>`
    ).join('');

  overlay.classList.add('open');

  function cleanup(){
    overlay.classList.remove('open');
    box.querySelectorAll('.face-choice-btn').forEach(b => b.removeEventListener('click', onClick));
  }
  function onClick(e){
    const faceIdx = Number(e.currentTarget.dataset.face);
    cleanup();
    onChoose(faceIdx);
  }
  box.querySelectorAll('.face-choice-btn').forEach(b => b.addEventListener('click', onClick));
}
