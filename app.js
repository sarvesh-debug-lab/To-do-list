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

    // Setup event listeners safely
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

        // Event delegation for task actions
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
        const startTimeInput = document.getElementById('taskStartTime');
        const endTimeInput = document.getElementById('taskEndTime');
        
        if (!startTimeInput || !endTimeInput) return true;

        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;

        if (startTime && endTime && startTime >= endTime) {
            alert('End time must be after start time');
            return false;
        }
        return true;
    }

    // Validate task data
    validateTaskData(formData) {
        if (!formData.name || formData.name.trim() === '') {
            throw new Error('Please enter a task name');
        }

        if (formData.date) {
            const today = new Date().toISOString().split('T')[0];
            if (formData.date < today) {
                throw new Error('Cannot set tasks in the past');
            }
        }

        return true;
    }

    // Get form data
    getFormData() {
        const nameInput = document.getElementById('taskName');
        const dateInput = document.getElementById('taskDate');
        const startTimeInput = document.getElementById('taskStartTime');
        const endTimeInput = document.getElementById('taskEndTime');
        const descriptionInput = document.getElementById('taskDescription');

        if (!nameInput) {
            throw new Error('Task form elements not found');
        }

        return {
            name: nameInput.value.trim(),
            date: dateInput ? dateInput.value : '',
            startTime: startTimeInput ? startTimeInput.value : '',
            endTime: endTimeInput ? endTimeInput.value : '',
            description: descriptionInput ? descriptionInput.value.trim() : ''
        };
    }

    // Add a task
    addTask(taskData) {
        const task = {
            id: crypto.randomUUID(),
            name: taskData.name,
            date: taskData.date,
            startTime: taskData.startTime || '',
            endTime: taskData.endTime || '',
            description: taskData.description || '',
            priority: this.selectedPriority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
    }

    // Update a task
    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...taskData,
            priority: this.selectedPriority
        };

        this.saveTasks();
        this.renderTasks();
    }

    // Delete a task
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Toggle task completion
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Modal control
    openModal(taskId = null) {
        this.currentEditId = taskId;
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');

        if (!modal || !modalTitle || !form) {
            console.error('Required modal elements not found');
            return;
        }

        if (taskId) {
            modalTitle.textContent = 'Edit Task';
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.populateForm(task);
            } else {
                console.error('Task not found for editing');
                return;
            }
        } else {
            modalTitle.textContent = 'Add New Task';
            form.reset();
            this.initializeApp();
            this.setDefaultPriority();
        }

        modal.style.display = 'flex';
        document.getElementById('taskName')?.focus();
    }

    // Populate form with task data
    populateForm(task) {
        const nameInput = document.getElementById('taskName');
        const dateInput = document.getElementById('taskDate');
        const startTimeInput = document.getElementById('taskStartTime');
        const endTimeInput = document.getElementById('taskEndTime');
        const descriptionInput = document.getElementById('taskDescription');

        if (nameInput) nameInput.value = task.name;
        if (dateInput) dateInput.value = task.date;
        if (startTimeInput) startTimeInput.value = task.startTime || '';
        if (endTimeInput) endTimeInput.value = task.endTime || '';
        if (descriptionInput) descriptionInput.value = task.description || '';

        this.setPriority(task.priority);
    }

    // Set priority buttons
    setPriority(priority) {
        document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
        const priorityBtn = document.querySelector(`.priority-btn[data-priority="${priority}"]`);
        if (priorityBtn) {
            priorityBtn.classList.add('active');
            this.selectedPriority = priority;
        }
    }

    // Set default priority
    setDefaultPriority() {
        this.setPriority('medium');
    }

    // Close modal
    closeModal() {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
        this.currentEditId = null;
    }

    // Handle form submission
    handleSubmit(e) {
        e.preventDefault();
        
        try {
            if (!this.validateTimeInputs()) return;
            
            const formData = this.getFormData();
            this.validateTaskData(formData);

            if (this.currentEditId) {
                this.updateTask(this.currentEditId, formData);
            } else {
                this.addTask(formData);
            }

            this.closeModal();
        } catch (error) {
            alert(error.message);
        }
    }

    // Rendering methods
    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container || !emptyState) {
            console.error('Required container elements not found');
            return;
        }

        if (this.tasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        const tasksByDate = this.groupTasksByDate();
        container.innerHTML = '';

        Object.keys(tasksByDate).sort().forEach(date => {
            const dateSection = this.createDateSection(date, tasksByDate[date]);
            container.appendChild(dateSection);
        });
    }

    // Group tasks by date
    groupTasksByDate() {
        const groups = {};
        this.tasks.forEach(task => {
            if (!groups[task.date]) groups[task.date] = [];
            groups[task.date].push(task);
        });
        return groups;
    }

    // Create date section
    createDateSection(date, tasks) {
        const section = document.createElement('div');
        section.className = 'date-section';

        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';

        const dateLabel = document.createElement('span');
        dateLabel.className = 'date-label';
        dateLabel.textContent = this.formatDateDisplay(date);

        const taskCount = document.createElement('span');
        taskCount.className = 'task-count';
        taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

        dateHeader.appendChild(dateLabel);
        dateHeader.appendChild(taskCount);

        const taskList = document.createElement('div');
        taskList.className = 'task-list';

        const sortedTasks = tasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        sortedTasks.forEach(task => {
            taskList.appendChild(this.createTaskCard(task));
        });

        section.appendChild(dateHeader);
        section.appendChild(taskList);
        return section;
    }

    // Create task card
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.dataset.taskId = task.id;

        let timeDisplay = '';
        if (task.startTime && task.endTime) {
            timeDisplay = `${task.startTime} - ${task.endTime}`;
        } else if (task.startTime) {
            timeDisplay = `Starts at ${task.startTime}`;
        } else if (task.endTime) {
            timeDisplay = `Ends at ${task.endTime}`;
        }

        card.innerHTML = `
            <div class="task-header">
                <div class="task-name">${this.escapeHtml(task.name)}</div>
                <span class="priority-badge priority-${task.priority || 'medium'}">
                    ${(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                </span>
            </div>
            ${timeDisplay ? `<div class="task-time">${timeDisplay}</div>` : ''}
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-actions">
                <button class="btn-small btn-complete">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="btn-small btn-edit">Edit</button>
                <button class="btn-small btn-delete">Delete</button>
            </div>
        `;
        return card;
    }

    // Utility methods
    formatDateDisplay(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Data persistence
    loadTasks() {
        try {
            const stored = localStorage.getItem('pwa-todo-tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('pwa-todo-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    // Theme management
    toggleTheme() {
        const body = document.body;
        const toggleBtn = document.getElementById('themeToggle');

        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            if (toggleBtn) toggleBtn.textContent = '🌙';
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            if (toggleBtn) toggleBtn.textContent = '☀️';
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const toggleBtn = document.getElementById('themeToggle');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            if (toggleBtn) toggleBtn.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            if (toggleBtn) toggleBtn.textContent = '🌙';
        }
    }

    // Service Worker registration
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ToDoApp();
});
