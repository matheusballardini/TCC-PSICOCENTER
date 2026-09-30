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

function maskCEP(value) {
    return value.replace(/\D/g, '').slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');
}

// nome não pode ter número, só deixa letras/acentos/espaço/apóstrofo/hífen
function maskName(value) {
    return value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ '-]/g, '');
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
    ligarEstadoCidade(document.getElementById('state'), document.getElementById('city'));
    ligarCepEndereco(document.getElementById('cep'), document.getElementById('state'), document.getElementById('city'), document.getElementById('address'));
    attachMask(document.getElementById('cep'), maskCEP);

    attachMask(document.getElementById('full_name'), maskName);
    attachMask(document.getElementById('cpf'), maskCPF);
    attachMask(document.getElementById('phone'), maskPhone);
    attachMask(document.getElementById('crp'), maskCRP);

    attachCharCounter(document.getElementById('bio'), document.getElementById('bioCounter'), 500);

    const birthDateInput = document.getElementById('birth_date');
    if (birthDateInput) {
        const hoje = new Date();
        const hojeStr = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
        birthDateInput.max = hojeStr;
        birthDateInput.min = '1900-01-01';
    }

    // botão de mostrar/esconder a senha: o cadeado vira um olho enquanto a senha está visível
    // (mesmo comportamento das telas de login, ver js/login.js)
    const toggleIcon = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('password');
    if (toggleIcon && senhaInput) {
        toggleIcon.addEventListener('click', () => {
            const estaEscondida = senhaInput.type === 'password';
            senhaInput.type = estaEscondida ? 'text' : 'password';
            toggleIcon.classList.toggle('bx-lock', !estaEscondida);
            toggleIcon.classList.toggle('bx-eye', estaEscondida);
        });
    }
});

// ============ VALIDAÇÕES ============

function isValidName(nameValue) {
    if (/\d/.test(nameValue || '')) return false;
    if (/([a-zA-ZÀ-ÖØ-öø-ÿ])\1{3,}/.test(nameValue || '')) return false;
    return true;
}

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

// horário de atendimento tem que ser dentro do "dia útil" (06:00-22:00) e o
// fim tem que vir depois do início (evita algo como 23:00 às 08:00, que na
// prática significaria atender de madrugada virando o dia)
const HORARIO_MIN_DISPONIBILIDADE = '06:00';
const HORARIO_MAX_DISPONIBILIDADE = '22:00';
const DURACAO_MINIMA_MINUTOS = 30;
function paraMinutos(horario) {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
}
function isValidHorarioDisponibilidade(start, end) {
    if (!start || !end) return false;
    if (start < HORARIO_MIN_DISPONIBILIDADE || end > HORARIO_MAX_DISPONIBILIDADE) return false;
    if (start >= end) return false;
    return paraMinutos(end) - paraMinutos(start) >= DURACAO_MINIMA_MINUTOS;
}

function isValidCRP(crpValue) {
    return /^\d{2}\/\d{4,6}$/.test(crpValue || '');
}

