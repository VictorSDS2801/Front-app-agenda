// URL da API
const API_URL = 'https://app-agenda-2-0.onrender.com/api';

// Elementos do DOM
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const activityForm = document.getElementById('activityForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const activitiesList = document.getElementById('activitiesList');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const filterSubject = document.getElementById('filterSubject');
const filterTomorrow = document.getElementById('filterTomorrow');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

// Campos do formulário
const activityIdInput = document.getElementById('activityId');
const subjectInput = document.getElementById('subject');
const descriptionInput = document.getElementById('description');
const issueDateInput = document.getElementById('issueDate');
const dueDateInput = document.getElementById('dueDate');

// Verificar autenticação
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = '/';
}

// Se não for admin, redirecionar
if (user.role !== 'admin') {
    window.location.href = 'student.html';
}

// Exibir nome do usuário
userNameSpan.textContent = `Admin: ${user.username}`;

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
});

// Variável para controlar qual atividade será deletada
let activityToDelete = null;

// Submeter formulário (Criar ou Editar)
activityForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const activityId = activityIdInput.value;
    const activityData = {
        subject: subjectInput.value,
        description: descriptionInput.value,
        issueDate: issueDateInput.value,
        dueDate: dueDateInput.value
    };

    if (activityId) {
        // Editar atividade existente
        await updateActivity(activityId, activityData);
    } else {
        // Criar nova atividade
        await createActivity(activityData);
    }
});

// Cancelar edição
cancelBtn.addEventListener('click', () => {
    resetForm();
});

