-- Tabela de serviços do salão (Canva "Tabela de serviços", set/2026), para carregar uma vez no banco.
-- Local: entra sozinho no `npx supabase db reset`. Produção: rodar uma vez no SQL Editor do Supabase.
-- Só insere os serviços que ainda não existem (pelo nome), então rodar de novo não duplica.
--
-- [CONFIRMAR COM A CAROL] duracao_minutos e valor_sinal são estimativas: a tabela do Canva não traz esses
-- dados. Depois é só ajustar no painel da equipe (/equipe/servicos).

insert into public.servicos (nome, descricao, grupo, duracao_minutos, valor, preco_p, preco_m, preco_g, preco_gg, a_partir_de, valor_sinal, observacoes, ordem)
select v.nome, v.descricao, v.grupo, v.duracao, v.p, v.p, v.m, v.g, v.gg, v.a_partir_de, v.sinal, v.observacoes, v.ordem
from (values
  ('Corte',                  null,                               'cuidados',  90, 120, 140, 160, 180, false, 40, 'Inclui lavagem e finalização.', 1),
  ('Tratamento',             null,                               'cuidados',  90, 170, 180, 190, 210, false, 50, E'Inclui lavagem e finalização.\nCombo com corte: incluir R$ 90.', 2),
  ('SOS Recuperação',        null,                               'cuidados',  90, 190, 200, 210, 230, false, 50, 'Combo com corte: incluir R$ 90.', 3),
  ('Finalização premium',    null,                               'cuidados',  60,  70,  80, 100, 120, false, 20, null, 4),
  ('Clubinho',               'Cronograma capilar em 4 visitas.', 'cuidados',  90, 380, 400, 440, 480, false, 80, null, 5),
  ('Retoque de raiz',        null,                               'coloracao', 90, 120, 130, 140, 160, false, 40, null, 10),
  ('Coloração total',        null,                               'coloracao',120, 160, 180, 210, 240, true,  50, null, 11),
  ('Morena iluminada',       null,                               'mechas',   240, 350, 400, 480, 550, true, 100, null, 20),
  ('Mechas super claras',    null,                               'mechas',   300, 500, 550, 600, 700, true, 150, null, 21),
  ('Ruivo sem descolorir',   null,                               'ruivos',   150, 250, 300, 380, 450, true,  80, null, 30),
  ('Ruivo com descolorante', null,                               'ruivos',   240, 350, 450, 500, 600, true, 100, null, 31)
) as v(nome, descricao, grupo, duracao, p, m, g, gg, a_partir_de, sinal, observacoes, ordem)
where not exists (select 1 from public.servicos s where s.nome = v.nome);
