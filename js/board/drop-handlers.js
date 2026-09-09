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
import { chooseSymbiontSide } from './pair-choice-popup.js';

export function handleDrop(payload, zone){
  if (!zone) return;

  if (payload.kind === 'deck' && zone.type === 'hand'){
    drawCard();
    return;
  }

  if (payload.kind !== 'hand') return;

  if (zone.type === 'newspecies') return dropAsNewSpecies(payload, zone);
  if (zone.type === 'attach') return dropAsProperty(payload, zone);
  if (zone.type === 'pair') return dropAsPairProperty(payload, zone);
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

/* Бросок карты-свойства ПРЯМО НА один вид (обычная .species-зона,
   zoneType 'attach'). Карты, у которых пара — единственная сторона
   (Симбиоз/Взаимодействие), сюда положить нельзя вовсе: у них нет
   ни одной "одиночной" грани, значит и класть тут нечего — вместо
   попапа просто ничего не происходит (см. dropAsPairProperty ниже,
   для них есть отдельная щель МЕЖДУ двумя видами). У двусторонних
   карт с ОДНОЙ парной и одной обычной гранью (оба «Сотрудничества» —
   Хищник/Жировой запас с другой стороны) сюда допустима только
   обычная грань, и раз она ровно одна — сразу разыгрываем её без
   лишнего попапа "какой стороной?": здесь и так очевидно, какая
   сторона имелась в виду, раз положили на одиночный вид. Попап
   остаётся только там, где ОБЕ стороны — обычные (Паразит/Хищник,
   Большой/Хищник и т.п.) и выбор действительно неоднозначен. */
function dropAsProperty(payload, zone){
  const type = getType(payload.typeId);
  const soloFaceIdxs = type.faces.map((f, i) => i).filter(i => !type.faces[i].pair);

  if (soloFaceIdxs.length === 0) return; // все стороны этой карты — парные, на одиночный вид её не положить
  if (soloFaceIdxs.length === 1){
    commitProperty(payload, zone, soloFaceIdxs[0]);
  } else {
    chooseFace(payload.typeId, faceIdx => commitProperty(payload, zone, faceIdx));
  }
}

/* Бросок карты-свойства В ЩЕЛЬ МЕЖДУ двумя конкретными соседними
   видами (zoneType 'pair', см. species-view.js/buildGap) — сюда
   попадают только парные карты, партнёр уже известен из самой
   щели (zone.leftUid/zone.rightUid), выбирать его попапом больше
   не нужно. Для Симбиоза (face.symbiontChoice) дополнительно
   спрашиваем, какая из двух сторон — симбионт. */
function dropAsPairProperty(payload, zone){
  const type = getType(payload.typeId);
  const pairFaceIdxs = type.faces.map((f, i) => i).filter(i => !!type.faces[i].pair);
  if (pairFaceIdxs.length === 0) return; // у этой карты вообще нет парной грани — щель ей ни к чему

  const faceIdx = pairFaceIdxs[0]; // у всех наших типов карт парная грань ровно одна
  const face = type.faces[faceIdx];

  if (face.symbiontChoice){
    chooseSymbiontSide(side => {
      const symbiontUid = side === 'left' ? zone.leftUid : zone.rightUid;
      commitPairProperty(payload, zone.playerId, zone.leftUid, zone.rightUid, faceIdx, symbiontUid);
    });
  } else {
    commitPairProperty(payload, zone.playerId, zone.leftUid, zone.rightUid, faceIdx, null);
  }
}

/* Прикрепляет парную карту сразу к ДВУМ видам одного стола (ищем их
   заново по uid, а не храним ссылки — за время попапа "кто симбионт"
   стол мог перерисоваться). Каждый вид получает свою копию карты с
   pairWith — uid карты-вида партнёра, чтобы species-view.js мог
   нарисовать между ними подписанный блок со стрелками вместо тега
   на самой карточке (см. card-view.js — такие копии он теперь
   пропускает). Для Симбиоза (symbiontUid задан) дополнительно
   помечает, какая из копий — сторона симбионта. */
function commitPairProperty(payload, playerId, leftUid, rightUid, faceIdx, symbiontUid){
  mutate(r => {
    const session = getSession();
    const me = r.players.find(p => p.id === session.playerId);
    const target = r.players.find(p => p.id === playerId);
    if (!me || !target || !target.table) return;
    if (!me.hand) me.hand = [];
    const handIdx = me.hand.findIndex(c => c.uid === payload.uid);
    if (handIdx < 0) return;
    const spA = target.table.find(sp => sp.card.uid === leftUid);
    const spB = target.table.find(sp => sp.card.uid === rightUid);
    if (!spA || !spB) return; // один из видов сбросили, пока игрок выбирал симбионта

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
   нему карты-свойства) — используется попапом, который всплывает,
   если поднять вид и отпустить его на том же месте (см.
   species-popup.js / table-gestures.js). Ищем вид по uid его карты,
   а не по индексу в массиве — индекс мог устареть между поднятием
   вида и нажатием кнопки в попапе. Если у вида была парная карта
   (Симбиоз/Взаимодействие/Сотрудничество) с соседом — у соседа
   остаётся её копия с pairWith на уже несуществующий uid; она
   перестаёт что-либо рисовать сама по себе (species-view.js ищет
   живого соседа с таким uid), но чтобы не таскать мёртвые данные,
   заодно вычищаем её из props оставшихся видов. */
export function discardSpecies(playerId, speciesUid){
  mutate(r => {
    const target = r.players.find(p => p.id === playerId);
    if (!target || !target.table) return;
    const idx = target.table.findIndex(sp => sp.card.uid === speciesUid);
    if (idx < 0) return;
    const [sp] = target.table.splice(idx, 1);
    if (!target.discard) target.discard = [];
    target.discard.push(sp.card, ...(sp.props || []));

    target.table.forEach(other => {
      if (!other.props) return;
      other.props = other.props.filter(pc => pc.pairWith !== speciesUid);
    });
  });
}

/* Переставляет ЦЕЛЫЙ СВЯЗАННЫЙ БЛОК видов на новую позицию в РЯДУ
   ТОГО ЖЕ игрока (перетаскивание существа по столу, см.
   table-gestures.js). Виды, скреплённые парной картой свойства,
   двигаются только вместе — их и приходит СПИСКОМ uid'ов, уже в
   исходном взаимном порядке (table-gestures.js сам находит весь
   связанный блок вокруг того вида, который потянули). insertIndex —
   позиция для этого блока, СЧИТАННАЯ УЖЕ ПОСЛЕ того, как весь блок
   мысленно убран из ряда (так её и вычисляет table-gestures.js,
   перебирая оставшихся соседей) — поэтому здесь он просто
   splice-ится обратно по этому индексу без досчёта. */
export function reorderSpecies(playerId, uids, insertIndex){
  mutate(r => {
    const target = r.players.find(p => p.id === playerId);
    if (!target || !target.table) return;
    const uidSet = new Set(uids);
    const block = target.table.filter(sp => uidSet.has(sp.card.uid));
    if (block.length !== uidSet.size) return; // часть связанного блока пропала, пока шёл жест
    const rest = target.table.filter(sp => !uidSet.has(sp.card.uid));
    let idx = insertIndex;
    if (idx < 0) idx = 0;
    if (idx > rest.length) idx = rest.length;
    rest.splice(idx, 0, ...block);
    target.table = rest;
  });
}

export function foodAdjust(delta){
  mutate(r => { r.foodCount = Math.max(0, (r.foodCount || 0) + delta); });
}
