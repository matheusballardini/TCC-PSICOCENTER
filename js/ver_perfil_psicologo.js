const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const psicologoId = params.get('id');

    const loadingIndicator = document.getElementById('loadingIndicator');
    const card = document.getElementById('cardPerfil');

    if (!psicologoId) {
        if (loadingIndicator) loadingIndicator.textContent = 'Psicólogo não encontrado.';
        return;
    }

    try {
        const res = await fetch(API_BASE + '/api/psychologists/' + encodeURIComponent(psicologoId));
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error('Não foi possível carregar o perfil.');

        renderProfile(data.data || {});
        if (card) card.style.display = 'block';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    } catch (err) {
        if (loadingIndicator) loadingIndicator.textContent = 'Não foi possível carregar o perfil.';
    }
});

function renderProfile(p) {
    const name = p.full_name || p.nome || '—';
    document.getElementById('fullName').textContent = name;

    const psicologoId = p.profile_id || p.id || '';
    const agendarBtn = document.getElementById('agendarBtn');
    if (agendarBtn) {
        agendarBtn.href = 'agendar_consulta.html?psicologo_id=' + encodeURIComponent(psicologoId) + '&nome=' + encodeURIComponent(name);
    }
    document.getElementById('crpVal').textContent = p.crp ? `CRP ${p.crp}` : '—';

    const photo = p.foto || null;
    if (photo) document.getElementById('profilePhoto').src = photo;

    const especialidades = Array.isArray(p.especialidades) ? p.especialidades : [];
    document.getElementById('especialidadesVal').innerHTML = especialidades
        .map((especialidade) => `<span class="tag">${escapeHtml(especialidade)}</span>`)
        .join('');

    const cidade = p.cidade ? `${p.cidade}${p.estado ? ', ' + p.estado : ''}` : '';
    document.getElementById('localizacaoVal').textContent = cidade ? `📍 ${cidade}` : '';

    const modalidadesVal = document.getElementById('modalidadesVal');
    const modalidades = [];
    if (p.modalidade === 'presencial' || p.modalidade === 'ambos') modalidades.push('🏠 Presencial');
    if (p.modalidade === 'online' || p.modalidade === 'ambos') modalidades.push('🎥 Online');
    modalidadesVal.innerHTML = modalidades.map((modalidade) => `<span>${modalidade}</span>`).join('');

    const precoVal = document.getElementById('precoVal');
    if (p.valor_consulta || p.valor_consulta_max) {
        precoVal.textContent = `R$ ${p.valor_consulta || '-'} - R$ ${p.valor_consulta_max || '-'} por sessão`;
    } else {
        precoVal.textContent = '';
    }

    document.getElementById('formacaoVal').textContent = p.formacao || '—';
    document.getElementById('instituicaoVal').textContent = p.instituicao || '—';
    document.getElementById('experienciaVal').textContent = p.anos_experiencia ? `${p.anos_experiencia} anos` : '—';
    document.getElementById('bioVal').textContent = p.descricao_profissional || p.biografia || '—';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
