/* ============================================================
   Evo.Data — карты, категории, стадии хода.
   Состав колоды сверен со скриншотом набора: ровно 84 карты,
   часть из них двусторонние (вторая сторона — ХИЩНИК или
   ЖИРОВОЙ ЗАПАС). Меняете баланс/тексты карт — правьте только
   этот файл, остальной код от него не зависит по структуре.
   ============================================================ */
window.Evo = window.Evo || {};

Evo.CATEGORY_META = {
  attack:  { label: 'Атака',   color: 'var(--c-attack)'  },
  defense: { label: 'Защита',  color: 'var(--c-defense)' },
  feeding: { label: 'Питание', color: 'var(--c-feeding)' },
  growth:  { label: 'Рост',    color: 'var(--c-growth)'  },
};

// Переиспользуемые описания "общих" граней двусторонних карт
const FACE_PREDATOR = { name: 'Хищник', cat: 'attack', icon: '🦖',
  desc: 'Позволяет напасть на другой вид вместо похода к кормовой базе.' };
const FACE_FAT = { name: 'Жировой запас', cat: 'growth', icon: '🐻',
  desc: 'Копит пищу впрок, позволяя пережить раунд с нехваткой корма.' };

/* Каждый тип карты: id, count (сколько физических карт этого типа
   в колоде), faces — 1 или 2 стороны. Если faces.length === 2,
   карта двусторонняя, игрок выбирает, какой стороной играть. */
Evo.CARD_TYPES = [
  { id:'camouflage', count:4, faces:[
    { name:'Камуфляж', cat:'defense', icon:'🍃',
      desc:'Может быть атаковано только хищником со свойством «Острое зрение».' } ] },

  { id:'burrow', count:4, faces:[
    { name:'Норное', cat:'defense', icon:'🕳️',
      desc:'Пока вид накормлен, хищник не может на него напасть.' } ] },

  { id:'sharpvision', count:4, faces:[
    { name:'Острое зрение', cat:'attack', icon:'👁️',
      desc:'Хищник с этим свойством может атаковать виды со свойством «Камуфляж».' } ] },

  { id:'symbiosis', count:4, faces:[
    { name:'Симбиоз', cat:'feeding', icon:'🐠',
      desc:'Играется сразу на пару соседних видов: симбионт защищает соседа, а тот делится с ним пищей.' } ] },

  { id:'piracy', count:4, faces:[
    { name:'Пиратство', cat:'attack', icon:'🏴‍☠️',
      desc:'Раз за ход можно отобрать пищу у уже накормленного вида другого игрока.' } ] },

  { id:'stomper', count:4, faces:[
    { name:'Топотун', cat:'attack', icon:'🐾',
      desc:'В свою фазу питания уничтожает одну фишку пищи в общей кормовой базе.' } ] },

  { id:'taildrop', count:4, faces:[
    { name:'Отбрасывание хвоста', cat:'defense', icon:'✂️',
      desc:'При атаке хищника вид выживает, сбросив взамен одну из своих карт свойств.' } ] },

  { id:'hibernation', count:4, faces:[
    { name:'Спячка', cat:'growth', icon:'😴',
      desc:'Раз в свою фазу питания вид автоматически считается накормленным — но не два хода подряд и не в последний ход.' } ] },

  { id:'poisonous', count:4, faces:[
    { name:'Ядовитое', cat:'defense', icon:'☠️',
      desc:'Хищник, съевший этот вид, погибает в фазу вымирания.' } ] },

  { id:'interaction', count:4, faces:[
    { name:'Взаимодействие', cat:'feeding', icon:'🔗',
      desc:'Играется на пару соседних видов: когда один берёт пищу из базы, второй получает ещё одну сверх очереди.' } ] },

  { id:'scavenger', count:4, faces:[
    { name:'Падальщик', cat:'feeding', icon:'🦴',
      desc:'Получает фишку пищи каждый раз, когда на столе съедают другой вид.' } ] },

  { id:'fast', count:4, faces:[
    { name:'Быстрое', cat:'defense', icon:'💨',
      desc:'При атаке хищника бросается кубик: на 4–6 вид спасается.' } ] },

  { id:'mimicry', count:4, faces:[
    { name:'Мимикрия', cat:'defense', icon:'🦎',
      desc:'При атаке хищника владелец перенаправляет её на другой свой вид, которого хищник способен атаковать.' } ] },

  { id:'aquatic', count:8, faces:[
    { name:'Водоплавающее', cat:'defense', icon:'🌊',
      desc:'Может быть атаковано только хищником с этим же свойством.' } ] },

  // -------- двусторонние карты --------
  { id:'parasite_predator', count:4, faces:[
    { name:'Паразит', cat:'attack', icon:'🪱',
      desc:'Играется на вид другого игрока: каждый ход забирает у него часть добытой пищи.' },
    FACE_PREDATOR ] },

  { id:'parasite_fat', count:4, faces:[
    { name:'Паразит', cat:'attack', icon:'🪱',
      desc:'Играется на вид другого игрока: каждый ход забирает у него часть добытой пищи.' },
    FACE_FAT ] },

  { id:'cooperation_predator', count:4, faces:[
    { name:'Сотрудничество', cat:'feeding', icon:'🤝',
      desc:'Играется на пару соседних видов: когда один добывает пищу, второй сразу получает фишку вне очереди.' },
    FACE_PREDATOR ] },

  { id:'cooperation_fat', count:4, faces:[
    { name:'Сотрудничество', cat:'feeding', icon:'🤝',
      desc:'Играется на пару соседних видов: когда один добывает пищу, второй сразу получает фишку вне очереди.' },
    FACE_FAT ] },

  { id:'big_predator', count:4, faces:[
    { name:'Большой', cat:'defense', icon:'🦕',
      desc:'Может быть атаковано только хищником с этим же свойством.' },
    FACE_PREDATOR ] },

  { id:'big_fat', count:4, faces:[
    { name:'Большой', cat:'defense', icon:'🦕',
      desc:'Может быть атаковано только хищником с этим же свойством.' },
    FACE_FAT ] },
];

Evo.PHASES = [
  { title:'Развитие', sub:'Разыгрывание карт',
    text:'Игроки по очереди играют по одной карте: как <b>новый вид</b> (рубашкой вверх) или как <b>свойство</b> для уже существующего вида (лицом вверх).' },
  { title:'Кормовая база', sub:'Определение пищи',
    text:'Подсчитывается, сколько пищи появится в общей кормовой базе в этом раунде.' },
  { title:'Питание', sub:'Фаза добычи корма',
    text:'По очереди игроки кормят своих существ: берут фишки, применяют свойства, хищники нападают.' },
  { title:'Вымирание', sub:'Подведение итогов',
    text:'Непрокормленные виды выбывают. Выжившие виды и их свойства приносят игрокам очки в конце партии.' },
];

Evo.getType = function(typeId){
  return Evo.CARD_TYPES.find(t => t.id === typeId);
};
Evo.getFace = function(cardInstance){
  const type = Evo.getType(cardInstance.typeId);
  return type.faces[cardInstance.face || 0];
};
Evo.TOTAL_CARDS = Evo.CARD_TYPES.reduce((s, t) => s + t.count, 0); // = 84

Evo.buildDeck = function(){
  const deck = [];
  Evo.CARD_TYPES.forEach(type=>{
    for (let i = 0; i < type.count; i++){
      deck.push({ uid: type.id + '-' + i, typeId: type.id, face: 0 });
    }
  });
  return deck;
};

Evo.shuffle = function(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
