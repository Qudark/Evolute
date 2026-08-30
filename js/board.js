/* ============================================================
   Evo.Board — вкладка "Стол": зал ожидания + сама игра.
   Карты перетаскиваются (Evo.Drag) из руки на стол/на карту-вид,
   и из колоды в руку. Правила не проверяются — куда перетащили,
   туда и легло.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.Board = (function(){
  let room = null;
  let unsubscribe = null;

  function enter(initialRoom){
    room = initialRoom;
    document.getElementById('roomBadge').style.display = 'flex';
    document.getElementById('roomBadgeCode').textContent = Evo.Session.code;
    document.getElementById('roomBadgeYou').textContent = '· ' + Evo.Session.name;
    document.getElementById('navGame').disabled = false;

    if (unsubscribe) unsubscribe();
    unsubscribe = Evo.Storage.subscribe(Evo.Session.code, (freshRoom)=>{
      if (Evo.Drag.isDragging()) return; // не дёргаем DOM во время жеста
      room = freshRoom;
      render();
    });
    render();
  }

  async function mutate(fn){
    const updated = await Evo.Storage.updateRoom(Evo.Session.code, fn);
    if (updated){ room = updated; render(); }
  }

  function myPlayer(){
    return room.players.find(p => p.id === Evo.Session.playerId);
  }

  function render(){
    if (!room) return;
    renderSyncTag();
    if (room.status === 'lobby'){
      document.getElementById('lobbyBlock').style.display = 'block';
      document.getElementById('boardBlock').style.display = 'none';
      renderLobby();
    } else {
      document.getElementById('lobbyBlock').style.display = 'none';
      document.getElementById('boardBlock').style.display = 'block';
      renderPhaseTrack();
      renderGame();
    }
  }

  function renderSyncTag(){
    const mode = Evo.Storage.getMode();
    const label = mode === 'firebase' ? 'синхронизация: мгновенная'
                : mode === 'claude'   ? 'синхронизация: тест в чате (опрос)'
                : 'офлайн-режим: только это устройство';
    const text = label + ' · обновлено ' + new Date(room.updatedAt || Date.now()).toLocaleTimeString();
    ['lobbySync', 'lobbySync2'].forEach(id=>{
      const tag = document.getElementById(id);
      if (tag) tag.textContent = text;
    });
  }

  /* ---------------- Lobby ---------------- */
  function renderLobby(){
    document.getElementById('lobbyCodeBig').textContent = room.code.split('').join(' ');
    const list = document.getElementById('lobbyPlayers');
    list.innerHTML = '';
    room.players.forEach(p=>{
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `<span class="dot"></span><span class="name">${p.name}</span>`;
      if (p.id === Evo.Session.playerId){
        const tag = document.createElement('span');
        tag.className = 'youtag'; tag.textContent = 'ВЫ';
        row.appendChild(tag);
      }
      list.appendChild(row);
    });
    const placeholders = Math.max(0, room.maxPlayers - room.players.length);
    for (let i=0;i<placeholders;i++){
      const row = document.createElement('div');
      row.className = 'player-row'; row.style.opacity = '.4';
      row.innerHTML = `<span class="dot" style="background:#4d5f52;"></span><span class="name mono">ожидание игрока…</span>`;
      list.appendChild(row);
    }
    const startBtn = document.getElementById('btnStart');
    startBtn.disabled = room.players.length < 2;
    startBtn.onclick = startGame;
  }

  function startGame(){
    mutate(r=>{
      const deck = Evo.shuffle(Evo.buildDeck());
      r.players.forEach(p=>{
        p.hand = []; p.table = []; p.discard = [];
        for (let i=0;i<6;i++){ const c = deck.pop(); if (c) p.hand.push(c); }
      });
      r.deck = deck;
      r.foodCount = 0;
      r.phase = 0;
      r.status = 'playing';
    });
  }

  /* ---------------- Phase tracker ---------------- */
  function renderPhaseTrack(){
    const track = document.getElementById('phaseTrack');
    track.innerHTML = '';
    Evo.PHASES.forEach((ph, idx)=>{
      const el = document.createElement('div');
      el.className = 'phase-pill' + (idx===room.phase ? ' active':'');
      el.innerHTML = `<div class="num">${['I','II','III','IV'][idx]}</div><div class="txt"><strong>${ph.title}</strong></div>`;
      el.addEventListener('click', ()=> mutate(r=>{ r.phase = idx; }));
      track.appendChild(el);
    });
    document.getElementById('phaseDetail').innerHTML = Evo.PHASES[room.phase].text;
  }

  /* ---------------- Game board ---------------- */
  function cardEl(card, { facedown=false, locked=false } = {}){
    const el = document.createElement('div');
    el.className = 'minicard' + (facedown ? ' facedown' : '') + (locked ? ' locked' : '');
    if (facedown){
      el.innerHTML = `<div class="mi-icon">🦎</div><div class="mi-name">вид</div>`;
    } else {
      const type = Evo.getType(card.typeId);
      const face = Evo.getFace(card);
      el.innerHTML = `<div class="mi-icon">${face.icon}</div><div class="mi-name">${face.name}</div>` +
        (type.faces.length > 1 ? `<div class="mi-flip" title="перевернуть карту">⟲</div>` : '');
      if (type.faces.length > 1){
        el.querySelector('.mi-flip').addEventListener('pointerdown', (e)=>{
          e.stopPropagation();
          mutate(r=>{
            const me = r.players.find(p=>p.id===Evo.Session.playerId);
            const c = me.hand.find(c=>c.uid===card.uid);
            if (c) c.face = c.face ? 0 : 1;
          });
        });
      }
    }
    return el;
  }

  function markDropzone(el, dataset){
    el.classList.add('dropzone');
    Object.entries(dataset).forEach(([k,v])=> el.dataset[k] = v);
  }

  function renderGame(){
    const me = myPlayer();
    if (!me) return;

    document.getElementById('myNameLabel').textContent = me.name;
    document.getElementById('foodCount').textContent = room.foodCount || 0;

    // --- draw pile ---
    const drawPile = document.getElementById('drawPile');
    drawPile.innerHTML = '';
    const pileCard = document.createElement('div');
    pileCard.className = 'minicard facedown';
    pileCard.innerHTML = `<div class="mi-icon">🂠</div><div class="mi-name">колода</div>`;
    drawPile.appendChild(pileCard);
    document.getElementById('drawMeta').textContent = room.deck.length + ' карт в колоде';
    pileCard.addEventListener('click', drawCard);
    Evo.Drag.makeDraggable(pileCard, { kind:'deck' }, handleDrop);

    // --- hand ---
    const handRow = document.getElementById('handRow');
    handRow.innerHTML = '';
    handRow.classList.toggle('empty', me.hand.length === 0);
    me.hand.forEach(card=>{
      const el = cardEl(card);
      Evo.Drag.makeDraggable(el, { kind:'hand', uid: card.uid }, handleDrop);
      handRow.appendChild(el);
    });
    markDropzone(handRow, { zoneType: 'hand' });
    document.getElementById('handCount').textContent = me.hand.length + ' карт';

    // --- discard (own) ---
    const discardRow = document.getElementById('discardRow');
    discardRow.innerHTML = '';
    discardRow.classList.toggle('empty', me.discard.length === 0);
    me.discard.slice(-8).forEach(card => discardRow.appendChild(cardEl(card, { locked:true })));
    markDropzone(discardRow, { zoneType: 'discard' });
    document.getElementById('discardCount').textContent = me.discard.length + ' карт';

    // --- all players' tables ---
    const allTables = document.getElementById('allTables');
    allTables.innerHTML = '';
    room.players.forEach(p=>{
      const zone = document.createElement('div');
      zone.className = 'zone' + (p.id === Evo.Session.playerId ? ' mine' : '');
      const h3 = document.createElement('h3');
      h3.innerHTML = `<span>Стол — <span class="pname">${p.name}${p.id===Evo.Session.playerId?' (вы)':''}</span></span><span class="mono">${p.table.length} видов</span>`;
      zone.appendChild(h3);

      const row = document.createElement('div');
      row.className = 'cardrow' + (p.table.length === 0 ? ' empty' : '');
      markDropzone(row, { zoneType: 'newspecies', zonePlayer: p.id });

      p.table.forEach((sp, idx)=>{
        const wrap = document.createElement('div');
        wrap.className = 'species';
        markDropzone(wrap, { zoneType: 'attach', zonePlayer: p.id, zoneSpecies: idx });
        wrap.appendChild(cardEl(sp.card, { facedown:true, locked:true }));
        const tags = document.createElement('div');
        tags.className = 'taglist';
        sp.props.forEach(pc=>{
          const face = Evo.getFace(pc);
          const t = document.createElement('span');
          t.className = 'tag';
          t.textContent = face.icon + ' ' + face.name;
          tags.appendChild(t);
        });
        wrap.appendChild(tags);
        const lbl = document.createElement('div');
        lbl.className = 'lbl'; lbl.textContent = 'вид №' + (idx+1);
        wrap.appendChild(lbl);
        row.appendChild(wrap);
      });
      zone.appendChild(row);
      allTables.appendChild(zone);
    });
  }

  function drawCard(){
    mutate(r=>{
      if (r.deck.length === 0) return;
      const me = r.players.find(p=>p.id===Evo.Session.playerId);
      me.hand.push(r.deck.pop());
    });
  }

  function handleDrop(payload, zone){
    if (!zone) return;

    if (payload.kind === 'deck' && zone.type === 'hand'){
      drawCard();
      return;
    }

    if (payload.kind === 'hand'){
      if (zone.type === 'newspecies'){
        mutate(r=>{
          const me = r.players.find(p=>p.id===Evo.Session.playerId);
          const target = r.players.find(p=>p.id===zone.playerId);
          const idx = me.hand.findIndex(c=>c.uid===payload.uid);
          if (idx<0 || !target) return;
          const [card] = me.hand.splice(idx,1);
          target.table.push({ card, props: [] });
        });
      } else if (zone.type === 'attach'){
        mutate(r=>{
          const me = r.players.find(p=>p.id===Evo.Session.playerId);
          const target = r.players.find(p=>p.id===zone.playerId);
          const idx = me.hand.findIndex(c=>c.uid===payload.uid);
          if (idx<0 || !target) return;
          const sp = target.table[Number(zone.speciesIdx)];
          if (!sp) return;
          const [card] = me.hand.splice(idx,1);
          sp.props.push(card);
        });
      } else if (zone.type === 'discard'){
        mutate(r=>{
          const me = r.players.find(p=>p.id===Evo.Session.playerId);
          const idx = me.hand.findIndex(c=>c.uid===payload.uid);
          if (idx<0) return;
          const [card] = me.hand.splice(idx,1);
          me.discard.push(card);
        });
      }
    }
  }

  function foodAdjust(delta){
    mutate(r=>{ r.foodCount = Math.max(0, (r.foodCount||0) + delta); });
  }

  return { enter, foodAdjust };
})();
