document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('appointmentsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver os agendamentos.</div>';
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

    // essa é a página do psicólogo; se quem estiver logado for paciente,
    // manda pro painel certo em vez de mostrar uma agenda vazia sem explicação
    const tipoConta = meData.data?.profile?.tipo;
    if (tipoConta && tipoConta !== 'psicologo') {
      alert('Esta é a área do psicólogo. Você está logado como paciente.');
      window.location.href = 'paginaposlogin.html';
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
    const psychologistAppointments = appointments.filter((appointment) => {
      const appointmentPsychologistId = appointment.psicologo_id;
      const isMine = String(appointmentPsychologistId) === String(currentUserId);
      const status = appointment.status || 'pendente';
      // consultas recusadas/canceladas somem da lista, já que não tem mais ação possível nelas
      return isMine && status !== 'recusada' && status !== 'cancelada';
    });

    if (!psychologistAppointments.length) {
      container.innerHTML = '<div class="empty-state">Nenhum agendamento recebido até o momento.</div>';
      return;
    }

    container.innerHTML = psychologistAppointments.map((appointment) => {
      const paciente = appointment.pacientes || {};
      const patientName = paciente.full_name || 'Paciente';
      const status = appointment.status || 'pendente';
      const rawDate = appointment.data || '';
      const rawTime = appointment.horario || '';
      const localeDate = rawDate ? new Date(rawDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data não informada';

      let actions = '';
      if (status === 'pendente') {
        actions = `
          <button class="btn accept-btn" data-id="${appointment.id}">Aceitar</button>
          <button class="btn-secondary reject-btn" data-id="${appointment.id}">Recusar</button>
        `;
      } else if (status === 'aceita') {
        actions = `
          <button class="btn conclude-btn" data-id="${appointment.id}">Concluir</button>
          <button class="btn-secondary cancel-btn" data-id="${appointment.id}">Cancelar</button>
        `;
      }

      return `
        <article class="appointment-item">
          <div class="item-main">
            <h3>${patientName}</h3>
            <div class="meta">
              <span>📅 ${localeDate}</span>
              <span>🕒 ${rawTime || 'Horário não informado'}</span>
            </div>
          </div>
          <div>
            <span class="status ${status}">${status}</span>
          </div>
          <div class="item-actions">
            ${actions}
          </div>
        </article>
      `;
    }).join('');

    const updateStatus = async (appointmentId, newStatus, successMessage) => {
      try {
        const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ status: newStatus })
        });

        const updated = await response.json();
        if (!response.ok) {
          throw new Error(updated?.message || 'Erro ao atualizar status.');
        }

        alert(successMessage);
        window.location.reload();
      } catch (error) {
        alert(error.message || 'Erro ao atualizar status.');
      }
    };

    document.querySelectorAll('.accept-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        updateStatus(event.target.dataset.id, 'aceita', 'Consulta aceita com sucesso!');
      });
    });

    document.querySelectorAll('.reject-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        if (!confirm('Recusar esta solicitação de consulta?')) return;

        const appointmentId = event.target.dataset.id;
        const card = event.target.closest('.appointment-item');

        try {
          const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ status: 'recusada' })
          });

          const updated = await response.json();
          if (!response.ok) {
            throw new Error(updated?.message || 'Erro ao recusar consulta.');
          }

          // marca como recusada na hora e some com o card depois de alguns segundos,
          // sem precisar recarregar a página inteira
          if (card) {
            const statusEl = card.querySelector('.status');
            if (statusEl) {
              statusEl.textContent = 'recusada';
              statusEl.className = 'status recusada';
            }
            const actionsEl = card.querySelector('.item-actions');
            if (actionsEl) actionsEl.innerHTML = '';

            setTimeout(() => {
              card.style.transition = 'opacity .5s ease, max-height .5s ease, margin .5s ease, padding .5s ease';
              card.style.maxHeight = card.offsetHeight + 'px';
              card.style.overflow = 'hidden';
              requestAnimationFrame(() => {
                card.style.opacity = '0';
                card.style.maxHeight = '0px';
                card.style.margin = '0';
                card.style.padding = '0';
              });
              setTimeout(() => card.remove(), 550);
            }, 5000);
          }
        } catch (error) {
          alert(error.message || 'Erro ao recusar consulta.');
        }
      });
    });

    document.querySelectorAll('.conclude-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        updateStatus(event.target.dataset.id, 'concluida', 'Consulta marcada como concluída.');
      });
    });

    document.querySelectorAll('.cancel-btn').forEach((button) => {
      button.addEventListener('click', (event) => {
        if (!confirm('Cancelar esta consulta?')) return;
        updateStatus(event.target.dataset.id, 'cancelada', 'Consulta cancelada.');
      });
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">' + error.message + '</div>';
  }
});
