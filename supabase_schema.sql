-- =========================================================
-- CAMPUS HUB — Схема базы данных для Supabase (PostgreSQL)
-- =========================================================

-- 1. Таблица учебных групп
CREATE TABLE IF NOT EXISTS public.college_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    course INT NOT NULL,
    faculty TEXT NOT NULL,
    curator TEXT NOT NULL,
    student_count INT DEFAULT 25
);

-- 2. Таблица преподавателей
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL
);

-- 3. Таблица расписания занятий
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pair_number INT NOT NULL,
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lecture', 'practice', 'lab', 'exam', 'seminar')),
    room TEXT NOT NULL,
    building TEXT NOT NULL,
    teacher TEXT NOT NULL,
    group_name TEXT NOT NULL,
    week_parity TEXT NOT NULL DEFAULT 'both' CHECK (week_parity IN ('both', 'numerator', 'denominator')),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Таблица новостей колледжа
CREATE TABLE IF NOT EXISTS public.news (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Объявления', 'Мероприятия', 'Сессия', 'Спорт', 'Наука')),
    author TEXT NOT NULL,
    read_time_min INT DEFAULT 3,
    likes INT DEFAULT 0,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Таблица сообщений в групповых чатах (Realtime)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    group_name TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'student',
    avatar_color TEXT DEFAULT '#38bdf8',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включение Realtime для чата
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Включение Row Level Security (RLS)
ALTER TABLE public.college_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Политики чтения (публичный доступ на чтение для авторизованных студентов)
CREATE POLICY "Allow public read on college_groups" ON public.college_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read on schedules" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Allow public read on news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Allow read chat messages of group" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
