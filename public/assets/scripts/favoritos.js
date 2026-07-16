const API_FAVORITOS = 'http://localhost:3000/favoritos';
const API_ALBUNS = 'http://localhost:3000/albuns';
async function buscarFavoritosUsuario(usuarioId) {
  const url = `${API_FAVORITOS}?usuarioId=${encodeURIComponent(usuarioId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`buscarFavoritosUsuario: resposta não-ok (${res.status}) para ${url}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const texto = await res.text();
    console.error(`buscarFavoritosUsuario: resposta não é JSON. URL: ${url} | Conteúdo recebido:`, texto.slice(0, 200));
    throw new Error('Resposta inesperada do servidor (não é JSON)');
  }

  return res.json();
}

async function ehFavorito(usuarioId, albumId) {
  const url = `${API_FAVORITOS}?usuarioId=${encodeURIComponent(usuarioId)}&albumId=${encodeURIComponent(albumId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`ehFavorito: resposta não-ok (${res.status}) para ${url}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const texto = await res.text();
    console.error(`ehFavorito: resposta não é JSON. URL: ${url} | Conteúdo recebido:`, texto.slice(0, 200));
    throw new Error('Resposta inesperada do servidor (não é JSON)');
  }

  const lista = await res.json();
  return lista.length > 0 ? lista[0] : null;
}

async function toggleFavorito(usuarioId, albumId) {
  const existente = await ehFavorito(usuarioId, albumId);

  if (existente) {
    await fetch(`${API_FAVORITOS}/${existente.id}`, {
      method: 'DELETE'
    });

    return false;
  }

  await fetch(API_FAVORITOS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      usuarioId,
      albumId
    })
  });

  return true;
}

async function carregarFavoritosNaPagina() {
  const container = document.getElementById('container-favoritos');
  if (!container) return;
  container.innerHTML = '';

  const usuario = getUsuarioLogado();
  if (!usuario) return;

  try {
    const favoritos = await buscarFavoritosUsuario(usuario.id);
    
    for (const fav of favoritos) {
      const albumResponse = await fetch(`${API_ALBUNS}/${fav.albumId}`);
      const album = await albumResponse.json();

      const card = createCard(album, true); 
      container.appendChild(card);
    }

    container.querySelectorAll('.btn-favorito').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const albumId = btn.dataset.albumId;
          
          const agoraFavorito = await toggleFavorito(usuario.id, albumId);
          
          if (!agoraFavorito) {
            const cardArticle = btn.closest('.col-12');
            if (cardArticle) {
              cardArticle.remove();
            }
          }

        } catch (err) {
          console.error('Erro ao atualizar favorito:', err);
        }
      });
    });

  } catch (err) {
    console.error('Erro ao carregar favoritos:', err);
  }
}

document.addEventListener('DOMContentLoaded', carregarFavoritosNaPagina);