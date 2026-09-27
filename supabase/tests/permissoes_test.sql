-- Testes de permissão e do vínculo do autocadastro com a ficha do balcão. Rodar com: npm run test:db
\set ON_ERROR_STOP 1
begin;

-- Fichas feitas no balcão, sem login.
insert into public.clientes (id, nome, telefone, cpf, email) values
  ('00000000-0000-0000-0000-0000000001a1', 'Duda (balcão)', '21988880001', '529.982.247-25', null),
  ('00000000-0000-0000-0000-0000000001a2', 'Eva', '21988880002', null, null),
  ('00000000-0000-0000-0000-0000000001a3', 'Fê', '21988880003', null, 'fe@ex.com'),
  ('00000000-0000-0000-0000-0000000001a4', 'Gabi', '21988880004', '11144477735', null),
  ('00000000-0000-0000-0000-0000000001a5', 'Irmã 1', '21988880005', null, null),
  ('00000000-0000-0000-0000-0000000001a6', 'Irmã 2', '21988880005', null, null),
  ('00000000-0000-0000-0000-0000000001a7', 'Hana', '21988880007', '71428793860', null),
  ('00000000-0000-0000-0000-0000000001a8', 'Iara', '21988880008', null, 'iara@ex.com');

insert into auth.users (id, email, raw_user_meta_data) values
  -- Mesmo CPF e mesmo telefone: assume a ficha.
  ('00000000-0000-0000-0000-0000000002a1', 'duda@ex.com', '{"origem":"autocadastro","nome":"Duda","telefone":"(21) 98888-0001","cpf":"52998224725"}'),
  -- Só o mesmo telefone: não assume (telefone não prova quem é); vira sugestão para a equipe.
  ('00000000-0000-0000-0000-0000000002a2', 'eva@ex.com', '{"origem":"autocadastro","nome":"Eva Souza","telefone":"(21) 98888-0002","cpf":"39053344705"}'),
  -- Mesmo e-mail, já confirmado: assume a ficha.
  ('00000000-0000-0000-0000-0000000002a3', 'FE@ex.com', '{"origem":"autocadastro","nome":"Fê","telefone":"21900000000","cpf":""}'),
  -- Mesmo telefone, mas a ficha tem outro CPF: não assume.
  ('00000000-0000-0000-0000-0000000002a4', 'x@ex.com', '{"origem":"autocadastro","nome":"Outra","telefone":"21988880004","cpf":"39053344705"}'),
  -- Telefone de duas fichas: não adivinha.
  ('00000000-0000-0000-0000-0000000002a5', 'irma@ex.com', '{"origem":"autocadastro","nome":"Irmã","telefone":"21988880005","cpf":""}'),
  -- Alguém que sabe só o CPF da Hana, com outro telefone e e-mail: não assume.
  ('00000000-0000-0000-0000-0000000002a6', 'golpe@ex.com', '{"origem":"autocadastro","nome":"Hana","telefone":"21911110000","cpf":"71428793860"}');

-- Iara se cadastra com o e-mail do balcão, mas ainda não clicou no link de confirmação.
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000002a7', 'iara@ex.com', null, '{"origem":"autocadastro","nome":"Iara","telefone":"21922220000","cpf":""}');

