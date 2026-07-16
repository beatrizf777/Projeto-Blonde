const API_URL = 'http://localhost:3000/albuns';
const API_ATRACOES = 'http://localhost:3000/atracoes';

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    mostrarErro('Nenhum álbum selecionado. <a href="index.html">Voltar para a Home</a>');
    return;
  }

  try {
    const [resAlbum, resAtracoes] = await Promise.all([
      fetch(`${API_URL}/${id}`),
      fetch(`${API_ATRACOES}?albumId=${id}`)
    ]);

    if (!resAlbum.ok) {
      console.error(`Álbum com id "${id}" não encontrado. Status: ${resAlbum.status}`);
      mostrarErro(`Álbum não encontrado (id: ${id}). <a href="index.html">Voltar para a Home</a>`);
      return;
    }

    const album = await resAlbum.json();

    if (!album || !album.nome) {
      console.error('Resposta do servidor não contém um álbum válido:', album);
      mostrarErro('Dados do álbum estão incompletos ou corrompidos. <a href="index.html">Voltar para a Home</a>');
      return;
    }

    const atracoes = await resAtracoes.json();

    renderDetalhe(album);
    renderAtracoes(atracoes);

    try {
      await configurarFavorito(album.id);
    } catch (err) {
      console.error('Erro ao configurar favorito (detalhes do álbum continuam visíveis):', err);
    }
  } catch (err) {
    console.error('Erro ao buscar detalhes do álbum:', err);
    mostrarErro('Erro ao conectar com o servidor. JSON Server está rodando?');
  }
}

function renderDetalhe(album) {
  document.title = `${album.nome} | blonde.com`;
  document.getElementById('detalhe-titulo').textContent = album.nome;
  document.getElementById('detalhe-img').src = album.imagem;
  document.getElementById('detalhe-img').alt = album.nome;
  document.getElementById('detalhe-descricao').textContent = album.descricaoCurta;
  document.getElementById('detalhe-conteudo-texto').textContent = album.descricaoCompleta;
  document.getElementById('detalhe-lancamento').textContent = album.lancamento;
  document.getElementById('detalhe-duracao').textContent = album.duracao;

  const tagsEl = document.getElementById('detalhe-tags');
  if (tagsEl && album.tags) {
    tagsEl.innerHTML = album.tags.map(t =>
      `<span style="display:inline-block; background:var(--bg); border:1.5px solid var(--border); border-radius:20px; padding:2px 10px; font-size:11px; font-family:'Courier Prime',monospace; margin:2px;">${t}</span>`
    ).join('');
  }

  const catEl = document.getElementById('detalhe-categoria');
  if (catEl) catEl.textContent = album.categoria;
}

function renderAtracoes(atracoes) {
  const container = document.getElementById('container-fotos-vinculadas');
  if (!container) return;
  container.innerHTML = '';

  if (atracoes.length === 0) {
    container.innerHTML = `<p class="font-monospace" style="opacity:0.6;">Nenhum material visual vinculado.</p>`;
    return;
  }

  atracoes.forEach(item => {
    container.innerHTML += `
      <div class="col-6 col-md-4">
        <div class="card bg-transparent border-secondary h-100 text-center">
          <div class="p-2">
            <img src="${item.imagem}" class="card-img-top img-fluid rounded" style="max-height:200px; object-fit:cover;" alt="${item.nome}">
          </div>
          <div class="card-body p-2">
            <h6 class="card-title m-0" style="font-family:'Courier Prime',monospace;">${item.nome}</h6>
            <small class="text-muted d-block mt-1">${item.descricao}</small>
          </div>
        </div>
      </div>
    `;
  });
}

async function configurarFavorito(albumId) {
  const usuario = getUsuarioLogado();
  const btn = document.getElementById('btn-favorito-detalhe');
  if (!usuario || !btn) return;

  btn.classList.remove('d-none');

  const favoritoExistente = await ehFavorito(usuario.id, albumId);
  btn.textContent = favoritoExistente ? '❤️' : '🤍';

  btn.addEventListener('click', async () => {
    const agoraFavorito = await toggleFavorito(usuario.id, albumId);
    btn.textContent = agoraFavorito ? '❤️' : '🤍';
  });
}

function mostrarErro(msg) {
  const main = document.getElementById('detalhes-main-container');
  if (main) main.innerHTML = `
    <div class="text-center py-5">
      <h1 class="display-1" style="font-family:'Special Elite';">404</h1>
      <p class="lead font-monospace">${msg}</p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', init);