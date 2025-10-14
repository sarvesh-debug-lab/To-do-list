class ToDoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.selectedPriority = 'medium';

        this.loadTheme();
        this.initializeApp();
        this.setupEventListeners();
        this.setupServiceWorker();
        this.renderTasks();
    }

    // Initialize the application
    initializeApp() {
        const dateInput = document.getElementById('taskDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        if (addTaskBtn) addTaskBtn.addEventListener('click', () => this.openModal());

        const addFirstTaskBtn = document.getElementById('addFirstTask');
        if (addFirstTaskBtn) addFirstTaskBtn.addEventListener('click', () => this.openModal());

        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeModal());

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

        const form = document.getElementById('taskForm');
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleTheme());

        // Priority buttons
        const priorityButtons = document.querySelectorAll('.priority-btn');
        if (priorityButtons.length > 0) {
            priorityButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    priorityButtons.forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    this.selectedPriority = e.target.getAttribute('data-priority');
                });
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'taskModal') this.closeModal();
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        // Task action delegation
        const tasksContainer = document.getElementById('tasksContainer');
        if (tasksContainer) {
            tasksContainer.addEventListener('click', (e) => {
                const taskCard = e.target.closest('.task-card');
                if (!taskCard) return;

                const taskId = taskCard.dataset.taskId;
                if (!taskId) return;

                if (e.target.classList.contains('btn-complete')) {
                    this.toggleTaskCompletion(taskId);
                } else if (e.target.classList.contains('btn-edit')) {
                    this.openModal(taskId);
                } else if (e.target.classList.contains('btn-delete')) {
                    this.deleteTask(taskId);
                }
            });
        }
    }

    // Validate time inputs
    validateTimeInputs() {
        const start = document.getElementById('taskStartTime');
        const end = document.getElementById('taskEndTime');
        if (!start || !end) return true;

        if (start.value && end.value && start.value >= end.value) {
            alert('End time must be after start time.');
            return false;
        }
        return true;
    }

    // Validate form data
    validateTaskData(formData) {
        if (!formData.name.trim()) throw new Error('Please enter a task name.');

        const today = new Date().toISOString().split('T')[0];
        if (formData.date && formData.date < today) {
            throw new Error('Cannot set tasks in the past.');
        }

        return true;
    }

    // Get form data
    getFormData() {
        const name = document.getElementById('taskName')?.value.trim() || '';
        const date = document.getElementById('taskDate')?.value || '';
        const startTime = document.getElementById('taskStartTime')?.value || '';
        const endTime = document.getElementById('taskEndTime')?.value || '';
        const description = document.getElementById('taskDescription')?.value.trim() || '';

        if (!name) throw new Error('Task name cannot be empty.');

        return { name, date, startTime, endTime, description };
    }

    // Add task
    addTask(taskData) {
        const newTask = {
            id: crypto.randomUUID(),
            ...taskData,
            priority: this.selectedPriority,
            completed: false,
            createdAt: new Date().toISOString()
        };
        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
    }

    // Update task
    updateTask(taskId, taskData) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index === -1) throw new Error('Task not found.');

        this.tasks[index] = { ...this.tasks[index], ...taskData, priority: this.selectedPriority };
        this.saveTasks();
        this.renderTasks();
    }

    // Delete task
    deleteTask(taskId) {
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.add('fade-out');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveTasks();
                this.renderTasks();
            }, 300);
        }
    }

    // Toggle completion with animation
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.animateTaskMove(taskId);
        }
    }

    // Animate moving completed task to bottom
    animateTaskMove(taskId) {
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!card) return;
        card.classList.add('fade-out');
        setTimeout(() => {
            this.renderTasks();
        }, 300);
    }

    // Modal controls
    openModal(taskId = null) {
        this.currentEditId = taskId;
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');
        if (!modal || !modalTitle || !form) return;

        if (taskId) {
            modalTitle.textContent = 'Edit Task';
            const task = this.tasks.find(t => t.id === taskId);
            if (task) this.populateForm(task);
        } else {
            modalTitle.textContent = 'Add New Task';
            form.reset();
            this.initializeApp();
            this.setDefaultPriority();
        }

        modal.style.display = 'flex';
        document.getElementById('taskName')?.focus();
    }

    closeModal() {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
        this.setDefaultPriority();
        this.currentEditId = null;
    }

    populateForm(task) {
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskStartTime').value = task.startTime || '';
        document.getElementById('taskEndTime').value = task.endTime || '';
        document.getElementById('taskDescription').value = task.description || '';
        this.setPriority(task.priority);
    }

    setPriority(priority) {
        document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
        const btn = document.querySelector(`.priority-btn[data-priority="${priority}"]`);
        if (btn) btn.classList.add('active');
        this.selectedPriority = priority;
    }

    setDefaultPriority() {
        this.setPriority('medium');
    }

    handleSubmit(e) {
        e.preventDefault();
        try {
            if (!this.validateTimeInputs()) return;
            const data = this.getFormData();
            this.validateTaskData(data);

            if (this.currentEditId) this.updateTask(this.currentEditId, data);
            else this.addTask(data);

            this.closeModal();
        } catch (err) {
            alert(err.message);
        }
    }

    // Rendering
    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        if (!container || !emptyState) return;

        if (this.tasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        const grouped = this.groupTasksByDate();
        container.innerHTML = '';

        Object.keys(grouped).sort().forEach(date => {
            const section = this.createDateSection(date, grouped[date]);
            container.appendChild(section);
        });
    }

    groupTasksByDate() {
        const groups = {};
        this.tasks.forEach(task => {
            if (!groups[task.date]) groups[task.date] = [];
            groups[task.date].push(task);
        });
        return groups;
    }

    createDateSection(date, tasks) {
        const section = document.createElement('div');
        section.className = 'date-section';

        const header = document.createElement('div');
        header.className = 'date-header';
        header.innerHTML = `
            <span class="date-label">${this.formatDateDisplay(date)}</span>
            <span class="task-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
        `;

        const list = document.createElement('div');
        list.className = 'task-list';

        const sorted = tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed - b.completed;
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        sorted.forEach(task => list.appendChild(this.createTaskCard(task)));

        section.appendChild(header);
        section.appendChild(list);
        return section;
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.dataset.taskId = task.id;

        let time = '';
        if (task.startTime && task.endTime) time = `${task.startTime} - ${task.endTime}`;
        else if (task.startTime) time = `Starts at ${task.startTime}`;
        else if (task.endTime) time = `Ends at ${task.endTime}`;

        card.innerHTML = `
            <div class="task-header">
                <div class="task-name">${this.escapeHtml(task.name)}</div>
                <span class="priority-badge priority-${task.priority}">
                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
            </div>
            ${time ? `<div class="task-time">${time}</div>` : ''}
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-actions">
                <button class="btn-small btn-complete">${task.completed ? 'Undo' : 'Complete'}</button>
                <button class="btn-small btn-edit">Edit</button>
                <button class="btn-small btn-delete">Delete</button>
            </div>
        `;
        return card;
    }

    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    escapeHtml(unsafe) {
        return unsafe.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    }

    loadTasks() {
        try {
            return JSON.parse(localStorage.getItem('pwa-todo-tasks')) || [];
        } catch {
            console.warn('Error loading tasks; resetting storage.');
            return [];
        }
    }

    saveTasks() {
        localStorage.setItem('pwa-todo-tasks', JSON.stringify(this.tasks));
    }

    toggleTheme() {
        const body = document.body;
        const toggle = document.getElementById('themeToggle');
        const dark = body.classList.toggle('dark-theme');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        if (toggle) toggle.textContent = dark ? '☀️' : '🌙';
    }

    loadTheme() {
        const saved = localStorage.getItem('theme');
        const toggle = document.getElementById('themeToggle');
        if (saved === 'dark') {
            document.body.classList.add('dark-theme');
            if (toggle) toggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            if (toggle) toggle.textContent = '🌙';
        }
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered.');
            } catch (e) {
                console.error('SW registration failed:', e);
            }
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ToDoApp();
});
