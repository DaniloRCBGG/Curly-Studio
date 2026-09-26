-- Ajustes de permissão (RNF01, RNF02) e vínculo do autocadastro com a ficha feita no balcão.

-- 1. Comissão e diária das funcionárias não podem sair pela API pública. ------------------------
-- O site e a agenda só precisam de nome e disponibilidade. Os valores de pagamento ficam
-- restritos ao servidor (a tela Equipe, só da gerente, lê com a chave de serviço).
revoke select on public.funcionarias from anon, authenticated;
grant select (id, nome, atende, ativa) on public.funcionarias to anon;
grant select (id, nome, cargo, atende, ativa, usuario_id, criado_em) on public.funcionarias to authenticated;

-- 2. A cliente edita os próprios dados, mas não os campos internos da ficha. --------------------
create function public.proteger_campos_da_ficha() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Equipe e servidor (chave de serviço) podem tudo; a cliente só muda os dados de contato.
  if current_user in ('anon', 'authenticated') and not public.eh_equipe() then
    new.usuario_id := old.usuario_id;
    new.asaas_customer_id := old.asaas_customer_id;
    new.aceite_privacidade_em := old.aceite_privacidade_em;
    new.criado_em := old.criado_em;
    new.latitude := old.latitude;
    new.longitude := old.longitude;
  end if;
  return new;
end;
$$;

create trigger proteger_campos_da_ficha before update on public.clientes
for each row execute function public.proteger_campos_da_ficha();

-- 3. Autocadastro no site assume a ficha que a equipe já tinha feito no balcão. ------------------
-- Procura uma ficha sem login, nesta ordem: mesmo CPF; senão mesmo e-mail; senão mesmo telefone.
-- E-mail e telefone só valem se a ficha não tiver outro CPF e houver uma única candidata,
-- para não entregar a ficha de uma pessoa a outra.
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m jsonb := new.raw_user_meta_data;
  v_cpf text := nullif(regexp_replace(coalesce(m ->> 'cpf', ''), '\D', '', 'g'), '');
  v_tel text := nullif(regexp_replace(coalesce(m ->> 'telefone', ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(new.email, ''))), '');
  v_ficha uuid;
begin
  insert into public.usuarios (id, perfil) values (new.id, 'cliente') on conflict do nothing;
  if coalesce(m ->> 'origem', '') <> 'autocadastro' then
    return new;
  end if;

  if v_cpf is not null then
    select id into v_ficha from public.clientes
     where usuario_id is null and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
     order by criado_em limit 1;
  end if;

  if v_ficha is null and v_email is not null then
    select min(id::text)::uuid into v_ficha from public.clientes
     where usuario_id is null and lower(trim(email)) = v_email
       and (cpf is null or v_cpf is null or regexp_replace(cpf, '\D', '', 'g') = v_cpf)
    having count(*) = 1;
  end if;

  if v_ficha is null and v_tel is not null then
    select min(id::text)::uuid into v_ficha from public.clientes
     where usuario_id is null and regexp_replace(telefone, '\D', '', 'g') = v_tel
       and (cpf is null or v_cpf is null or regexp_replace(cpf, '\D', '', 'g') = v_cpf)
    having count(*) = 1;
  end if;

  if v_ficha is not null then
    -- Os dados que a cliente digitou no site valem mais que os anotados no balcão.
    update public.clientes set
      usuario_id = new.id,
      nome = coalesce(nullif(m ->> 'nome', ''), nome),
      telefone = coalesce(v_tel, telefone),
      email = coalesce(new.email, email),
      cpf = coalesce(v_cpf, cpf),
      cep = coalesce(nullif(m ->> 'cep', ''), cep),
      endereco = coalesce(nullif(m ->> 'endereco', ''), endereco),
      bairro = coalesce(nullif(m ->> 'bairro', ''), bairro),
      cidade = coalesce(nullif(m ->> 'cidade', ''), cidade),
      aceite_privacidade_em = now()
     where id = v_ficha;
  else
    insert into public.clientes (usuario_id, nome, telefone, email, cpf, cep, endereco, bairro, cidade, aceite_privacidade_em)
    values (new.id, m ->> 'nome', coalesce(v_tel, m ->> 'telefone'), new.email, v_cpf, m ->> 'cep', m ->> 'endereco', m ->> 'bairro', m ->> 'cidade', now());
  end if;
  return new;
end;
$$;
