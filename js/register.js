let registerInProgress = false;

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

    const fullName = form.querySelector('#full_name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const passwordConfirm = form.querySelector('#password_confirm')?.value || '';

    if (!fullName || !email || !password) {
        message.style.color = '#ff4444';
        message.textContent = 'Preencha nome, e-mail e senha.';
        resetSubmitButton();
        return;
    }

    if (password !== passwordConfirm && passwordConfirm) {
        message.style.color = '#ff4444';
        message.textContent = 'As senhas não conferem.';
        resetSubmitButton();
        return;
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
        const address = presencial ? {
            city: form.querySelector('#city').value.trim(),
            state: form.querySelector('#state').value.trim(),
            address: form.querySelector('#address').value.trim()
        } : null;

        // Prices
        const price_min = form.querySelector('#price_min').value || null;
        const price_max = form.querySelector('#price_max').value || null;

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
