// Mostra a bolinha vermelha de aviso no link "Agendamentos" do psicólogo
// quando existe algum agendamento novo que ele ainda não viu (nunca abriu
// a página de Agendamentos desde que a consulta foi criada).
document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('agendamentosBadge');
  if (!badge) return;

  const token = localStorage.getItem('authToken');
  if (!token) return;

  fetch(`${API_BASE}/api/appointments/unseen-count`, {
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