// Criar atividade
async function createActivity(activityData) {
    try {
        // Ajustar datas para ISO UTC (sem conversão de timezone)
        const adjustedData = {
            ...activityData,
            issueDate: adjustDateToISO(activityData.issueDate),
            dueDate: adjustDateToISO(activityData.dueDate)
        };

        const response = await fetch(`${API_URL}/activities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adjustedData)
        });

        if (response.ok) {
            alert('Atividade criada com sucesso!');
            resetForm();
            loadActivities(getCurrentFilters());
        } else {
            const error = await response.json();
            alert('Erro ao criar atividade: ' + error.error);
        }
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Atualizar atividade
// Atualizar atividade
async function updateActivity(id, activityData) {
    try {
        console.log('🔍 DEBUG - activityData original:', activityData);
        
        // Ajustar datas para ISO UTC (sem conversão de timezone)
        const adjustedData = {
            ...activityData,
            issueDate: adjustDateToISO(activityData.issueDate),
            dueDate: adjustDateToISO(activityData.dueDate)
        };
        
        console.log('🔍 DEBUG - adjustedData:', adjustedData);

        const response = await fetch(`${API_URL}/activities/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adjustedData)
        });

        if (response.ok) {
            alert('Atividade atualizada com sucesso!');
            resetForm();
            loadActivities(getCurrentFilters());
        } else {
            const error = await response.json();
            console.log('❌ DEBUG - Erro do servidor:', error);
            alert('Erro ao atualizar atividade: ' + error.error);
        }
    } catch (error) {
        console.error('Erro ao atualizar atividade:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Deletar atividade
async function deleteActivity(id) {
    try {
        const response = await fetch(`${API_URL}/activities/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Atividade deletada com sucesso!');
            loadActivities(getCurrentFilters());
            closeDeleteModal();
        } else {
            const error = await response.json();
            alert('Erro ao deletar atividade: ' + error.error);
        }
    } catch (error) {
        console.error('Erro ao deletar atividade:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Carregar atividades
async function loadActivities(filters = {}) {
    showLoading();

    try {
        // Construir query params
        let queryParams = new URLSearchParams();

        if (filters.tomorrow) {
            queryParams.append('tomorrow', 'true');
        }

        const url = `${API_URL}/activities${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

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

        // Filtrar por matéria no frontend (case-insensitive e sem acentos)
        if (filters.subject) {
            const normalizedFilter = normalizeString(filters.subject);
            activities = activities.filter(activity =>
                normalizeString(activity.subject).includes(normalizedFilter)
            );
        }

        hideLoading();
        displayActivities(activities);

    } catch (error) {
        console.error('Erro ao carregar atividades:', error);
        hideLoading();
        showEmptyMessage();
    }
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

// Criar card de atividade (versão admin)
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = 'activity-card';

    // Formatar datas
    // ✅ CORRETO - não converte timezone
    const issueDate = formatDateUTC(activity.issueDate);
    const dueDate = formatDateUTC(activity.dueDate);

    card.innerHTML = `
        <div class="activity-header">
            <span class="activity-subject">${activity.subject}</span>
        </div>
        <p class="activity-description">${activity.description}</p>
        <div class="activity-dates">
            <span>📅 Emissão: ${issueDate}</span>
            <span>⏰ Entrega: ${dueDate}</span>
        </div>
        <div class="activity-actions">
            <button class="btn-edit" data-id="${activity.id}">✏️ Editar</button>
            <button class="btn-delete" data-id="${activity.id}">🗑️ Excluir</button>
        </div>
    `;

    // Event listeners dos botões
    const editBtn = card.querySelector('.btn-edit');
    const deleteBtn = card.querySelector('.btn-delete');

    editBtn.addEventListener('click', () => editActivity(activity));
    deleteBtn.addEventListener('click', () => openDeleteModal(activity));

    return card;
}

// Editar atividade (preencher formulário)
function editActivity(activity) {
    formTitle.textContent = '✏️ Editar Atividade';
    submitBtn.textContent = 'Salvar Alterações';
    cancelBtn.style.display = 'inline-block';

    activityIdInput.value = activity.id;
    subjectInput.value = activity.subject;
    descriptionInput.value = activity.description;
    
    // Formatar datas para input type="date" (YYYY-MM-DD)
    issueDateInput.value = activity.issueDate.split('T')[0];
    dueDateInput.value = activity.dueDate.split('T')[0];

    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Resetar formulário
function resetForm() {
    activityForm.reset();
    activityIdInput.value = '';
    formTitle.textContent = '➕ Nova Atividade';
    submitBtn.textContent = 'Criar Atividade';
    cancelBtn.style.display = 'none';
}

// Abrir modal de confirmação de exclusão
function openDeleteModal(activity) {
    activityToDelete = activity;
    const modalActivityName = deleteModal.querySelector('.modal-activity-name');
    modalActivityName.textContent = `"${activity.subject} - ${activity.description}"`;
    deleteModal.classList.add('show');
}

// Fechar modal
function closeDeleteModal() {
    deleteModal.classList.remove('show');
    activityToDelete = null;
}

// Confirmar exclusão
confirmDeleteBtn.addEventListener('click', () => {
    if (activityToDelete) {
        deleteActivity(activityToDelete.id);
    }
});

// Cancelar exclusão
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Fechar modal ao clicar fora
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Aplicar filtros
applyFiltersBtn.addEventListener('click', () => {
    const filters = getCurrentFilters();
    loadActivities(filters);
});

// Limpar filtros
clearFiltersBtn.addEventListener('click', () => {
    filterSubject.value = '';
    filterTomorrow.checked = false;
    loadActivities();
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

    return filters;
}

// Função para normalizar string (remover acentos e lowercase)
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
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

// Função para ajustar data local para ISO UTC
function adjustDateToISO(dateValue) {
    console.log('📅 adjustDateToISO recebeu:', dateValue);

    // Se já for Date, converte direto
    if (dateValue instanceof Date) {
        return dateValue.toISOString();
    }

    // Se for string sem hora, adiciona meia-noite UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return new Date(dateValue + 'T00:00:00Z').toISOString();
    }

    // Se já for string ISO, retorna como está
    return new Date(dateValue).toISOString();
}


// Formatar data UTC sem conversão de timezone
function formatDateUTC(dateString) {
    // Pegar apenas a parte da data (YYYY-MM-DD)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    // Retornar no formato brasileiro
    return `${day}/${month}/${year}`;
}
// Carregar atividades ao iniciar
loadActivities();