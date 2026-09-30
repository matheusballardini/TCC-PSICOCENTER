
document.addEventListener('DOMContentLoaded', () => {
    carregarContaLogada();

    const contaBtn = document.getElementById('contaBtn');
    const dropdown = document.getElementById('contaDropdown');
    const sairBtn = document.getElementById('contaSairBtn');

    contaBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const aberto = dropdown.classList.toggle('aberto');
        contaBtn.setAttribute('aria-expanded', String(aberto));
    });

    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target) && event.target !== contaBtn) {
            dropdown.classList.remove('aberto');
            contaBtn.setAttribute('aria-expanded', 'false');
        }
    });

    sairBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('mockCurrentUser');
        localStorage.removeItem('authUserId');
        window.location.href = 'entrar.html';
    });
});

async function carregarContaLogada() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch(API_BASE + '/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok || !data.success) return;

        const profile = data.data?.profile || {};
        const nome = profile.full_name || profile.nome || 'Usuário';
        const email = profile.email || '';
        const foto = avatarSrc(profile.foto, nome);

        document.getElementById('contaFoto').src = foto;
        document.getElementById('contaFotoGrande').src = foto;
        document.getElementById('contaNome').textContent = nome;
        document.getElementById('contaEmail').textContent = email;
    } catch (err) {
        console.warn('Erro ao carregar conta logada', err);
    }
}
