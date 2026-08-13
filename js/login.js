async function login() {
    const API_BASE = 'http://localhost:3001';
    const email = document.getElementById("email").value.trim();
    const senha_usuario = document.getElementById("senha_usuario").value;

    if (!email || !senha_usuario) {
        alert("Informe o e-mail e a senha para continuar.");
        return;
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
            alert('Login bem-sucedido!');
            const loc = window.location.href || '';
            if (loc.includes('loginpsicologo')) {
                window.location.href = 'perfil.html';
            } else {
                window.location.href = 'paginaposlogin.html';
            }
            return;
        }

        const message = data?.message || 'Erro ao fazer login. Verifique e tente novamente.';
        alert(message);
    } catch (error) {
        console.warn('Backend indisponível, tentando fallback local.', error);
        const user = findMockUser(email);
        if (user && user.password === senha_usuario) {
            alert('Login local bem-sucedido!');
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

        alert('Não foi possível conectar ao servidor e não há usuário local cadastrado. Tente novamente mais tarde.');
    }
}

function findMockUser(email) {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}
