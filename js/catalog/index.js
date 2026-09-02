/* ============================================================
   catalog/index.js — вкладка "Каталог карт": публичная точка
   входа, вызывает рендер всех частей экрана по порядку.
   ============================================================ */
import { renderMeta } from './meta.js';
import { renderMosaic } from './mosaic.js';
import { renderChipbar } from './chipbar.js';
import { renderGrid } from './grid.js';

export function render(){
  renderMeta();
  renderMosaic();
  renderChipbar();
  renderGrid();
}
