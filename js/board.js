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
  let currentOppIdx = 0;
  let controlsReady = false;

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
    if (!controlsReady) setupControls();
  }

  function setupControls(){
    controlsReady = true;

    // Стрелки соперников
    document.getElementById('oppArrowLeft').addEventListener('click', () => {
      if (currentOppIdx > 0) { currentOppIdx--; renderGame(); }
    });
    document.getElementById('oppArrowRight').addEventListener('click', () => {
      const opponents = room ? room.players.filter(p => p.id !== Evo.Session.playerId) : [];
      if (currentOppIdx < opponents.length - 1) { currentOppIdx++; renderGame(); }
    });

    // Свайп по зоне соперников
    const strip = document.getElementById('opponentStrip');
    let touchStartX = 0;
    strip.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    strip.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      const opponents = room ? room.players.filter(p => p.id !== Evo.Session.playerId) : [];
      if (Math.abs(diff) > 40) {
        if (diff > 0 && currentOppIdx < opponents.length - 1) currentOppIdx++;
        else if (diff < 0 && currentOppIdx > 0) currentOppIdx--;
        renderGame();
      }
    }, { passive: true });

    // Меню (три точки)
    document.getElementById('menuDots').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('controlsPopup').classList.toggle('open');
    });
    document.addEventListener('click', () => {
      document.getElementById('controlsPopup').classList.remove('open');
    });

    // Переключение вида через меню
    document.querySelectorAll('.ctrl-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + view).classList.add('active');
        document.querySelectorAll('nav.tabs button').forEach(b => {
          b.classList.toggle('active', b.dataset.view === view);
        });
      });
    });

    // Кормовая база
    document.getElementById('foodMinus').addEventListener('click', () => foodAdjust(-1));
    document.getElementById('foodPlus').addEventListener('click', () => foodAdjust(1));
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

    // Защита от undefined-массивов (Firebase стирает пустые [])
    const myHand    = me.hand    || [];
    const myDiscard = me.discard || [];

    renderPhaseTrack();
    renderSyncTag();

    // --- Соперники ---
    const opponents = room.players.filter(p => p.id !== Evo.Session.playerId);
    renderOpponents(opponents);

    // --- Стол игрока ---
    renderPlayerTable(me);

    // --- Колода ---
    renderDeck();

    // --- Рука ---
    renderHand(myHand);

    // --- Счётчики ---
    document.getElementById('foodCount').textContent = room.foodCount || 0;
    document.getElementById('discardCount').textContent = myDiscard.length;
    document.getElementById('handCount').textContent = myHand.length;
    document.getElementById('drawMeta').textContent = (room.deck ? room.deck.length : 0) + ' карт';
  }

  function renderOpponents(opponents) {
    const carousel = document.getElementById('opponentCarousel');
    carousel.innerHTML = '';

    if (opponents.length === 0) {
      carousel.innerHTML = '<div class="empty-opponent">Ожидание соперников…</div>';
      updateCarousel(0);
      return;
    }

    opponents.forEach((p, idx) => {
      const slot = document.createElement('div');
      slot.className = 'opponent-slot';
      slot.dataset.index = idx;

      const name = document.createElement('div');
      name.className = 'opponent-name';
      name.textContent = p.name;
      slot.appendChild(name);

      const tableRow = document.createElement('div');
      tableRow.className = 'opponent-table';
      markDropzone(tableRow, { zoneType: 'newspecies', zonePlayer: p.id });

      const table = p.table || [];
      table.forEach((sp, sIdx) => {
        tableRow.appendChild(createSpeciesCard(sp, sIdx, p.id, 'opponent'));
      });

      slot.appendChild(tableRow);
      carousel.appendChild(slot);
    });

    updateCarousel(opponents.length);
  }

  function createSpeciesCard(sp, idx, playerId, owner) {
    const props = sp.props || [];
    const wrap = document.createElement('div');
    wrap.className = 'species ' + (owner === 'player' ? 'player-species' : 'opponent-species');
    markDropzone(wrap, { zoneType: 'attach', zonePlayer: playerId, zoneSpecies: idx });

    // Анимация появления с задержкой
    wrap.style.animation = 'cardAppear 0.4s ease ' + (idx * 0.06) + 's both';

    if (owner === 'player') {
      // Props сверху (к зоне ивентов / центру)
      wrap.appendChild(createTagList(props));
      // Карта снизу
      wrap.appendChild(cardEl(sp.card, { facedown: true, locked: true }));
      // Метка
      const lbl = document.createElement('div');
      lbl.className = 'lbl';
      lbl.textContent = 'вид №' + (idx + 1);
      wrap.appendChild(lbl);
    } else {
      // Карта сверху
      wrap.appendChild(cardEl(sp.card, { facedown: true, locked: true }));
      // Props снизу (к зоне ивентов / центру)
      wrap.appendChild(createTagList(props));
      // Метка
      const lbl = document.createElement('div');
      lbl.className = 'lbl';
      lbl.textContent = 'вид №' + (idx + 1);
      wrap.appendChild(lbl);
    }

    return wrap;
  }

  function createTagList(props) {
    const tags = document.createElement('div');
    tags.className = 'taglist';
    props.forEach(pc => {
      const face = Evo.getFace(pc);
      const t = document.createElement('span');
      t.className = 'tag';
      t.textContent = face.icon + ' ' + face.name;
      tags.appendChild(t);
    });
    return tags;
  }

  function updateCarousel(total) {
    const carousel = document.getElementById('opponentCarousel');
    const left = document.getElementById('oppArrowLeft');
    const right = document.getElementById('oppArrowRight');

    if (window.innerWidth > 900 || total <= 1) {
      carousel.classList.remove('carousel-mode');
      left.style.display = 'none';
      right.style.display = 'none';
      carousel.style.transform = '';
      return;
    }

    carousel.classList.add('carousel-mode');
    left.style.display = 'flex';
    right.style.display = 'flex';
    left.disabled = currentOppIdx === 0;
    right.disabled = currentOppIdx >= total - 1;

    carousel.style.transform = `translateX(-${currentOppIdx * 100}%)`;
  }

  function renderPlayerTable(me) {
    const container = document.getElementById('playerTable');
    container.innerHTML = '';
    markDropzone(container, { zoneType: 'newspecies', zonePlayer: me.id });

    const table = me.table || [];
    table.forEach((sp, idx) => {
      container.appendChild(createSpeciesCard(sp, idx, me.id, 'player'));
    });

    if (table.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'table-hint';
      hint.textContent = 'Перетащите карту сюда, чтобы создать новый вид';
      container.appendChild(hint);
    }
  }

  function renderDeck() {
    const pile = document.getElementById('drawPile');
    pile.innerHTML = '';

    const deckCount = room.deck ? room.deck.length : 0;
    const visibleCards = Math.min(3, Math.max(1, deckCount));

    for (let i = 0; i < visibleCards; i++) {
      const card = document.createElement('div');
      card.className = 'minicard facedown';
      card.innerHTML = `<div class="mi-icon">🂠</div><div class="mi-name">колода</div>`;
      card.style.position = 'absolute';
      card.style.top = (i * 2) + 'px';
      card.style.left = (i * 2) + 'px';
      card.style.zIndex = visibleCards - i;
      card.style.transform = `rotate(${(i - 1) * 1.2}deg)`;

      if (i === 0) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', drawCard);
        Evo.Drag.makeDraggable(card, { kind: 'deck' }, handleDrop);
      } else {
        card.style.pointerEvents = 'none';
        card.style.opacity = (0.9 - i * 0.08).toString();
      }
      pile.appendChild(card);
    }
  }

  function renderHand(hand) {
    const row = document.getElementById('handRow');
    row.innerHTML = '';

    hand.forEach((card, idx) => {
      const el = cardEl(card);
      el.style.animation = 'cardAppear 0.3s ease ' + (idx * 0.04) + 's both';
      Evo.Drag.makeDraggable(el, { kind: 'hand', uid: card.uid }, handleDrop);
      row.appendChild(el);
    });

    if (hand.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hand-empty';
      empty.textContent = 'Пусто';
      row.appendChild(empty);
    }
  }

  function drawCard(){
    mutate(r=>{
      if (!r.deck || r.deck.length === 0) return;
      const me = r.players.find(p=>p.id===Evo.Session.playerId);
      if (!me) return;
      if (!me.hand) me.hand = [];
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
          if (!me || !target) return;
          if (!me.hand) me.hand = [];
          if (!target.table) target.table = [];
          const idx = me.hand.findIndex(c=>c.uid===payload.uid);
          if (idx<0) return;
          const [card] = me.hand.splice(idx,1);
          target.table.push({ card, props: [] });
        });
      } else if (zone.type === 'attach'){
        mutate(r=>{
          const me = r.players.find(p=>p.id===Evo.Session.playerId);
          const target = r.players.find(p=>p.id===zone.playerId);
          if (!me || !target) return;
          if (!me.hand) me.hand = [];
          if (!target.table) target.table = [];
          const idx = me.hand.findIndex(c=>c.uid===payload.uid);
          if (idx<0) return;
          const sp = target.table[Number(zone.speciesIdx)];
          if (!sp) return;
          if (!sp.props) sp.props = [];
          const [card] = me.hand.splice(idx,1);
          sp.props.push(card);
        });
      } else if (zone.type === 'discard'){
        mutate(r=>{
          const me = r.players.find(p=>p.id===Evo.Session.playerId);
          if (!me) return;
          if (!me.hand) me.hand = [];
          if (!me.discard) me.discard = [];
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
