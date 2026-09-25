"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { caminhoSeguro, cpfValido, soDigitos } from "@/lib/validacao";

export type EstadoForm = { erro?: string } | undefined;

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("senha") ?? ""),
  });
  if (error) return { erro: "E-mail ou senha incorretos. Se ainda não tem conta, crie uma." };
  redirect(caminhoSeguro(form.get("voltar")));
}

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const campo = (nome: string) => String(form.get(nome) ?? "").trim();
  const nome = campo("nome");
  const telefone = soDigitos(campo("telefone"));
  const cpf = soDigitos(campo("cpf"));
  const email = campo("email");
  const senha = String(form.get("senha") ?? "");

  if (!nome || telefone.length < 10) return { erro: "Preencha nome e telefone com DDD." };
  if (!cpfValido(cpf)) return { erro: "CPF inválido. Ele é necessário para gerar o Pix do sinal." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (form.get("aceite") !== "on") return { erro: "Para continuar, aceite a política de privacidade." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        origem: "autocadastro",
        nome,
        telefone,
        cpf,
        cep: soDigitos(campo("cep")),
        endereco: campo("endereco"),
        bairro: campo("bairro"),
        cidade: campo("cidade"),
      },
    },
  });
  if (error) {
    return { erro: error.message.includes("registered") ? "Já existe uma conta com este e-mail. Tente entrar." : "Não foi possível criar a conta. Tente de novo." };
  }
  if (!data.session) {
    return { erro: "Conta criada! Enviamos um e-mail de confirmação: clique no link e depois entre com sua senha." };
  }
  redirect(caminhoSeguro(form.get("voltar"), "/agendar"));
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
