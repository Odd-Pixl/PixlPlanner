<template>
  <div class="task-manager">
    <header class="header">
      <h1>Pixl Planner</h1>
      <p class="subtitle">Game Engine Development Tasks</p>
    </header>

    <div class="controls">
      <button @click="showAddForm = true" class="btn btn-primary">
        <span class="icon">+</span>
        Add Task
      </button>
      <div class="stats">
        <span class="stat">{{ tasks.length }} tasks</span>
        <span class="stat">{{ domains.length }} domains</span>
      </div>
    </div>

    <!-- Add Task Form -->
    <div v-if="showAddForm" class="modal-overlay" @click="showAddForm = false">
      <div class="modal" @click.stop>
        <h3>Add New Task</h3>
        <form @submit.prevent="handleAddTask">
          <div class="form-group">
            <label>Task Name</label>
            <input v-model="newTask.name" type="text" required />
          </div>
          <div class="form-group">
            <label>Domain</label>
            <select v-model="newTask.domain">
              <option v-for="domain in domains" :key="domain.id" :value="domain.id">
                {{ domain.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newTask.description" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Features</label>
            <div class="feature-selector">
              <label v-for="feature in features" :key="feature.id" class="checkbox-label">
                <input
                  type="checkbox"
                  :value="feature.id"
                  v-model="newTask.features"
                />
                {{ feature.name }}
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddForm = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Task</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Task List -->
    <div class="task-list">
      <draggable
        v-model="tasks"
        @end="handleReorder"
        item-key="id"
        class="drag-area"
        :animation="150"
        ghost-class="ghost"
      >
        <template #item="{ element: task }">
          <div class="task-card" :class="{ editing: editingTask === task.id }">
            <div class="task-header">
              <div class="task-info">
                <h3 class="task-name" @click="toggleEdit(task.id)">{{ task.name }}</h3>
                <span class="domain-badge" :class="`domain-${task.domain}`">
                  {{ getDomainById(task.domain)?.name || task.domain }}
                </span>
              </div>
              <div class="task-actions">
                <button @click="toggleEdit(task.id)" class="btn-icon" title="Edit">
                  ✏️
                </button>
                <button @click="handleRemoveTask(task.id)" class="btn-icon btn-danger" title="Delete">
                  🗑️
                </button>
                <span class="drag-handle">⋮⋮</span>
              </div>
            </div>

            <div v-if="editingTask === task.id" class="task-edit-form">
              <div class="form-group">
                <label>Name</label>
                <input v-model="task.name" type="text" />
              </div>
              <div class="form-group">
                <label>Domain</label>
                <select v-model="task.domain">
                  <option v-for="domain in domains" :key="domain.id" :value="domain.id">
                    {{ domain.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="task.description" rows="3"></textarea>
              </div>
              <div class="form-actions">
                <button @click="editingTask = null" class="btn btn-secondary">Done</button>
              </div>
            </div>

            <div v-else class="task-content">
              <p class="task-description">{{ task.description }}</p>

              <div v-if="task.features && task.features.length > 0" class="task-features">
                <span class="feature-tag" v-for="featureId in task.features" :key="featureId">
                  {{ getFeatureById(featureId)?.name || featureId }}
                </span>
              </div>

              <div v-if="task.dependsOn && task.dependsOn.length > 0" class="task-dependencies">
                <span class="dependencies-label">Depends on:</span>
                <span class="dependency" v-for="depId in task.dependsOn" :key="depId">
                  {{ tasks.find(t => t.id === depId)?.name || depId }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/project.js'
import draggable from 'vuedraggable'

const store = useProjectStore()

// Reactive references to store data
const { domains, features, tasks } = store
const { getDomainById, getFeatureById, removeTask } = store

// Local state
const showAddForm = ref(false)
const editingTask = ref(null)
const newTask = ref({
  name: '',
  domain: 'runtime',
  description: '',
  features: []
})

// Methods
function handleAddTask() {
  store.addTask({ ...newTask.value })
  newTask.value = {
    name: '',
    domain: 'runtime',
    description: '',
    features: []
  }
  showAddForm.value = false
}

function handleReorder() {
  store.reorderTasks(tasks.value)
}

function toggleEdit(taskId) {
  editingTask.value = editingTask.value === taskId ? null : taskId
}

function handleRemoveTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    removeTask(taskId)
  }
}
</script>

<style scoped>
.task-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0.5rem 0 0 0;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat {
  color: #666;
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007AFF;
  color: white;
}

.btn-primary:hover {
  background: #0056CC;
}

.btn-secondary {
  background: #F2F2F2;
  color: #333;
}

.btn-secondary:hover {
  background: #E5E5E5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.feature-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 2px solid #E5E5E5;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.task-list {
  min-height: 200px;
}

.task-card {
  background: white;
  border: 2px solid #F0F0F0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.task-card:hover {
  border-color: #D0D0D0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-card.editing {
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-info {
  flex: 1;
}

.task-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.domain-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #F2F2F2;
  color: #666;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.domain-editor { background: #E8F4FD; color: #0066CC; }
.domain-runtime { background: #FFF2E8; color: #CC4400; }
.domain-interaction { background: #F0FFF4; color: #00AA22; }
.domain-persistence { background: #FFF0F5; color: #AA0055; }
.domain-compilation { background: #F5F0FF; color: #6600AA; }
.domain-tooling { background: #FFFACD; color: #B8860B; }

.task-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #F0F0F0;
}

.btn-danger:hover {
  background: #FFE5E5;
}

.drag-handle {
  color: #999;
  cursor: grab;
  font-weight: bold;
}

.drag-handle:active {
  cursor: grabbing;
}

.task-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.task-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feature-tag {
  background: #E8F4FD;
  color: #0066CC;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.task-dependencies {
  border-top: 1px solid #E5E5E5;
  padding-top: 1rem;
}

.dependencies-label {
  font-weight: 500;
  color: #666;
  margin-right: 0.5rem;
}

.dependency {
  display: inline-block;
  background: #F8F8F8;
  color: #666;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.25rem;
}

.ghost {
  opacity: 0.5;
  transform: rotate(5deg);
}

.task-edit-form {
  border-top: 2px solid #E5E5E5;
  padding-top: 1rem;
  margin-top: 1rem;
}
</style>
