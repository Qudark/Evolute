/* ============================================================
   board/dropzone-utils.js — общий помощник для разметки зон,
   куда можно перетащить карту (используется в нескольких view).
   ============================================================ */
export function markDropzone(el, dataset){
  el.classList.add('dropzone');
  Object.entries(dataset).forEach(([k, v]) => { el.dataset[k] = v; });
}
