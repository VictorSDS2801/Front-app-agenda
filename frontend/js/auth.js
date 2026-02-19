// URL da API
const API_URL = 'https://app-agenda-2-0.onrender.com/api';

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const messageDiv = document.getElementById('message');

// Alternar entre login e registro
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    hideMessage();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    hideMessage();
});

// Registro de novo usuário
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Conta criada com sucesso! Faça login.', 'success');
            setTimeout(() => {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
                registerForm.reset();
            }, 2000);
        } else {
            showMessage(data.error || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        showMessage('Erro ao conectar com o servidor', 'error');
        console.error(error);
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Salvar token e dados do usuário no localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showMessage('Login realizado com sucesso!', 'success');

            // Redirecionar baseado no role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'student.html';
                }
            }, 1000);
        } else {
            showMessage(data.error || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        showMessage('Erro ao conectar com o servidor', 'error');
        console.error(error);
    }
});

// Função para mostrar mensagens
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
}

// Função para esconder mensagens
function hideMessage() {
    messageDiv.className = 'message';
}

// Verificar se já está logado
if (localStorage.getItem('token')) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'student.html';
    }
}