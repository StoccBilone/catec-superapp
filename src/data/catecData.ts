import { CollegeGroup, Lesson, NewsItem } from '../types';

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

export const CATEC_LESSONS: Lesson[] = [
  // ===================== ДҮЙСЕНБІ / ПОНЕДЕЛЬНИК (1) =====================
  // 0 пара 11:25-12:55
  { id: 'c-1-0-p4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Базы данных', type: 'lecture', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'П4 А', dayOfWeek: 1 },
  { id: 'c-1-0-p4bu', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 Б/У', dayOfWeek: 1 },
  { id: 'c-1-0-p4v', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Компьютерные сети', type: 'lecture', room: '315 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 В', dayOfWeek: 1 },
  { id: 'c-1-0-p4g', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Охрана труда', type: 'seminar', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.', group: 'П4 Г', dayOfWeek: 1 },
  { id: 'c-1-0-is4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'РО 8.2. Администрирование средств ИБ', type: 'lab', room: 'База DOSTI', building: 'Лабораторный корпус', teacher: 'Вафаев А.Р.', group: 'ИС4А', dayOfWeek: 1 },
  { id: 'c-1-0-vm4ab', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Программирование логических контроллеров', type: 'practice', room: '409 ауд.', building: 'Главный корпус', teacher: 'Шарипов С.Б.', group: 'ВМ4А/Б', dayOfWeek: 1 },
  { id: 'c-1-0-vt4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Основы композитинга (Телевидение)', type: 'lecture', room: '401 ауд.', building: 'Главный корпус', teacher: 'Әділ Б.Е.', group: 'ВТ4А', dayOfWeek: 1 },
  { id: 'c-1-0-vt4b', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'РО 11.1. Профилактические мероприятия и отчетность', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4Б', dayOfWeek: 1 },

  // 1 пара 13:25-14:55
  { id: 'c-1-1-p4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Рефакторинг программного кода', type: 'practice', room: '406 ауд.', building: 'Главный корпус', teacher: 'Абайұлы Т.', group: 'П4 А', dayOfWeek: 1 },
  { id: 'c-1-1-p4bu', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Кумархан А.А.', group: 'П4 Б/У', dayOfWeek: 1 },
  { id: 'c-1-1-p4v', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 В', dayOfWeek: 1 },
  { id: 'c-1-1-p4g', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Базы данных', type: 'lecture', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'П4 Г', dayOfWeek: 1 },
  { id: 'c-1-1-p4k', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Компьютерные сети', type: 'lecture', room: '402 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 К', dayOfWeek: 1 },
  { id: 'c-1-1-is4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 6.1. Настройка конфигурации облачной инфраструктуры', type: 'lab', room: '211 ауд.', building: 'Главный корпус', teacher: 'Қуттыбай Т.Е.', group: 'ИС4А', dayOfWeek: 1 },
  { id: 'c-1-1-sib4au', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Организационное и правовое обеспечение ИБ', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'СИБ4А/У', dayOfWeek: 1 },
  { id: 'c-1-1-sib4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Безопасность электронного документооборота', type: 'practice', room: '401 ауд.', building: 'Главный корпус', teacher: 'Әділ Б.Е.', group: 'СИБ4Б', dayOfWeek: 1 },
  { id: 'c-1-1-rob4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Документирование систем', type: 'seminar', room: 'База DOSTI', building: 'Лабораторный корпус', teacher: 'Вафаев А.Р.', group: 'РОБ4А', dayOfWeek: 1 },
  { id: 'c-1-1-vm4ab', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Режиссура кинопроизведения (Телевидение)', type: 'lecture', room: '409 ауд.', building: 'Главный корпус', teacher: 'Шарипов С.Б.', group: 'ВМ4А/Б', dayOfWeek: 1 },
  { id: 'c-1-1-vt4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 7.1. Первичная настройка сетевых устройств', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4А', dayOfWeek: 1 },
  { id: 'c-1-1-vt4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Зеленин В.А.', group: 'ВТ4Б', dayOfWeek: 1 },

  // 2 пара 15:05-16:35
  { id: 'c-1-2-p4a', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 А', dayOfWeek: 1 },
  { id: 'c-1-2-p4bu', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'РО 3.2. Экономические процессы на предприятии', type: 'lecture', room: '105 ауд.', building: 'Главный корпус', teacher: 'Қияш Ш.М.', group: 'П4 Б/У', dayOfWeek: 1 },
  { id: 'c-1-2-p4v', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Рефакторинг программного кода', type: 'practice', room: '406 ауд.', building: 'Главный корпус', teacher: 'Абайұлы Т.', group: 'П4 В', dayOfWeek: 1 },
  { id: 'c-1-2-p4g', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Кушенов Ф.Т.', group: 'П4 Г', dayOfWeek: 1 },
  { id: 'c-1-2-p4k', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Защита безопасности информации', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'П4 К', dayOfWeek: 1 },
  { id: 'c-1-2-is4a', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'РО 5.1. Установка ПО для администрирования БД', type: 'lab', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'ИС4А', dayOfWeek: 1 },
  { id: 'c-1-2-sib4au', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Безопасность электронного документооборота', type: 'practice', room: '401 ауд.', building: 'Главный корпус', teacher: 'Әділ Б.Е.', group: 'СИБ4А/У', dayOfWeek: 1 },
  { id: 'c-1-2-sib4b', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Организационное и правовое обеспечение ИБ', type: 'lecture', room: '211 ауд.', building: 'Главный корпус', teacher: 'Қуттыбай Т.Е.', group: 'СИБ4Б', dayOfWeek: 1 },
  { id: 'c-1-2-rob4a', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Программирование логических контроллеров', type: 'lab', room: 'База DOSTI', building: 'Лабораторный корпус', teacher: 'Вафаев А.Р.', group: 'РОБ4А', dayOfWeek: 1 },
  { id: 'c-1-2-vm4ab', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Специализированное монтажное оборудование', type: 'practice', room: '416 ауд.', building: 'Главный корпус', teacher: 'Аби С.К.', group: 'ВМ4А/Б', dayOfWeek: 1 },
  { id: 'c-1-2-vt4a', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'РО 11.1. Профилактические мероприятия и техотчетность', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4А', dayOfWeek: 1 },
  { id: 'c-1-2-vt4b', pairNumber: 2, timeStart: '15:05', timeEnd: '16:35', subject: 'Основы права', type: 'lecture', room: '106 ауд.', building: 'Главный корпус', teacher: 'Нуржумаев М.Т.', group: 'ВТ4Б', dayOfWeek: 1 },

  // ===================== СЕЙСЕНБІ / ВТОРНИК (2) =====================
  // 0 пара 11:25-12:55
  { id: 'c-2-0-p4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Защита безопасности информации', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'П4 А', dayOfWeek: 2 },
  { id: 'c-2-0-p4v', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 В', dayOfWeek: 2 },
  { id: 'c-2-0-p4g', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Базы данных', type: 'lecture', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'П4 Г', dayOfWeek: 2 },
  { id: 'c-2-0-is4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'РО 7.1. Установка системного и прикладного ПО', type: 'lab', room: '412 ауд.', building: 'Главный корпус', teacher: 'Медведев А.А.', group: 'ИС4А', dayOfWeek: 2 },
  { id: 'c-2-0-sib4au', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Документоведение', type: 'seminar', room: '211 ауд.', building: 'Главный корпус', teacher: 'Қуттыбай Т.Е.', group: 'СИБ4А/У', dayOfWeek: 2 },
  { id: 'c-2-0-rob4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Охрана труда', type: 'lecture', room: '402 ауд.', building: 'Главный корпус', teacher: 'Османов А.В.', group: 'РОБ4А', dayOfWeek: 2 },
  { id: 'c-2-0-vm4ab', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'Специализированное монтажное оборудование', type: 'practice', room: '416 ауд.', building: 'Главный корпус', teacher: 'Аби С.К.', group: 'ВМ4А/Б', dayOfWeek: 2 },
  { id: 'c-2-0-vt4a', pairNumber: 0, timeStart: '11:25', timeEnd: '12:55', subject: 'РО 8.1. Профилактические работы по серверам', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4А', dayOfWeek: 2 },

  // 1 пара 13:25-14:55
  { id: 'c-2-1-p4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Компьютерные сети', type: 'lecture', room: '310 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 А', dayOfWeek: 2 },
  { id: 'c-2-1-p4bu', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 Б/У', dayOfWeek: 2 },
  { id: 'c-2-1-p4v', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Базы данных', type: 'lecture', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'П4 В', dayOfWeek: 2 },
  { id: 'c-2-1-p4g', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Рефакторинг программного кода', type: 'practice', room: '406 ауд.', building: 'Главный корпус', teacher: 'Абайұлы Т.', group: 'П4 Г', dayOfWeek: 2 },
  { id: 'c-2-1-p4k', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Охрана труда', type: 'lecture', room: '315 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 К', dayOfWeek: 2 },
  { id: 'c-2-1-is4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 7.1. Установка системного и прикладного ПО', type: 'lab', room: '412 ауд.', building: 'Главный корпус', teacher: 'Медведев А.А.', group: 'ИС4А', dayOfWeek: 2 },
  { id: 'c-2-1-sib4au', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Планирование и управление ИБ', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'СИБ4А/У', dayOfWeek: 2 },
  { id: 'c-2-1-rob4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Проектирование интегральных микросхем', type: 'lab', room: '403 ауд.', building: 'Главный корпус', teacher: 'Донченко Г.А.', group: 'РОБ4А', dayOfWeek: 2 },
  { id: 'c-2-1-vm4ab', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Основы композитинга (Телевидение)', type: 'lecture', room: '409 ауд.', building: 'Главный корпус', teacher: 'Шарипов С.Б.', group: 'ВМ4А/Б', dayOfWeek: 2 },
  { id: 'c-2-1-vt4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Охрана труда', type: 'lecture', room: '402 ауд.', building: 'Главный корпус', teacher: 'Османов А.В.', group: 'ВТ4А', dayOfWeek: 2 },
  { id: 'c-2-1-vt4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 8.1. Профилактические работы по серверам', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4Б', dayOfWeek: 2 },

  // ===================== СӘРСЕНБІ / СРЕДА (3) =====================
  // 1 пара 13:25-14:55
  { id: 'c-3-1-p4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Охрана труда', type: 'lecture', room: '316 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 А', dayOfWeek: 3 },
  { id: 'c-3-1-p4bu', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Рефакторинг программного кода', type: 'practice', room: '406 ауд.', building: 'Главный корпус', teacher: 'Абайұлы Т.', group: 'П4 Б/У', dayOfWeek: 3 },
  { id: 'c-3-1-p4v', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Базы данных', type: 'lecture', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'П4 В', dayOfWeek: 3 },
  { id: 'c-3-1-p4g', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Компьютерные сети', type: 'lecture', room: '402 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 Г', dayOfWeek: 3 },
  { id: 'c-3-1-p4k', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 К', dayOfWeek: 3 },
  { id: 'c-3-1-sib4au', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Разработка политики корпоративной ИБ', type: 'lab', room: '403 ауд.', building: 'Главный корпус', teacher: 'Қуттыбай Т.Е.', group: 'СИБ4А/У', dayOfWeek: 3 },
  { id: 'c-3-1-sib4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Планирование и управление ИБ', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'СИБ4Б', dayOfWeek: 3 },
  { id: 'c-3-1-rob4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Кумархан А.А.', group: 'РОБ4А', dayOfWeek: 3 },
  { id: 'c-3-1-vm4ab', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Режиссура кинопроизведения', type: 'practice', room: '409 ауд.', building: 'Главный корпус', teacher: 'Шарипов С.Б.', group: 'ВМ4А/Б', dayOfWeek: 3 },
  { id: 'c-3-1-vt4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 7.1. Настройка активных сетевых устройств', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4А', dayOfWeek: 3 },
  { id: 'c-3-1-vt4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Зеленин В.А.', group: 'ВТ4Б', dayOfWeek: 3 },

  // ===================== БЕЙСЕНБІ / ЧЕТВЕРГ (4) =====================
  // 1 пара 13:25-14:55
  { id: 'c-4-1-p4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 А', dayOfWeek: 4 },
  { id: 'c-4-1-p4bu', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Базы данных', type: 'lecture', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'П4 Б/У', dayOfWeek: 4 },
  { id: 'c-4-1-p4v', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Зеленин В.А.', group: 'П4 В', dayOfWeek: 4 },
  { id: 'c-4-1-p4g', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Охрана труда', type: 'lecture', room: '315 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 Г', dayOfWeek: 4 },
  { id: 'c-4-1-p4k', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Рефакторинг программного кода', type: 'practice', room: '406 ауд.', building: 'Главный корпус', teacher: 'Абайұлы Т.', group: 'П4 К', dayOfWeek: 4 },
  { id: 'c-4-1-is4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 9.1. Общие вопросы охраны труда', type: 'seminar', room: '102 ауд.', building: 'Главный корпус', teacher: 'Қуттыбай Т.Е.', group: 'ИС4А', dayOfWeek: 4 },
  { id: 'c-4-1-sib4au', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Безопасность электронного документооборота', type: 'lab', room: '401 ауд.', building: 'Главный корпус', teacher: 'Әділ Б.Е.', group: 'СИБ4А/У', dayOfWeek: 4 },
  { id: 'c-4-1-sib4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Планирование и управление ИБ', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'СИБ4Б', dayOfWeek: 4 },
  { id: 'c-4-1-rob4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Проектирование интегральных микросхем', type: 'lab', room: '403 ауд.', building: 'Главный корпус', teacher: 'Донченко Г.А.', group: 'РОБ4А', dayOfWeek: 4 },
  { id: 'c-4-1-vm4ab', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Основы композитинга', type: 'lecture', room: '409 ауд.', building: 'Главный корпус', teacher: 'Шарипов С.Б.', group: 'ВМ4А/Б', dayOfWeek: 4 },
  { id: 'c-4-1-vt4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 8.1. Обслуживание серверов', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4А', dayOfWeek: 4 },
  { id: 'c-4-1-vt4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Охрана труда', type: 'lecture', room: '402 ауд.', building: 'Главный корпус', teacher: 'Османов А.В.', group: 'ВТ4Б', dayOfWeek: 4 },

  // ===================== ЖҰМА / ПЯТНИЦА (5) =====================
  // 1 пара 13:25-14:55
  { id: 'c-5-1-p4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Защита безопасности информации', type: 'lecture', room: '410 ауд.', building: 'Главный корпус', teacher: 'Усенбаев Н.Б.', group: 'П4 А', dayOfWeek: 5 },
  { id: 'c-5-1-p4bu', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Мобильные приложения', type: 'practice', room: '303 ауд.', building: 'Главный корпус', teacher: 'Медетбекова М.Д.', group: 'П4 Б/У', dayOfWeek: 5 },
  { id: 'c-5-1-p4v', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Компьютерные сети', type: 'lecture', room: '402 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 В', dayOfWeek: 5 },
  { id: 'c-5-1-p4g', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Рефакторинг программного кода', type: 'practice', room: '406 ауд.', building: 'Главный корпус', teacher: 'Абайұлы Т.', group: 'П4 Г', dayOfWeek: 5 },
  { id: 'c-5-1-p4k', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Охрана труда', type: 'lecture', room: '315 ауд.', building: 'Главный корпус', teacher: 'Бородихин В.А.', group: 'П4 К', dayOfWeek: 5 },
  { id: 'c-5-1-is4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 5.2. Функционирование базы данных', type: 'lab', room: '304 ауд.', building: 'Главный корпус', teacher: 'Тойшибаева А.М.', group: 'ИС4А', dayOfWeek: 5 },
  { id: 'c-5-1-sib4au', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Физическая культура', type: 'practice', room: 'Спортзал', building: 'Спорткомплекс', teacher: 'Кушенов Ф.Т.', group: 'СИБ4А/У', dayOfWeek: 5 },
  { id: 'c-5-1-rob4a', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Схемотехника', type: 'lab', room: '403 ауд.', building: 'Главный корпус', teacher: 'Донченко Г.А.', group: 'РОБ4А', dayOfWeek: 5 },
  { id: 'c-5-1-vm4ab', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'Операторское мастерство (Телевидение)', type: 'practice', room: '409 ауд.', building: 'Главный корпус', teacher: 'Шарипов С.Б.', group: 'ВМ4А/Б', dayOfWeek: 5 },
  { id: 'c-5-1-vt4b', pairNumber: 1, timeStart: '13:25', timeEnd: '14:55', subject: 'РО 8.1. Профилактика серверов', type: 'practice', room: '210 ауд.', building: 'Главный корпус', teacher: 'Турдыбакиев А.', group: 'ВТ4Б', dayOfWeek: 5 },
];

export const CATEC_NEWS: NewsItem[] = [
  {
    id: 'catec-news-1',
    title: 'Открытие AI Lab и лаборатории машинного обучения в ЦАТЭК',
    summary: 'В колледже ЦАТЭК состоялось открытие новой специализированной лаборатории для разработки моделей искусственного интеллекта и мобильных сервисов.',
    content: 'Центральноазиатский технико-экономический колледж (ЦАТЭК) расширяет учебную инфраструктуру. Совместно с ведущими IT-компаниями Алматы открыта лаборатория искусственного интеллекта AI Lab.\n\nСтуденты отделений ПО, ИС и ВТ получат доступ к высокопроизводительным серверам для обучения нейросетей, проведения экспериментов с Computer Vision и LLM-моделями, а также подготовки к региональным хакатонам.',
    category: 'AI & IT',
    date: 'Сегодня, 10:30',
    author: 'Пресс-служба ЦАТЭК (catec.kz)',
    authorRole: 'Официальный аккаунт',
    likes: 142,
    commentsCount: 19,
    isImportant: true,
  },
  {
    id: 'catec-news-2',
    title: 'Регламент промежуточной аттестации и сессии на 7 семестр',
    summary: 'Учебная часть утвердила сроки сдачи зачетов и экзаменационной сессии для выпускного 4 курса.',
    content: 'Уважаемые студенты 4 курса!\n\nУчебный отдел ЦАТЭК информирует о графике контрольных недель:\n1. Рубежный контроль №1 — с 20 по 26 октября.\n2. Рубежный контроль №2 — с 1 по 7 декабря.\n3. Зимняя экзаменационная сессия — с 12 по 28 января.\n\nПроверить индивидуальные ведомости успеваемости и допуск к экзаменам вы можете в разделе «Личный кабинет» или в университетской системе Platonus.',
    category: 'Сессия',
    date: 'Вчера, 16:15',
    author: 'Учебный отдел ЦАТЭК',
    authorRole: 'Деканат',
    likes: 88,
    commentsCount: 7,
    isImportant: true,
  },
  {
    id: 'catec-news-3',
    title: 'Almaty AI Hackathon 2026: регистрация команд открыта',
    summary: 'Крупнейший хакатон Алматы для молодых разработчиков с призовым фондом 1 500 000 ₸ при поддержке Astana Hub и акимата г. Алматы.',
    content: 'С 24 по 26 октября в Алматы пройдет масштабный хакатон по генеративному ИИ и автоматизации городской среды.\n\nНоминации:\n• AI-ассистенты для образовательных учреждений;\n• FinTech и автоматизация бизнеса;\n• Smart City решения для Алматы.\n\nСтуденты ЦАТЭК могут подать командную заявку через студсовет или найти участников в групповом чате приложения.',
    category: 'Хакатон',
    date: '3 дня назад',
    author: 'Студенческий совет ЦАТЭК',
    authorRole: 'Студсовет',
    likes: 215,
    commentsCount: 34,
    isImportant: false,
  },
  {
    id: 'catec-news-4',
    title: 'Модернизация сети и Wi-Fi 6 в корпусе по ул. Жандосова 58',
    summary: 'Завершен монтаж нового телекоммуникационного оборудования Cisco в лекционных аудиториях и библиотеке.',
    content: 'Для обеспечения стабильного доступа студентов к онлайн-платформам и удаленным серверам в главном корпусе колледжа развернута бесшовная сеть Wi-Fi 6 с увеличенной пропускной способностью до 1 Гбит/с.',
    category: 'CATEC',
    date: '5 дней назад',
    author: 'IT-департамент колледжа',
    authorRole: 'Служба поддержки',
    likes: 97,
    commentsCount: 11,
    isImportant: false,
  },
];

export const PROFILE_BANNERS = [
  { id: 'catec_blue', title: 'ЦАТЭК Алматы (Official Blue)', colors: ['#0f172a', '#0369a1', '#0284c7'] },
  { id: 'almaty_cyber', title: 'Almaty Tech Cyber', colors: ['#09090b', '#4c1d95', '#06b6d4'] },
  { id: 'kazakhstan_ai', title: 'Kazakhstan AI Hub', colors: ['#064e3b', '#047857', '#10b981'] },
  { id: 'dark_obsidian', title: 'Dark Obsidian Minimal', colors: ['#0a0a0a', '#18181b', '#27272a'] },
];

export const AVATAR_PRESETS = [
  { id: 'av1', label: 'Student Dev', color: '#0284c7' },
  { id: 'av2', label: 'Security Lead', color: '#7c3aed' },
  { id: 'av3', label: 'Robotics Eng', color: '#059669' },
  { id: 'av4', label: 'Data Scientist', color: '#ea580c' },
];
