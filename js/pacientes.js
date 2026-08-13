document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('patientsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver seus pacientes.</div>';
    return;
  }

  container.innerHTML = '<div class="empty-state">Carregando pacientes...</div>';

  try {
    // busca o id direto da sessão atual (em vez de confiar só no que ficou salvo
    // no navegador de logins anteriores, que pode estar desatualizado)
    const meRes = await fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
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

    const currentUserId = meData.data?.user?.id;
    if (currentUserId) localStorage.setItem('authUserId', String(currentUserId));

    const response = await fetch('http://localhost:3001/api/appointments/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Erro ao buscar pacientes.');
    }

    const appointments = Array.isArray(data.data) ? data.data : [];

    // só consultas em que eu sou o psicólogo e que foram aceitas ou já aconteceram (concluida)
    const myAppointments = appointments.filter((appointment) => {
      const isMine = String(appointment.psicologo_id) === String(currentUserId);
      const status = appointment.status || 'pendente';
      return isMine && (status === 'aceita' || status === 'concluida');
    });

    if (!myAppointments.length) {
      container.innerHTML = '<div class="empty-state">Você ainda não tem pacientes com consultas aceitas.</div>';
      return;
    }

    // agrupa as consultas por paciente
    const patientsById = {};
    myAppointments.forEach((appointment) => {
      const patientId = appointment.paciente_id;
      if (!patientsById[patientId]) {
        patientsById[patientId] = {
          info: appointment.pacientes || {},
          appointments: []
        };
      }
      patientsById[patientId].appointments.push(appointment);
    });

    container.innerHTML = Object.entries(patientsById).map(([patientId, patient]) => {
      const name = patient.info.full_name || 'Paciente';
      const photo = patient.info.foto || '../images/psicologo.webp';
      const email = patient.info.email || '—';
      const telefone = patient.info.telefone || '—';
      const profissao = patient.info.profissao || '';

      const appointmentsHtml = patient.appointments.map((appointment) => {
        const status = appointment.status || 'pendente';
        const rawDate = appointment.data || '';
        const rawTime = appointment.horario || '';
        const localeDate = rawDate ? new Date(rawDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data não informada';

        const cancelBtn = status === 'aceita'
          ? `<button class="btn-secondary cancel-appointment-btn" data-id="${appointment.id}">Cancelar consulta</button>`
          : '';

        return `
          <div class="patient-appointment-row">
            <div class="meta">
              <span>📅 ${localeDate}</span>
              <span>🕒 ${rawTime || 'Horário não informado'}</span>
              <span class="status ${status}">${status}</span>
            </div>
            ${cancelBtn}
          </div>
        `;
      }).join('');

      return `
        <article class="patient-card" data-patient-id="${patientId}">
          <div class="patient-header">
            <img class="patient-photo" src="${photo}" alt="Foto de ${escapeHtml(name)}">
            <div class="patient-info">
              <h3>${escapeHtml(name)}</h3>
              <div class="meta">✉️ ${escapeHtml(email)} &nbsp;|&nbsp; 📞 ${escapeHtml(telefone)}${profissao ? ' &nbsp;|&nbsp; 💼 ' + escapeHtml(profissao) : ''}</div>
            </div>
          </div>
          <div class="patient-appointments">
            ${appointmentsHtml}
          </div>
          <div class="patient-actions">
            <button class="btn-secondary remove-patient-btn" data-patient-id="${patientId}">Remover paciente</button>
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.cancel-appointment-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        if (!confirm('Cancelar esta consulta?')) return;
        await updateAppointmentStatus(event.target.dataset.id, 'cancelada');
        window.location.reload();
      });
    });

    document.querySelectorAll('.remove-patient-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const patientId = event.target.dataset.patientId;
        if (!confirm('Remover este paciente? Todas as consultas ativas com ele serão canceladas.')) return;

        const patient = patientsById[patientId];
        const toCancel = patient.appointments.filter((appointment) => appointment.status === 'aceita');
        for (const appointment of toCancel) {
          await updateAppointmentStatus(appointment.id, 'cancelada');
        }
        window.location.reload();
      });
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">' + error.message + '</div>';
  }

  async function updateAppointmentStatus(appointmentId, status) {
    try {
      const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ status })
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated?.message || 'Erro ao atualizar consulta.');
    } catch (error) {
      alert(error.message || 'Erro ao atualizar consulta.');
    }
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
