document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
});

const API_BASE = 'http://localhost:3001';

async function initProfilePage() {
    const scheduleBtn = document.getElementById('scheduleBtn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            const psicologoId = scheduleBtn.dataset.psicologoId;
            const nome = document.getElementById('fullName')?.textContent?.trim();
            if (!psicologoId) return;
            const url = 'agendar_consulta.html?psicologo_id=' + encodeURIComponent(psicologoId) + '&nome=' + encodeURIComponent(nome || 'Psicólogo');
            window.location.href = url;
        });
    }

    const storedUser = getStoredCurrentUser();
    if (storedUser) {
        renderProfile({
            full_name: storedUser.full_name || storedUser.name || '—',
            role: storedUser.role || 'Psicólogo',
            email: storedUser.email || '—',
            phone: storedUser.phone || '—',
            crp: storedUser.crp || 'Carregando...',
            bio: storedUser.bio || '',
            photo: storedUser.photo || null
        }, storedUser.id || null, true);
    }

    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    await loadProfile();

    if (loadingIndicator) loadingIndicator.style.display = 'none';
    const crpEl = document.getElementById('crpVal');
    if (crpEl && crpEl.textContent === 'Carregando...') crpEl.textContent = '—';
}

function getStoredCurrentUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

async function loadProfile() {
    const token = localStorage.getItem('authToken');

    // check query params: ?id= or ?email=
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('id');
    const viewEmail = params.get('email');

    // if viewing another professional by id, load without requiring auth
    if (viewId) {
        try {
            const res = await fetch(API_BASE + '/api/psychologists/' + encodeURIComponent(viewId));
            const data = await res.json();
            if (res.ok && data.success) {
                renderProfile(data.data || {}, viewId, false);
                // hide edit/account buttons when viewing other profile
                hideOwnerActions();
                return;
            }
        } catch (e) {
            console.warn('Erro ao buscar psicólogo por id', e);
        }
        // fallback: continue to try local
    }

    if (viewEmail) {
        const mock = findMockUser(viewEmail);
        if (mock) {
            const profile = mock.profile || {};
            profile.full_name = mock.full_name || profile.full_name;
            profile.email = mock.email;
            renderProfile(profile, null, true);
            hideOwnerActions();
            return;
        }
        // if not found locally, continue to other flows
    }
    if (token) {
        try {
            const res = await fetch(API_BASE + '/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const profile = data.data?.profile || {};
                const user = data.data?.user || {};

                // essa é a página do psicólogo; se quem estiver logado for paciente,
                // manda pro painel certo em vez de mostrar os dados dele aqui
                if (profile.tipo && profile.tipo !== 'psicologo') {
                    alert('Esta é a área do psicólogo. Você está logado como paciente.');
                    window.location.href = 'paginaposlogin.html';
                    return;
                }

                // if user is psicologo, try get full psicologo record
                if (profile.role === 'psicologo' && user.id) {
                    try {
                        const pRes = await fetch(API_BASE + '/api/psychologists/' + user.id, {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        const pData = await pRes.json();
                        if (pRes.ok && pData.success) {
                            // combina os dados de profiles (nome, email, telefone...) com os de psicologos (crp, bio profissional...)
                            renderProfile({ ...profile, ...(pData.data || {}) }, user.id);
                        } else {
                            renderProfile(profile, user.id);
                        }
                    } catch (e) {
                        renderProfile(profile, user.id);
                    }
                } else {
                    renderProfile(profile, user.id);
                }
                return;
            }
        } catch (err) {
            console.warn('Erro ao buscar /api/auth/me', err);
        }
    }

    // fallback: try mock users stored in localStorage
    const mockEmail = localStorage.getItem('mockCurrentUser');
    const mockUser = findMockUser(mockEmail);
    if (mockUser) {
        const profile = mockUser.profile || {};
        profile.full_name = mockUser.full_name || profile.full_name;
        profile.email = mockUser.email;
        renderProfile(profile, mockUser.id || null, true);
        return;
    }

    const storedUser = getStoredCurrentUser();
    if (storedUser) {
        renderProfile({
            full_name: storedUser.full_name || storedUser.name || '—',
            role: storedUser.role || 'Psicólogo',
            email: storedUser.email || '—',
            phone: storedUser.phone || '—',
            crp: storedUser.crp || '—',
            bio: storedUser.bio || '',
            photo: storedUser.photo || null
        }, storedUser.id || null, true);
        return;
    }

    console.warn('Nenhum usuário autenticado encontrado');
}

function hideOwnerActions() {
    const eb = document.getElementById('editBtn'); if (eb) eb.style.display = 'none';
}

function renderProfile(profile = {}, userId = null, isMock = false) {
    const nameEl = document.getElementById('fullName');
    const roleEl = document.getElementById('role');
    const emailEl = document.getElementById('emailVal');
    const phoneEl = document.getElementById('phoneVal');
    const crpEl = document.getElementById('crpVal');
    const photoEl = document.getElementById('profilePhoto');
    const bioEl = document.getElementById('bioVal');

    // sidebar elements
    const sidebarPhoto = document.getElementById('sidebarPhoto');
    const sidebarName = document.getElementById('sidebarName');
    const sidebarRole = document.getElementById('sidebarRole');

    const photo = profile.photo || profile.foto || null;
    const bio = profile.bio || profile.descricao_profissional || profile.biografia || '';
    const displayName = profile.full_name || profile.nome || profile.name || '—';
    const displayRole = profile.role === 'psicologo' || profile.tipo === 'psicologo' ? 'Psicólogo' : (profile.role || profile.tipo || 'Psicólogo');

    nameEl.textContent = displayName;
    roleEl.textContent = displayRole;
    emailEl.textContent = profile.email || '—';
    phoneEl.textContent = profile.phone || profile.telefone || '—';
    crpEl.textContent = profile.crp || '—';
    bioEl.textContent = bio;

    if (photo) {
        photoEl.src = photo;
    }

    // update sidebar if present
    if (sidebarPhoto && photo) sidebarPhoto.src = photo;
    if (sidebarName) sidebarName.textContent = displayName;
    if (sidebarRole) sidebarRole.textContent = displayRole;

    const scheduleBtn = document.getElementById('scheduleBtn');
    if (scheduleBtn) {
        const currentUserId = localStorage.getItem('authUserId');
        const shouldShowSchedule = Boolean(userId) && Boolean(currentUserId) && String(currentUserId) !== String(userId);
        scheduleBtn.style.display = shouldShowSchedule ? 'inline-flex' : 'none';
        scheduleBtn.dataset.psicologoId = userId || '';
    }

    // store current ids for update
    photoEl.dataset.userId = userId || '';
    photoEl.dataset.isMock = isMock ? '1' : '0';
}

function findMockUser(email) {
    if (!email) return null;
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}
