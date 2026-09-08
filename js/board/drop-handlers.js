/* ============================================================
   board/drop-handlers.js — куда переносится карта, когда её
   отпускают над той или иной .dropzone. Правила игры не
   проверяются: куда перетащили, туда и легло.
   ============================================================ */
import { getType } from '../data/deck.js';
import { getSession } from '../session.js';
import { getRoom, mutate } from './state.js';
import { drawCard } from './deck-view.js';
import { chooseFace } from './face-choice-popup.js';
import { choosePartner, chooseSymbiont } from './pair-choice-popup.js';

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
    chooseFace(payload.typeId, faceIdx => afterFaceChosen(payload, zone, type, faceIdx));
  } else {
    afterFaceChosen(payload, zone, type, 0);
  }
}

function afterFaceChosen(payload, zone, type, faceIdx){
  const face = type.faces[faceIdx];
  // face.pair (см. data/cards.js — Симбиоз/Взаимодействие/Сотрудничество)
  // значит, что этой стороной карту нельзя прикрепить к одному виду:
  // нужен второй вид с того же стола, чтобы сыграть карту "между" ними.
  if (face.pair){
    startPairFlow(payload, zone, faceIdx, face);
  } else {
    commitProperty(payload, zone, faceIdx);
  }
}

function startPairFlow(payload, zone, faceIdx, face){
  const room = getRoom();
  const target = room && room.players.find(p => p.id === zone.playerId);
  const table = (target && target.table) || [];
  const primary = table[Number(zone.speciesIdx)];
  if (!primary) return; // вид, на который бросили карту, уже пропал со стола

  const primaryUid = primary.card.uid;
  const candidates = table
    .filter(sp => sp.card.uid !== primaryUid)
    .map(sp => ({ uid: sp.card.uid, label: 'Вид №' + (table.indexOf(sp) + 1) }));

  if (candidates.length === 0) return; // не с кем сыграть парную карту — на столе только этот один вид

  choosePartner(candidates, partnerUid => {
    if (face.symbiontChoice){
      const primaryChoice = { uid: primaryUid, label: 'Вид №' + (table.indexOf(primary) + 1) };
      const partnerChoice = candidates.find(c => c.uid === partnerUid);
      chooseSymbiont(primaryChoice, partnerChoice, symbiontUid => {
        commitPairProperty(payload, zone.playerId, primaryUid, partnerUid, faceIdx, symbiontUid);
      });
    } else {
      commitPairProperty(payload, zone.playerId, primaryUid, partnerUid, faceIdx, null);
    }
  });
}

/* Прикрепляет парную карту сразу к ДВУМ видам одного стола (найденным
   заново по uid — за время попапов стол мог перерисоваться). Каждый
   вид получает свою копию карты с pairWith — uid карты-вида партнёра,
   чтобы card-view.js мог показать её как реально парное свойство, а
   не как две независимые карты. Для Симбиоза (symbiontUid задан)
   дополнительно помечает, какая из копий — сторона симбионта. */
function commitPairProperty(payload, playerId, primaryUid, partnerUid, faceIdx, symbiontUid){
  mutate(r => {
    const session = getSession();
    const me = r.players.find(p => p.id === session.playerId);
    const target = r.players.find(p => p.id === playerId);
    if (!me || !target || !target.table) return;
    if (!me.hand) me.hand = [];
    const handIdx = me.hand.findIndex(c => c.uid === payload.uid);
    if (handIdx < 0) return;
    const spA = target.table.find(sp => sp.card.uid === primaryUid);
    const spB = target.table.find(sp => sp.card.uid === partnerUid);
    if (!spA || !spB) return; // один из видов сбросили, пока игрок выбирал

    const [card] = me.hand.splice(handIdx, 1);
    card.face = faceIdx;
    if (!spA.props) spA.props = [];
    if (!spB.props) spB.props = [];

    const cardForA = { ...card, pairWith: spB.card.uid };
    const cardForB = { ...card, pairWith: spA.card.uid };
    if (symbiontUid){
      cardForA.symbiont = symbiontUid === spA.card.uid;
      cardForB.symbiont = symbiontUid === spB.card.uid;
    }
    spA.props.push(cardForA);
    spB.props.push(cardForB);
  });
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

/* Сбросить целый вид со стола (карту-вид + все прикреплённые к
   нему карты-свойства) — используется попапом по долгому нажатию
   на карточке (см. species-popup.js / table-gestures.js). Ищем вид
   по uid его карты, а не по индексу в массиве — индекс мог устареть
   между долгим нажатием и нажатием кнопки в попапе (например, кто-то
   успел сбросить другой вид раньше в этом же столе). */
export function discardSpecies(playerId, speciesUid){
  mutate(r => {
    const target = r.players.find(p => p.id === playerId);
    if (!target || !target.table) return;
    const idx = target.table.findIndex(sp => sp.card.uid === speciesUid);
    if (idx < 0) return;
    const [sp] = target.table.splice(idx, 1);
    if (!target.discard) target.discard = [];
    target.discard.push(sp.card, ...(sp.props || []));
  });
}

/* Переставляет вид на новую позицию в РЯДУ ТОГО ЖЕ игрока (перетаскивание
   существа по столу, см. table-gestures.js). Ищем по uid карты-вида, а
   не по индексу — тот мог устареть, пока шёл сам жест. insertIndex —
   позиция, на которую нужно поставить вид, СЧИТАННАЯ УЖЕ ПОСЛЕ того,
   как он мысленно убран из ряда (так её и вычисляет table-gestures.js,
   перебирая соседей без самого перетаскиваемого вида) — поэтому здесь
   он просто splice-ится обратно по этому индексу без досчёта. */
export function reorderSpecies(playerId, speciesUid, insertIndex){
  mutate(r => {
    const target = r.players.find(p => p.id === playerId);
    if (!target || !target.table) return;
    const fromIndex = target.table.findIndex(sp => sp.card.uid === speciesUid);
    if (fromIndex < 0) return;
    const [sp] = target.table.splice(fromIndex, 1);
    let idx = insertIndex;
    if (idx < 0) idx = 0;
    if (idx > target.table.length) idx = target.table.length;
    target.table.splice(idx, 0, sp);
  });
}

export function foodAdjust(delta){
  mutate(r => { r.foodCount = Math.max(0, (r.foodCount || 0) + delta); });
}
