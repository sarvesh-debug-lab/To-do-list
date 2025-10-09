class ToDoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.selectedPriority = 'medium';
        
        this.initializeApp();
        this.setupEventListeners();
        this.setupServiceWorker();
        this.renderTasks();
    }

    // Initialize the application
    initializeApp() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDate').min = today;
        document.getElementById('taskDate').value = today;
    }

    // Setup event listeners
    setupEventListeners() {
        // Modal controls
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Priority selector event listeners
        document.querySelectorAll('.priority-btn').forEach(selector => {
            selector.addEventListener('click', (e) => {
                document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedPriority = e.target.getAttribute('data-priority');
            });
        });
        
        // Close modal when clicking outside
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') this.closeModal();
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    // Add input validation
    validateTimeInputs() {
        const startTime = document.getElementById('taskStartTime').value;
        const endTime = document.getElementById('taskEndTime').value;
        
        if (startTime && endTime && startTime >= endTime) {
            alert('End time must be after start time');
            return false;
        }
        return true;
    }

    // Task management methods
    addTask(taskData) {
        const task = {
            id: Date.now().toString(),
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

    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...taskData,
                priority: this.selectedPriority
            };
            
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    // Modal management
    openModal(taskId = null) {
        this.currentEditId = taskId;
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');
        
        if (taskId) {
            // Edit mode
            modalTitle.textContent = 'Edit Task';
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('taskName').value = task.name;
                document.getElementById('taskDate').value = task.date;
                document.getElementById('taskStartTime').value = task.startTime || '';
                document.getElementById('taskEndTime').value = task.endTime || '';
                document.getElementById('taskDescription').value = task.description;
                
                // Set priority
                document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector(`.priority-btn.${task.priority}`).classList.add('active');
                this.selectedPriority = task.priority;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Task';
            form.reset();
            this.initializeApp(); // Reset to default values
            
            // Reset priority to medium
            document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.priority-btn.medium').classList.add('active');
            this.selectedPriority = 'medium';
        }
        
        modal.style.display = 'flex';
        document.getElementById('taskName').focus();
    }

    closeModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.currentEditId = null;
        document.getElementById('taskForm').reset();
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateTimeInputs()) return;
        
        const formData = {
            name: document.getElementById('taskName').value.trim(),
            date: document.getElementById('taskDate').value,
            startTime: document.getElementById('taskStartTime').value,
            endTime: document.getElementById('taskEndTime').value,
            description: document.getElementById('taskDescription').value.trim()
        };
        
        // Validation
        if (!formData.name) {
            alert('Please enter a task name');
            return;
        }

        if (this.currentEditId) {
            this.updateTask(this.currentEditId, formData);
        } else {
            this.addTask(formData);
        }
        
        this.closeModal();
    }

    // Rendering methods
    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (this.tasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        // Group tasks by date
        const tasksByDate = this.groupTasksByDate();
        container.innerHTML = '';
        
        Object.keys(tasksByDate).sort().forEach(date => {
            const dateSection = this.createDateSection(date, tasksByDate[date]);
            container.appendChild(dateSection);
        });
    }

    groupTasksByDate() {
        const groups = {};
        
        this.tasks.forEach(task => {
            if (!groups[task.date]) {
                groups[task.date] = [];
            }
            groups[task.date].push(task);
        });
        
        return groups;
    }

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
        
        // Sort tasks by priority (High > Medium > Low)
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

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        
        // Format time display
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
                <button class="btn-small btn-complete" onclick="app.toggleTaskCompletion('${task.id}')">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="btn-small btn-edit" onclick="app.openModal('${task.id}')">Edit</button>
                <button class="btn-small btn-delete" onclick="app.deleteTask('${task.id}')">Delete</button>
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
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    escapeHtml(unsafe) {
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
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            document.getElementById('themeToggle').textContent = '🌙';
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            document.getElementById('themeToggle').textContent = '🌙';
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
    app.loadTheme();
});
