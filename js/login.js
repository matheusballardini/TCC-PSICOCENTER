async function login() {
    const API_BASE = 'http://localhost:3001';
    const email = document.getElementById("email").value.trim();
    const senha_usuario = document.getElementById("senha_usuario").value;

    if (!email || !senha_usuario) {
        alert("Informe o e-mail e a senha para continuar.");
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    const loginBtnOriginalText = loginBtn ? loginBtn.textContent : '';
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.style.opacity = '0.6';
        loginBtn.textContent = 'Carregando...';
    }

    function resetLoginButton() {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
            loginBtn.textContent = loginBtnOriginalText;
        }
    }

    try {
        const response = await fetch(API_BASE + '/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password: senha_usuario })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const token = data.data?.token;
            const user = data.data?.user || {};
            const profile = data.data?.profile || {};
            const tipoConta = profile.tipo || profile.role || '';

            // confere se a conta é do tipo certo pra tela de login usada,
            // pra não deixar um psicólogo entrar como paciente (ou vice-versa)
            const loc = window.location.href || '';
            const isPsicologoLoginPage = loc.includes('loginpsicologo');
            const isPacienteLoginPage = loc.includes('loginpaciente');
            if (isPsicologoLoginPage && tipoConta && tipoConta !== 'psicologo') {
                resetLoginButton();
                alert('Esta conta não é de psicólogo. Use o login de paciente.');
                return;
            }
            if (isPacienteLoginPage && tipoConta && tipoConta !== 'paciente') {
                resetLoginButton();
                alert('Esta conta não é de paciente. Use o login de psicólogo.');
                return;
            }

            if (token) {
                localStorage.setItem('authToken', token);
                try {
                    const currentUser = {
                        id: user.id || profile.id || null,
                        email: user.email || profile.email || '',
                        full_name: profile.full_name || profile.nome || '',
                        role: profile.role || profile.tipo || '',
                        photo: profile.foto || null,
                        phone: profile.telefone || null,
                        crp: profile.crp || null,
                        bio: profile.biografia || null
                    };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    if (currentUser.email) localStorage.setItem('mockCurrentUser', currentUser.email);
                    if (currentUser.id) localStorage.setItem('authUserId', String(currentUser.id));
                } catch(e){}
            }
            // mantém o botão em "Carregando..." até a troca de página acontecer;
            // usa o tipo real da conta pra decidir o destino, não a tela de login usada
            if (tipoConta === 'psicologo') {
                window.location.href = 'perfil.html';
            } else {
                window.location.href = 'paginaposlogin.html';
            }
            return;
        }

        resetLoginButton();
        const message = data?.message || 'Erro ao fazer login. Verifique e tente novamente.';
        alert(message);
    } catch (error) {
        console.warn('Backend indisponível, tentando fallback local.', error);
        const user = findMockUser(email);
        if (user && user.password === senha_usuario) {
            const currentUser = {
                id: user.id || null,
                email: user.email || email,
                full_name: user.full_name || user.name || '',
                role: user.role || '',
                photo: user.profile?.photo || null,
                phone: user.profile?.phone || null,
                crp: user.profile?.crp || null,
                bio: user.profile?.bio || null
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('mockCurrentUser', email);
            if (user.id) localStorage.setItem('authUserId', String(user.id));
            const loc = window.location.href || '';
            if (loc.includes('loginpsicologo')) {
                window.location.href = 'perfil.html';
            } else {
                window.location.href = 'paginaposlogin.html';
            }
            return;
        }

        resetLoginButton();
        alert('Não foi possível conectar ao servidor e não há usuário local cadastrado. Tente novamente mais tarde.');
    }
}

function findMockUser(email) {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// botão de mostrar/esconder a senha: o cadeado vira um olho enquanto a senha está visível
document.addEventListener('DOMContentLoaded', () => {
    const toggleIcon = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha_usuario');
    if (!toggleIcon || !senhaInput) return;

    toggleIcon.addEventListener('click', () => {
        const estaEscondida = senhaInput.type === 'password';
        senhaInput.type = estaEscondida ? 'text' : 'password';
        toggleIcon.classList.toggle('bx-lock', !estaEscondida);
        toggleIcon.classList.toggle('bx-eye', estaEscondida);
    });
});
