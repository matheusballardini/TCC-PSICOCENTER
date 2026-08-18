const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
    initEditPage();
});

let newPhotoBase64 = null;

// ============ MÁSCARAS (formatam o campo enquanto o usuário digita) ============

function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function maskCRP(value) {
    return value.replace(/\D/g, '').slice(0, 8)
        .replace(/(\d{2})(\d)/, '$1/$2');
}

function maskUF(value) {
    return value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
}

function attachMask(input, maskFn) {
    if (!input) return;
    input.addEventListener('input', () => {
        const cursorFromEnd = input.value.length - input.selectionStart;
        input.value = maskFn(input.value);
        const pos = Math.max(0, input.value.length - cursorFromEnd);
        input.setSelectionRange(pos, pos);
    });
}

function attachCharCounter(textarea, counterEl, max) {
    if (!textarea || !counterEl) return;
    const update = () => {
        const len = textarea.value.length;
        counterEl.textContent = `${len}/${max}`;
        counterEl.classList.toggle('limite-excedido', len >= max);
    };
    textarea.addEventListener('input', update);
    update();
}

// ============ VALIDAÇÕES (mesmas regras do cadastro) ============

function isValidPhone(phoneValue) {
    const digits = (phoneValue || '').replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
}

function isValidCRP(crpValue) {
    return /^\d{2}\/\d{4,6}$/.test(crpValue || '');
}

function isValidEmail(emailValue) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue || '');
}

const DAYS = [
    { key: 'mon' }, { key: 'tue' }, { key: 'wed' }, { key: 'thu' },
    { key: 'fri' }, { key: 'sat' }, { key: 'sun' },
];

