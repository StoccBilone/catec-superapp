-- CATEC SuperApp: device sessions, a shared directory, posts and private conversations.
-- PIN stays on the device. Public student IDs are independent of the PIN.
begin;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_id bigint generated always as identity (start with 100000) unique,
  full_name text not null check (length(full_name) between 1 and 100),
  group_name text not null check (length(group_name) between 1 and 40),
  bio text not null default '' check (length(bio) <= 200),
  avatar_path text, cover_path text,
  created_at timestamptz not null default now()
);
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(), title text not null check (length(title) between 1 and 60),
  kind text not null check (kind in ('chat','group')), owner_id uuid not null references public.profiles(id),
  college_group text, created_at timestamptz not null default now()
);
create unique index if not exists rooms_college_group on public.rooms(college_group) where college_group is not null;
create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (room_id,user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id),
  body text not null default '' check(length(body) <= 10000),
  attachments jsonb not null default '[]' check(jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5),
  created_at timestamptz not null default now()
);
create index if not exists messages_room_time on public.messages(room_id,created_at);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null default auth.uid() references public.profiles(id),
  title text not null default '' check(length(title) <= 300), body text not null default '' check(length(body) <= 10000),
  category text not null default 'Студенты',
  attachments jsonb not null default '[]' check(jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;

create or replace function public.is_room_member(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.room_members where room_id = target and user_id = auth.uid());
$$;
revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;
create policy "Directory for signed in students" on public.profiles for select to authenticated using(true);
create policy "Create own profile" on public.profiles for insert to authenticated with check(id = auth.uid());
create policy "Edit own profile" on public.profiles for update to authenticated using(id = auth.uid()) with check(id = auth.uid());
create policy "Members see rooms" on public.rooms for select to authenticated using(public.is_room_member(id));
create policy "Members see participants" on public.room_members for select to authenticated using(public.is_room_member(room_id));
create policy "Members see messages" on public.messages for select to authenticated using(public.is_room_member(room_id));
create policy "Members send as themselves" on public.messages for insert to authenticated with check(sender_id = auth.uid() and public.is_room_member(room_id));
create policy "Students read posts" on public.posts for select to authenticated using(true);
create policy "Students publish as themselves" on public.posts for insert to authenticated with check(author_id = auth.uid());

revoke all on public.profiles, public.rooms, public.room_members, public.messages, public.posts from anon, authenticated;
grant select on public.profiles, public.rooms, public.room_members, public.messages, public.posts to authenticated;
grant insert(id, full_name, group_name, bio, avatar_path, cover_path) on public.profiles to authenticated;
grant update(full_name, group_name, bio, avatar_path, cover_path) on public.profiles to authenticated;
grant usage on sequence public.profiles_student_id_seq to authenticated;
grant insert(room_id,sender_id,body,attachments) on public.messages to authenticated;
grant insert(author_id,title,body,category,attachments) on public.posts to authenticated;

create or replace function public.create_conversation(label text, room_kind text, recipient uuid default null, study_group text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare room uuid; my_group text;
begin
  select group_name into my_group from public.profiles where id = auth.uid();
  if my_group is null then raise exception 'Profile required'; end if;
  if length(trim(label)) not between 1 and 60 or room_kind not in ('chat','group') then raise exception 'Invalid conversation'; end if;
  if study_group is not null then
    if study_group <> my_group or room_kind <> 'group' then raise exception 'Group does not match profile'; end if;
    insert into public.rooms(title,kind,owner_id,college_group) values(study_group,'group',auth.uid(),study_group)
    on conflict(college_group) where college_group is not null do update set college_group=excluded.college_group returning id into room;
  elsif recipient is not null then
    if recipient = auth.uid() or not exists(select 1 from public.profiles where id=recipient) then raise exception 'Recipient unavailable'; end if;
    -- Serialise only this participant pair to avoid duplicate rooms on simultaneous creation.
    perform pg_advisory_xact_lock(hashtextextended(least(auth.uid()::text,recipient::text)||greatest(auth.uid()::text,recipient::text),0));
    select r.id into room from public.rooms r where r.kind='chat' and exists(select 1 from public.room_members m where m.room_id=r.id and m.user_id=auth.uid()) and exists(select 1 from public.room_members m where m.room_id=r.id and m.user_id=recipient) limit 1;
  end if;
  if room is null then insert into public.rooms(title,kind,owner_id) values(trim(label),room_kind,auth.uid()) returning id into room; end if;
  insert into public.room_members(room_id,user_id) values(room,auth.uid()) on conflict do nothing;
  if recipient is not null then insert into public.room_members(room_id,user_id) values(room,recipient) on conflict do nothing; end if;
  return room;
end;
$$;
revoke all on function public.create_conversation(text,text,uuid,text) from public, anon;
grant execute on function public.create_conversation(text,text,uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('materials','materials',false,26214400,
array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm','audio/mp4','audio/m4a','audio/x-m4a','audio/webm','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','application/zip','application/octet-stream'])
on conflict(id) do nothing;
create policy "Students upload their materials" on storage.objects for insert to authenticated with check(bucket_id='materials' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Read accessible materials" on storage.objects for select to authenticated using(bucket_id='materials' and (
  (storage.foldername(name))[1] = auth.uid()::text
  or exists(select 1 from public.profiles p where p.avatar_path=name or p.cover_path=name)
  or exists(select 1 from public.posts p, jsonb_array_elements(p.attachments) a where a->>'storagePath'=name)
  or exists(select 1 from public.messages m, jsonb_array_elements(m.attachments) a where a->>'storagePath'=name and public.is_room_member(m.room_id))
));

-- Apply once to an existing CATEC SuperApp database.
create or replace function public.create_group_conversation(label text, participants uuid[])
returns uuid language plpgsql security definer set search_path = '' as $
declare room uuid;
begin
  if not exists(select 1 from public.profiles where id=auth.uid()) then raise exception 'Profile required'; end if;
  if length(trim(label)) not between 1 and 60 or coalesce(cardinality(participants),0) not between 1 and 30 then raise exception 'Invalid group'; end if;
  if exists(select 1 from unnest(participants) target where target is null or not exists(select 1 from public.profiles p where p.id=target)) then raise exception 'Recipient unavailable'; end if;
  insert into public.rooms(title,kind,owner_id) values(trim(label),'group',auth.uid()) returning id into room;
  insert into public.room_members(room_id,user_id) values(room,auth.uid());
  insert into public.room_members(room_id,user_id) select room,target from unnest(participants) target on conflict do nothing;
  return room;
end;
$;
revoke all on function public.create_group_conversation(text,uuid[]) from public, anon;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;

commit;
