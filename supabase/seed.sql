-- Dados de exemplo só para desenvolvimento local (npx supabase db reset).
-- Os serviços reais vêm de supabase/dados/tabela-de-servicos.sql, carregado antes deste arquivo.
insert into public.funcionarias (id, nome, cargo, modalidade, atende) values
  ('10000000-0000-0000-0000-000000000001', 'Carol Rios', 'gerente', null, true),
  ('10000000-0000-0000-0000-000000000002', 'Juliana', 'cabeleireira_auxiliar', 'comissao', true);
update public.funcionarias set percentual_comissao = 30 where cargo = 'cabeleireira_auxiliar';

-- A Carol faz todos os serviços; a Juliana, os de cuidados.
insert into public.funcionaria_servicos (funcionaria_id, servico_id)
select '10000000-0000-0000-0000-000000000001', id from public.servicos;
insert into public.funcionaria_servicos (funcionaria_id, servico_id)
select '10000000-0000-0000-0000-000000000002', id from public.servicos where grupo = 'cuidados';

-- Estoque de exemplo.
insert into public.fornecedores (id, nome, telefone) values
  ('30000000-0000-0000-0000-000000000001', 'Distribuidora Cachos', '21988887777');

insert into public.produtos (id, nome, marca, unidade, tamanho_embalagem, valor_embalagem, fornecedor_id) values
  ('40000000-0000-0000-0000-000000000001', 'Máscara de hidratação', 'Exemplo', 'g', 1000, 89.90, '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'Creme de pentear', 'Exemplo', 'ml', 500, 45.00, '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'Touca térmica', null, 'un', 1, 12.00, null);
