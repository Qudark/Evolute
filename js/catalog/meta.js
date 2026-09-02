/* ============================================================
   catalog/meta.js — строка "84 карты · 20 типов карт".
   ============================================================ */
import { CARD_TYPES } from '../data/cards.js';
import { TOTAL_CARDS } from '../data/deck.js';

export function renderMeta(){
  document.getElementById('deckMeta').textContent =
    TOTAL_CARDS + ' карт · ' + CARD_TYPES.length + ' типов карт';
}
