-- Pix direto na chave da Carol, confirmado à mão pela equipe (sem Asaas).
-- Fica num arquivo só: o novo valor do enum não pode ser usado na mesma transação em que é criado.
alter type forma_sinal add value if not exists 'pix_manual';
