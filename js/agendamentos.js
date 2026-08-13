document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('appointmentsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver os agendamentos.</div>';
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
    const psychologistAppointments = appointments.filter((appointment) => {
      const appointmentPsychologistId = appointment.psicologo_id;
      return String(appointmentPsychologistId) === String(currentUserId);
    });

    if (!psychologistAppointments.length) {
      container.innerHTML = '<div class="empty-state">Nenhum agendamento recebido até o momento.</div>';
      return;
    }

    container.innerHTML = psychologistAppointments.map((appointment) => {
      const paciente = appointment.pacientes || {};
      const psychologistName = appointment.psicologos?.full_name || 'Psicólogo';
      const patientName = paciente.full_name || 'Paciente';
      const status = appointment.status || 'pendente';
      const rawDate = appointment.data || '';
      const rawTime = appointment.horario || '';
      const localeDate = rawDate ? new Date(rawDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data não informada';

      return `
        <article class="appointment-item">
          <div class="item-main">
            <h3>${patientName}</h3>
            <div class="meta">
              <span>📅 ${localeDate}</span>
              <span>🕒 ${rawTime || 'Horário não informado'}</span>
              <span>👤 ${psychologistName}</span>
            </div>
          </div>
          <div>
            <span class="status ${status}">${status}</span>
          </div>
          <div class="item-actions">
            <select data-id="${appointment.id}" class="status-select">
              <option value="pendente" ${status === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="confirmada" ${status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
              <option value="concluida" ${status === 'concluida' ? 'selected' : ''}>Concluída</option>
              <option value="cancelada" ${status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
            </select>
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async (event) => {
        const appointmentId = event.target.dataset.id;
        const newStatus = event.target.value;

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

          alert('Status atualizado com sucesso!');
          window.location.reload();
        } catch (error) {
          alert(error.message || 'Erro ao atualizar status.');
        }
      });
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">' + error.message + '</div>';
  }
});
