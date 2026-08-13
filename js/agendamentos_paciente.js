document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('appointmentsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver seus agendamentos.</div>';
    return;
  }

  try {
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
    const currentUserId = localStorage.getItem('authUserId');
    const patientAppointments = appointments.filter((appointment) => {
      const appointmentPatientId = appointment.paciente_id;
      return String(appointmentPatientId) === String(currentUserId);
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
            <button class="btn-secondary cancel-btn" data-id="${appointment.id}">Cancelar</button>
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
