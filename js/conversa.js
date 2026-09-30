document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams(window.location.search);
  const otherUserId = params.get('with');

  const sidebarPhoto = document.getElementById('sidebarPhoto');
  const sidebarName = document.getElementById('sidebarName');
  const sidebarCargo = document.getElementById('sidebarCargo');
  const navPerfil = document.getElementById('navPerfil');
  const navLista2 = document.getElementById('navLista2');
  const navLista2Texto = document.getElementById('navLista2Texto');
  const navAgendamentos = document.getElementById('navAgendamentos');
  const navMensagens = document.getElementById('navMensagens');
  const topoFino = document.getElementById('topoFino');
  const conteudoPrincipal = document.getElementById('conteudoPrincipal');
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
  const nomeEl = document.getElementById('chatNome');
  const fotoEl = document.getElementById('chatFoto');
  const mensagensEl = document.getElementById('chatMensagens');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const bannerEl = document.getElementById('agendamentoBanner');
  const contadorEl = document.getElementById('chatCounter');
  const listaConversasEl = document.getElementById('listaConversas');
  const painelConversasTitulo = document.getElementById('painelConversasTitulo');
  const LIMITE_MENSAGEM = 2000;

  function atualizarContador() {
    if (!contadorEl) return;
    const len = input.value.length;
    contadorEl.textContent = `${len}/${LIMITE_MENSAGEM}`;
    contadorEl.classList.toggle('limite-excedido', len >= LIMITE_MENSAGEM);
  }
  input.addEventListener('input', atualizarContador);

  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('mockCurrentUser');
      localStorage.removeItem('authUserId');
      window.location.href = 'entrar.html';
    });
  }

  if (!token) {
    window.location.href = 'entrar.html';
    return;
  }
  if (!otherUserId) {
    mensagensEl.innerHTML = '<p class="empty-state">Conversa inválida.</p>';
    form.style.display = 'none';
    return;
  }

  let currentUserId = null;
  let currentUserTipo = null;
  let ultimoTimestamp = null;
  let primeiraCargaMensagens = true;
  let pollInterval = null;
  let editandoAgendamento = false;

  function estaNoFim() {
    return mensagensEl.scrollTop + mensagensEl.clientHeight >= mensagensEl.scrollHeight - 40;
  }

  function formatarHora(iso) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const LIMITE_EXCLUSAO_MS = 5 * 60 * 1000;
  function podeExcluir(sentAt) {
    return (Date.now() - new Date(sentAt).getTime()) <= LIMITE_EXCLUSAO_MS;
  }

  function renderMensagens(mensagens, manterScrollNoFim) {
    if (!mensagens.length) {
      mensagensEl.innerHTML = '<p class="empty-state">Nenhuma mensagem ainda. Envie a primeira!</p>';
      return;
    }
    mensagensEl.innerHTML = mensagens.map((m) => {
      const minha = String(m.sender_id) === String(currentUserId);
      if (m.deleted_at) {
        return `
          <div class="bolha-linha ${minha ? 'minha' : 'dele'}">
            <div class="bolha bolha-excluida">
              <p>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                <em>Mensagem excluída</em>
              </p>
              <span class="bolha-hora">${formatarHora(m.sent_at)}</span>
            </div>
          </div>
        `;
      }
      const botaoExcluir = (minha && podeExcluir(m.sent_at))
        ? `<button type="button" class="btn-excluir-msg" data-id="${m.id}" title="Excluir mensagem" aria-label="Excluir mensagem">&times;</button>`
        : '';
      return `
        <div class="bolha-linha ${minha ? 'minha' : 'dele'}">
          <div class="bolha">
            ${botaoExcluir}
            <p>${escapeHtml(m.body)}</p>
            <span class="bolha-hora">${formatarHora(m.sent_at)}</span>
          </div>
        </div>
      `;
    }).join('');
    // só força o scroll pro fim se a pessoa já estava lendo as mensagens mais recentes;
    // se tinha subido pra ler mensagens antigas, não puxa ela de volta a cada atualização
    if (manterScrollNoFim) {
      mensagensEl.scrollTop = mensagensEl.scrollHeight;
    }
  }

  async function excluirMensagem(mensagemId) {
    if (!confirm('Excluir esta mensagem para sempre?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/chats/threads/${otherUserId}/messages/${mensagemId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Não foi possível excluir a mensagem.');
      // força a atualização mesmo se a mensagem excluída não for a última
      // (senão o "id da última mensagem não mudou" faria carregarThread pular o re-render)
      ultimoTimestamp = null;
      await carregarThread(false);
    } catch (error) {
      alert(error.message || 'Não foi possível excluir a mensagem.');
    }
  }

  mensagensEl.addEventListener('click', (event) => {
    const botao = event.target.closest('.btn-excluir-msg');
    if (!botao) return;
    excluirMensagem(botao.dataset.id);
  });

  async function carregarThread(mostrarLoading) {
    if (mostrarLoading) mensagensEl.innerHTML = '<p class="empty-state">Carregando mensagens...</p>';
    try {
      const res = await fetch(`${API_BASE}/api/chats/threads/${otherUserId}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Não foi possível carregar a conversa.');

      const otherUser = data.data.otherUser;
      nomeEl.textContent = otherUser.full_name || 'Usuário';
      fotoEl.src = avatarSrc(otherUser.foto, otherUser.full_name);

      const mensagens = data.data.messages;
      const novoUltimo = mensagens.length ? mensagens[mensagens.length - 1].id : null;
      if (novoUltimo !== ultimoTimestamp || primeiraCargaMensagens) {
        const jaEstavaNoFim = primeiraCargaMensagens || estaNoFim();
        ultimoTimestamp = novoUltimo;
        primeiraCargaMensagens = false;
        renderMensagens(mensagens, jaEstavaNoFim);
      }
    } catch (error) {
      mensagensEl.innerHTML = '<p class="empty-state">' + escapeHtml(error.message) + '</p>';
      if (pollInterval) clearInterval(pollInterval);
    }
  }

  function formatarDataExibicao(dataStr) {
    return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  async function enviarMensagemSistema(texto) {
    try {
      await fetch(`${API_BASE}/api/chats/threads/${otherUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ body: texto })
      });
      await carregarThread(false);
    } catch (e) {
      // se isso falhar, o horário já foi alterado mesmo assim; só não fica registrado no chat
    }
  }

  function renderBannerAgendamento(appointment) {
    if (editandoAgendamento) return;

    if (!appointment) {
      bannerEl.style.display = 'none';
      bannerEl.innerHTML = '';
      return;
    }

    // só o psicólogo pode propor um novo horário; o paciente só acompanha o aviso
    const botaoEditar = currentUserTipo === 'psicologo'
      ? '<button type="button" id="editarAgendamentoBtn" class="btn-secondary">Alterar horário</button>'
      : '';

    bannerEl.style.display = '';
    bannerEl.innerHTML = `
      <div class="agendamento-banner-linha">
        <span>${heroIcon('calendario')} Consulta pendente marcada para <strong>${formatarDataExibicao(appointment.data)}</strong> às <strong>${appointment.horario}</strong></span>
        ${botaoEditar}
      </div>
    `;

    if (currentUserTipo === 'psicologo') {
      document.getElementById('editarAgendamentoBtn').addEventListener('click', () => {
        abrirFormularioEdicaoAgendamento(appointment);
      });
    }
  }

  function abrirFormularioEdicaoAgendamento(appointment) {
    editandoAgendamento = true;
    const hojeStr = new Date().toISOString().slice(0, 10);

    bannerEl.innerHTML = `
      <div class="agendamento-banner-linha">
        <span>${heroIcon('calendario')} Combine um novo dia e horário para a consulta pendente:</span>
      </div>
      <form id="formEditarAgendamento" class="agendamento-editar-form">
        <input type="date" id="novaDataAgendamento" min="${hojeStr}" value="${appointment.data}" required>
        <input type="time" id="novoHorarioAgendamento" value="${appointment.horario}" required>
        <button type="submit" class="btn">Salvar</button>
        <button type="button" id="cancelarEdicaoAgendamento" class="btn-secondary">Cancelar</button>
        <span id="erroEdicaoAgendamento" class="agendamento-erro"></span>
      </form>
    `;

    document.getElementById('cancelarEdicaoAgendamento').addEventListener('click', () => {
      editandoAgendamento = false;
      renderBannerAgendamento(appointment);
    });

    document.getElementById('formEditarAgendamento').addEventListener('submit', async (event) => {
      event.preventDefault();
      const novaData = document.getElementById('novaDataAgendamento').value;
      const novoHorario = document.getElementById('novoHorarioAgendamento').value;
      const erroEl = document.getElementById('erroEdicaoAgendamento');
      const submitBtn = event.target.querySelector('button[type="submit"]');
      erroEl.textContent = '';
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/api/appointments/${appointment.id}/reschedule`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ data: novaData, horario: novoHorario })
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result?.message || 'Erro ao alterar a consulta.');

        editandoAgendamento = false;
        await carregarAgendamentoPendente();
        await enviarMensagemSistema(`📅 Consulta reagendada para ${formatarDataExibicao(novaData)} às ${novoHorario}.`);
      } catch (error) {
        erroEl.textContent = error.message || 'Erro ao alterar a consulta.';
        submitBtn.disabled = false;
      }
    });
  }

  async function carregarAgendamentoPendente() {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/me`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok || !data.success) return;

      const appointments = Array.isArray(data.data) ? data.data : [];
      const pendente = appointments.find((a) => {
        return a.status === 'pendente'
          && (String(a.paciente_id) === String(otherUserId) || String(a.psicologo_id) === String(otherUserId));
      });

      renderBannerAgendamento(pendente || null);
    } catch (e) {
      // sem sinal de rede etc: não é crítico, o chat continua funcionando sem o banner
    }
  }

  // ajusta a sidebar (foto, nome, links do menu) conforme o usuário logado
  // é paciente ou psicólogo, já que essa página de conversa é compartilhada
  function configurarSidebar(profile) {
    const nome = profile?.full_name || profile?.nome || 'Usuário';
    if (sidebarName) sidebarName.textContent = nome;
    if (sidebarPhoto) sidebarPhoto.src = avatarSrc(profile?.foto, nome);

    const souPsicologo = currentUserTipo === 'psicologo';

    if (sidebarCargo) sidebarCargo.textContent = souPsicologo ? 'Psicólogo' : 'Paciente';
    if (navPerfil) navPerfil.href = souPsicologo ? 'perfil.html' : 'perfil_paciente.html';
    if (navLista2) navLista2.href = souPsicologo ? 'pacientes.html' : 'meus_psicologos.html';
    if (navLista2Texto) navLista2Texto.textContent = souPsicologo ? 'Pacientes' : 'Psicólogos';
    if (navAgendamentos) navAgendamentos.href = souPsicologo ? 'agendamentos.html' : 'agendamentos_paciente.html';
    if (navMensagens) navMensagens.href = souPsicologo ? 'mensagens.html' : 'mensagens_paciente.html';

    // só o paciente tem os atalhos de Início/Buscar profissionais; o psicólogo
    // usa o layout de conteúdo sem essa barra fina no topo
    if (souPsicologo) {
      if (topoFino) topoFino.style.display = 'none';
      if (conteudoPrincipal) conteudoPrincipal.classList.replace('conteudo-lista', 'conteudo-lista-psicologo');
    } else if (topoFino) {
      topoFino.style.display = '';
    }

    if (painelConversasTitulo) {
      painelConversasTitulo.textContent = souPsicologo ? 'Pacientes' : 'Psicólogos';
    }
  }

  function formatarDataHoraLista(iso) {
    const data = new Date(iso);
    const hoje = new Date();
    const mesmoDia = data.toDateString() === hoje.toDateString();
    return mesmoDia
      ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function renderItemConversa(thread) {
    const nome = thread.full_name || 'Usuário';
    const foto = avatarSrc(thread.foto, nome);
    const preview = thread.lastMessage
      ? escapeHtml(thread.lastMessage.body).slice(0, 60)
      : 'Nenhuma mensagem ainda';
    const hora = thread.lastMessage ? formatarDataHoraLista(thread.lastMessage.sent_at) : '';
    const ativa = String(thread.otherUserId) === String(otherUserId);

    return `
      <a class="conversa-item${ativa ? ' ativa' : ''}" href="conversa.html?with=${encodeURIComponent(thread.otherUserId)}">
        <img class="conversa-item-foto" src="${foto}" alt="Foto de ${escapeHtml(nome)}" loading="lazy">
        <div class="conversa-item-info">
          <h4>${escapeHtml(nome)}</h4>
          <p class="conversa-item-preview">${preview}</p>
        </div>
        ${hora ? `<span class="thread-hora">${hora}</span>` : ''}
      </a>
    `;
  }

  // lista, no painel ao lado, todo mundo com quem dá pra conversar (igual à
  // tela de Mensagens), permitindo trocar de conversa sem voltar pra lá
  async function carregarListaConversas() {
    if (!listaConversasEl) return;
    try {
      const res = await fetch(`${API_BASE}/api/chats/threads`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Erro ao buscar conversas.');

      const threads = Array.isArray(data.data) ? data.data : [];
      if (!threads.length) {
        listaConversasEl.innerHTML = '<p class="empty-state">Nenhuma conversa disponível ainda.</p>';
        return;
      }
      listaConversasEl.innerHTML = threads.map((thread) => renderItemConversa(thread)).join('');
    } catch (error) {
      listaConversasEl.innerHTML = '<p class="empty-state">' + escapeHtml(error.message) + '</p>';
    }
  }

  try {
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const meData = await meRes.json();
    if (!meRes.ok || !meData.success) throw new Error('Não autenticado');

    currentUserId = meData.data?.user?.id;
    currentUserTipo = meData.data?.profile?.tipo;
    configurarSidebar(meData.data?.profile);

    await carregarThread(true);
    await carregarAgendamentoPendente();
    await carregarListaConversas();
    pollInterval = setInterval(() => {
      carregarThread(false);
      carregarAgendamentoPendente();
      carregarListaConversas();
    }, 4000);
  } catch (error) {
    mensagensEl.innerHTML = '<p class="empty-state">' + escapeHtml(error.message || 'Erro ao carregar conversa.') + '</p>';
    form.style.display = 'none';
    return;
  }

  // Enter envia a mensagem; Shift+Enter quebra linha, como em qualquer chat
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    input.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/chats/threads/${otherUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ body: texto })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || 'Erro ao enviar mensagem.');

      input.value = '';
      atualizarContador();
      await carregarThread(false);
    } catch (error) {
      alert(error.message || 'Erro ao enviar mensagem.');
    } finally {
      submitButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (pollInterval) clearInterval(pollInterval);
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
