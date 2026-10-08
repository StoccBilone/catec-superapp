-- Apply once to an existing CATEC SuperApp database.
create or replace function public.create_group_conversation(label text, participants uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
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
$$;
revoke all on function public.create_group_conversation(text,uuid[]) from public, anon;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;
