class Task {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description || '';
        this.completed = data.completed || false;
        this.priority = data.priority || 'medium';
        this.userId = data.userId;
        this.createdAt = data.createdAt;
        this.startDate = data.startDate || null;
        this.endDate = data.endDate || null;
        this.category = data.category || null;
        this.tag = data.tag || null; 
    }

    validate() {
        const errors = [];
        if (!this.title?.trim()) errors.push('Título é obrigatório');
        if (!this.userId) errors.push('Usuário é obrigatório');
        return { isValid: errors.length === 0, errors };
    }

    toJSON() {
        return { ...this };
    }
}

module.exports = Task;