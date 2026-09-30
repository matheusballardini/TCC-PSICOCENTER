// Mostra a bolinha vermelha de aviso no link "Mensagens" quando o usuário
// logado tem alguma mensagem não lida. Compartilhado por todas as páginas
// que têm esse link (ver <span id="mensagensBadge"> no HTML de cada uma).
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('mensagensBadge');
  if (!badge) return;

  const token = localStorage.getItem('authToken');
  if (!token) return;

  fetch(`${API_BASE}/api/chats/unread-count`, {
    headers: { Authorization: 'Bearer ' + token }
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.data.count > 0) {
        badge.style.display = 'block';
      }
    })
    .catch(() => {
      // sem conexão ou não autenticado de verdade: só não mostra a bolinha, sem travar a página
    });
});
