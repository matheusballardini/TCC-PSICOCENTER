const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    initPatientProfile();
});

async function initPatientProfile() {
    const token = localStorage.getItem('authToken');
    const statusEl = document.getElementById('statusLogin');

    if (!token) {
        if (statusEl) {
            statusEl.textContent = 'Você não está logado.';
            statusEl.style.color = '#c0392b';
        }
        setTimeout(() => { window.location.href = 'loginpaciente.html'; }, 1500);
        return;
    }

    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
        const meRes = await fetch(API_BASE + '/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.success) throw new Error('Sessão expirada');

        const profile = meData.data?.profile || {};
        const userId = meData.data?.user?.id;

        // essa é a página do paciente; se quem estiver logado for psicólogo,
        // manda pro painel certo em vez de mostrar os dados dele aqui
        if (profile.tipo && profile.tipo !== 'paciente') {
            alert('Esta é a área do paciente. Você está logado como psicólogo.');
            window.location.href = 'perfil.html';
            return;
        }

        let paciente = {};
        if (userId) {
            try {
                const pRes = await fetch(API_BASE + '/api/patients/' + userId, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const pData = await pRes.json();
                if (pRes.ok && pData.success) paciente = pData.data || {};
            } catch (e) {
                console.warn('Erro ao buscar dados do paciente', e);
            }
        }

        renderProfile(profile, paciente);

        if (statusEl) {
            statusEl.textContent = 'Logado como ' + (profile.email || '');
            statusEl.style.color = '#2e7d32';
        }
    } catch (err) {
        console.warn('Erro ao carregar perfil do paciente', err);
        if (statusEl) {
            statusEl.textContent = 'Sessão expirada. Faça login novamente.';
            statusEl.style.color = '#c0392b';
        }
        setTimeout(() => { window.location.href = 'loginpaciente.html'; }, 1500);
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

function renderProfile(profile, paciente) {
    const name = profile.full_name || profile.nome || '—';
    const photo = profile.foto || null;

    document.getElementById('fullName').textContent = name;
    document.getElementById('emailVal').textContent = profile.email || '—';
    document.getElementById('phoneVal').textContent = profile.telefone || '—';
    document.getElementById('birthVal').textContent = profile.data_nascimento || '—';
    document.getElementById('genderVal').textContent = paciente.genero || '—';
    document.getElementById('occupationVal').textContent = paciente.profissao || '—';

    const cidade = profile.cidade || '';
    const estado = profile.estado || '';
    const cityState = [cidade, estado].filter(Boolean).join(' / ');
    document.getElementById('cityStateVal').textContent = cityState || '—';

    if (photo) document.getElementById('profilePhoto').src = photo;
}