async function initEditPage() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'loginpsicologo.html';
        return;
    }

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

    attachMask(document.getElementById('edit_phone'), maskPhone);
    attachMask(document.getElementById('edit_crp'), maskCRP);
    attachMask(document.getElementById('edit_crp_state'), maskUF);
    attachMask(document.getElementById('edit_state'), maskUF);
    attachCharCounter(document.getElementById('edit_bio'), document.getElementById('edit_bioCounter'), 500);

    const presCheckbox = document.getElementById('edit_mod_presencial');
    const presFields = document.getElementById('editPresencialFields');
    presCheckbox.addEventListener('change', () => {
        presFields.style.display = presCheckbox.checked ? 'block' : 'none';
    });

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

        // essa é a página do psicólogo; se quem estiver logado for paciente,
        // manda pro painel certo em vez de mostrar os dados dele aqui
        if (profile.tipo && profile.tipo !== 'psicologo') {
            alert('Esta é a área do psicólogo. Você está logado como paciente.');
            window.location.href = 'paginaposlogin.html';
            return;
        }

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
        document.getElementById('edit_phone').value = phone ? maskPhone(phone) : '';
        document.getElementById('edit_crp').value = crp;
        document.getElementById('edit_bio').value = bio;
        document.getElementById('edit_bio').dispatchEvent(new Event('input'));
        if (photo) document.getElementById('photoPreview').src = photo;

        // dados profissionais
        document.getElementById('edit_crp_state').value = psicologo.crp_uf || '';
        document.getElementById('edit_education').value = psicologo.formacao || '';
        document.getElementById('edit_institution').value = psicologo.instituicao || '';
        document.getElementById('edit_years').value = psicologo.anos_experiencia ?? '';

        // especialidades
        const especialidades = Array.isArray(psicologo.especialidades_json)
            ? psicologo.especialidades_json
            : (Array.isArray(psicologo.especialidades) ? psicologo.especialidades : []);
        document.querySelectorAll('input[name="edit_specialty"]').forEach((el) => {
            el.checked = especialidades.includes(el.value);
        });

        // modalidade + endereço
        const modalidade = psicologo.modalidade || 'online';
        const isOnline = modalidade === 'online' || modalidade === 'ambos';
        const isPresencial = modalidade === 'presencial' || modalidade === 'ambos';
        document.getElementById('edit_mod_online').checked = isOnline;
        document.getElementById('edit_mod_presencial').checked = isPresencial;
        document.getElementById('editPresencialFields').style.display = isPresencial ? 'block' : 'none';
        document.getElementById('edit_city').value = psicologo.cidade || profile.cidade || '';
        document.getElementById('edit_state').value = psicologo.estado || profile.estado || '';
        document.getElementById('edit_address').value = psicologo.endereco || '';

        // valores
        document.getElementById('edit_price_min').value = psicologo.valor_consulta ?? '';
        document.getElementById('edit_price_max').value = psicologo.valor_consulta_max ?? '';

        // disponibilidade
        let slots = [];
        try {
            slots = typeof psicologo.disponibilidade === 'string'
                ? JSON.parse(psicologo.disponibilidade)
                : (psicologo.disponibilidade || []);
        } catch (e) {
            slots = [];
        }
        DAYS.forEach((d) => {
            const slot = (slots || []).find((s) => s.day === d.key);
            const checkbox = document.getElementById(`edit_day_${d.key}`);
            const startInput = document.getElementById(`edit_${d.key}_start`);
            const endInput = document.getElementById(`edit_${d.key}_end`);
            if (slot) {
                checkbox.checked = true;
                startInput.value = slot.start || '';
                endInput.value = slot.end || '';
            }
        });

        const sidebarName = document.getElementById('sidebarName');
        const sidebarPhoto = document.getElementById('sidebarPhoto');
        if (sidebarName) sidebarName.textContent = name || '—';
        if (sidebarPhoto && photo) sidebarPhoto.src = photo;
    } catch (err) {
        console.warn('Erro ao carregar dados do perfil', err);
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
        window.location.href = 'loginpsicologo.html';
        return;
    }

    function falhaValidacao(texto) {
        message.style.color = '#ff4444';
        message.textContent = texto;
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar alterações';
        return false;
    }

    const nameVal = document.getElementById('edit_name').value.trim();
    const emailVal = document.getElementById('edit_email').value.trim();
    const phoneVal = document.getElementById('edit_phone').value.trim();
    const crpVal = document.getElementById('edit_crp').value.trim();
    const crpStateVal = document.getElementById('edit_crp_state').value.trim();
    const bioVal = document.getElementById('edit_bio').value.trim();
    const educationVal = document.getElementById('edit_education').value.trim();
    const institutionVal = document.getElementById('edit_institution').value.trim();
    const priceMinVal = document.getElementById('edit_price_min').value;
    const priceMaxVal = document.getElementById('edit_price_max').value;
    const cityVal = document.getElementById('edit_city').value.trim();
    const stateVal = document.getElementById('edit_state').value.trim();
    const addressVal = document.getElementById('edit_address').value.trim();

    const specialties = Array.from(document.querySelectorAll('input[name="edit_specialty"]:checked')).map((el) => el.value);
    const online = document.getElementById('edit_mod_online').checked;
    const presencial = document.getElementById('edit_mod_presencial').checked;

    if (nameVal.length < 5 || nameVal.length > 100) return falhaValidacao('Nome deve ter entre 5 e 100 caracteres.');
    if (!isValidEmail(emailVal)) return falhaValidacao('Informe um e-mail válido.');
    if (!isValidPhone(phoneVal)) return falhaValidacao('Telefone inválido.');
    if (!isValidCRP(crpVal)) return falhaValidacao('CRP inválido. Use o formato 00/000000.');
    if (crpStateVal.length !== 2) return falhaValidacao('Informe o estado do CRP (sigla com 2 letras).');
    if (!educationVal || educationVal.length > 100) return falhaValidacao('Formação é obrigatória (máx. 100 caracteres).');
    if (!institutionVal || institutionVal.length > 100) return falhaValidacao('Instituição é obrigatória (máx. 100 caracteres).');
    if (!bioVal || bioVal.length > 500) return falhaValidacao('Biografia é obrigatória (máx. 500 caracteres).');
    if (!specialties.length) return falhaValidacao('Selecione pelo menos uma especialidade.');
    if (!online && !presencial) return falhaValidacao('Selecione ao menos uma modalidade de atendimento.');
    if (presencial && (!cityVal || !stateVal || !addressVal)) return falhaValidacao('Informe cidade, estado e endereço do consultório.');
    if (!priceMinVal || !priceMaxVal) return falhaValidacao('Informe os valores mínimo e máximo da sessão.');

    const availability = [];
    DAYS.forEach((d) => {
        const checked = document.getElementById(`edit_day_${d.key}`).checked;
        if (checked) {
            const start = document.getElementById(`edit_${d.key}_start`).value;
            const end = document.getElementById(`edit_${d.key}_end`).value;
            if (start && end) availability.push({ day: d.key, start, end });
        }
    });

    if (!availability.length) return falhaValidacao('Selecione pelo menos um dia de disponibilidade com horário de início e fim.');

    const payload = {
        full_name: document.getElementById('edit_name').value.trim(),
        email: document.getElementById('edit_email').value.trim(),
        phone: document.getElementById('edit_phone').value.trim(),
        crp: document.getElementById('edit_crp').value.trim(),
        bio: document.getElementById('edit_bio').value.trim(),
        crp_state: document.getElementById('edit_crp_state').value.trim(),
        education: document.getElementById('edit_education').value.trim(),
        institution: document.getElementById('edit_institution').value.trim(),
        years_experience: document.getElementById('edit_years').value || null,
        specialties,
        modalities: { online, presencial },
        city: document.getElementById('edit_city').value.trim(),
        state: document.getElementById('edit_state').value.trim(),
        address: { address: document.getElementById('edit_address').value.trim() },
        price_min: document.getElementById('edit_price_min').value || null,
        price_max: document.getElementById('edit_price_max').value || null,
        availability,
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
