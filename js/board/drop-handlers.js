/* ============================================================
   board/drop-handlers.js — куда переносится карта, когда её
   отпускают над той или иной .dropzone. Правила игры не
   проверяются: куда перетащили, туда и легло.
   ============================================================ */
import { getType } from '../data/deck.js';
import { getSession } from '../session.js';
import { mutate } from './state.js';
import { drawCard } from './deck-view.js';
import { chooseFace } from './face-choice-popup.js';

export function handleDrop(payload, zone){
  if (!zone) return;

  if (payload.kind === 'deck' && zone.type === 'hand'){
    drawCard();
    return;
  }

  if (payload.kind !== 'hand') return;

  if (zone.type === 'newspecies') return dropAsNewSpecies(payload, zone);
  if (zone.type === 'attach') return dropAsProperty(payload, zone);
  if (zone.type === 'discard') return dropAsDiscard(payload);
}

function dropAsNewSpecies(payload, zone){
  mutate(r => {
    const session = getSession();
    const me = r.players.find(p => p.id === session.playerId);
    const target = r.players.find(p => p.id === zone.playerId);
    if (!me || !target) return;
    if (!me.hand) me.hand = [];
    if (!target.table) target.table = [];
    const idx = me.hand.findIndex(c => c.uid === payload.uid);
    if (idx < 0) return;
    const [card] = me.hand.splice(idx, 1);
    target.table.push({ card, props: [] });
  });
}

function dropAsProperty(payload, zone){
  // У двусторонних карт (напр. «Паразит / Хищник») сторону теперь
  // выбирают в момент розыгрыша, всплывающим попапом — вместо
  // прежней кнопки-флипа прямо на карте в руке.
  const type = getType(payload.typeId);
  if (type.faces.length > 1){
    chooseFace(payload.typeId, faceIdx => commitProperty(payload, zone, faceIdx));
  } else {
    commitProperty(payload, zone, 0);
  }
}

function commitProperty(payload, zone, faceIdx){
  mutate(r => {
    const session = getSession();
    const me = r.players.find(p => p.id === session.playerId);
    const target = r.players.find(p => p.id === zone.playerId);
    if (!me || !target) return;
    if (!me.hand) me.hand = [];
    if (!target.table) target.table = [];
    const idx = me.hand.findIndex(c => c.uid === payload.uid);
    if (idx < 0) return;
    const sp = target.table[Number(zone.speciesIdx)];
    if (!sp) return;
    if (!sp.props) sp.props = [];
    const [card] = me.hand.splice(idx, 1);
    card.face = faceIdx;
    sp.props.push(card);
  });
}

function dropAsDiscard(payload){
  mutate(r => {
    const session = getSession();
    const me = r.players.find(p => p.id === session.playerId);
    if (!me) return;
    if (!me.hand) me.hand = [];
    if (!me.discard) me.discard = [];
    const idx = me.hand.findIndex(c => c.uid === payload.uid);
    if (idx < 0) return;
    const [card] = me.hand.splice(idx, 1);
    me.discard.push(card);
  });
}

export function foodAdjust(delta){
  mutate(r => { r.foodCount = Math.max(0, (r.foodCount || 0) + delta); });
}
