document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('threadsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver suas mensagens.</div>';
    return;
  }

  container.innerHTML = '<div class="empty-state">Carregando conversas...</div>';

  try {
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const meData = await meRes.json();
    if (!meRes.ok || !meData.success) throw new Error('Não autenticado');

    // essa é a página do psicólogo; se quem estiver logado for paciente,
    // manda pro painel certo em vez de mostrar uma lista vazia sem explicação
    const tipoConta = meData.data?.profile?.tipo;
    if (tipoConta && tipoConta !== 'psicologo') {
      alert('Esta é a área do psicólogo. Você está logado como paciente.');
      window.location.href = 'paginaposlogin.html';
      return;
    }

    const response = await fetch(`${API_BASE}/api/chats/threads`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || 'Erro ao buscar conversas.');

    const threads = Array.isArray(data.data) ? data.data : [];

    if (!threads.length) {
      container.innerHTML = '<div class="empty-state">Você ainda não tem pacientes com consulta agendada ou concluída para conversar.</div>';
      return;
    }

    container.innerHTML = threads.map((thread) => renderThreadCard(thread)).join('');
  } catch (error) {
    container.innerHTML = '<div class="empty-state">' + escapeHtml(error.message) + '</div>';
  }
});

function renderThreadCard(thread) {
  const nome = thread.full_name || 'Usuário';
  const foto = avatarSrc(thread.foto, nome);
  const preview = thread.lastMessage
    ? escapeHtml(thread.lastMessage.body).slice(0, 90)
    : 'Nenhuma mensagem ainda — envie a primeira!';
  const hora = thread.lastMessage ? formatarDataHora(thread.lastMessage.sent_at) : '';

  return `
    <a class="thread-card" href="conversa.html?with=${encodeURIComponent(thread.otherUserId)}">
      <img class="thread-photo" src="${foto}" alt="Foto de ${escapeHtml(nome)}" loading="lazy">
      <div class="thread-info">
        <h3>${escapeHtml(nome)}</h3>
        <p class="thread-preview">${preview}</p>
      </div>
      ${hora ? `<span class="thread-hora">${hora}</span>` : ''}
    </a>
  `;
}

function formatarDataHora(iso) {
  const data = new Date(iso);
  const hoje = new Date();
  const mesmoDia = data.toDateString() === hoje.toDateString();
  return mesmoDia
    ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
