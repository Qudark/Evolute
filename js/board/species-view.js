/* ============================================================
   board/species-view.js — один "вид" на столе: карта-вид +
   прикреплённые к нему карты-свойства (в виде тегов).
   Свой вид рисуется тегами сверху, вид соперника — снизу
   (оба тянутся к центральной "зоне ивентов").
   ============================================================ */
import { getFace } from '../data/deck.js';
import { cardEl } from './card-view.js';
import { markDropzone } from './dropzone-utils.js';
import { shouldAnimate } from './appear-tracker.js';

export function createTagList(props){
  const tags = document.createElement('div');
  tags.className = 'taglist';
  props.forEach(pc => {
    const face = getFace(pc);
    const t = document.createElement('span');
    t.className = 'tag';
    t.textContent = face.icon + ' ' + face.name;
    tags.appendChild(t);
  });
  return tags;
}

export function createSpeciesCard(sp, idx, playerId, owner){
  const props = sp.props || [];
  const wrap = document.createElement('div');
  wrap.className = 'species ' + (owner === 'player' ? 'player-species' : 'opponent-species');
  markDropzone(wrap, { zoneType: 'attach', zonePlayer: playerId, zoneSpecies: idx });
  // Анимация появления — только если этот вид (по uid его карты)
  // ещё не был показан ни разу, иначе рендер просто перерисовывает
  // существующую карточку без "мигания" (см. appear-tracker.js).
  if (shouldAnimate(sp.card.uid)){
    wrap.style.animation = 'cardAppear 0.4s ease ' + (idx * 0.06) + 's both';
  }

  const label = document.createElement('div');
  label.className = 'lbl';
  label.textContent = 'вид №' + (idx + 1);

  if (owner === 'player'){
    // Props сверху (к зоне ивентов / центру), карта снизу, метка последней.
    wrap.appendChild(createTagList(props));
    wrap.appendChild(cardEl());
    wrap.appendChild(label);
  } else {
    // Карта сверху, props снизу (к зоне ивентов / центру), метка последней.
    wrap.appendChild(cardEl());
    wrap.appendChild(createTagList(props));
    wrap.appendChild(label);
  }

  return wrap;
}
