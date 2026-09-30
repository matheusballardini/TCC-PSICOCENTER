document.addEventListener("DOMContentLoaded", function () {

    // se a pessoa já estiver logada, "Voltar" leva pra área dela em vez da home pública
    const botaoVoltar = document.getElementById('botaoVoltar');
    if (botaoVoltar && localStorage.getItem('authToken')) {
        botaoVoltar.setAttribute('href', 'paginaposlogin.html');
    }

    // "Mensagens" só faz sentido pra quem já está logado (essa página também é pública)
    const linkMensagens = document.getElementById('linkMensagens');
    if (linkMensagens && localStorage.getItem('authToken')) {
        linkMensagens.style.display = '';
    }

    // estado do paciente logado, usado pra recomendar psicólogos mais perto
    // (mesmo estado) primeiro na lista — null se não estiver logado ou não tiver estado salvo
    let patientEstado = null;

    async function carregarEstadoPaciente() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                patientEstado = data.data?.profile?.estado || null;
            }
        } catch (e) {
            console.warn('Erro ao carregar estado do paciente', e);
        }
    }

    // psicólogos do mesmo estado do paciente vêm primeiro na lista
    function ordenarPorProximidade(list) {
        if (!patientEstado) return list;
        return [...list].sort((a, b) => {
            const aPerto = a.estado === patientEstado ? 0 : 1;
            const bPerto = b.estado === patientEstado ? 0 : 1;
            return aPerto - bPerto;
        });
    }

    // fetch professionals from backend and render them
    async function fetchAndRender() {
        const loadingEl = document.getElementById('loadingProfissionais');
        if (loadingEl) loadingEl.style.display = 'block';
        try {
            await carregarEstadoPaciente();
            const res = await fetch(API_BASE + '/api/psychologists');
            const data = await res.json();
            const list = (res.ok && data.success) ? ordenarPorProximidade(data.data) : [];
            if (Array.isArray(list) && list.length > 0) {
                renderProfessionals(list);
            } else {
                // fallback to local mock users
                const local = loadLocalPsychologists();
                if (local.length) renderProfessionals(local);
                else renderProfessionals(list);
            }
            // after rendering, run initial filter to update counts
            filtrarProfissionais();
        } catch (e) {
            console.warn('Erro ao buscar psicólogos', e);
            // fallback to local mock users
            const local = loadLocalPsychologists();
            if (local.length) renderProfessionals(local);
            filtrarProfissionais();
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    function loadLocalPsychologists(){
        try{
            const users = JSON.parse(localStorage.getItem('mockUsers')||'[]');
            // only psychologists
            return users.filter(u => (u.role || '').toLowerCase() === 'psicologo' || (u.role || '').toLowerCase() === 'psicólogo').map(u => {
                const p = {
                    id: u.id || null,
                    full_name: u.full_name || u.name || '',
                    email: u.email,
                    profile: u.profile || {},
                    cpf: (u.profile && u.profile.cpf) || null,
                    crp: (u.profile && u.profile.crp) || null,
                    specialties: (u.profile && u.profile.specialties) || [],
                    modalities: (u.profile && u.profile.modalities) || { online: false, presencial: false },
                    address: (u.profile && u.profile.address) || null,
                    price_min: (u.profile && u.profile.price_min) || null,
                    price_max: (u.profile && u.profile.price_max) || null,
                    photo: (u.profile && u.profile.photo) || null,
                };
                return p;
            });
        }catch(e){ return []; }
    }

    // render function: creates card elements inside .profissionais
    function renderProfessionals(list) {
        const container = document.querySelector('.profissionais');
        if (!container) return;
        container.innerHTML = '';

        if (!Array.isArray(list) || list.length === 0) {
            return;
        }

        list.forEach(p => {
            const name = p.full_name || p.name || '—';
            const crp = p.crp ? `CRP ${p.crp}` : '';
            const specialties = Array.isArray(p.especialidades) ? p.especialidades : (Array.isArray(p.specialties) ? p.specialties : []);
            const city = p.cidade ? `${p.cidade}${p.estado ? ', ' + p.estado : ''}` : (p.city || '');
            const pertoDeVoce = patientEstado && p.estado === patientEstado;
            const modalidades = [];
            if (p.modalidade === 'presencial' || p.modalidade === 'ambos') modalidades.push(heroIcon('casa') + ' Presencial');
            if (p.modalidade === 'online' || p.modalidade === 'ambos') modalidades.push(heroIcon('camera') + ' Online');
            const price = (p.valor_consulta || p.valor_consulta_max) ? `R$ ${p.valor_consulta || '-'} - R$ ${p.valor_consulta_max || '-'}` : '';

            const psychologistId = p.profile_id || p.id || null;
            const avatar = `<img class="avatar" src="${avatarSrc(p.foto, name)}" alt="${escapeHtml(name)}" loading="lazy">`;

            const card = document.createElement('article');
            card.className = 'card';
            card.innerHTML = `
                <div class="profissional-topo">
                    ${avatar}
                    <div>
                        <h2 class="nome">${escapeHtml(name)}</h2>
                        <p class="crp">${escapeHtml(crp)}</p>
                        <div class="avaliacao${(p.ratings_count || 0) > 0 ? ' clicavel' : ''}" ${(p.ratings_count || 0) > 0 ? `data-psicologo-id="${psychologistId}" data-nome="${escapeHtml(name)}"` : ''}>${(p.ratings_count || 0) > 0
                            ? `<span class="estrela">★</span> ${Number(p.rating || 0).toFixed(1)} <small>(${p.ratings_count} — ver comentários)</small>`
                            : `<small>Sem avaliações ainda</small>`}</div>
                    </div>
                </div>
                ${pertoDeVoce ? '<div class="perto-badge">📍 Perto de você</div>' : ''}
                <div class="especialidades">${specialties.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
                <div class="localizacao"><i class="bx bx-map"></i> ${escapeHtml(city)}</div>
                <div class="modalidades">${modalidades.map(m => `<span class="modalidade">${m}</span>`).join('')}</div>
                <hr class="linha">
                <p class="preco">${escapeHtml(price)}</p>
                <p class="por-sessao">por sessão</p>
                <div class="acoes-profissional">
                    <a href="#" class="btn-perfil"><i class="bx bx-user"></i> Ver Perfil</a>
                    <a href="#" class="btn-agendar"><i class="bx bx-calendar"></i> Agendar</a>
                </div>
            `;

            card.dataset.psychologist = JSON.stringify(p);
            try{
                const link = card.querySelector('.btn-perfil');
                const agendarLink = card.querySelector('.btn-agendar');
                const profileHref = psychologistId ? 'ver_perfil_psicologo.html?id=' + encodeURIComponent(psychologistId) : '#';
                if(link){
                    link.setAttribute('href', profileHref);
                }
                if(agendarLink){
                    if (psychologistId) {
                        agendarLink.setAttribute('href', 'agendar_consulta.html?psicologo_id=' + encodeURIComponent(psychologistId) + '&nome=' + encodeURIComponent(name));
                    } else {
                        agendarLink.setAttribute('href', 'agendar_consulta.html');
                    }
                }
            }catch(e){}
            container.appendChild(card);
        });
    }

    // delegação de evento: funciona mesmo depois de renderProfessionals recriar os cards
    document.addEventListener('click', async (event) => {
        const avaliacaoEl = event.target.closest('.avaliacao.clicavel');
        if (!avaliacaoEl) return;
        const psicologoId = avaliacaoEl.dataset.psicologoId;
        const nome = avaliacaoEl.dataset.nome || 'Psicólogo';
        try {
            const res = await fetch(`${API_BASE}/api/psychologists/${encodeURIComponent(psicologoId)}/ratings`);
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error('Não foi possível carregar os comentários.');
            abrirModalComentarios({ titulo: `Avaliações de ${nome}`, avaliacoes: result.data });
        } catch (err) {
            alert(err.message || 'Erro ao carregar comentários.');
        }
    });

    function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

    // ================================
    // ELEMENTOS DA PÁGINA
    // ================================

    const campoBusca = document.querySelector(".search-box input");
    const profissionais = () => document.querySelectorAll(".card");
    const linhasFiltro = document.querySelectorAll(".filtro-linha");
    const subtitulo = document.querySelector(".subtitulo");

    // Primeiro grupo = Especialidades
    const filtrosEspecialidade = linhasFiltro[0].querySelectorAll(".filtro");

    // Segundo grupo = Modalidade
    const filtrosModalidade = linhasFiltro[1].querySelectorAll(".filtro");


    // ================================
    // FILTROS ATUAIS
    // ================================

    let especialidadeSelecionada = "Todos";
    let modalidadeSelecionada = "Todos";


    // ================================
    // NORMALIZAR TEXTO
    // Remove acentos e deixa tudo minúsculo
    // ================================

    function normalizarTexto(texto) {
        return String(texto || '')
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }


    // ================================
    // VERIFICAR ESPECIALIDADE
    // ================================

    function possuiEspecialidade(card, especialidade) {
        if (especialidade === "Todos") return true;
        const tags = card.querySelectorAll(".tag");
        const especialidadeNormalizada = normalizarTexto(especialidade);
        return Array.from(tags).some(tag => normalizarTexto(tag.textContent) === especialidadeNormalizada);
    }


    // ================================
    // VERIFICAR MODALIDADE
    // ================================

    function possuiModalidade(card, modalidade) {
        if (modalidade === "Todos") return true;
        const modalidades = card.querySelectorAll(".modalidade");
        const modalidadeNormalizada = normalizarTexto(modalidade);
        return Array.from(modalidades).some(item => normalizarTexto(item.textContent).includes(modalidadeNormalizada));
    }


    // ================================
    // VERIFICAR PESQUISA
    // ================================

    function correspondeBusca(card, pesquisa) {
        if (!pesquisa) return true;
        const textoCard = normalizarTexto(card.textContent);
        const buscaNormalizada = normalizarTexto(pesquisa);
        return textoCard.includes(buscaNormalizada);
    }


    // ================================
    // FILTRAR PROFISSIONAIS
    // ================================

    function filtrarProfissionais() {
        const pesquisa = campoBusca.value;
        let quantidadeEncontrada = 0;
        Array.from(profissionais()).forEach(function (card) {
            const correspondeEspecialidade = possuiEspecialidade(card, especialidadeSelecionada);
            const correspondeModalidade = possuiModalidade(card, modalidadeSelecionada);
            const correspondePesquisa = correspondeBusca(card, pesquisa);
            if (correspondeEspecialidade && correspondeModalidade && correspondePesquisa) {
                card.style.display = "flex";
                quantidadeEncontrada++;
            } else {
                card.style.display = "none";
            }
        });

        if (quantidadeEncontrada === 1) {
            subtitulo.textContent = "Encontre o psicólogo ideal para suas necessidades - 1 profissional disponível";
        } else {
            subtitulo.textContent = `Encontre o psicólogo ideal para suas necessidades - ${quantidadeEncontrada} profissionais disponíveis`;
        }

        let mensagemVazia = document.querySelector(".mensagem-vazia");
        if (quantidadeEncontrada === 0) {
            if (!mensagemVazia) {
                mensagemVazia = document.createElement("div");
                mensagemVazia.className = "mensagem-vazia";
                mensagemVazia.innerHTML = `
                    <h3>Nenhum profissional encontrado</h3>
                    <p>Tente mudar sua pesquisa ou selecionar outro filtro.</p>
                `;
                document.querySelector(".profissionais").appendChild(mensagemVazia);
            }
            mensagemVazia.style.display = "block";
        } else {
            if (mensagemVazia) mensagemVazia.style.display = "none";
        }
    }


    // ================================
    // CLICAR NO FILTRO DE ESPECIALIDADE
    // ================================

    filtrosEspecialidade.forEach(function (botao) {
        botao.addEventListener("click", function () {
            filtrosEspecialidade.forEach(function (item) { item.classList.remove("ativo"); });
            botao.classList.add("ativo");
            especialidadeSelecionada = botao.textContent.trim();
            filtrarProfissionais();
        });
    });


    // ================================
    // CLICAR NO FILTRO DE MODALIDADE
    // ================================

    filtrosModalidade.forEach(function (botao) {
        botao.addEventListener("click", function () {
            filtrosModalidade.forEach(function (item) { item.classList.remove("ativo"); });
            botao.classList.add("ativo");
            modalidadeSelecionada = botao.textContent.trim();
            filtrarProfissionais();
        });
    });


    // ================================
    // PESQUISA EM TEMPO REAL
    // ================================

    campoBusca.addEventListener("input", function () { filtrarProfissionais(); });


    // ================================
    // ENTER NA PESQUISA
    // ================================

    campoBusca.addEventListener("keydown", function (event) {
        if (event.key === "Enter") filtrarProfissionais();
    });


    // ================================
    // INICIAR PÁGINA
    // ================================

    fetchAndRender();

});