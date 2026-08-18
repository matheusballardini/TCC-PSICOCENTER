let registerInProgress = false;

// ============ MÁSCARAS (formatam o campo enquanto o usuário digita) ============

function maskCPF(value) {
    return value.replace(/\D/g, '').slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

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

// aplica uma máscara a um input sempre que o usuário digita, mantendo o cursor no lugar certo
function attachMask(input, maskFn) {
    if (!input) return;
    input.addEventListener('input', () => {
        const cursorFromEnd = input.value.length - input.selectionStart;
        input.value = maskFn(input.value);
        const pos = Math.max(0, input.value.length - cursorFromEnd);
        input.setSelectionRange(pos, pos);
    });
}

// mostra "0/500" embaixo do campo e atualiza a cada tecla digitada
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

document.addEventListener('DOMContentLoaded', () => {
    attachMask(document.getElementById('cpf'), maskCPF);
    attachMask(document.getElementById('phone'), maskPhone);
    attachMask(document.getElementById('crp'), maskCRP);
    attachMask(document.getElementById('crp_state'), maskUF);
    attachMask(document.getElementById('state'), maskUF);

    attachCharCounter(document.getElementById('bio'), document.getElementById('bioCounter'), 500);
});

// ============ VALIDAÇÕES ============

function isValidCPF(cpfValue) {
    const digits = (cpfValue || '').replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i], 10) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    if (rev !== parseInt(digits[9], 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i], 10) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev >= 10) rev = 0;
    if (rev !== parseInt(digits[10], 10)) return false;

    return true;
}

function isValidEmail(emailValue) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue || '');
}

function isValidPhone(phoneValue) {
    const digits = (phoneValue || '').replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
}

function isValidCRP(crpValue) {
    return /^\d{2}\/\d{4,6}$/.test(crpValue || '');
}

