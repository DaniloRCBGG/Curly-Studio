-- Pix manual: a cliente paga na chave da Carol, avisa pelo site ("Já paguei") e manda o
-- comprovante no WhatsApp; a equipe confere no banco e confirma o sinal no painel.

-- Quando a cliente avisou que pagou.
alter table public.sinais add column cliente_informou_em timestamptz;

-- A cliente avisa que pagou: o horário fica guardado até a equipe confirmar ou cancelar
-- (no máximo até a hora do atendimento).
create function public.informar_pagamento(p_agendamento_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.agendamentos a
     set expira_em = greatest(a.expira_em, a.inicio)
    from public.clientes c, public.sinais s
   where a.id = p_agendamento_id and c.id = a.cliente_id and c.usuario_id = auth.uid()
     and s.agendamento_id = a.id and s.forma = 'pix_manual' and s.status = 'pendente'
     and a.status = 'aguardando_sinal' and a.expira_em >= now();
  if not found then
    raise exception 'reserva_nao_encontrada';
  end if;
  update public.sinais set cliente_informou_em = coalesce(cliente_informou_em, now())
   where agendamento_id = p_agendamento_id;
end;
$$;

-- A equipe confirma que o Pix caiu. Reaproveita a mesma regra do webhook do Asaas:
-- reserva vencida volta a valer se o horário ainda estiver livre.
create function public.confirmar_sinal_manual(p_agendamento_id uuid) returns status_sinal
language plpgsql security definer set search_path = public as $$
declare
  v_cobranca text;
begin
  if not public.eh_equipe() then
    raise exception 'sem_permissao';
  end if;
  select provedor_cobranca_id into v_cobranca from public.sinais
   where agendamento_id = p_agendamento_id and forma = 'pix_manual';
  if v_cobranca is null then
    raise exception 'sinal_nao_encontrado';
  end if;
  return public.confirmar_sinal(v_cobranca);
end;
$$;

revoke execute on function public.informar_pagamento(uuid) from public, anon;
revoke execute on function public.confirmar_sinal_manual(uuid) from public, anon;
grant execute on function public.informar_pagamento(uuid) to authenticated;
grant execute on function public.confirmar_sinal_manual(uuid) to authenticated;
