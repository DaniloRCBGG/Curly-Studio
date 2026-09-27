-- Testes do cadastro completado depois do login com Google. Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

-- Ficha feita no balcão, só com telefone.
insert into public.clientes (id, nome, telefone) values ('00000000-0000-0000-0000-0000000003a1', 'Lu (balcão)', '21944443333');

-- Entrar pelo Google cria o usuário sem ficha.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000004a1', 'lu@gmail.com', '{"full_name":"Luana Reis","iss":"https://accounts.google.com"}'),
  ('00000000-0000-0000-0000-0000000004a2', 'nova@gmail.com', '{"full_name":"Nova"}');

do $$ begin
  assert (select perfil from public.usuarios where id = '00000000-0000-0000-0000-0000000004a1') = 'cliente';
  assert not exists (select 1 from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000004a1'), 'Google não cria ficha sozinho';
end $$;

-- Luana completa só com o telefone do balcão: telefone não prova quem é, então ganha ficha nova
-- (a equipe junta as duas no painel depois de conferir).
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000004a1';
select public.completar_cadastro('Luana Reis', '(21) 94444-3333', '529.982.247-25', null, null, 'Penha', 'Rio de Janeiro');
do $$ begin
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000003a1') is null, 'só telefone não pode assumir a ficha';
  assert (select cpf from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000004a1') = '52998224725';
end $$;

-- Ficha do balcão com o e-mail do Google: o Google já confirmou o e-mail, então assume.
insert into public.clientes (id, nome, telefone, email) values ('00000000-0000-0000-0000-0000000003a2', 'Mel (balcão)', '21944440000', 'mel@gmail.com');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000004a3', 'mel@gmail.com', '{"full_name":"Mel"}');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000004a3';
select public.completar_cadastro('Mel Lima', '21944440000', '39053344705', null, null, null, null);
do $$ begin
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000003a2') = '00000000-0000-0000-0000-0000000004a3', 'e-mail do Google deveria assumir a ficha';
end $$;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000004a1';

-- Completar de novo é recusado.
do $$ begin
  perform public.completar_cadastro('Luana', '21944443333', '52998224725', null, null, null, null);
  raise exception 'deveria recusar segunda ficha';
exception when others then
  assert sqlerrm = 'ficha_ja_existe', 'erro inesperado: ' || sqlerrm;
end $$;

-- Sem ficha no balcão: cria uma nova.
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000004a2';
select public.completar_cadastro('Nova Cliente', '21911112222', '39053344705', null, null, null, null);
do $$ begin
  assert (select count(*) from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000004a2') = 1, 'deveria criar ficha';
end $$;

rollback;
\echo LOGIN_GOOGLE_OK
