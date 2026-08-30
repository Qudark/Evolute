/* ============================================================
   Evo.Catalog — вкладка "Каталог карт": мозаика всей колоды
   и карточки со сгибом (лицо / обратная сторона).
   ============================================================ */
window.Evo = window.Evo || {};

Evo.Catalog = (function(){
  let activeFilter = null;

  function render(){
    renderMeta();
    renderMosaic();
    renderChipbar();
    renderGrid();
  }

  function renderMeta(){
    document.getElementById('deckMeta').textContent =
      Evo.TOTAL_CARDS + ' карт · ' + Evo.CARD_TYPES.length + ' типов карт';
  }

  function renderMosaic(){
    const mosaic = document.getElementById('mosaic');
    mosaic.innerHTML = '';
    Evo.buildDeck().forEach(card=>{
      const type = Evo.getType(card.typeId);
      const face = type.faces[0];
      const meta = Evo.CATEGORY_META[face.cat];
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.background = meta.color;
      tile.title = type.faces.map(f=>f.name).join(' / ');
      tile.addEventListener('click', ()=>{
        activeFilter = null; renderChipbar(); renderGrid();
        const target = document.querySelector('.propcard[data-type="'+type.id+'"]');
        if (target){
          target.scrollIntoView({behavior:'smooth', block:'center'});
          target.animate([{outline:'2px solid var(--c-growth)'},{outline:'2px solid transparent'}], {duration:900});
        }
      });
      mosaic.appendChild(tile);
    });
  }

  function renderChipbar(){
    const bar = document.getElementById('chipbar');
    bar.innerHTML = '';
    const allChip = document.createElement('div');
    allChip.className = 'chip' + (activeFilter===null ? ' active':'');
    allChip.textContent = 'Все свойства';
    allChip.addEventListener('click', ()=>{ activeFilter=null; renderChipbar(); renderGrid(); });
    bar.appendChild(allChip);

    Object.entries(Evo.CATEGORY_META).forEach(([keyId, meta])=>{
      const chip = document.createElement('div');
      chip.className = 'chip' + (activeFilter===keyId ? ' active':'');
      chip.innerHTML = `<span class="dot" style="background:${meta.color}"></span>${meta.label}`;
      chip.addEventListener('click', ()=>{ activeFilter=keyId; renderChipbar(); renderGrid(); });
      bar.appendChild(chip);
    });
  }

  function renderGrid(){
    const grid = document.getElementById('propGrid');
    grid.innerHTML = '';
    Evo.CARD_TYPES
      .filter(type => !activeFilter || type.faces.some(f=>f.cat===activeFilter))
      .forEach(type=>{
        const faceA = type.faces[0];
        const faceB = type.faces[1] || null;
        const metaA = Evo.CATEGORY_META[faceA.cat];

        const card = document.createElement('div');
        card.className = 'propcard';
        card.dataset.type = type.id;

        const backHtml = faceB
          ? `<div class="cat-band" style="background:${Evo.CATEGORY_META[faceB.cat].color}"></div>
             <div class="fhead">
               <div class="icon">${faceB.icon}</div>
               <div><div class="fname">${faceB.name}</div><div class="fcat" style="color:${Evo.CATEGORY_META[faceB.cat].color}">${Evo.CATEGORY_META[faceB.cat].label}</div></div>
             </div>
             <div class="fdesc">${faceB.desc}</div>
             <div class="fcount"><span>вторая сторона той же карты</span><span>× ${type.count}</span></div>`
          : `<div class="lizard">🦎</div>
             <div class="backlabel">рубашка карты</div>
             <div class="backhint">ЛЮБАЯ КАРТА МОЖЕТ БЫТЬ<br>ВИДОМ ИЛИ СВОЙСТВОМ</div>`;

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
            <div class="face back ${faceB?'has-face':''}">${backHtml}</div>
          </div>`;
        card.addEventListener('click', ()=> card.classList.toggle('flipped'));
        grid.appendChild(card);
      });
  }

  return { render };
})();