do $$ begin
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '00000000-0000-0000-0000-0000000002a1', 'CPF e telefone deveriam vincular';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a2') is null, 'só telefone não pode vincular';
  assert (select count(*) from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a2') = 1, 'sem vínculo, cria ficha nova';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a3') = '00000000-0000-0000-0000-0000000002a3', 'e-mail confirmado deveria vincular';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a4') is null, 'CPF diferente não pode vincular';
  assert (select count(*) from public.clientes where usuario_id is null and telefone = '21988880005') = 2, 'telefone repetido não pode vincular';
  assert (select count(*) from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a4') = 1, 'sem vínculo, cria ficha nova';
  assert (select count(*) from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a5') = 1, 'sem vínculo, cria ficha nova';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a7') is null, 'só o CPF não pode vincular';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a8') is null, 'e-mail sem confirmar não pode vincular';
  assert not exists (select 1 from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a7'), 'sem confirmar o e-mail, ainda não tem ficha';
end $$;

-- Iara confirma o e-mail: agora assume a ficha do balcão.
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-0000000002a7';
do $$ begin
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a8') = '00000000-0000-0000-0000-0000000002a7', 'e-mail confirmado deveria vincular';
end $$;

-- A equipe vê as fichas para juntar; a cliente não vê nem junta.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000002e1', 'equipe@ex.com');
update public.usuarios set perfil = 'funcionaria' where id = '00000000-0000-0000-0000-0000000002e1';

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000002a2';
do $$ begin
  assert (select count(*) from public.fichas_para_juntar()) = 0, 'cliente não pode ver fichas para juntar';
  perform public.juntar_fichas((select id from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a2'), '00000000-0000-0000-0000-0000000001a2');
  raise exception 'cliente não pode juntar fichas';
exception when others then
  assert sqlerrm = 'sem_permissao', 'erro inesperado: ' || sqlerrm;
end $$;

set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000002e1';
do $$
declare v_site uuid := (select id from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a2');
begin
  assert exists (select 1 from public.fichas_para_juntar() where site_id = v_site and balcao_id = '00000000-0000-0000-0000-0000000001a2' and motivo = 'mesmo telefone'), 'Eva deveria aparecer para juntar';
  assert exists (select 1 from public.fichas_para_juntar() where balcao_id = '00000000-0000-0000-0000-0000000001a7' and motivo = 'mesmo CPF'), 'Hana deveria aparecer para a equipe conferir';
  update public.clientes set bairro = 'Penha' where id = '00000000-0000-0000-0000-0000000001a2';
  perform public.juntar_fichas(v_site, '00000000-0000-0000-0000-0000000001a2');
  assert not exists (select 1 from public.clientes where id = '00000000-0000-0000-0000-0000000001a2'), 'ficha do balcão deveria sumir';
  assert (select bairro from public.clientes where id = v_site) = 'Penha', 'campo vazio deveria vir do balcão';
end $$;
reset request.jwt.claim.sub;

-- A cliente muda o telefone, mas não os campos internos.
update public.clientes set asaas_customer_id = 'cus_real' where id = '00000000-0000-0000-0000-0000000001a1';
grant usage on schema public to authenticated;
grant select, update on public.clientes to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000002a1';
update public.clientes set telefone = '21966660000', asaas_customer_id = 'cus_de_outra', usuario_id = null, cpf = '00000000000', email = 'outra@ex.com'
 where id = '00000000-0000-0000-0000-0000000001a1';
reset role;
do $$ begin
  assert (select telefone from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '21966660000', 'cliente deveria editar o telefone';
  assert (select asaas_customer_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = 'cus_real', 'cliente não pode mudar o Asaas';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '00000000-0000-0000-0000-0000000002a1', 'cliente não pode soltar a ficha';
  assert (select cpf from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '52998224725', 'cliente não pode trocar o CPF';
  assert (select email from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = 'duda@ex.com', 'cliente não pode trocar o e-mail';
end $$;

-- Visitante e cliente não leem diária nem comissão.
do $$ begin
  assert not has_column_privilege('anon', 'public.funcionarias', 'percentual_comissao', 'select'), 'visitante lê comissão';
  assert not has_column_privilege('authenticated', 'public.funcionarias', 'valor_diaria_semana', 'select'), 'logada lê diária';
  assert has_column_privilege('anon', 'public.funcionarias', 'nome', 'select'), 'o site precisa do nome';
end $$;

-- Ficha precisa de telefone ou e-mail.
insert into public.clientes (nome, email) values ('Só e-mail', 'so@ex.com');
do $$ begin
  insert into public.clientes (nome) values ('Sem contato');
  raise exception 'deveria exigir telefone ou e-mail';
exception when check_violation then null;
end $$;

rollback;
\echo PERMISSOES_OK