function isValidBirthDate(birthDateStr) {
    if (!birthDateStr) return false;
    const birth = new Date(birthDateStr + 'T00:00:00');
    if (Number.isNaN(birth.getTime())) return false;
    if (birth.getFullYear() < 1900) return false;
    return birth.getTime() <= Date.now();
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
    if (!isValidName(fullName)) {
        return falhaValidacao('Nome inválido: não pode ter números nem 4 ou mais letras repetidas seguidas.');
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
        const anosExperiencia = form.querySelector('#years_experience').value || null;
        const bio = form.querySelector('#bio').value.trim();

        // Specialties
        const specialties = Array.from(form.querySelectorAll('input[name="specialty"]:checked')).map(i => i.value);

        // Modalities
        const online = form.querySelector('#mod_online').checked;
        const presencial = form.querySelector('#mod_presencial').checked;
        const cityVal = form.querySelector('#city').value.trim();
        const stateVal = form.querySelector('#state').value.trim();
        const addressVal = form.querySelector('#address').value.trim();
        const addressNumberVal = form.querySelector('#address_number').value.trim();
        const addressCompleto = addressNumberVal ? `${addressVal}, ${addressNumberVal}` : addressVal;
        const address = presencial ? { city: cityVal, state: stateVal, address: addressCompleto } : null;

        // Prices
        const price_min = form.querySelector('#price_min').value || null;
        const price_max = form.querySelector('#price_max').value || null;

        // ---- validações específicas do psicólogo ----
        if (!isValidCPF(cpf)) return falhaValidacao('CPF inválido.');
        if (!birth_date) return falhaValidacao('Informe a data de nascimento.');
        if (!isValidBirthDate(birth_date)) return falhaValidacao('Data de nascimento inválida: deve ser a partir de 1900 e não pode ser no futuro.');
        const idade = getAge(birth_date);
        if (idade === null || idade < 22) return falhaValidacao('É necessário ter pelo menos 22 anos para se cadastrar como psicólogo.');
        if (!isValidPhone(phone)) return falhaValidacao('Telefone inválido.');
        if (!isValidCRP(crp)) return falhaValidacao('CRP inválido. Use o formato 00/000000.');
        if (crp_state.length !== 2) return falhaValidacao('Informe o estado do CRP (sigla com 2 letras).');
        if (!education || education.length > 100) return falhaValidacao('Formação é obrigatória (máx. 100 caracteres).');
        if (!institution || institution.length > 100) return falhaValidacao('Instituição é obrigatória (máx. 100 caracteres).');
        if (anosExperiencia !== null && (Number(anosExperiencia) < 0 || Number(anosExperiencia) > 80)) return falhaValidacao('Número inválido, coloque um número de anos de experiência válido.');
        if (!bio || bio.length > 500) return falhaValidacao('Biografia é obrigatória (máx. 500 caracteres).');
        if (!specialties.length) return falhaValidacao('Selecione pelo menos uma especialidade.');
        if (!online && !presencial) return falhaValidacao('Selecione ao menos uma modalidade de atendimento.');
        if (presencial && (!cityVal || !stateVal || !addressVal)) return falhaValidacao('Informe cidade, estado e endereço do consultório.');
        if (!price_min || !price_max) return falhaValidacao('Informe os valores mínimo e máximo da sessão.');
        if (Number(price_min) < 1) return falhaValidacao('O valor mínimo deve ser no mínimo 1.');
        if (Number(price_max) <= Number(price_min)) return falhaValidacao('O valor máximo deve ser maior que o valor mínimo.');

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
        for (const d of days) {
            const checked = form.querySelector(`#day_${d.key}`).checked;
            if (checked) {
                const start = form.querySelector(`#${d.key}_start`).value;
                const end = form.querySelector(`#${d.key}_end`).value;
                if (start && end) {
                    if (!isValidHorarioDisponibilidade(start, end)) {
                        return falhaValidacao(`Horário inválido em ${d.label}: use um intervalo entre ${HORARIO_MIN_DISPONIBILIDADE} e ${HORARIO_MAX_DISPONIBILIDADE}, com o fim pelo menos ${DURACAO_MINIMA_MINUTOS} minutos depois do início.`);
                    }
                    availability.push({ day: d.key, start, end });
                }
            }
        }

        if (!availability.length) return falhaValidacao('Selecione pelo menos um dia de disponibilidade com horário de início e fim.');

        // Photo (optional) -> read as base64
        const photoInput = form.querySelector('#photo');
        let photoBase64 = null;
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            photoBase64 = await comprimirImagem(file);
        }

        payload.profile = {
            cpf, birth_date, phone, crp, crp_state, education, institution, years_experience: anosExperiencia, bio,
            specialties, modalities: { online, presencial }, address, price_min, price_max, availability, photo: photoBase64
        };
    }

    // Se estiver cadastrando um paciente, coleta os campos extras do formulário
    if (role === 'paciente') {
        const cpf = form.querySelector('#cpf').value.trim();
        const birth_date = form.querySelector('#birth_date').value || null;
        const gender = form.querySelector('#gender').value || null;
        const occupation = form.querySelector('#occupation').value.trim();
        const phone = form.querySelector('#phone').value.trim();
        const city = form.querySelector('#city').value.trim();
        const state = form.querySelector('#state').value.trim();

        // ---- validações específicas do paciente ----
        if (!isValidCPF(cpf)) return falhaValidacao('CPF inválido.');
        if (!birth_date) return falhaValidacao('Informe a data de nascimento.');
        if (!isValidBirthDate(birth_date)) return falhaValidacao('Data de nascimento inválida: deve ser a partir de 1900 e não pode ser no futuro.');
        if (!isValidPhone(phone)) return falhaValidacao('Telefone inválido.');

        // Foto (opcional) -> lida como base64
        const photoInput = form.querySelector('#photo');
        let photoBase64 = null;
        if (photoInput && photoInput.files && photoInput.files[0]) {
            const file = photoInput.files[0];
            photoBase64 = await comprimirImagem(file);
        }

        payload.profile = {
            cpf, birth_date, gender, occupation, phone,
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

        // qualquer resposta de erro do backend (validação, email duplicado, etc.)
        // sempre vem com uma mensagem — mostra ela, nunca finge que deu certo
        message.style.color = '#ff4444';
        message.textContent = data?.message || 'Não foi possível concluir o cadastro. Tente novamente.';
        resetSubmitButton();
    } catch (err) {
        // chegou aqui só se a requisição nem chegou a sair do navegador
        // (backend fora do ar, sem internet, etc.) — nunca finge sucesso nesse caso,
        // porque isso já causou contas "fantasma" que pareciam cadastradas mas não existiam
        console.warn('Falha de conexão ao tentar cadastrar', err);
        message.style.color = '#ff4444';
        message.textContent = 'Não foi possível conectar ao servidor. Verifique sua internet (ou se o backend está rodando) e tente novamente.';
        resetSubmitButton();
    }
}
