-- Dados de exemplo só para desenvolvimento local (npx supabase db reset).
insert into public.funcionarias (id, nome, cargo, modalidade, atende) values
  ('10000000-0000-0000-0000-000000000001', 'Carol Rios', 'gerente', null, true),
  ('10000000-0000-0000-0000-000000000002', 'Juliana', 'cabeleireira_auxiliar', 'comissao', true);
update public.funcionarias set percentual_comissao = 30 where cargo = 'cabeleireira_auxiliar';

insert into public.servicos (id, nome, descricao, duracao_minutos, valor, valor_sinal, ordem) values
  ('20000000-0000-0000-0000-000000000001', 'Corte cacheado', 'Corte a seco, fio a fio, respeitando a curvatura natural.', 90, 180, 50, 1),
  ('20000000-0000-0000-0000-000000000002', 'Hidratação profunda', 'Tratamento para devolver maciez, brilho e definição.', 60, 120, 30, 2),
  ('20000000-0000-0000-0000-000000000003', 'Finalização', 'Definição dos cachos com técnica e produtos adequados ao seu fio.', 45, 80, 20, 3);

insert into public.funcionaria_servicos values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003');
