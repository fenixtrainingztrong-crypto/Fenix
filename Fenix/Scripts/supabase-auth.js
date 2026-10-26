import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// A chave publishable/anon pode estar no frontend. Nunca use service_role aqui.
const SUPABASE_URL = "https://uxfrsifswfaxojuubgeb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lZIEjlFQ0HtoS6u3sHT-1A_1v7G-rMw";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function mostrarMensagem(form, mensagem, erro = false) {
  let area = form.querySelector(".supabase-message");
  if (!area) {
    area = document.createElement("p");
    area.className = "supabase-message";
    area.setAttribute("role", "status");
    area.setAttribute("aria-live", "polite");
    area.style.marginTop = "15px";
    form.appendChild(area);
  }
  area.textContent = mensagem;
  area.style.color = erro ? "#ff4757" : "#2ed573";
}

function definirCarregamento(botao, carregando, htmlOriginal) {
  botao.disabled = carregando;
  botao.innerHTML = carregando
    ? '<span>Processando...</span>'
    : htmlOriginal;
}

// CADASTRO
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome")?.value.trim() ?? "";
    const username = document.getElementById("username")?.value.trim() ?? "";
    const cpf = (document.getElementById("cpf")?.value ?? "").replace(/\D/g, "");
    const nascdate = document.getElementById("data_nascimento")?.value ?? "";
    const email = document.getElementById("email")?.value.trim() ?? "";
    const senha = document.getElementById("password")?.value ?? "";
    const confirmarSenha = document.getElementById("confirm_password")?.value ?? "";
    const termos = document.getElementById("terms");
    const botao = registerForm.querySelector('[type="submit"]');
    const htmlOriginal = botao?.innerHTML ?? "Criar Conta";

    if (!nome || !username || cpf.length !== 11 || !nascdate || !email || !senha) {
      mostrarMensagem(registerForm, "Preencha todos os campos obrigatórios e informe um CPF com 11 números.", true);
      return;
    }
    if (senha !== confirmarSenha) {
      mostrarMensagem(registerForm, "As senhas não coincidem.", true);
      return;
    }
    if (senha.length < 8) {
      mostrarMensagem(registerForm, "Use uma senha com pelo menos 8 caracteres.", true);
      return;
    }
    if (termos && !termos.checked) {
      mostrarMensagem(registerForm, "Você precisa aceitar os termos para continuar.", true);
      return;
    }

    definirCarregamento(botao, true, htmlOriginal);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome, username, cpf, nascdate } }
      });
      if (error) throw error;

      if (data.session) {
        mostrarMensagem(registerForm, "Conta criada! Redirecionando...");
        window.location.href = "Planos.html";
      } else {
        mostrarMensagem(registerForm, "Cadastro iniciado! Confira seu e-mail para confirmar a conta antes de entrar.");
        definirCarregamento(botao, false, htmlOriginal);
      }
    } catch (error) {
      mostrarMensagem(registerForm, "Não foi possível cadastrar: " + (error?.message ?? "erro desconhecido"), true);
      definirCarregamento(botao, false, htmlOriginal);
    }
  });
}

// LOGIN (e-mail e senha pelo Supabase Auth)
const loginForm = document.querySelector("form.auth-form:not(#registerForm)");
if (loginForm && document.getElementById("login")) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email")?.value.trim() ?? "";
    const senha = document.getElementById("password")?.value ?? "";
    const botao = document.getElementById("login");
    const htmlOriginal = botao.innerHTML;

    if (!email || !senha) {
      mostrarMensagem(loginForm, "Informe seu e-mail e senha.", true);
      return;
    }

    definirCarregamento(botao, true, htmlOriginal);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      window.location.href = "Planos.html";
    } catch (error) {
      mostrarMensagem(loginForm, "Não foi possível entrar. Confira o e-mail e a senha e verifique se confirmou seu e-mail.", true);
      definirCarregamento(botao, false, htmlOriginal);
    }
  });
}

// Alternar a visualização das senhas
 document.querySelectorAll(".password-toggle").forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = botao.parentElement?.querySelector("input");
    if (!campo) return;
    campo.type = campo.type === "password" ? "text" : "password";
  });
});
