const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    initEditPatientPage();
});

let newPhotoBase64 = null;

async function initEditPatientPage() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'loginpaciente.html';
        return;
    }

    const photoInput = document.getElementById('edit_photo');
    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        newPhotoBase64 = await toBase64(file);
        document.getElementById('photoPreview').src = newPhotoBase64;
    });

    document.getElementById('editForm').addEventListener('submit', saveProfile);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', deleteAccount);

    await loadCurrentData(token);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('mockCurrentUser');
    localStorage.removeItem('authUserId');
    window.location.href = 'index.html';
}

async function deleteAccount() {
    const confirmed = confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.');
    if (!confirmed) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Você precisa estar logado para excluir a conta.');
        return;
    }

    try {
        const res = await fetch(API_BASE + '/api/auth/me', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data?.message || 'Falha ao excluir a conta.');
        }

        localStorage.clear();
        alert('Conta excluída com sucesso.');
        window.location.href = 'index.html';
    } catch (err) {
        alert('Erro ao excluir conta: ' + (err?.message || err));
    }
}

async function loadCurrentData(token) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    try {
        const meRes = await fetch(API_BASE + '/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.success) throw new Error('Não autenticado');

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

        document.getElementById('edit_name').value = profile.full_name || profile.nome || '';
        document.getElementById('edit_email').value = profile.email || '';
        document.getElementById('edit_phone').value = profile.telefone || '';
        document.getElementById('edit_birth').value = profile.data_nascimento || '';
        document.getElementById('edit_gender').value = paciente.genero || '';
        document.getElementById('edit_occupation').value = paciente.profissao || '';
        document.getElementById('edit_city').value = profile.cidade || '';
        document.getElementById('edit_state').value = profile.estado || '';
        if (profile.foto) document.getElementById('photoPreview').src = profile.foto;
    } catch (err) {
        console.warn('Erro ao carregar dados do paciente', err);
        document.getElementById('editMessage').textContent = 'Não foi possível carregar seus dados.';
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

async function saveProfile(event) {
    event.preventDefault();
    const message = document.getElementById('editMessage');
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    message.style.color = '#666';
    message.textContent = '';

    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'loginpaciente.html';
        return;
    }

    const payload = {
        full_name: document.getElementById('edit_name').value.trim(),
        email: document.getElementById('edit_email').value.trim(),
        phone: document.getElementById('edit_phone').value.trim(),
        birth_date: document.getElementById('edit_birth').value || null,
        gender: document.getElementById('edit_gender').value || null,
        occupation: document.getElementById('edit_occupation').value.trim(),
        city: document.getElementById('edit_city').value.trim(),
        state: document.getElementById('edit_state').value.trim(),
    };
    if (newPhotoBase64) payload.photo = newPhotoBase64;

    try {
        const meRes = await fetch(API_BASE + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.success) throw new Error('Não autenticado');
        const userId = meData.data?.user?.id;

        const res = await fetch(API_BASE + '/api/patients/' + userId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data?.message || 'Falha ao salvar alterações');
        }

        // mantém o localStorage coerente com o que foi salvo
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            currentUser.full_name = payload.full_name;
            currentUser.email = payload.email;
            currentUser.phone = payload.phone;
            if (newPhotoBase64) currentUser.photo = newPhotoBase64;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch (e) { /* ignore */ }

        message.style.color = '#2e7d32';
        message.textContent = 'Alterações salvas com sucesso! Voltando...';
        setTimeout(() => { window.location.href = 'perfil_paciente.html'; }, 900);
    } catch (err) {
        message.style.color = '#ff4444';
        message.textContent = err.message || 'Erro ao salvar alterações.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar alterações';
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
