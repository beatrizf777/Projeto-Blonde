const API_USUARIOS = 'http://localhost:3000/usuarios';
const SESSION_KEY = 'usuarioLogado';

async function loginUser(login, senha) {
  try {
    const res = await fetch(`${API_USUARIOS}?login=${encodeURIComponent(login)}`);
    const usuarios = await res.json();

    if (usuarios.length === 0) return false;

    const usuario = usuarios[0];
    if (usuario.senha !== senha) return false;

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    return true;
  } catch (err) {
    console.error('Erro ao tentar logar:', err);
    return false;
  }
}

async function addUser(nome, login, senha, email) {
  try {
    const checagem = await fetch(`${API_USUARIOS}?login=${encodeURIComponent(login)}`);
    const existentes = await checagem.json();
    if (existentes.length > 0) {
      return { erro: 'login-existente' };
    }

    const novoUsuario = { nome, login, senha, email, admin: false };

    const res = await fetch(API_USUARIOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoUsuario)
    });

    if (!res.ok) return { erro: 'falha-servidor' };

    const criado = await res.json();
    return criado;
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    return { erro: 'falha-conexao' };
  }
}


async function loginComPerfil(perfil) {
  try {
    const res = await fetch(`${API_USUARIOS}?admin=${perfil === 'admin'}`);
    const usuarios = await res.json();

    if (usuarios.length === 0) {
      return false;
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuarios[0]));
    return true;
  } catch (err) {
    console.error('Erro ao tentar logar:', err);
    return false;
  }
}

function getUsuarioLogado() {
  const dados = sessionStorage.getItem(SESSION_KEY);
  return dados ? JSON.parse(dados) : null;
}

function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function isAdmin() {
  const usuario = getUsuarioLogado();
  return !!(usuario && usuario.admin);
}

function atualizarMenuSessao() {
  const usuario = getUsuarioLogado();

  const linkLogin = document.getElementById('nav-login');
  const linkLogout = document.getElementById('nav-logout');
  const linkFavoritos = document.getElementById('nav-favoritos');
  const linkCadastroItem = document.getElementById('nav-cadastro-item');
  const saudacao = document.getElementById('nav-saudacao');

  if (usuario) {
    if (linkLogin) linkLogin.classList.add('d-none');
    if (linkLogout) linkLogout.classList.remove('d-none');
    if (linkFavoritos) linkFavoritos.classList.remove('d-none');
    if (saudacao) {
      saudacao.classList.remove('d-none');
      saudacao.textContent = `olá, ${usuario.nome.split(' ')[0]}`;
    }
    if (linkCadastroItem) {
      linkCadastroItem.classList.toggle('d-none', !usuario.admin);
    }
  } else {
    if (linkLogin) linkLogin.classList.remove('d-none');
    if (linkLogout) linkLogout.classList.add('d-none');
    if (linkFavoritos) linkFavoritos.classList.add('d-none');
    if (linkCadastroItem) linkCadastroItem.classList.add('d-none');
    if (saudacao) saudacao.classList.add('d-none');
  }
}

document.addEventListener('DOMContentLoaded', atualizarMenuSessao);