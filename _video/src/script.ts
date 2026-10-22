// Сценарий: каждая фраза — отдельная сцена. key: true — ключевое слово (акцентный цвет).
export type Word = {text: string; key?: boolean; attach?: boolean};
export type Scene = {lines: Word[][]; sub?: string; duration: number};

export const SCENES: Scene[] = [
  {lines: [[{text: 'Метраж'}], [{text: 'вручную?', key: true}]], duration: 75},
  {lines: [[{text: 'Часы.'}, {text: 'Ошибки.', key: true}, {text: 'Рутина.'}]], duration: 75},
  {lines: [[{text: 'Встречайте'}], [{text: 'QTOMate', key: true}]], duration: 80},
  {lines: [[{text: 'Загрузите'}], [{text: 'BIM-модель', key: true}]], duration: 75},
  {lines: [[{text: 'Объёмы'}], [{text: 'за'}, {text: 'минуты', key: true}]], duration: 75},
  {lines: [[{text: 'Точно.', key: true}], [{text: 'Автоматически.'}]], duration: 75},
  {lines: [[{text: 'QTO', key: true}, {text: 'Mate', attach: true}]], sub: 'Метраж без рутины', duration: 105},
];
