-- O bucket `avatars` existia sem nenhuma policy em storage.objects. Como RLS está
-- habilitado nessa tabela, nenhum usuário autenticado conseguia enviar ou remover
-- a própria foto: todo upload falhava com 403. Estas policies liberam leitura
-- pública (bucket é público) e escrita apenas na pasta do próprio usuário
-- (<uid>/arquivo), que é o padrão usado por useAvatarUpload.

drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );