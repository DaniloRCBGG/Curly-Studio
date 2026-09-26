-- Login com Google. Quem entra pelo Google não passa pelo formulário de cadastro, então a ficha
-- é criada (ou ligada à do balcão) depois, quando a cliente completa telefone e CPF no site.

-- A busca da ficha do balcão sai do gatilho para uma função, usada nos dois caminhos.
-- Procura uma ficha sem login: mesmo CPF; senão mesmo e-mail; senão mesmo telefone. E-mail e
-- telefone só valem se a ficha não tiver outro CPF e houver uma única candidata.
create function public.vincular_ficha(p_usuario uuid, p_email text, m jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_cpf text := nullif(regexp_replace(coalesce(m ->> 'cpf', ''), '\D', '', 'g'), '');
  v_tel text := nullif(regexp_replace(coalesce(m ->> 'telefone', ''), '\D', '', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_ficha uuid;
begin
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
      usuario_id = p_usuario,
      nome = coalesce(nullif(m ->> 'nome', ''), nome),
      telefone = coalesce(v_tel, telefone),
      email = coalesce(p_email, email),
      cpf = coalesce(v_cpf, cpf),
      cep = coalesce(nullif(m ->> 'cep', ''), cep),
      endereco = coalesce(nullif(m ->> 'endereco', ''), endereco),
      bairro = coalesce(nullif(m ->> 'bairro', ''), bairro),
      cidade = coalesce(nullif(m ->> 'cidade', ''), cidade),
      aceite_privacidade_em = now()
     where id = v_ficha;
  else
    insert into public.clientes (usuario_id, nome, telefone, email, cpf, cep, endereco, bairro, cidade, aceite_privacidade_em)
    values (p_usuario, m ->> 'nome', coalesce(v_tel, m ->> 'telefone'), p_email, v_cpf, m ->> 'cep', m ->> 'endereco', m ->> 'bairro', m ->> 'cidade', now())
    returning id into v_ficha;
  end if;
  return v_ficha;
end;
$$;

revoke execute on function public.vincular_ficha(uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id, perfil) values (new.id, 'cliente') on conflict do nothing;
  if coalesce(new.raw_user_meta_data ->> 'origem', '') = 'autocadastro' then
    perform public.vincular_ficha(new.id, new.email, new.raw_user_meta_data);
  end if;
  return new;
end;
$$;

-- A cliente que entrou pelo Google completa o cadastro (telefone e CPF são exigidos pelo Pix).
create function public.completar_cadastro(
  p_nome text, p_telefone text, p_cpf text, p_cep text, p_endereco text, p_bairro text, p_cidade text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'nao_autenticado';
  end if;
  if exists (select 1 from public.clientes where usuario_id = auth.uid()) then
    raise exception 'ficha_ja_existe';
  end if;
  select email into v_email from auth.users where id = auth.uid();
  return public.vincular_ficha(auth.uid(), v_email, jsonb_build_object(
    'nome', p_nome, 'telefone', p_telefone, 'cpf', p_cpf,
    'cep', p_cep, 'endereco', p_endereco, 'bairro', p_bairro, 'cidade', p_cidade
  ));
end;
$$;

revoke execute on function public.completar_cadastro(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.completar_cadastro(text, text, text, text, text, text, text) to authenticated;
