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

  try {
    const res = await fetch('http://localhost:3001/api/psychologists');
    const data = await res.json();
    const list = res.ok && data.success ? data.data : [];

    if (select) {
      select.innerHTML = '<option value="">Selecione um psicólogo</option>';
      list.forEach((psychologist) => {
        const option = document.createElement('option');
        option.value = psychologist.id;
        option.textContent = psychologist.full_name || psychologist.name || 'Psicólogo';
        if (selectedPsychologistId && String(psychologist.id) === String(selectedPsychologistId)) {
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
        select.value = list[0].id;
      }
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
