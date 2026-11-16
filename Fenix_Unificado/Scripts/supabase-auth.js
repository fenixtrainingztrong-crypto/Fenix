import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://uxfrsifswfaxojuubgeb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lZIEjlFQ0HtoS6u3sHT-1A_1v7G-rMw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

function mostrarMensagem(form, mensagem, erro = false) {
    let area = form.querySelector(".supabase-message");

    if (!area) {
        area = document.createElement("p");
        area.className = "supabase-message";
        area.setAttribute("role", "status");
        area.style.marginTop = "15px";
        form.appendChild(area);
    }

    area.textContent = mensagem;
    area.style.color = erro ? "#ff4757" : "#2ed573";
}

function definirCarregamento(botao, carregando, textoOriginal) {
    if (!botao) return;
    botao.disabled = carregando;
    botao.innerHTML = carregando ? "<span>Processando...</span>" : textoOriginal;
}

// CADASTRO
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const username = document.getElementById("username").value.trim();
        const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
        const dataNascimento = document.getElementById("data_nascimento").value;
        const email = document.getElementById("email").value.trim();
        const senha = document.getElementById("password").value;
        const confirmarSenha = document.getElementById("confirm_password").value;
        const termos = document.getElementById("terms");

        const botao = registerForm.querySelector('[type="submit"]');
        const textoOriginal = botao ? botao.innerHTML : "Criar Conta";

        if (!nome || !username || !cpf || !dataNascimento || !email || !senha) {
            mostrarMensagem(registerForm, "Preencha nome, usuário, CPF, nascimento, e-mail e senha.", true);
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

        definirCarregamento(botao, true, textoOriginal);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: senha,
                options: {
                    data: {
                        nome,
                        username,
                        cpf,
                        nascdate: dataNascimento
                    }
                }
            });

            if (error) throw error;

            if (data.session) {
                mostrarMensagem(registerForm, "Conta criada! Redirecionando...");
                window.location.href = "Planos.html";
            } else {
                mostrarMensagem(registerForm, "Cadastro iniciado! Confira seu e-mail para confirmar a conta antes de entrar.");
            }
        } catch (error) {
            mostrarMensagem(registerForm, "Não foi possível cadastrar: " + error.message, true);
        } finally {
            definirCarregamento(botao, false, textoOriginal);
        }
    });
}

// LOGIN
const loginForm = document.querySelector("form.auth-form:not(#registerForm)");

if (loginForm && document.getElementById("login")) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const inputLogin = document.getElementById("email").value.trim();
        const senha = document.getElementById("password").value;
        const botao = document.getElementById("login");
        const textoOriginal = botao ? botao.innerHTML : "Acessar Conta";

        if (!inputLogin || !senha) {
            mostrarMensagem(loginForm, "Informe seu e-mail e senha.", true);
            return;
        }

        if (!inputLogin.includes("@")) {
            mostrarMensagem(loginForm, "Por segurança, entre utilizando seu e-mail.", true);
            return;
        }

        definirCarregamento(botao, true, textoOriginal);

        try {
            const { data: loginData, error } = await supabase.auth.signInWithPassword({
                email: inputLogin,
                password: senha
            });

            if (error) throw error;

            const { data: cliente, error: perfilError } = await supabase
                .from("clientes")
                .select("role")
                .eq("auth_user_id", loginData.user.id)
                .maybeSingle();

            if (perfilError) throw perfilError;

            if (cliente && cliente.role === "adm") {
                window.location.href = "Admin.html";
                return;
            }

            window.location.href = "Planos.html";
        } catch (error) {
            mostrarMensagem(loginForm, "Não foi possível entrar: confira os dados e a senha.", true);
            definirCarregamento(botao, false, textoOriginal);
        }
    });
}

// Alternar a visualização das senhas
document.querySelectorAll(".password-toggle").forEach((botao) => {
    botao.addEventListener("click", () => {
        const campo = botao.previousElementSibling;
        if (!campo) return;

        campo.type = campo.type === "password" ? "text" : "password";
    });
});

window.fenixSupabase = { supabase };
