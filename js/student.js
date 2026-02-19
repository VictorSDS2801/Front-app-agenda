// URL da API
const API_URL = 'https://app-agenda-2-0.onrender.com/api';

// Elementos do DOM
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const activitiesList = document.getElementById('activitiesList');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const filterSubject = document.getElementById('filterSubject');
const filterTomorrow = document.getElementById('filterTomorrow');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');
const showCompleted = document.getElementById('showCompleted');

// Verificar autenticação
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = '/';
}

// Se for admin, redirecionar
if (user.role === 'admin') {
    window.location.href = 'admin.html';
}

// Exibir nome do usuário
userNameSpan.textContent = `Olá, ${user.username}!`;

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
});

// Buscar e exibir atividades
async function loadActivities(filters = {}) {
    showLoading();

    try {
        // Construir query params (apenas filtros do backend)
        let queryParams = new URLSearchParams();
        
        if (filters.tomorrow) {
            queryParams.append('tomorrow', 'true');
        }

        // ✅ Corrigido: usar rota /activities
        const url = `${API_URL}/activities${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        console.log("🔍 URL chamada:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            return;
        }

        let activities = await response.json();

        // Filtrar por matéria no frontend
        if (filters.subject) {
            const normalizedFilter = normalizeString(filters.subject);
            activities = activities.filter(activity => 
                normalizeString(activity.subject).includes(normalizedFilter)
            );
        }

        // Mostrar apenas não feitas, a menos que o filtro esteja marcado
        if (!filters.showCompleted) {
            activities = activities.filter(activity => !activity.completed);
        }

        hideLoading();
        displayActivities(activities);

    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        hideLoading();
        showEmptyMessage();
    }
}

// Função para normalizar string
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Exibir atividades
function displayActivities(activities) {
    activitiesList.innerHTML = '';

    if (activities.length === 0) {
        showEmptyMessage();
        return;
    }

    emptyMessage.style.display = 'none';

    activities.forEach(activity => {
        const card = createActivityCard(activity);
        activitiesList.appendChild(card);
    });
}

// Criar card de atividade
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = `activity-card ${activity.completed ? 'completed' : 'not-completed'}`;
    card.dataset.activityId = activity.id;
    
    const issueDate = formatDateUTC(activity.issueDate);
    const dueDate = formatDateUTC(activity.dueDate);

    card.innerHTML = `
        <div class="activity-header">
            <span class="activity-subject">${activity.subject}</span>
            <span class="activity-status ${activity.completed ? 'status-completed' : 'status-pending'}">
                ${activity.completed ? '✓ Feita' : '✗ Pendente'}
            </span>
        </div>
        <p class="activity-description">${activity.description}</p>
        <div class="activity-dates">
            <span>📅 Emissão: ${issueDate}</span>
            <span>⏰ Entrega: ${dueDate}</span>
        </div>
    `;

    card.addEventListener('click', function() {
        toggleActivity(this.dataset.activityId);
    });

    return card;
}

// Marcar/desmarcar atividade
async function toggleActivity(activityId) {
    try {
        const response = await fetch(`${API_URL}/completions/toggle/${activityId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Toggle realizado:', data);
            
            // Recarregar atividades mantendo filtros
            const filters = getCurrentFilters();
            await loadActivities(filters);
        } else {
            const error = await response.json();
            console.error('Erro no toggle:', error);
            alert('Erro ao atualizar atividade: ' + error.error);
        }

    } catch (error) {
        console.error('Erro ao toggle atividade:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Aplicar filtros
applyFiltersBtn.addEventListener('click', () => {
    const filters = getCurrentFilters();
    console.log("🔍 Filtros aplicados:", filters);
    loadActivities(filters);
});

// Limpar filtros
clearFiltersBtn.addEventListener('click', () => {
    filterSubject.value = '';
    filterTomorrow.checked = false;
    showCompleted.checked = false;
    loadActivities(getCurrentFilters());
});

// Pegar filtros atuais
function getCurrentFilters() {
    const filters = {};
    
    if (filterSubject.value.trim()) {
        filters.subject = filterSubject.value.trim();
    }
    
    if (filterTomorrow.checked) {
        filters.tomorrow = true;
    }

    if (showCompleted.checked) {
        filters.showCompleted = true;
    }
    
    return filters;
}

// Mostrar loading
function showLoading() {
    loadingMessage.style.display = 'block';
    activitiesList.innerHTML = '';
    emptyMessage.style.display = 'none';
}

// Esconder loading
function hideLoading() {
    loadingMessage.style.display = 'none';
}

// Mostrar mensagem vazia
function showEmptyMessage() {
    emptyMessage.style.display = 'block';
    activitiesList.innerHTML = '';
}

// Formatar data UTC
function formatDateUTC(dateString) {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
}

// Carregar atividades ao iniciar (já com filtros atuais)
loadActivities(getCurrentFilters());
