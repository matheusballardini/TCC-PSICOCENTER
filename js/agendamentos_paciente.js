document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('appointmentsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver seus agendamentos.</div>';
    return;
  }

  container.innerHTML = '<div class="empty-state">Carregando agendamentos...</div>';

  try {
    // busca o id direto da sessão atual (em vez de confiar só no que ficou salvo
    // no navegador de logins anteriores, que pode estar desatualizado)
    const meRes = await fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const meData = await meRes.json();
    if (!meRes.ok || !meData.success) throw new Error('Não autenticado');

    // essa é a página do paciente; se quem estiver logado for psicólogo,
    // manda pro painel certo em vez de mostrar uma lista vazia sem explicação
    const tipoConta = meData.data?.profile?.tipo;
    if (tipoConta && tipoConta !== 'paciente') {
      alert('Esta é a área do paciente. Você está logado como psicólogo.');
      window.location.href = 'perfil.html';
      return;
    }

    const currentUserId = meData.data?.user?.id;
    if (currentUserId) localStorage.setItem('authUserId', String(currentUserId));

    const response = await fetch('http://localhost:3001/api/appointments/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Erro ao buscar agendamentos.');
    }

    const appointments = Array.isArray(data.data) ? data.data : [];
    const patientAppointments = appointments.filter((appointment) => {
      const appointmentPatientId = appointment.paciente_id;
      const isMine = String(appointmentPatientId) === String(currentUserId);
      const status = appointment.status || 'pendente';
      // consultas canceladas/recusadas somem da lista, já que não tem mais ação possível nelas
      return isMine && status !== 'cancelada' && status !== 'recusada';
    });

    if (!patientAppointments.length) {
      container.innerHTML = '<div class="empty-state">Você ainda não agendou nenhuma consulta.</div>';
      return;
    }

    container.innerHTML = patientAppointments.map((appointment) => {
      const psychologist = appointment.psicologos || {};
      const patientName = 'Você';
      const status = appointment.status || 'pendente';
      const rawDate = appointment.data || '';
      const rawTime = appointment.horario || '';
      const localeDate = rawDate ? new Date(rawDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data não informada';

      const cancelBtn = (status === 'pendente' || status === 'aceita')
        ? `<button class="btn-secondary cancel-btn" data-id="${appointment.id}">Cancelar</button>`
        : '';

      return `
        <article class="appointment-item">
          <div class="item-main">
            <h3>${psychologist.full_name || 'Psicólogo'}</h3>
            <div class="meta">
              <span>📅 ${localeDate}</span>
              <span>🕒 ${rawTime || 'Horário não informado'}</span>
              <span>👤 ${patientName}</span>
            </div>
          </div>
          <div>
            <span class="status ${status}">${status}</span>
          </div>
          <div class="item-actions">
            ${cancelBtn}
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.cancel-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const appointmentId = event.target.dataset.id;

        try {
          const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });

          const updated = await response.json();
          if (!response.ok) {
            throw new Error(updated?.message || 'Erro ao cancelar consulta.');
          }

          alert('Consulta cancelada com sucesso!');
          window.location.reload();
        } catch (error) {
          alert(error.message || 'Erro ao cancelar consulta.');
        }
      });
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">' + error.message + '</div>';
  }
});
