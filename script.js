// js/script.js
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingTodo = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateDeleteAllButton();
    }

    bindEvents() {
        // Form elements
        const todoInput = document.getElementById('todoInput');
        const dateInput = document.getElementById('dateInput');
        const addBtn = document.getElementById('addBtn');
        const filterSelect = document.getElementById('filterSelect');
        const deleteAllBtn = document.getElementById('deleteAllBtn');

        // Modal elements
        const confirmModal = document.getElementById('confirmModal');
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');

        // Set default date to today
        dateInput.value = new Date().toISOString().split('T')[0];

        // Add todo events
        addBtn.addEventListener('click', () => this.handleAddTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTodo();
        });

        // Filter event
        filterSelect.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.render();
        });

        // Delete all event
        deleteAllBtn.addEventListener('click', () => {
            this.showConfirmModal('Are you sure you want to delete all tasks?', () => {
                this.deleteAllTodos();
            });
        });

        // Modal events
        confirmNo.addEventListener('click', () => this.hideConfirmModal());
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) this.hideConfirmModal();
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideConfirmModal();
        });
    }

    validateForm() {
        const todoInput = document.getElementById('todoInput');
        const dateInput = document.getElementById('dateInput');
        const errorMessage = document.getElementById('errorMessage');

        let errors = [];

        // Validate task input
        if (!todoInput.value.trim()) {
            errors.push('Task is required');
        } else if (todoInput.value.trim().length < 3) {
            errors.push('Task must be at least 3 characters long');
        }

        // Validate date input
        if (!dateInput.value) {
            errors.push('Due date is required');
        } else {
            const selectedDate = new Date(dateInput.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                errors.push('Due date cannot be in the past');
            }
        }

        // Show error message
        if (errors.length > 0) {
            errorMessage.textContent = errors[0];
            errorMessage.style.display = 'block';
            return false;
        } else {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
            return true;
        }
    }

    handleAddTodo() {
        if (!this.validateForm()) {
            return;
        }

        const todoInput = document.getElementById('todoInput');
        const dateInput = document.getElementById('dateInput');

        if (this.editingTodo) {
            // Update existing todo
            const todo = this.todos.find(t => t.id === this.editingTodo);
            if (todo) {
                todo.text = todoInput.value.trim();
                todo.dueDate = dateInput.value;
                todo.updatedAt = new Date().toISOString();
            }
            this.editingTodo = null;
            document.getElementById('addBtn').textContent = '+';
        } else {
            // Add new todo
            const newTodo = {
                id: Date.now(),
                text: todoInput.value.trim(),
                dueDate: dateInput.value,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.todos.unshift(newTodo);
        }

        // Clear form
        todoInput.value = '';
        dateInput.value = new Date().toISOString().split('T')[0];

        this.saveTodos();
        this.render();
        this.updateDeleteAllButton();
        this.clearErrorMessage();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const todoInput = document.getElementById('todoInput');
            const dateInput = document.getElementById('dateInput');
            
            todoInput.value = todo.text;
            dateInput.value = todo.dueDate;
            
            this.editingTodo = id;
            document.getElementById('addBtn').textContent = '✓';
            
            todoInput.focus();
        }
    }

    deleteTodo(id) {
        this.showConfirmModal('Are you sure you want to delete this task?', () => {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.render();
            this.updateDeleteAllButton();
            
            // Cancel editing if the edited todo is deleted
            if (this.editingTodo === id) {
                this.cancelEdit();
            }
        });
    }

    deleteAllTodos() {
        this.todos = [];
        this.saveTodos();
        this.render();
        this.updateDeleteAllButton();
        this.cancelEdit();
    }

    cancelEdit() {
        this.editingTodo = null;
        document.getElementById('todoInput').value = '';
        document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
        document.getElementById('addBtn').textContent = '+';
        this.clearErrorMessage();
    }

    getFilteredTodos() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(t => t.completed);
            case 'pending':
                return this.todos.filter(t => !t.completed);
            case 'today':
                return this.todos.filter(t => {
                    const dueDate = new Date(t.dueDate);
                    return dueDate.getTime() === today.getTime();
                });
            case 'overdue':
                return this.todos.filter(t => {
                    const dueDate = new Date(t.dueDate);
                    return !t.completed && dueDate < today;
                });
            default:
                return this.todos;
        }
    }

    getTaskStatus(todo) {
        if (todo.completed) {
            return { text: 'Completed', class: 'status-completed' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(todo.dueDate);

        if (dueDate < today) {
            return { text: 'Overdue', class: 'status-overdue' };
        } else {
            return { text: 'Pending', class: 'status-pending' };
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }

    render() {
        const tableBody = document.getElementById('todoTableBody');
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            tableBody.innerHTML = `
                <div class="no-tasks">
                    <p>No task found</p>
                </div>
            `;
            return;
        }

        tableBody.innerHTML = filteredTodos.map(todo => {
            const status = this.getTaskStatus(todo);
            return `
                <div class="todo-row ${todo.completed ? 'completed' : ''}">
                    <div class="task-cell">
                        <div class="task-checkbox ${todo.completed ? 'checked' : ''}" 
                             onclick="app.toggleTodo(${todo.id})"></div>
                        <span class="task-text">${this.escapeHtml(todo.text)}</span>
                    </div>
                    <div class="date-cell">
                        ${this.formatDate(todo.dueDate)}
                    </div>
                    <div class="status-cell">
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </div>
                    <div class="actions-cell">
                        <button class="action-btn edit-btn" onclick="app.editTodo(${todo.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" onclick="app.deleteTodo(${todo.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateDeleteAllButton() {
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        deleteAllBtn.disabled = this.todos.length === 0;
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmYes = document.getElementById('confirmYes');

        confirmMessage.textContent = message;
        modal.style.display = 'block';

        // Remove existing event listeners
        const newConfirmYes = confirmYes.cloneNode(true);
        confirmYes.parentNode.replaceChild(newConfirmYes, confirmYes);

        // Add new event listener
        newConfirmYes.addEventListener('click', () => {
            onConfirm();
            this.hideConfirmModal();
        });
    }

    hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.style.display = 'none';
    }

    clearErrorMessage() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new TodoApp();