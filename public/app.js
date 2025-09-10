const { createApp } = Vue;

createApp({
    data() {
        return {
            showModal: false,
            isLoading: false,
            isCreating: false,
            isTesting: false,
            isDeletingTask: null,
            tasks: [],
            taskForm: {
                title: '',
                body: '',
                scheduledTime: '',
                sound: '',
                deviceKey: '',
                group: ''
            },
            toasts: []
        };
    },
    
    mounted() {
        this.loadTasks();
        this.initializeForm();
    },

    methods: {
        initializeForm() {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            this.taskForm.scheduledTime = now.toISOString().slice(0, 16);
        },

        openModal() {
            this.showModal = true;
            this.initializeForm();
        },

        closeModal() {
            this.showModal = false;
            this.resetForm();
        },

        resetForm() {
            this.taskForm = {
                title: '',
                body: '',
                scheduledTime: '',
                sound: '',
                deviceKey: '',
                group: ''
            };
            this.initializeForm();
        },

        async loadTasks() {
            this.isLoading = true;
            try {
                const response = await fetch('/api/tasks');
                this.tasks = await response.json();
            } catch (error) {
                console.error('加载任务失败:', error);
                this.showToast('加载任务失败: ' + error.message, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async handleCreateTask() {
            this.isCreating = true;
            
            const taskData = {
                title: this.taskForm.title,
                body: this.taskForm.body,
                scheduledTime: new Date(this.taskForm.scheduledTime).getTime(),
                sound: this.taskForm.sound || undefined,
                deviceKey: this.taskForm.deviceKey || undefined,
                group: this.taskForm.group || undefined
            };
            
            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskData)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '创建任务失败');
                }
                
                this.closeModal();
                this.loadTasks();
                this.showToast('任务创建成功！', 'success');
                
            } catch (error) {
                console.error('创建任务失败:', error);
                this.showToast('创建任务失败: ' + error.message, 'error');
            } finally {
                this.isCreating = false;
            }
        },

        async deleteTask(taskId) {
            if (!confirm('确定要删除这个任务吗？')) {
                return;
            }
            
            this.isDeletingTask = taskId;
            try {
                const response = await fetch('/api/tasks/' + taskId, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('删除任务失败');
                }
                
                this.loadTasks();
                this.showToast('任务删除成功！', 'success');
                
            } catch (error) {
                console.error('删除任务失败:', error);
                this.showToast('删除任务失败: ' + error.message, 'error');
            } finally {
                this.isDeletingTask = null;
            }
        },

        async sendTestPush() {
            this.isTesting = true;
            try {
                const response = await fetch('/api/test', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showToast('测试推送发送成功！', 'success');
                } else {
                    this.showToast('测试推送发送失败', 'error');
                }
                
            } catch (error) {
                console.error('发送测试推送失败:', error);
                this.showToast('发送测试推送失败: ' + error.message, 'error');
            } finally {
                this.isTesting = false;
            }
        },

        formatDateTime(timestamp) {
            return new Date(timestamp).toLocaleString('zh-CN');
        },

        getStatusText(status) {
            const statusMap = {
                'pending': '待发送',
                'sent': '已发送',
                'failed': '发送失败'
            };
            return statusMap[status] || status;
        },

        // Toast methods
        showToast(message, type = 'info', duration = 3000) {
            const id = Date.now() + Math.random();
            const toast = {
                id,
                message,
                type,
                show: false
            };
            
            this.toasts.push(toast);
            
            // Trigger show animation
            setTimeout(() => {
                const toastIndex = this.toasts.findIndex(t => t.id === id);
                if (toastIndex >= 0) {
                    this.toasts[toastIndex].show = true;
                }
            }, 100);
            
            // Auto hide
            if (duration > 0) {
                setTimeout(() => {
                    this.hideToast(id);
                }, duration);
            }
            
            return id;
        },

        hideToast(id) {
            const toastIndex = this.toasts.findIndex(t => t.id === id);
            if (toastIndex >= 0) {
                this.toasts[toastIndex].show = false;
                // Remove from DOM after animation
                setTimeout(() => {
                    this.toasts = this.toasts.filter(t => t.id !== id);
                }, 300);
            }
        },

        getToastIcon(type) {
            const icons = {
                success: '✓',
                error: '✕',
                warning: '!',
                info: 'i'
            };
            return icons[type] || icons.info;
        }
    }
}).mount('#app');