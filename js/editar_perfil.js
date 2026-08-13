const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    initEditPage();
});

let newPhotoBase64 = null;

async function initEditPage() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'loginpsicologo.html';
        return;
    }

    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.location.href = 'perfil.html';
    });
    document.getElementById('cancelBtn2').addEventListener('click', () => {
        window.location.href = 'perfil.html';
    });

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
    try {
        const meRes = await fetch(API_BASE + '/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.success) throw new Error('Não autenticado');

        const profile = meData.data?.profile || {};
        const userId = meData.data?.user?.id;

        let psicologo = {};
        if (userId) {
            try {
                const pRes = await fetch(API_BASE + '/api/psychologists/' + userId, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const pData = await pRes.json();
                if (pRes.ok && pData.success) psicologo = pData.data || {};
            } catch (e) {
                console.warn('Erro ao buscar dados do psicólogo', e);
            }
        }

        const name = profile.full_name || profile.nome || '';
        const email = profile.email || '';
        const phone = profile.telefone || '';
        const bio = psicologo.descricao_profissional || profile.biografia || '';
        const crp = psicologo.crp || '';
        const photo = profile.foto || null;

        document.getElementById('edit_name').value = name;
        document.getElementById('edit_email').value = email;
        document.getElementById('edit_phone').value = phone;
        document.getElementById('edit_crp').value = crp;
        document.getElementById('edit_bio').value = bio;
        if (photo) document.getElementById('photoPreview').src = photo;

        const sidebarName = document.getElementById('sidebarName');
        const sidebarPhoto = document.getElementById('sidebarPhoto');
        if (sidebarName) sidebarName.textContent = name || '—';
        if (sidebarPhoto && photo) sidebarPhoto.src = photo;
    } catch (err) {
        console.warn('Erro ao carregar dados do perfil', err);
        document.getElementById('editMessage').textContent = 'Não foi possível carregar seus dados.';
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
        window.location.href = 'loginpsicologo.html';
        return;
    }

    const payload = {
        full_name: document.getElementById('edit_name').value.trim(),
        email: document.getElementById('edit_email').value.trim(),
        phone: document.getElementById('edit_phone').value.trim(),
        crp: document.getElementById('edit_crp').value.trim(),
        bio: document.getElementById('edit_bio').value.trim(),
    };
    if (newPhotoBase64) payload.photo = newPhotoBase64;

    try {
        const meRes = await fetch(API_BASE + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.success) throw new Error('Não autenticado');
        const userId = meData.data?.user?.id;

        const res = await fetch(API_BASE + '/api/psychologists/' + userId, {
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
            currentUser.crp = payload.crp;
            currentUser.bio = payload.bio;
            if (newPhotoBase64) currentUser.photo = newPhotoBase64;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } catch (e) { /* ignore */ }

        message.style.color = '#2e7d32';
        message.textContent = 'Alterações salvas com sucesso! Voltando...';
        setTimeout(() => { window.location.href = 'perfil.html'; }, 900);
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
