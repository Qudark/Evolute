/* ============================================================
   board/phase-track.js — полоса фаз хода над столом. Фазы не
   проверяются игрой, любой игрок может переключить их вручную.
   ============================================================ */
import { PHASES } from '../data/phases.js';
import { mutate } from './state.js';

const ROMAN = ['I', 'II', 'III', 'IV'];

export function renderPhaseTrack(room){
  const track = document.getElementById('phaseTrack');
  track.innerHTML = '';
  PHASES.forEach((ph, idx) => {
    const el = document.createElement('div');
    el.className = 'phase-pill' + (idx === room.phase ? ' active' : '');
    el.innerHTML = `<div class="num">${ROMAN[idx]}</div><div class="txt"><strong>${ph.title}</strong></div>`;
    el.addEventListener('click', () => mutate(r => { r.phase = idx; }));
    track.appendChild(el);
  });
  document.getElementById('phaseDetail').innerHTML = PHASES[room.phase].text;
}
