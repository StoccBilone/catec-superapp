import { CollegeGroup, NewsItem } from '../types';

export const CATEC_GROUPS: CollegeGroup[] = [
  { id: 'p4a', name: 'П4 А', code: '06130100', course: 4, specialty: 'Программное обеспечение (ПО)', curator: 'Тойшибаева А.М.', studentCount: 26 },
  { id: 'p4bu', name: 'П4 Б/У', code: '06130100', course: 4, specialty: 'Программное обеспечение (Ускоренное)', curator: 'Медетбекова М.Д.', studentCount: 24 },
  { id: 'p4v', name: 'П4 В', code: '06130100', course: 4, specialty: 'Программное обеспечение', curator: 'Абайұлы Т.', studentCount: 25 },
  { id: 'p4g', name: 'П4 Г', code: '06130100', course: 4, specialty: 'Программное обеспечение', curator: 'Бородихин В.А.', studentCount: 27 },
  { id: 'p4k', name: 'П4 К', code: '06130100', course: 4, specialty: 'Бағдарламалық қамтамасыз ету (Қаз)', curator: 'Қуттыбай Т.Е.', studentCount: 28 },
  { id: 'is4a', name: 'ИС4А', code: '06120100', course: 4, specialty: 'Информационные системы', curator: 'Усенбаев Н.Б.', studentCount: 25 },
  { id: 'sib4au', name: 'СИБ4А/У', code: '06120200', course: 4, specialty: 'Системы информационной безопасности', curator: 'Әділ Б.Е.', studentCount: 23 },
  { id: 'sib4b', name: 'СИБ4Б', code: '06120200', course: 4, specialty: 'Системы информационной безопасности', curator: 'Вафаев А.Р.', studentCount: 24 },
  { id: 'rob4a', name: 'РОБ4А', code: '07140900', course: 4, specialty: 'Робототехника и мехатроника', curator: 'Донченко Г.А.', studentCount: 22 },
  { id: 'vm4ab', name: 'ВМ4А/Б', code: '06120300', course: 4, specialty: 'Вычислительные машины и комплексы', curator: 'Шарипов С.Б.', studentCount: 25 },
  { id: 'vt4a', name: 'ВТ4А', code: '06130200', course: 4, specialty: 'Вычислительная техника и ПО', curator: 'Турдыбакиев А.', studentCount: 26 },
  { id: 'vt4b', name: 'ВТ4Б', code: '06130200', course: 4, specialty: 'Вычислительная техника и ПО', curator: 'Османов А.В.', studentCount: 26 },
];

export { IMPORTED_LESSONS as CATEC_LESSONS } from './importedSchedule';

export const CATEC_NEWS: NewsItem[] = [];

export const PROFILE_BANNERS = [
  { id: 'catec_blue', title: 'Светлая', colors: ['#F2F2F2', '#F8F8F8', '#F2F2F2'] },
  { id: 'dark_obsidian', title: 'Тёмная', colors: ['#0A0A0A', '#161817', '#0A0A0A'] },
];
export const AVATAR_PRESETS = [{ id: 'av1', label: 'Студент', color: '#555957' }];
