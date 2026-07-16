const API_URL = 'http://localhost:3000/albuns';
const API_AVALIACOES = 'http://localhost:3000/avaliacoes';

let todosOsItens = []; 


async function fetchItems() {
  const response = await fetch(API_URL);
  const data = await response.json();
  return data;
}

function createCard(album, favoritoAtual) {
  const usuario = getUsuarioLogado();
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-md-4';

  const coracaoHtml = usuario
    ? `<button class="btn-favorito" data-album-id="${album.id}" style="background:none; border:none; font-size:20px; cursor:pointer; position:absolute; top:8px; right:8px;">
        ${favoritoAtual ? '❤️' : '🤍'}
      </button>`
    : '';

  const anoLancamento = album.lancamento ? album.lancamento.slice(0, 4) : '?';

  col.innerHTML = `
    <article class="album-card h-100" style="position:relative;">
      ${coracaoHtml}
      <div class="album-cover-wrap">
        <img src="${album.imagem || ''}" alt="${album.nome || ''}" class="album-cover-img"/>
      </div>
      <h4 class="mt-2 text-center" style="font-family: 'Special Elite'; font-size: 1.1rem;">${album.nome || '(sem nome)'}</h4>
      <p style="font-size:12px; text-align:center; opacity:0.7; font-family:'Courier Prime',monospace;">${album.categoria || ''} · ${anoLancamento}</p>
      <p style="font-size:12px; text-align:center; font-family:'Courier Prime',monospace; padding: 0 8px;">${album.descricaoCurta || ''}</p>
      <a href="detalhes.html?id=${album.id}" class="album-link text-center d-block mb-3">clique -aqui- para saber mais.</a>
    </article>
  `;
  return col;
}

async function renderCards(items) {
  const container = document.getElementById('container-cards');
  if (!container) return;
  container.innerHTML = ''; 

  const usuario = getUsuarioLogado();
  let favoritosIds = [];

  if (usuario) {
    try {
      const favoritos = await buscarFavoritosUsuario(usuario.id);
      favoritosIds = favoritos.map(f => f.albumId);
    } catch (err) {
      console.error('Não foi possível carregar favoritos:', err);
    }
  }

  items.forEach(item => {
    const isFavorito = favoritosIds.map(String).includes(String(item.id));
    container.appendChild(createCard(item, isFavorito));
  });

  if (usuario) {
    container.querySelectorAll('.btn-favorito').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const albumId = btn.dataset.albumId;
          const agoraFavorito = await toggleFavorito(usuario.id, albumId);
          btn.textContent = agoraFavorito ? '❤️' : '🤍';
        } catch (err) {
          console.error('Erro ao favoritar:', err);
        }
      });
    });
  }
}


function setupBusca() {
  const campoPesquisa = document.getElementById('campo-pesquisa');
  if (!campoPesquisa) return;

  campoPesquisa.addEventListener('input', (e) => {
    const termoBusca = e.target.value.toLowerCase().trim();

    if (termoBusca === "") {
      renderCards(todosOsItens);
    } else {
      const itensFiltrados = todosOsItens.filter(item => {
        const nome = (item.nome || "").toLowerCase();
        const desc = (item.descricaoCurta || "").toLowerCase();
        
        return nome.includes(termoBusca) || desc.includes(termoBusca);
      });

      renderCards(itensFiltrados);
    }
  });
}


async function renderGrafico(albuns) {
  const canvas = document.getElementById('graficoAvaliacoes');
  if (!canvas) return;

  try {
    const resAval = await fetch(API_AVALIACOES);
    const avaliacoes = await resAval.json();

    const labels = [];
    const notas = [];

    avaliacoes.forEach(av => {
      const album = albuns.find(a => String(a.id) === String(av.albumId));
      if (album) {
        labels.push(album.nome);
        notas.push(av.nota);
      }
    });

    if (labels.length === 0) {
      console.warn('Nenhuma avaliação encontrada para os álbuns carregados.');
      return;
    }

    const paletaCores = ['#e8734a', '#4a90c4', '#5cb85c', '#9b59b6', '#f0ad4e', '#e85f8d', '#34c3b5', '#c8a030'];
    const coresFundo = notas.map((_, i) => paletaCores[i % paletaCores.length]);
    const coresBorda = coresFundo.map(c => c);

    const menorNota = Math.min(...notas);
    const pisoEixo = Math.max(0, Math.floor(menorNota) - 1);

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nota do álbum (0-10)',
          data: notas,
          backgroundColor: coresFundo,
          borderColor: coresBorda,
          borderWidth: 2,
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }]
      },
      options: {
        maintainAspectRatio: false,
        layout: {
          padding: { top: 24 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Nota: ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: pisoEixo,
            max: 10,
            grid: { color: 'rgba(26,18,0,0.08)' },
            ticks: { stepSize: 0.5 }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      },
      plugins: [{
        id: 'valoresNoTopo',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          chart.data.datasets[0].data.forEach((valor, i) => {
            const meta = chart.getDatasetMeta(0);
            const bar = meta.data[i];
            ctx.save();
            ctx.fillStyle = '#1a1200';
            ctx.font = 'bold 12px Courier Prime, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(valor, bar.x, bar.y - 8);
            ctx.restore();
          });
        }
      }]
    });
  } catch (err) {
    console.error('Erro ao renderizar gráfico:', err);
  }
}

function renderCarrossel(destaques) {
  const inner = document.getElementById('carrossel-destaques-inner');
  if (!inner) return;
  inner.innerHTML = '';
  destaques.forEach((album, index) => {
    inner.innerHTML += `
      <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <img src="${album.imagem}" class="d-block w-100 carousel-img-custom" alt="${album.nome}">
        <div class="carousel-caption">
          <h5>${album.nome}</h5>
          <p>${album.descricaoCurta}</p>
          <a href="detalhes.html?id=${album.id}" class="btn btn-sm btn-light mt-2" style="position:relative; z-index:20; pointer-events:auto;">Explorar Obra</a>
        </div>
      </div>
    `;
  });
}

async function init() {
  try {
    todosOsItens = await fetchItems();
  } catch (err) {
    const container = document.getElementById('container-cards');
    if (container) container.innerHTML = `<p class="text-center font-monospace">Erro ao carregar dados. JSON Server está rodando?</p>`;
    return;
  }

  try {
    await renderCards(todosOsItens);
  } catch (err) {
    console.error('Erro ao renderizar cards:', err);
  }

  try {
    renderCarrossel(todosOsItens.filter(a => a.destaque));
  } catch (err) {
    console.error('Erro ao renderizar carrossel:', err);
  }

  try {
    await renderGrafico(todosOsItens);
  } catch (err) {
    console.error('Erro ao renderizar gráfico:', err);
  }

  setupBusca();
}

document.addEventListener('DOMContentLoaded', init);