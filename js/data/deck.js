/* ============================================================
   data/deck.js — сборка/тасовка колоды и поиск карт по id.
   Опирается только на данные из cards.js.
   ============================================================ */
import { CARD_TYPES } from './cards.js';

export const TOTAL_CARDS = CARD_TYPES.reduce((sum, t) => sum + t.count, 0); // = 84

export function getType(typeId){
  return CARD_TYPES.find(t => t.id === typeId);
}

export function getFace(cardInstance){
  const type = getType(cardInstance.typeId);
  return type.faces[cardInstance.face || 0];
}

export function buildDeck(){
  const deck = [];
  CARD_TYPES.forEach(type => {
    for (let i = 0; i < type.count; i++){
      deck.push({ uid: type.id + '-' + i, typeId: type.id, face: 0 });
    }
  });
  return deck;
}

export function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