function getAge(birthDateStr) {
    if (!birthDateStr) return null;
    const today = new Date();
    const birth = new Date(birthDateStr + 'T00:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthdayThisYear = today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthdayThisYear) age--;
    return age;
}

async function register(event, role) {
    const API_BASE = 'http://localhost:3001';
    event.preventDefault();

    if (registerInProgress) return;
    registerInProgress = true;

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const submitButtonOriginalText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = '0.6';
        submitButton.textContent = 'Carregando...';
    }

    function resetSubmitButton() {
        registerInProgress = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.textContent = submitButtonOriginalText;
        }
    }

    const message = document.getElementById('registerMessage');
    message.style.color = '#fff';
    message.textContent = 'Processando cadastro...';

    function falhaValidacao(texto) {
        message.style.color = '#ff4444';
        message.textContent = texto;
        resetSubmitButton();
    }

    const fullName = form.querySelector('#full_name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const passwordConfirm = form.querySelector('#password_confirm')?.value || '';

    // ---- validações comuns aos dois cadastros ----
    if (fullName.length < 5 || fullName.length > 100) {
        return falhaValidacao('Nome deve ter entre 5 e 100 caracteres.');
    }
    if (!isValidEmail(email)) {
        return falhaValidacao('Informe um e-mail válido.');
    }
    if (!password) {
        return falhaValidacao('Informe uma senha.');
    }
    if (password !== passwordConfirm && passwordConfirm) {
        return falhaValidacao('As senhas não conferem.');
    }

    // Base payload
    const payload = { full_name: fullName, email, password, role };

    // If registering a psychologist, collect extended fields
    if (role === 'psicologo') {
        const cpf = form.querySelector('#cpf').value.trim();
        const birth_date = form.querySelector('#birth_date').value || null;
        const phone = form.querySelector('#phone').value.trim();
        const crp = form.querySelector('#crp').value.trim();
        const crp_state = form.querySelector('#crp_state').value.trim();
        const education = form.querySelector('#education').value.trim();
        const institution = form.querySelector('#institution').value.trim();
        const years_experience = form.querySelector('#years_experience').value || null;
        const bio = form.querySelector('#bio').value.trim();

        // Specialties
        const specialties = Array.from(form.querySelectorAll('input[name="specialty"]:checked')).map(i => i.value);

        // Modalities
        const online = form.querySelector('#mod_online').checked;
        const presencial = form.querySelector('#mod_presencial').checked;
        const cityVal = form.querySelector('#city').value.trim();
        const stateVal = form.querySelector('#state').value.trim();
        const addressVal = form.querySelector('#address').value.trim();
        const address = presencial ? { city: cityVal, state: stateVal, address: addressVal } : null;

        // Prices
        const price_min = form.querySelector('#price_min').value || null;
        const price_max = form.querySelector('#price_max').value || null;

        // ---- validações específicas do psicólogo ----
        if (!isValidCPF(cpf)) return falhaValidacao('CPF inválido.');
        if (!birth_date) return falhaValidacao('Informe a data de nascimento.');
        const idade = getAge(birth_date);
        if (idade === null || idade < 22) return falhaValidacao('É necessário ter pelo menos 22 anos para se cadastrar como psicólogo.');
        if (!isValidPhone(phone)) return falhaValidacao('Telefone inválido.');
        if (!isValidCRP(crp)) return falhaValidacao('CRP inválido. Use o formato 00/000000.');
        if (crp_state.length !== 2) return falhaValidacao('Informe o estado do CRP (sigla com 2 letras).');
        if (!education || education.length > 100) return falhaValidacao('Formação é obrigatória (máx. 100 caracteres).');
        if (!institution || institution.length > 100) return falhaValidacao('Instituição é obrigatória (máx. 100 caracteres).');
        if (!bio || bio.length > 500) return falhaValidacao('Biografia é obrigatória (máx. 500 caracteres).');
        if (!specialties.length) return falhaValidacao('Selecione pelo menos uma especialidade.');
        if (!online && !presencial) return falhaValidacao('Selecione ao menos uma modalidade de atendimento.');
        if (presencial && (!cityVal || !stateVal || !addressVal)) return falhaValidacao('Informe cidade, estado e endereço do consultório.');
        if (!price_min || !price_max) return falhaValidacao('Informe os valores mínimo e máximo da sessão.');

        // Availability (one range per day)
        const days = [
            { key: 'mon', label: 'Segunda' },
            { key: 'tue', label: 'Terça' },
            { key: 'wed', label: 'Quarta' },
            { key: 'thu', label: 'Quinta' },
            { key: 'fri', label: 'Sexta' },
            { key: 'sat', label: 'Sábado' },
            { key: 'sun', label: 'Domingo' },
        ];

        const availability = [];
        days.forEach(d => {
            const checked = form.querySelector(`#day_${d.key}`).checked;
            if (checked) {
                const start = form.querySelector(`#${d.key}_start`).value;
                const end = form.querySelector(`#${d.key}_end`).value;
                if (start && end) {
                    availability.push({ day: d.key, start, end });
                }
            }
        });

        if (!availability.length) return falhaValidacao('Selecione pelo menos um dia de disponibilidade com horário de início e fim.');

        // Photo (optional) -> read as base64
        const photoInput = form.querySelector('#photo');
        let photoBase64 = null;
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            photoBase64 = await toBase64(file);
        }

        payload.profile = {
            cpf, birth_date, phone, crp, crp_state, education, institution, years_experience, bio,
            specialties, modalities: { online, presencial }, address, price_min, price_max, availability, photo: photoBase64
        };
    }

    // Se estiver cadastrando um paciente, coleta os campos extras do formulário
    if (role === 'paciente') {
        const birth_date = form.querySelector('#birth_date').value || null;
        const gender = form.querySelector('#gender').value || null;
        const occupation = form.querySelector('#occupation').value.trim();
        const phone = form.querySelector('#phone').value.trim();
        const city = form.querySelector('#city').value.trim();
        const state = form.querySelector('#state').value.trim();

        // ---- validações específicas do paciente ----
        if (!birth_date) return falhaValidacao('Informe a data de nascimento.');
        if (!isValidPhone(phone)) return falhaValidacao('Telefone inválido.');

        // Foto (opcional) -> lida como base64
        const photoInput = form.querySelector('#photo');
        let photoBase64 = null;
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            photoBase64 = await toBase64(file);
        }

        payload.profile = {
            birth_date, gender, occupation, phone,
            address: { city, state },
            photo: photoBase64
        };
    }

    try {
        const response = await fetch(API_BASE + '/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok && data.success) {
            const currentUser = {
                id: data?.data?.user?.id || null,
                email,
                full_name: fullName,
                role,
                photo: payload.profile?.photo || null,
                phone: payload.profile?.phone || null,
                crp: payload.profile?.crp || null,
                bio: payload.profile?.bio || null
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('mockCurrentUser', email);
            if (currentUser.id) localStorage.setItem('authUserId', String(currentUser.id));
            message.style.color = '#000';
            message.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
            setTimeout(() => {
                window.location.href = role === 'paciente' ? 'loginpaciente.html' : 'loginpsicologo.html';
            }, 1200);
            return;
        }

        if (data?.message) {
            message.textContent = data.message;
            resetSubmitButton();
            return;
        }

        throw new Error('Falha no cadastro via backend');
    } catch (err) {
        console.warn('Backend não disponível, usando fallback local.', err);
        saveMockUser({ email, password, full_name: fullName, role, profile: payload.profile || {} });
        const currentUser = {
            id: null,
            email,
            full_name: fullName,
            role,
            photo: payload.profile?.photo || null,
            phone: payload.profile?.phone || null,
            crp: payload.profile?.crp || null,
            bio: payload.profile?.bio || null
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        message.style.color = '#000';
        message.textContent = 'Cadastro local realizado com sucesso! Redirecionando...';
        try { localStorage.setItem('mockCurrentUser', email); } catch(e){}
        setTimeout(() => {
            window.location.href = role === 'paciente' ? 'loginpaciente.html' : 'loginpsicologo.html';
        }, 1200);
    }
}

function saveMockUser(user) {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const exists = users.some(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (!exists) {
        users.push(user);
        localStorage.setItem('mockUsers', JSON.stringify(users));
    }
}

function findMockUser(email) {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}
