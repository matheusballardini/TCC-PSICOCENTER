// Sino de notificações flutuante (canto inferior direito), compartilhado
// pelas páginas internas do site. Ícone do Heroicons (ver js/icons.js, que
// precisa ser carregado antes deste arquivo).
(function () {

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    injectStyles();
    const { button, badge, dropdown, lista, marcarTodasBtn } = buildUI();

    function getCachedRole() {
      try {
        return JSON.parse(localStorage.getItem('currentUser') || '{}').role || null;
      } catch (e) {
        return null;
      }
    }

    function formatarRelativo(iso) {
      const diffMs = Date.now() - new Date(iso).getTime();
      const min = Math.floor(diffMs / 60000);
      if (min < 1) return 'agora mesmo';
      if (min < 60) return `há ${min} min`;
      const horas = Math.floor(min / 60);
      if (horas < 24) return `há ${horas}h`;
      const dias = Math.floor(horas / 24);
      return `há ${dias}d`;
    }

    function textoNotificacao(n) {
      // nome/preview vêm de dados digitados por usuários (nome de perfil, texto da
      // mensagem) — sempre escapar antes de jogar no innerHTML, senão vira XSS
      const nome = escapeHtml(n.payload?.actorName || 'Alguém');
      const data = n.payload?.data
        ? new Date(n.payload.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : '';
      const horario = escapeHtml(n.payload?.horario || '');
      switch (n.type) {
        case 'solicitacao_consulta':
          return `${nome} solicitou uma consulta para ${data} às ${horario}.`;
        case 'consulta_aceita':
          return `${nome} aceitou sua consulta de ${data} às ${horario}.`;
        case 'consulta_cancelada':
          return `${nome} cancelou a consulta de ${data} às ${horario}.`;
        case 'mensagem':
          return `${nome}: ${escapeHtml(n.payload?.preview || 'nova mensagem')}`;
        default:
          return 'Nova notificação.';
      }
    }

    function destinoNotificacao(n) {
      if (n.type === 'mensagem') {
        return 'conversa.html?with=' + encodeURIComponent(n.actor_id);
      }
      const role = getCachedRole();
      return role === 'psicologo' ? 'agendamentos.html' : 'agendamentos_paciente.html';
    }

    async function carregarContagem() {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        const count = data?.data?.count || 0;
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.style.display = count > 0 ? 'flex' : 'none';
      } catch (e) {
        // sem conexão: só não mostra a contagem, não é crítico
      }
    }

    async function carregarLista() {
      lista.innerHTML = '<p class="notif-vazio">Carregando...</p>';
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        const notificacoes = Array.isArray(data?.data) ? data.data : [];

        if (!notificacoes.length) {
          lista.innerHTML = '<p class="notif-vazio">Nenhuma notificação por enquanto.</p>';
          return;
        }

        lista.innerHTML = notificacoes.map((n) => `
          <a class="notif-item${n.read_at ? '' : ' nao-lida'}" href="${destinoNotificacao(n)}" data-id="${n.id}">
            <p>${textoNotificacao(n)}</p>
            <span class="notif-hora">${formatarRelativo(n.created_at)}</span>
          </a>
        `).join('');

        lista.querySelectorAll('.notif-item').forEach((item) => {
          item.addEventListener('click', () => {
            fetch(`${API_BASE}/api/notifications/${item.dataset.id}/read`, {
              method: 'PATCH',
              headers: { Authorization: 'Bearer ' + token }
            }).catch(() => {});
          });
        });
      } catch (e) {
        lista.innerHTML = '<p class="notif-vazio">Erro ao carregar notificações.</p>';
      }
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const abrindo = dropdown.style.display !== 'flex';
      dropdown.style.display = abrindo ? 'flex' : 'none';
      if (abrindo) carregarLista();
    });

    dropdown.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    marcarTodasBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
          method: 'PATCH',
          headers: { Authorization: 'Bearer ' + token }
        });
        await carregarContagem();
        await carregarLista();
      } catch (e) {
        // sem conexão: tenta de novo na próxima interação
      }
    });

    carregarContagem();
  }

  function buildUI() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'notif-bell-btn';
    button.setAttribute('aria-label', 'Notificações');
    button.innerHTML = (typeof heroIcon === 'function' ? heroIcon('sino', 24) : '') + '<span class="notif-bell-badge"></span>';

    const dropdown = document.createElement('div');
    dropdown.className = 'notif-bell-dropdown';
    dropdown.innerHTML = `
      <div class="notif-bell-header">
        <h3>Notificações</h3>
        <button type="button" id="notifMarcarTodas" class="notif-marcar-todas">Marcar todas como lidas</button>
      </div>
      <div class="notif-bell-lista"></div>
    `;
    dropdown.style.display = 'none';

    document.body.appendChild(button);
    document.body.appendChild(dropdown);

    return {
      button,
      badge: button.querySelector('.notif-bell-badge'),
      dropdown,
      lista: dropdown.querySelector('.notif-bell-lista'),
      marcarTodasBtn: dropdown.querySelector('#notifMarcarTodas'),
    };
  }

  function injectStyles() {
    if (document.getElementById('notifBellStyles')) return;
    const style = document.createElement('style');
    style.id = 'notifBellStyles';
    style.textContent = `
      .notif-bell-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #2b4391, #845fb4);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(28, 34, 72, 0.28);
        z-index: 9998;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .notif-bell-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 28px rgba(28, 34, 72, 0.35);
      }
      .notif-bell-badge {
        display: none;
        position: absolute;
        top: 2px;
        right: 2px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 2px #fff;
      }
      .notif-bell-dropdown {
        position: fixed;
        bottom: 86px;
        right: 24px;
        width: min(360px, calc(100vw - 32px));
        max-height: 70vh;
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 20px 45px rgba(28, 34, 72, 0.28);
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
      }
      .notif-bell-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 16px 18px;
        border-bottom: 1px solid rgba(43, 67, 145, 0.12);
      }
      .notif-bell-header h3 {
        margin: 0;
        font-size: 1rem;
        color: #2b4391;
      }
      .notif-marcar-todas {
        border: none;
        background: none;
        color: #5568fc;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
        padding: 4px;
      }
      .notif-marcar-todas:hover {
        text-decoration: underline;
      }
      .notif-bell-lista {
        overflow-y: auto;
        max-height: 60vh;
      }
      .notif-vazio {
        margin: 0;
        padding: 24px 18px;
        text-align: center;
        color: #6b7280;
        font-size: 0.9rem;
      }
      .notif-item {
        display: block;
        padding: 14px 18px;
        text-decoration: none;
        color: #1f2a44;
        border-bottom: 1px solid rgba(43, 67, 145, 0.08);
        transition: background 0.15s ease;
      }
      .notif-item:hover {
        background: rgba(43, 67, 145, 0.05);
      }
      .notif-item.nao-lida {
        background: rgba(85, 104, 252, 0.06);
        font-weight: 600;
      }
      .notif-item p {
        margin: 0 0 4px;
        font-size: 0.88rem;
        line-height: 1.4;
      }
      .notif-hora {
        font-size: 0.75rem;
        color: #6b7280;
      }
      @media (max-width: 480px) {
        .notif-bell-btn {
          bottom: 16px;
          right: 16px;
          width: 46px;
          height: 46px;
        }
        .notif-bell-dropdown {
          bottom: 72px;
          right: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
})();
