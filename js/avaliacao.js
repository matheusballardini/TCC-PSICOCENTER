// Modal simples de avaliação por estrelas (1-5) + comentário opcional,
// reaproveitado tanto pelo paciente (avalia psicólogo) quanto pelo psicólogo (avalia paciente).
function abrirModalAvaliacao({ nomeAvaliado, onEnviar }) {
  const overlay = document.createElement('div');
  overlay.className = 'avaliacao-overlay';
  overlay.innerHTML = `
    <div class="avaliacao-modal">
      <h3>Avaliar ${nomeAvaliado}</h3>
      <div class="avaliacao-estrelas" id="avaliacaoEstrelas">
        ${[1, 2, 3, 4, 5].map((n) => `<span class="avaliacao-estrela" data-valor="${n}">☆</span>`).join('')}
      </div>
      <textarea id="avaliacaoComentario" rows="3" maxlength="500" placeholder="Comentário (opcional)"></textarea>
      <p id="avaliacaoErro" class="avaliacao-erro"></p>
      <div class="avaliacao-acoes">
        <button type="button" class="btn" id="avaliacaoEnviarBtn">Enviar avaliação</button>
        <button type="button" class="btn-secondary" id="avaliacaoCancelarBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let notaEscolhida = 0;
  const estrelas = overlay.querySelectorAll('.avaliacao-estrela');
  const pintarEstrelas = (ate) => {
    estrelas.forEach((estrela) => {
      const valor = Number(estrela.dataset.valor);
      estrela.textContent = valor <= ate ? '★' : '☆';
      estrela.classList.toggle('preenchida', valor <= ate);
    });
  };

  estrelas.forEach((estrela) => {
    estrela.addEventListener('mouseenter', () => pintarEstrelas(Number(estrela.dataset.valor)));
    estrela.addEventListener('click', () => {
      notaEscolhida = Number(estrela.dataset.valor);
      pintarEstrelas(notaEscolhida);
    });
  });
  overlay.querySelector('#avaliacaoEstrelas').addEventListener('mouseleave', () => pintarEstrelas(notaEscolhida));

  const fechar = () => overlay.remove();
  overlay.querySelector('#avaliacaoCancelarBtn').addEventListener('click', fechar);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) fechar();
  });

  overlay.querySelector('#avaliacaoEnviarBtn').addEventListener('click', async () => {
    const erroEl = overlay.querySelector('#avaliacaoErro');
    if (notaEscolhida < 1) {
      erroEl.textContent = 'Escolha de 1 a 5 estrelas.';
      return;
    }
    const review = overlay.querySelector('#avaliacaoComentario').value.trim();
    try {
      await onEnviar({ rating: notaEscolhida, review });
      fechar();
    } catch (error) {
      erroEl.textContent = error.message || 'Erro ao enviar avaliação.';
    }
  });
}

function escapeHtmlAvaliacao(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Modal que lista as avaliações (nota + comentário) que alguém recebeu.
// Reaproveitado tanto pro perfil do psicólogo (comentários de pacientes)
// quanto pro do paciente (comentários de psicólogos).
function abrirModalComentarios({ titulo, avaliacoes }) {
  const overlay = document.createElement('div');
  overlay.className = 'avaliacao-overlay';

  const listaHtml = (avaliacoes && avaliacoes.length)
    ? avaliacoes.map((avaliacao) => {
      const nota = Number(avaliacao.rating) || 0;
      const estrelas = '★'.repeat(nota) + '☆'.repeat(5 - nota);
      const data = avaliacao.created_at
        ? new Date(avaliacao.created_at).toLocaleDateString('pt-BR')
        : '';
      const foto = avatarSrc(avaliacao.reviewer_photo, avaliacao.reviewer_name);
      const comentario = avaliacao.review
        ? escapeHtmlAvaliacao(avaliacao.review)
        : '<em>(sem comentário)</em>';

      return `
        <div class="comentario-item">
          <img class="comentario-foto" src="${foto}" alt="Foto de ${escapeHtmlAvaliacao(avaliacao.reviewer_name)}" loading="lazy">
          <div class="comentario-corpo">
            <div class="comentario-topo">
              <strong>${escapeHtmlAvaliacao(avaliacao.reviewer_name)}</strong>
              <span class="comentario-data">${data}</span>
            </div>
            <div class="comentario-estrelas">${estrelas}</div>
            <p class="comentario-texto">${comentario}</p>
          </div>
        </div>
      `;
    }).join('')
    : '<p class="avaliacao-vazio">Ainda não há avaliações.</p>';

  overlay.innerHTML = `
    <div class="avaliacao-modal comentarios-modal">
      <h3>${escapeHtmlAvaliacao(titulo)}</h3>
      <div class="comentarios-lista">${listaHtml}</div>
      <div class="avaliacao-acoes">
        <button type="button" class="btn-secondary" id="comentariosFecharBtn">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const fechar = () => overlay.remove();
  overlay.querySelector('#comentariosFecharBtn').addEventListener('click', fechar);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) fechar();
  });
}
