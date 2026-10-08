import { CollegeGroup, Lesson, NewsItem, UserProfile, ChatMessage } from '../types';
import { CATEC_GROUPS, CATEC_LESSONS, CATEC_NEWS } from './catecData';

export const MOCK_GROUPS: CollegeGroup[] = CATEC_GROUPS;
export const MOCK_SCHEDULE: Lesson[] = CATEC_LESSONS;
export const MOCK_NEWS: NewsItem[] = CATEC_NEWS;

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'std-4092',
  fullName: 'Алексей Смирнов',
  role: 'student',
  group: 'П4 А',
  studentId: '4092',
  passCode: '4092',
  course: 4,
  faculty: 'Отделение информационных технологий ЦАТЭК',
  averageGrade: 4.85,
  attendancePercent: 96,
  bannerId: 'catec_blue',
};

export const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  'П4 А': [
    {
      id: 'm1',
      senderId: 'curator',
      senderName: 'Тойшибаева А.М. (Куратор)',
      senderRole: 'teacher',
      avatarColor: '#0284c7',
      text: 'Группа П4 А, здравствуйте! Напоминаю, что сегодня 0 пара по Базам данных в 304 ауд.',
      createdAt: '11:15',
    },
    {
      id: 'm2',
      senderId: 'std-1',
      senderName: 'Дамир Мусин',
      senderRole: 'student',
      avatarColor: '#38bdf8',
      text: 'Асель Муратовна, отчеты по лабораторной работе №4 приносить в распечатанном виде?',
      createdAt: '11:20',
    },
  ],
};
