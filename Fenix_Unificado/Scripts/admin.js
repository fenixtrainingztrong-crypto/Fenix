import { supabase } from './supabase-auth.js';

const $ = (id) => document.getElementById(id);
const roleFilter = $('roleFilter');
const userTableBody = $('userTableBody');
const workoutList = $('workoutList');
const formNotice = $('formNotice');

let usuarios = [];
let treinos = [];

function escapar(valor = '') {
  return String(valor).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function aviso(mensagem, tipo = 'success') {
  if (!formNotice) return;
  formNotice.textContent = mensagem;
  formNotice.classList.add('visible');
  formNotice.style.color = tipo === 'success' ? '#a6f3d5' : '#ffd779';
}

async function protegerPainel() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    window.location.replace('Login.html');
    return false;
  }

  const { data: perfil, error } = await supabase
    .from('clientes')
    .select('id, role')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();

  if (error || !perfil || perfil.role !== 'adm') {
    await supabase.auth.signOut();
    window.location.replace('Login.html?acesso=negado');
    return false;
  }

  document.body.classList.remove('admin-loading');
  return true;
}

async function carregarUsuarios() {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, auth_user_id, nome, email, role')
    .order('id', { ascending: true });

  if (error) throw error;
  usuarios = data || [];
  renderUsuarios();
}

async function carregarTreinos() {
  const { data, error } = await supabase
    .from('treinos')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  treinos = data || [];
  renderTreinos();
}

function renderUsuarios() {
  const filtro = roleFilter.value;
  const lista = filtro === 'all' ? usuarios : usuarios.filter((u) => u.role === filtro);

  userTableBody.innerHTML = lista.length ? lista.map((u) => `
    <tr>
      <td><div class="user-name">${escapar(u.nome)}</div><div class="user-email">${escapar(u.email)}</div></td>
      <td><span class="badge ${u.role === 'adm' ? 'adm' : 'user'}">${u.role === 'adm' ? 'Admin' : 'User'}</span></td>
      <td>Ativo</td>
      <td><div class="action-group">
        <button class="btn btn-secondary" data-action="toggle-role" data-id="${Number(u.id)}">${u.role === 'adm' ? 'Remover adm' : 'Promover adm'}</button>
        <button class="btn btn-danger" data-action="delete-user" data-id="${Number(u.id)}">Excluir</button>
      </div></td>
    </tr>`).join('') : '<tr><td colspan="4"><div class="empty-state">Nenhum usuário encontrado.</div></td></tr>';

  $('totalUsers').textContent = usuarios.length;
  $('totalAdmins').textContent = usuarios.filter((u) => u.role === 'adm').length;
  $('totalUsersActive').textContent = usuarios.length;
  $('userCountBadge').textContent = `${lista.length} usuários`;
}

function renderTreinos() {
  workoutList.innerHTML = treinos.length ? treinos.map((t) => `
    <article class="workout-card">
      <img class="thumb" src="./FIREImgs/Treino grande.png" alt="Treino" />
      <h4>Treino #${Number(t.id)}</h4>
      <div class="meta"><span>Região: ${escapar(t.regiao ?? '-')}</span><span>Intensidade: ${escapar(t.intensidade ?? '-')}</span></div>
      <p>${escapar(t.tempoMinutos ?? '-')} minutos · ${escapar(t.gastoCalorico ?? '-')} kcal</p>
      <div class="card-actions"><button class="btn btn-neutral" data-action="delete-workout" data-id="${Number(t.id)}">Excluir</button></div>
    </article>`).join('') : '<div class="empty-state">Nenhum treino cadastrado.</div>';

  $('totalWorkouts').textContent = treinos.length;
  $('workoutCountBadge').textContent = `${treinos.length} treinos`;
}

$('workoutForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const nomeTreino = $('workoutName').value.trim();
  const nivel = $('workoutLevel').value;
  const categoria = $('workoutCategory').value;
  const dados = {
    nomeTreino,
    gastoCalorico: 300,
    intensidade: nivel === 'Avançado' ? 5 : nivel === 'Intermediário' ? 3 : 2,
    tempoMinutos: 45,
    regiao: categoria === 'Inferior' ? 2 : categoria === 'Cardio' ? 3 : categoria === 'Funcional' ? 4 : 1
  };

  const { error } = await supabase.from('treinos').insert(dados);
  if (error) return aviso(`Erro ao salvar treino: ${error.message}`, 'warning');
  event.target.reset();
  await carregarTreinos();
  aviso('Treino adicionado com sucesso!');
});

document.addEventListener('click', async (event) => {
  const botao = event.target.closest('button[data-action]');
  if (!botao) return;
  const id = Number(botao.dataset.id);
  const action = botao.dataset.action;

  if (action === 'toggle-role') {
    const usuario = usuarios.find((u) => Number(u.id) === id);
    if (!usuario) return;
    // Impede remover a propria permissao administrativa por este painel.
    const { data: { user } } = await supabase.auth.getUser();
    if (usuario.auth_user_id === user?.id && usuario.role === 'adm') {
      alert('Você não pode remover sua própria permissão de administrador.');
      return;
    }
    const novoRole = usuario.role === 'adm' ? 'user' : 'adm';
    const { error } = await supabase.from('clientes').update({ role: novoRole }).eq('id', id);
    if (error) return alert(`Erro ao alterar função: ${error.message}`);
    await carregarUsuarios();
  }

  if (action === 'delete-user') {
    if (!confirm('Excluir o registro deste cliente? A conta de autenticação do Supabase não será apagada.')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return alert(`Erro ao excluir cliente: ${error.message}`);
    await carregarUsuarios();
  }

  if (action === 'delete-workout') {
    if (!confirm('Deseja excluir este treino?')) return;
    const { error } = await supabase.from('treinos').delete().eq('id', id);
    if (error) return alert(`Erro ao excluir treino: ${error.message}`);
    await carregarTreinos();
  }
});

roleFilter.addEventListener('change', renderUsuarios);

$('adminLogout')?.addEventListener('click', async (event) => {
  event.preventDefault();
  await supabase.auth.signOut();
  window.location.replace('Login.html');
});

(async function iniciar() {
  try {
    if (!await protegerPainel()) return;
    await Promise.all([carregarUsuarios(), carregarTreinos()]);
  } catch (error) {
    console.error(error);
    aviso(`Não foi possível carregar o painel: ${error.message}`, 'warning');
  }
})();
