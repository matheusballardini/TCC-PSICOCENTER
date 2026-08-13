const DIAS_SEMANA = {
  mon: 'Segunda', tue: 'Terça', wed: 'Quarta', thu: 'Quinta',
  fri: 'Sexta', sat: 'Sábado', sun: 'Domingo',
};

// guarda os psicólogos carregados (com a disponibilidade) para consultar ao trocar o select
let psychologistsById = {};

function renderDisponibilidade(psychologistId) {
  const info = document.getElementById('disponibilidadeInfo');
  if (!info) return;

  const psychologist = psychologistsById[psychologistId];
  if (!psychologist) {
    info.textContent = '';
    return;
  }

  let slots = [];
  try {
    slots = typeof psychologist.disponibilidade === 'string'
      ? JSON.parse(psychologist.disponibilidade)
      : (psychologist.disponibilidade || []);
  } catch (e) {
    slots = [];
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    info.textContent = 'Este psicólogo ainda não informou horários disponíveis. Você pode solicitar o horário desejado normalmente.';
    return;
  }

  const texto = slots
    .map((slot) => `${DIAS_SEMANA[slot.day] || slot.day}: ${slot.start} às ${slot.end}`)
    .join(' | ');
  info.textContent = 'Horários disponíveis: ' + texto;
}

const DIA_SEMANA_CODIGO = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getSlots(psychologistId) {
  const psychologist = psychologistsById[psychologistId];
  if (!psychologist) return [];
  try {
    const slots = typeof psychologist.disponibilidade === 'string'
      ? JSON.parse(psychologist.disponibilidade)
      : (psychologist.disponibilidade || []);
    return Array.isArray(slots) ? slots : [];
  } catch (e) {
    return [];
  }
}

// pega o dia da semana direto da data escolhida no calendário e confere
// se bate com algum dos horários que o psicólogo disponibilizou
function checkAvailability(psychologistId, dateStr, timeStr) {
  const slots = getSlots(psychologistId);
  if (!slots.length) return { valid: true };
  if (!dateStr || !timeStr) return { valid: true };

  const diaCodigo = DIA_SEMANA_CODIGO[new Date(dateStr + 'T00:00:00').getDay()];
  const slotsDoDia = slots.filter((slot) => slot.day === diaCodigo);

  if (!slotsDoDia.length) {
    return { valid: false, reason: `Este psicólogo não atende às ${DIAS_SEMANA[diaCodigo] || diaCodigo}s.` };
  }

  const dentroDoHorario = slotsDoDia.some((slot) => timeStr >= slot.start && timeStr <= slot.end);
  if (!dentroDoHorario) {
    const janelas = slotsDoDia.map((slot) => `${slot.start} às ${slot.end}`).join(' ou ');
    return { valid: false, reason: `Nesse dia o psicólogo atende apenas ${janelas}.` };
  }

  return { valid: true };
}

function validarFormulario() {
  const select = document.getElementById('psychologistSelect');
  const date = document.getElementById('appointmentDate')?.value;
  const time = document.getElementById('appointmentTime')?.value;
  const erroEl = document.getElementById('disponibilidadeErro');
  const submitBtn = document.querySelector('#scheduleForm button[type="submit"]');

  if (!select || !date || !time) {
    if (erroEl) erroEl.textContent = '';
    if (submitBtn) submitBtn.disabled = false;
    return true;
  }

  const resultado = checkAvailability(select.value, date, time);
  if (erroEl) erroEl.textContent = resultado.valid ? '' : resultado.reason;
  if (submitBtn) submitBtn.disabled = !resultado.valid;
  return resultado.valid;
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams(window.location.search);
  const selectedPsychologistId = params.get('psicologo_id');
  const selectedPsychologistName = params.get('nome');

  const select = document.getElementById('psychologistSelect');
  const form = document.getElementById('scheduleForm');

  if (!token) {
    alert('Você precisa estar logado para agendar uma consulta.');
    window.location.href = 'loginpaciente.html';
    return;
  }

  // essa é a área do paciente; se quem estiver logado for psicólogo,
  // manda pro painel certo em vez de deixar solicitar consulta pra si mesmo
  try {
    const meRes = await fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const meData = await meRes.json();
    const tipoConta = meData?.data?.profile?.tipo;
    if (meRes.ok && meData.success && tipoConta && tipoConta !== 'paciente') {
      alert('Esta é a área do paciente. Você está logado como psicólogo.');
      window.location.href = 'perfil.html';
      return;
    }
  } catch (e) {
    console.warn('Erro ao verificar tipo de conta', e);
  }

  if (select) select.innerHTML = '<option value="">Carregando profissionais...</option>';

  try {
    const res = await fetch('http://localhost:3001/api/psychologists');
    const data = await res.json();
    const list = res.ok && data.success ? data.data : [];
    psychologistsById = Object.fromEntries(
      list.map((psychologist) => [String(psychologist.profile_id || psychologist.id), psychologist])
    );

    if (select) {
      select.innerHTML = '<option value="">Selecione um psicólogo</option>';
      list.forEach((psychologist) => {
        const psychologistId = psychologist.profile_id || psychologist.id;
        const option = document.createElement('option');
        option.value = psychologistId;
        option.textContent = psychologist.full_name || psychologist.name || 'Psicólogo';
        if (selectedPsychologistId && String(psychologistId) === String(selectedPsychologistId)) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      if (selectedPsychologistId && !Array.from(select.options).some((option) => option.value === selectedPsychologistId)) {
        const fallback = document.createElement('option');
        fallback.value = selectedPsychologistId;
        fallback.textContent = selectedPsychologistName || 'Psicólogo selecionado';
        fallback.selected = true;
        select.appendChild(fallback);
      }

      if (!selectedPsychologistId && list.length) {
        select.value = list[0].profile_id || list[0].id;
      }

      renderDisponibilidade(select.value);
      validarFormulario();
      select.addEventListener('change', () => { renderDisponibilidade(select.value); validarFormulario(); });

      const dateInput = document.getElementById('appointmentDate');
      const timeInput = document.getElementById('appointmentTime');
      dateInput?.addEventListener('change', validarFormulario);
      timeInput?.addEventListener('change', validarFormulario);
    }
  } catch (error) {
    console.error('Erro ao carregar psicólogos:', error);
    if (select) {
      select.innerHTML = '<option value="">Erro ao carregar profissionais</option>';
    }
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const psychologistId = select.value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;

    if (!psychologistId || !date || !time) {
      alert('Preencha todos os campos para agendar.');
      return;
    }

    const resultado = checkAvailability(psychologistId, date, time);
    if (!resultado.valid) {
      alert(resultado.reason);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          psicologo_id: psychologistId,
          data: date,
          horario: time,
          status: 'pendente'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível criar a consulta.');
      }

      alert('Consulta solicitada com sucesso!');
      window.location.href = 'agendamentos_paciente.html';
    } catch (error) {
      alert(error.message || 'Erro ao agendar consulta.');
    }
  });
});
