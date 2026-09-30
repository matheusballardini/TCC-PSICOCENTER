// Preenche foto/nome na sidebar do psicólogo e liga o botão de sair.
// Usado pelas páginas que têm a sidebar mas não carregam o perfil inteiro
// (pacientes, agendamentos, mensagens) — perfil.html já faz isso por conta
// própria em perfil.js.
document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('sidebarLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('mockCurrentUser');
            localStorage.removeItem('authUserId');
            window.location.href = 'entrar.html';
        });
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    const sidebarPhoto = document.getElementById('sidebarPhoto');
    const sidebarName = document.getElementById('sidebarName');
    if (!sidebarPhoto && !sidebarName) return;

    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok || !data.success) return;

        const profile = data.data?.profile || {};
        const name = profile.full_name || profile.nome || 'Psicólogo';
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarPhoto) sidebarPhoto.src = avatarSrc(profile.foto, name);
    } catch (e) {
        // sem conexão: a sidebar fica com os valores padrão do HTML
    }
});
