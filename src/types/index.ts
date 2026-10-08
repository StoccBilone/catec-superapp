export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  id: string;
  fullName: string;
  cloudId?: string;
  role: UserRole;
  group: string; // "П4 А", "П4 Б/У", "П4 В", "П4 Г", "П4 К", "ИС4А", "СИБ4А/У", "СИБ4Б", "РОБ4А", "ВМ4А/Б", "ВТ4А", "ВТ4Б"
  studentId: string; // 4 цифры: например "4092"
  passCode: string; // 4-значный код авторизации: "4092"
  course: number; // 4
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  bannerId?: string; // id выбранного баннера
  faculty: string;
  averageGrade: number;
  attendancePercent: number;
}

export type LessonType = 'lecture' | 'practice' | 'lab' | 'exam' | 'seminar';

export interface Lesson {
  id: string;
  pairNumber: number; // 0, 1, 2, 3, 4
  timeStart: string; // e.g. "11:25", "13:25", "15:05", "16:50", "18:30"
  timeEnd: string; // e.g. "12:55", "14:55", "16:35", "18:20", "20:00"
  subject: string;
  type?: LessonType;
  variant?: number;
  sourceRange?: string;
  room: string;
  building: string;
  teacher: string;
  group: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5; // 1: Дүйсенбі / Понедельник ... 5: Жұма / Пятница
  notes?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'CATEC' | 'AI & IT' | 'Хакатон' | 'Сессия' | 'Студенты';
  date: string;
  author: string;
  authorRole?: string;
  avatarUrl?: string;
  imageUri?: string;
  attachments?: Material[];
  authorId?: string;
  readTimeMin?: number;
  likes: number;
  commentsCount?: number;
  isImportant?: boolean;
  isUserCreated?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  avatarColor: string;
  text: string;
  createdAt: string;
  isOwn?: boolean;
  attachments?: Material[];
}

export interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'image' | 'link' | 'video' | 'voice' | 'videoNote';
  uri?: string;
  mimeType?: string;
  size?: string;
  duration?: number;
  waveform?: number[];
  storagePath?: string;
}

export interface CollegeGroup {
  id: string;
  name: string;
  code: string;
  course: number;
  specialty: string;
  curator: string;
  studentCount: number;
}
