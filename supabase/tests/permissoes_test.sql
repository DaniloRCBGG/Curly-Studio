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
  ('00000000-0000-0000-0000-0000000001a6', 'Irmã 2', '21988880005', null, null);

insert into auth.users (id, email, raw_user_meta_data) values
  -- Mesmo CPF, telefone novo: assume a ficha e atualiza o telefone.
  ('00000000-0000-0000-0000-0000000002a1', 'duda@ex.com', '{"origem":"autocadastro","nome":"Duda","telefone":"21977770001","cpf":"52998224725"}'),
  -- Mesmo telefone, ficha sem CPF: assume a ficha.
  ('00000000-0000-0000-0000-0000000002a2', 'eva@ex.com', '{"origem":"autocadastro","nome":"Eva Souza","telefone":"(21) 98888-0002","cpf":"39053344705"}'),
  -- Mesmo e-mail: assume a ficha.
  ('00000000-0000-0000-0000-0000000002a3', 'FE@ex.com', '{"origem":"autocadastro","nome":"Fê","telefone":"21900000000","cpf":""}'),
  -- Mesmo telefone, mas a ficha tem outro CPF: não assume.
  ('00000000-0000-0000-0000-0000000002a4', 'x@ex.com', '{"origem":"autocadastro","nome":"Outra","telefone":"21988880004","cpf":"39053344705"}'),
  -- Telefone de duas fichas: não adivinha.
  ('00000000-0000-0000-0000-0000000002a5', 'irma@ex.com', '{"origem":"autocadastro","nome":"Irmã","telefone":"21988880005","cpf":""}');

do $$ begin
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '00000000-0000-0000-0000-0000000002a1', 'CPF deveria vincular';
  assert (select telefone from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '21977770001', 'telefone do site deveria valer';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a2') = '00000000-0000-0000-0000-0000000002a2', 'telefone deveria vincular';
  assert (select cpf from public.clientes where id = '00000000-0000-0000-0000-0000000001a2') = '39053344705', 'CPF do site deveria entrar na ficha';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a3') = '00000000-0000-0000-0000-0000000002a3', 'e-mail deveria vincular';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a4') is null, 'CPF diferente não pode vincular';
  assert (select count(*) from public.clientes where usuario_id is null and telefone = '21988880005') = 2, 'telefone repetido não pode vincular';
  assert (select count(*) from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a4') = 1, 'sem vínculo, cria ficha nova';
  assert (select count(*) from public.clientes where usuario_id = '00000000-0000-0000-0000-0000000002a5') = 1, 'sem vínculo, cria ficha nova';
end $$;

-- A cliente muda o telefone, mas não os campos internos.
update public.clientes set asaas_customer_id = 'cus_real' where id = '00000000-0000-0000-0000-0000000001a1';
grant usage on schema public to authenticated;
grant select, update on public.clientes to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-0000000002a1';
update public.clientes set telefone = '21966660000', asaas_customer_id = 'cus_de_outra', usuario_id = null
 where id = '00000000-0000-0000-0000-0000000001a1';
reset role;
do $$ begin
  assert (select telefone from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '21966660000', 'cliente deveria editar o telefone';
  assert (select asaas_customer_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = 'cus_real', 'cliente não pode mudar o Asaas';
  assert (select usuario_id from public.clientes where id = '00000000-0000-0000-0000-0000000001a1') = '00000000-0000-0000-0000-0000000002a1', 'cliente não pode soltar a ficha';
end $$;

-- Visitante e cliente não leem diária nem comissão.
do $$ begin
  assert not has_column_privilege('anon', 'public.funcionarias', 'percentual_comissao', 'select'), 'visitante lê comissão';
  assert not has_column_privilege('authenticated', 'public.funcionarias', 'valor_diaria_semana', 'select'), 'logada lê diária';
  assert has_column_privilege('anon', 'public.funcionarias', 'nome', 'select'), 'o site precisa do nome';
end $$;

rollback;
\echo PERMISSOES_OK
