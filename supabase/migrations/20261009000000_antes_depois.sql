-- Antes e depois das clientes na home. A equipe envia as fotos pelo painel (/equipe/fotos);
-- os arquivos ficam no bucket público "antes-depois" e esta tabela guarda a ordem e as legendas.

create table public.antes_depois (
  id uuid primary key default gen_random_uuid(),
  antes_caminho text not null,
  depois_caminho text not null,
  servico text not null,
  legenda text,
  -- LGPD: só entra no site com a autorização da cliente registrada.
  autorizado boolean not null check (autorizado),
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_por uuid references auth.users (id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now()
);

alter table public.antes_depois enable row level security;
create policy "antes e depois ativos são públicos" on public.antes_depois for select using (ativo or public.eh_equipe());
create policy "equipe gerencia antes e depois" on public.antes_depois for all using (public.eh_equipe()) with check (public.eh_equipe());

-- Bucket público para leitura (as fotos aparecem no site); só a equipe envia e apaga.
-- Até 5 MB por arquivo e só imagens: o painel já reduz a foto no navegador antes de enviar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('antes-depois', 'antes-depois', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "equipe envia antes e depois" on storage.objects for insert to authenticated
  with check (bucket_id = 'antes-depois' and public.eh_equipe());
create policy "equipe apaga antes e depois" on storage.objects for delete to authenticated
  using (bucket_id = 'antes-depois' and public.eh_equipe());
-- O Storage confere a leitura antes de apagar: a equipe precisa "ver" os arquivos pela API.
create policy "equipe vê antes e depois" on storage.objects for select to authenticated
  using (bucket_id = 'antes-depois' and public.eh_equipe());
