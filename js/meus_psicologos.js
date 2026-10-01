document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const container = document.getElementById('psychologistsContainer');

  if (!token) {
    container.innerHTML = '<div class="empty-state">Faça login para ver seus psicólogos.</div>';
    return;
  }

  container.innerHTML = '<div class="empty-state">Carregando psicólogos...</div>';

  try {
    // busca o id direto da sessão atual (em vez de confiar só no que ficou salvo
    // no navegador de logins anteriores, que pode estar desatualizado)
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
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

    const response = await fetch(`${API_BASE}/api/appointments/me`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Erro ao buscar psicólogos.');
    }

    const appointments = Array.isArray(data.data) ? data.data : [];

    // só consultas em que eu sou o paciente e que foram aceitas ou já aconteceram (concluida)
    const myAppointments = appointments.filter((appointment) => {
      const isMine = String(appointment.paciente_id) === String(currentUserId);
      const status = appointment.status || 'pendente';
      return isMine && (status === 'aceita' || status === 'concluida');
    });

    if (!myAppointments.length) {
      container.innerHTML = '<div class="empty-state">Você ainda não tem psicólogos com consultas aceitas. <a href="buscar_profissionais.html">Buscar profissionais</a></div>';
      return;
    }

    // agrupa as consultas por psicólogo
    const psychologistsById = {};
    myAppointments.forEach((appointment) => {
      const psicologoId = appointment.psicologo_id;
      if (!psychologistsById[psicologoId]) {
        psychologistsById[psicologoId] = {
          info: appointment.psicologos || {},
          appointments: []
        };
      }
      psychologistsById[psicologoId].appointments.push(appointment);
    });

    // busca a média de avaliação de cada psicólogo em paralelo
    const ratingSummaries = {};
    await Promise.all(Object.keys(psychologistsById).map(async (psicologoId) => {
      try {
        const res = await fetch(`${API_BASE}/api/psychologists/${psicologoId}/rating-summary`);
        const result = await res.json();
        if (res.ok && result.success) ratingSummaries[psicologoId] = result.data;
      } catch (e) {
        console.warn('Erro ao buscar avaliação do psicólogo', psicologoId, e);
      }
    }));

    container.innerHTML = Object.entries(psychologistsById).map(([psicologoId, psicologo]) => {
      const name = psicologo.info.full_name || 'Psicólogo';
      const photo = avatarSrc(psicologo.info.foto, name);
      const email = psicologo.info.email || '—';
      const telefone = psicologo.info.telefone || '—';
      const summary = ratingSummaries[psicologoId] || { average: 0, total: 0 };
      const ratingHtml = summary.total > 0
        ? `<span class="rating-summary clicavel" data-psicologo-id="${psicologoId}" data-nome="${escapeHtml(name)}">★ ${summary.average.toFixed(1)} <span class="rating-count">(${summary.total} — ver comentários)</span></span>`
        : `<span class="rating-summary rating-count">Sem avaliações ainda</span>`;

      const appointmentsHtml = psicologo.appointments.map((appointment) => {
        const status = appointment.status || 'pendente';
        const rawDate = appointment.data || '';
        const rawTime = appointment.horario || '';
        const localeDate = rawDate ? new Date(rawDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data não informada';

        return `
          <div class="patient-appointment-row">
            <div class="meta">
              <span>${heroIcon('calendario')} ${localeDate}</span>
              <span>${heroIcon('relogio')} ${rawTime || 'Horário não informado'}</span>
              <span class="status ${status}">${status}</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <article class="patient-card" data-psicologo-id="${psicologoId}">
          <div class="patient-header">
            <img class="patient-photo" src="${photo}" alt="Foto de ${escapeHtml(name)}" loading="lazy">
            <div class="patient-info">
              <h3>${escapeHtml(name)}</h3>
              <div class="meta"><span class="meta-item">${heroIcon('envelope')} ${escapeHtml(email)}</span><span class="meta-item">${heroIcon('telefone')} ${escapeHtml(telefone)}</span></div>
              <div class="meta">${ratingHtml}</div>
            </div>
          </div>
          <div class="patient-appointments">
            ${appointmentsHtml}
          </div>
          <div class="patient-actions">
            <a class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center;" href="ver_perfil_psicologo.html?id=${encodeURIComponent(psicologoId)}">Ver perfil</a>
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.rating-summary.clicavel').forEach((el) => {
      el.addEventListener('click', async () => {
        const psicologoId = el.dataset.psicologoId;
        const nome = el.dataset.nome || 'Psicólogo';
        try {
          const res = await fetch(`${API_BASE}/api/psychologists/${psicologoId}/ratings`);
          const result = await res.json();
          if (!res.ok || !result.success) throw new Error('Não foi possível carregar os comentários.');
          abrirModalComentarios({ titulo: `Avaliações de ${nome}`, avaliacoes: result.data });
        } catch (err) {
          alert(err.message || 'Erro ao carregar comentários.');
        }
      });
    });
  } catch (error) {
    container.innerHTML = '<div class="empty-state">' + error.message + '</div>';
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
