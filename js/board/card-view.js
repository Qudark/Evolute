/* ============================================================
   board/card-view.js — рубашка карты-вида на столе (всегда
   лицом вниз и заблокирована — сам вид не берётся в руку),
   с прикреплёнными свойствами прямо на самой карточке (плашка
   .mi-tags поверх нижней части — см. 10-cards.css).
   Лицевая сторона карты в руке рисуется в hand-view.js: там
   другая механика (аккордеон, жест выбора), поэтому вынесена
   в отдельный файл вместо переиспользования этого.
   ============================================================ */
import { getFace } from '../data/deck.js';

const MARQUEE_PX_PER_SEC = 26;
const MARQUEE_MIN_DURATION = 2.5;

export function cardEl(props = []){
  const el = document.createElement('div');
  el.className = 'minicard facedown locked';
  el.innerHTML = `<div class="mi-icon">🦎</div><div class="mi-name">вид</div>`;

  if (props.length){
    const tags = document.createElement('div');
    tags.className = 'mi-tags';

    props.forEach(pc => {
      const face = getFace(pc);
      const tag = document.createElement('div');
      tag.className = 'mi-tag';

      const icon = document.createElement('span');
      icon.className = 'mi-tag-icon';
      icon.textContent = face.icon;

      const name = document.createElement('span');
      name.className = 'mi-tag-name';
      const inner = document.createElement('span');
      inner.className = 'mi-tag-name-inner';
      inner.textContent = face.name;
      name.appendChild(inner);

      tag.appendChild(icon);
      tag.appendChild(name);
      tags.appendChild(tag);

      // Меряем реальную ширину ПОСЛЕ того, как элемент попадёт в
      // документ и получит раскладку (rAF ждёт следующий кадр) —
      // до этого offsetWidth/scrollWidth ничего не значат.
      requestAnimationFrame(() => fitTagMarquee(name, inner, face.name));
    });

    el.appendChild(tags);
  }

  return el;
}

function fitTagMarquee(nameEl, innerEl, text){
  const overflow = innerEl.scrollWidth - nameEl.clientWidth;
  if (overflow <= 1) return; // название и так помещается — ничего не трогаем

  // Дублируем текст с разделителем и едем ровно на ширину одной
  // копии — на стыке цикл выглядит бесшовным.
  innerEl.textContent = text + '\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0' + text;
  const distance = innerEl.scrollWidth / 2;
  const duration = Math.max(MARQUEE_MIN_DURATION, distance / MARQUEE_PX_PER_SEC);
  innerEl.style.setProperty('--marquee-distance', distance + 'px');
  innerEl.style.setProperty('--marquee-duration', duration + 's');
  nameEl.classList.add('marquee');
}
