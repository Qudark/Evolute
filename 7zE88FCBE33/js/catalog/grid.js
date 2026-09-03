/* ============================================================
   catalog/grid.js — сетка переворачивающихся карточек свойств
   (лицо / обратная сторона для двусторонних карт).
   ============================================================ */
import { CATEGORY_META, CARD_TYPES } from '../data/cards.js';
import { getFilter } from './filter-state.js';

function backFaceHtml(faceB, count){
  const meta = CATEGORY_META[faceB.cat];
  return `<div class="cat-band" style="background:${meta.color}"></div>
    <div class="fhead">
      <div class="icon">${faceB.icon}</div>
      <div><div class="fname">${faceB.name}</div><div class="fcat" style="color:${meta.color}">${meta.label}</div></div>
    </div>
    <div class="fdesc">${faceB.desc}</div>
    <div class="fcount"><span>вторая сторона той же карты</span><span>× ${count}</span></div>`;
}

function backPlainHtml(){
  return `<div class="lizard">🦎</div>
    <div class="backlabel">рубашка карты</div>
    <div class="backhint">ЛЮБАЯ КАРТА МОЖЕТ БЫТЬ<br>ВИДОМ ИЛИ СВОЙСТВОМ</div>`;
}

function propCardEl(type){
  const faceA = type.faces[0];
  const faceB = type.faces[1] || null;
  const metaA = CATEGORY_META[faceA.cat];

  const card = document.createElement('div');
  card.className = 'propcard';
  card.dataset.type = type.id;

  card.innerHTML = `
    <div class="inner">
      <div class="face front">
        <div class="cat-band" style="background:${metaA.color}"></div>
        <div class="fhead">
          <div class="icon">${faceA.icon}</div>
          <div><div class="fname">${faceA.name}</div><div class="fcat" style="color:${metaA.color}">${metaA.label}</div></div>
        </div>
        <div class="fdesc">${faceA.desc}</div>
        <div class="fcount"><span>в колоде</span><span>× ${type.count}</span></div>
      </div>
      <div class="face back ${faceB ? 'has-face' : ''}">${faceB ? backFaceHtml(faceB, type.count) : backPlainHtml()}</div>
    </div>`;
  card.addEventListener('click', () => card.classList.toggle('flipped'));
  return card;
}

export function renderGrid(){
  const grid = document.getElementById('propGrid');
  grid.innerHTML = '';
  const activeFilter = getFilter();
  CARD_TYPES
    .filter(type => !activeFilter || type.faces.some(f => f.cat === activeFilter))
    .forEach(type => grid.appendChild(propCardEl(type)));
}
