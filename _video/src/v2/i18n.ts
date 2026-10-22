// Тексты ролика на четырёх языках сайта. Формулировки взяты из _build/strings.py сайта,
// чтобы ролик не обещал больше, чем сайт.
export type Lang = 'en' | 'ru' | 'uz' | 'tr';
export const LANGS: Lang[] = ['en', 'ru', 'uz', 'tr'];
export type Word = {text: string; key?: boolean; dim?: string};
export type Lines = Word[][];
type L<T> = Record<Lang, T>;

const w = (text: string, key = false, dim?: string): Word => ({text, key, dim});

export const COPY: {
  hook: L<{h: Lines; v: Lines}>;
  manual: L<{h: Lines; v?: Lines}>;
  measure: L<{h: Lines; v?: Lines}>;
  scan: L<{h: Lines; v: Lines}>;
  approve: L<{h: Lines; v?: Lines}>;
  excel: L<{h: Lines; v?: Lines}>;
  tagline: L<string>;
  sheetLabels: L<[string, string, string]>;
  rooms: L<[string, string, string]>;
  rows: L<Record<string, string>>;
  units: L<Record<string, string>>;
  dec: L<string>;
  boqTitle: L<string>;
  boqSrc: L<string>;
  approved: L<string>;
  allApproved: L<string>;
  sample: L<string>;
} = {
  hook: {
    en: {h: [[w('Still measuring')], [w('by hand?', true, 'Σ = ?')]], v: [[w('Still')], [w('measuring')], [w('by hand?', true, 'Σ = ?')]]},
    ru: {h: [[w('Всё ещё считаете')], [w('вручную?', true, 'Σ = ?')]], v: [[w('Всё ещё')], [w('считаете')], [w('вручную?', true, 'Σ = ?')]]},
    uz: {h: [[w('Hali ham'), w('qo‘lda', true, 'Σ = ?')], [w('o‘lchaysizmi?')]], v: [[w('Hali ham')], [w('qo‘lda', true, 'Σ = ?')], [w('o‘lchaysizmi?')]]},
    tr: {h: [[w('Hâlâ'), w('elle mi', true, 'Σ = ?')], [w('ölçüyorsunuz?')]], v: [[w('Hâlâ')], [w('elle mi', true, 'Σ = ?')], [w('ölçüyorsunuz?')]]},
  },
  manual: {
    en: {h: [[w('It takes')], [w('days.', true)]]},
    ru: {h: [[w('На это уходят')], [w('дни.', true)]], v: [[w('На это')], [w('уходят')], [w('дни.', true)]]},
    uz: {h: [[w('Bunga')], [w('kunlar', true), w('ketadi.')]], v: [[w('Bunga')], [w('kunlar', true)], [w('ketadi.')]]},
    tr: {h: [[w('Günler', true)], [w('sürer.')]]},
  },
  measure: {
    en: {h: [[w('QtoMate')], [w('measures', true, '1:100'), w('the drawing')]], v: [[w('QtoMate')], [w('measures', true, '1:100')], [w('the drawing')]]},
    ru: {h: [[w('QtoMate')], [w('измеряет', true, '1:100'), w('чертёж')]], v: [[w('QtoMate')], [w('измеряет', true, '1:100')], [w('чертёж')]]},
    uz: {h: [[w('QtoMate')], [w('chizmani'), w('o‘lchaydi', true, '1:100')]], v: [[w('QtoMate')], [w('chizmani')], [w('o‘lchaydi', true, '1:100')]]},
    tr: {h: [[w('QtoMate')], [w('çizimi'), w('ölçer', true, '1:100')]], v: [[w('QtoMate')], [w('çizimi')], [w('ölçer', true, '1:100')]]},
  },
  scan: {
    en: {h: [[w('Every quantity traces back to the'), w('drawing', true)]], v: [[w('Every quantity traces')], [w('back to the'), w('drawing', true)]]},
    ru: {h: [[w('Каждое количество привязано к'), w('чертежу', true)]], v: [[w('Каждое количество')], [w('привязано к'), w('чертежу', true)]]},
    uz: {h: [[w('Har bir miqdor'), w('chizmaga', true), w('bog‘langan')]], v: [[w('Har bir miqdor')], [w('chizmaga', true), w('bog‘langan')]]},
    tr: {h: [[w('Her miktar'), w('çizime', true), w('kadar izlenir')]], v: [[w('Her miktar')], [w('çizime', true), w('kadar izlenir')]]},
  },
  approve: {
    en: {h: [[w('An estimator'), w('approves', true)]], v: [[w('An estimator')], [w('approves', true)]]},
    ru: {h: [[w('Сметчик'), w('утверждает', true)]], v: [[w('Сметчик')], [w('утверждает', true)]]},
    uz: {h: [[w('Smetachi'), w('tasdiqlaydi', true)]], v: [[w('Smetachi')], [w('tasdiqlaydi', true)]]},
    tr: {h: [[w('Keşif mühendisi'), w('onaylar', true)]], v: [[w('Keşif')], [w('mühendisi')], [w('onaylar', true)]]},
  },
  excel: {
    en: {h: [[w('Export to')], [w('Excel', true, '.xlsx')]]},
    ru: {h: [[w('Экспорт в')], [w('Excel', true, '.xlsx')]]},
    uz: {h: [[w('Excel’ga', true, '.xlsx')], [w('eksport')]]},
    tr: {h: [[w('Excel’e', true, '.xlsx')], [w('aktarım')]]},
  },
  tagline: {
    en: 'Takeoff that shows its working.',
    ru: 'Подсчёт объёмов, в котором видно каждое измерение.',
    uz: 'Har bir raqamning manbasi ko‘rinadigan hajm hisobi.',
    tr: 'Her rakamın kaynağını gösteren metraj.',
  },
  sheetLabels: {
    en: ['Sheet', 'Scale', 'Status'],
    ru: ['Лист', 'Масштаб', 'Статус'],
    uz: ['Varaq', 'Masshtab', 'Holat'],
    tr: ['Pafta', 'Ölçek', 'Durum'],
  },
  rooms: {
    en: ['Living', 'Bedroom', 'Kitchen'],
    ru: ['Гостиная', 'Спальня', 'Кухня'],
    uz: ['Mehmonxona', 'Yotoqxona', 'Oshxona'],
    tr: ['Salon', 'Yatak odası', 'Mutfak'],
  },
  rows: {
    en: {area: 'Floor area', ext: 'External walls', int: 'Internal partitions', doors: 'Doors', windows: 'Windows'},
    ru: {area: 'Площадь пола', ext: 'Наружные стены', int: 'Внутренние перегородки', doors: 'Двери', windows: 'Окна'},
    uz: {area: 'Pol maydoni', ext: 'Tashqi devorlar', int: 'Ichki pardevorlar', doors: 'Eshiklar', windows: 'Derazalar'},
    tr: {area: 'Döşeme alanı', ext: 'Dış duvarlar', int: 'İç bölme duvarlar', doors: 'Kapılar', windows: 'Pencereler'},
  },
  units: {
    en: {u_m2: 'm²', u_m: 'm', u_no: 'no.'},
    ru: {u_m2: 'м²', u_m: 'м', u_no: 'шт.'},
    uz: {u_m2: 'm²', u_m: 'm', u_no: 'dona'},
    tr: {u_m2: 'm²', u_m: 'm', u_no: 'adet'},
  },
  dec: {en: '.', ru: ',', uz: ',', tr: ','},
  boqTitle: {
    en: 'Bill of quantities, draft',
    ru: 'Ведомость объёмов работ, черновик',
    uz: 'Ish hajmlari qaydnomasi, qoralama',
    tr: 'Metraj cetveli, taslak',
  },
  boqSrc: {
    en: 'Source: sheet A-101, ground floor plan, 1:100',
    ru: 'Источник: лист A-101, план первого этажа, 1:100',
    uz: 'Manba: A-101 varaq, birinchi qavat rejasi, 1:100',
    tr: 'Kaynak: A-101 paftası, zemin kat planı, 1:100',
  },
  approved: {en: 'Approved', ru: 'Утверждено', uz: 'Tasdiqlandi', tr: 'Onaylandı'},
  allApproved: {en: 'All 5 lines approved', ru: 'Все 5 строк утверждены', uz: 'Barcha 5 qator tasdiqlandi', tr: '5 satırın tümü onaylandı'},
  sample: {
    en: 'Illustrative sample, not a real project',
    ru: 'Условный пример, не реальный проект',
    uz: 'Shartli namuna, haqiqiy loyiha emas',
    tr: 'Temsili örnektir, gerçek bir proje değildir',
  },
};
