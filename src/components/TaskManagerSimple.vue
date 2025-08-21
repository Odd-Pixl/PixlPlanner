<template>
  <div class="task-manager">
    <header class="header">
      <h1>Pixl Planner</h1>
      <p class="subtitle">Game Engine Development Tasks</p>
    </header>

    <div class="controls">
      <div class="control-group">
        <button @click="showAddForm = true" class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Task
        </button>
        <button @click="showPhaseForm = true" class="btn btn-secondary">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          Manage Phases
        </button>
      </div>
      <div class="stats">
        <div class="stat-item">
          <span class="stat-number">{{ completedTasks }}</span>
          <span class="stat-label">completed</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ store.tasks.length }}</span>
          <span class="stat-label">total tasks</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ store.phases.length }}</span>
          <span class="stat-label">phases</span>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
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
              <option v-for="domain in store.domains" :key="domain.id" :value="domain.id">
                {{ domain.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newTask.description" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddForm = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Task</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Phase Management Modal -->
    <div v-if="showPhaseForm" class="modal-overlay" @click="showPhaseForm = false">
      <div class="modal phase-modal" @click.stop>
        <h3>Manage Phases</h3>

        <div class="form-group">
          <button @click="showAddPhaseForm = true" class="btn btn-primary btn-small">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Phase
          </button>
        </div>

        <!-- Add Phase Form -->
        <div v-if="showAddPhaseForm" class="add-phase-form">
          <div class="form-group">
            <label>Phase Name</label>
            <input v-model="newPhase.name" type="text" placeholder="Enter phase name" />
          </div>
          <div class="form-group">
            <label>Goal</label>
            <input v-model="newPhase.goal" type="text" placeholder="Phase goal or milestone" />
          </div>
          <div class="form-actions">
            <button @click="showAddPhaseForm = false" class="btn btn-secondary btn-small">Cancel</button>
            <button @click="handleAddPhase" class="btn btn-primary btn-small">Add Phase</button>
          </div>
        </div>

        <!-- Phase List -->
        <div class="phase-list">
          <div v-for="phase in store.phases" :key="phase.id" class="phase-item">
            <div class="phase-header">
              <span class="drag-handle">⋮⋮</span>
              <div class="phase-info">
                <h4>{{ phase.name }}</h4>
                <p>{{ phase.goal }}</p>
                <span class="task-count">{{ (phase.tasks || []).length }} tasks</span>
              </div>
              <button @click="handleRemovePhase(phase.id)" class="btn-icon btn-danger" title="Delete Phase">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="showPhaseForm = false" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Task List Grouped by Phases -->
    <div class="phases-container">
      <div v-for="(phaseTasks, phaseId) in tasksByPhase" :key="phaseId" class="phase-group">
        <div class="phase-title">
          <h2>{{ getPhaseTitle(phaseId) }}</h2>
          <span class="phase-progress">
            {{ getPhaseCompletedTasks(phaseTasks) }} / {{ phaseTasks.length }} completed
          </span>
        </div>
        <div class="task-list">
          <draggable
            :list="phaseTasks"
            @end="handleReorder"
            item-key="id"
            class="drag-area"
            :animation="200"
            ghost-class="ghost-task"
            chosen-class="chosen-task"
            handle=".drag-handle"
          >
            <template #item="{ element: task }">
              <div class="task-item" :class="{ completed: task.completed, editing: editingTask === task.id }">
                <div class="task-row">
                  <!-- Drag Handle -->
                  <div class="drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                    </svg>
                  </div>

                  <!-- Completion Checkbox -->
                  <label class="checkbox-container">
                    <input
                      type="checkbox"
                      v-model="task.completed"
                      @change="updateTaskCompletion(task.id, $event.target.checked)"
                    />
                    <span class="checkmark"></span>
                  </label>

                  <!-- Task Content -->
                  <div class="task-content" @click="toggleEdit(task.id)">
                    <div class="task-header">
                      <h3 class="task-name" :class="{ completed: task.completed }">
                        {{ task.name }}
                      </h3>
                      <div class="task-meta">
                        <span class="domain-badge" :class="`domain-${task.domain}`">
                          {{ store.getDomainById(task.domain)?.name || task.domain }}
                        </span>
                      </div>
                    </div>
                    <p class="task-description" v-if="task.description">
                      {{ task.description }}
                    </p>
                    <div v-if="task.features && task.features.length > 0" class="task-features">
                      <span class="feature-tag" v-for="featureId in task.features" :key="featureId">
                        {{ store.getFeatureById(featureId)?.name || featureId }}
                      </span>
                    </div>
                    <div v-if="task.dependsOn && task.dependsOn.length > 0" class="task-dependencies">
                      <span class="dependencies-label">Depends on:</span>
                      <span class="dependency" v-for="depId in task.dependsOn" :key="depId">
                        {{ store.tasks.find(t => t.id === depId)?.name || depId }}
                      </span>
                    </div>
                  </div>

                  <!-- Task Actions -->
                  <div class="task-actions">
                    <button @click="toggleEdit(task.id)" class="btn-icon" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click="handleRemoveTask(task.id)" class="btn-icon btn-danger" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Inline Edit Form -->
                <div v-if="editingTask === task.id" class="edit-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Task Name</label>
                      <input v-model="task.name" type="text" />
                    </div>
                    <div class="form-group">
                      <label>Domain</label>
                      <select v-model="task.domain">
                        <option v-for="domain in store.domains" :key="domain.id" :value="domain.id">
                          {{ domain.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Description</label>
                    <textarea v-model="task.description" rows="3"></textarea>
                  </div>
                  <div class="form-actions">
                    <button @click="editingTask = null" class="btn btn-secondary">Done</button>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/project-simple.js'
import draggable from 'vuedraggable'

const store = useProjectStore()

// Local state
const showAddForm = ref(false)
const showPhaseForm = ref(false)
const showAddPhaseForm = ref(false)
const editingTask = ref(null)
const newTask = ref({
  name: '',
  domain: 'runtime',
  description: '',
  features: []
})
const newPhase = ref({
  name: '',
  goal: ''
})

// Computed properties
const completedTasks = computed(() => {
  return store.tasks.filter(task => task.completed).length
})

const progressPercent = computed(() => {
  if (store.tasks.length === 0) return 0
  return (completedTasks.value / store.tasks.length) * 100
})

const tasksByPhase = computed(() => {
  return store.getTasksByPhase()
})

// Helper functions for getting tasks
function getTasksForPhase(phaseId) {
  const phase = store.getPhaseById(phaseId)
  if (!phase || !phase.tasks) return []
  return store.tasks.filter(task => phase.tasks.includes(task.id))
}

function getUnassignedTasks() {
  const assignedTaskIds = store.phases.flatMap(phase => phase.tasks || [])
  return store.tasks.filter(task => !assignedTaskIds.includes(task.id))
}

// Methods
function handleAddTask() {
  console.log('Adding task:', newTask.value)
  store.addTask({ ...newTask.value })
  newTask.value = {
    name: '',
    domain: 'runtime',
    description: '',
    features: []
  }
  showAddForm.value = false
}

function handleRemoveTask(taskId) {
  console.log('Removing task:', taskId)
  if (confirm('Are you sure you want to delete this task?')) {
    store.removeTask(taskId)
  }
}

function handleReorder() {
  console.log('Tasks reordered')
}

function toggleEdit(taskId) {
  editingTask.value = editingTask.value === taskId ? null : taskId
}

function updateTaskCompletion(taskId, completed) {
  console.log('Updating task completion:', taskId, completed)
  store.updateTask(taskId, { completed })
}

// Phase management methods
function handleAddPhase() {
  if (newPhase.value.name.trim()) {
    store.addPhase({ ...newPhase.value })
    newPhase.value = { name: '', goal: '' }
    showAddPhaseForm.value = false
  }
}

function handleRemovePhase(phaseId) {
  const phase = store.getPhaseById(phaseId)
  if (!phase) return

  const hasTasksInPhase = phase.tasks && phase.tasks.length > 0

  if (hasTasksInPhase) {
    // Show options to move tasks
    const otherPhases = store.phases.filter(p => p.id !== phaseId)
    if (otherPhases.length === 0) {
      alert('Cannot delete the last phase with tasks. Create another phase first.')
      return
    }

    const phaseNames = otherPhases.map(p => p.name).join('\n')
    const choice = prompt(`This phase has ${phase.tasks.length} tasks. Move them to which phase?\n\nAvailable phases:\n${phaseNames}\n\nEnter the exact phase name:`)

    if (choice) {
      const targetPhase = otherPhases.find(p => p.name === choice)
      if (targetPhase) {
        store.removePhase(phaseId, targetPhase.id)
      } else {
        alert('Phase not found. Please enter the exact phase name.')
        return
      }
    } else {
      return // User cancelled
    }
  } else {
    if (confirm(`Are you sure you want to delete the phase "${phase.name}"?`)) {
      store.removePhase(phaseId)
    }
  }
}

function handlePhaseReorder() {
  console.log('Phases reordered')
}

function getPhaseCompletedTasks(tasks) {
  return tasks.filter(task => task.completed).length
}
</script>

<style scoped>
/* Ensure page background matches app (handles Safari safe areas) */
:global(html), :global(body) {
  background-color: #fafafa !important;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  min-height: 100dvh;
}
@media (prefers-color-scheme: dark) {
  :global(html), :global(body) { background-color: #0f0f0f !important; }
}

.task-manager {
  max-width: 1000px;
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

.control-group {
  display: flex;
  gap: 1rem;
}

.stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #007AFF;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #E8E8E8;
  border-radius: 4px;
  overflow: hidden;
  max-width: 300px;
}

.progress-fill {
  height: 100%;
  background: #007AFF;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  min-width: 80px;
  text-align: right;
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

.btn .icon {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: #007AFF;
  color: white;
}

.btn-primary:hover {
  background: #0056CC;
  transform: translateY(-1px);
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
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Phase Management Styles */
.phase-modal {
  max-width: 600px;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.add-phase-form {
  background: #F8F9FA;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid #E9ECEF;
}

.phase-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 1rem 0;
}

.phase-item {
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.phase-item:hover {
  border-color: #D0D0D0;
}

.phase-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 1rem;
}

.phase-info {
  flex: 1;
}

.phase-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.phase-info p {
  margin: 0 0 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
}

.task-count {
  font-size: 0.8rem;
  color: #999;
}

.ghost-phase {
  opacity: 0.5;
}

/* Phase Groups */
.phases-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.phase-group {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.phase-title {
  background: #F8F9FA;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E5E5E5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phase-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.phase-progress {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.task-list {
  min-height: 50px;
}

.task-item {
  border-bottom: 1px solid #F0F0F0;
  transition: all 0.2s;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background: transparent;
}



.task-row {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  gap: 1rem;
}

.drag-handle {
  width: 20px;
  height: 20px;
  color: #CCC;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
}

.drag-handle:hover {
  color: #999;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle svg {
  width: 16px;
  height: 16px;
}

.checkbox-container {
  position: relative;
  cursor: pointer;
  margin-top: 0.25rem;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 1px solid #DDD;
  border-radius: 4px;
  display: block;
  transition: all 0.2s;
}

.checkbox-container:hover .checkmark {
  border-color: #007AFF;
}

/* Fix checkbox styling */
.checkbox-container input:checked ~ .checkmark {
  background-color: #007AFF;
  border-color: #007AFF;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.task-content {
  flex: 1;
  cursor: pointer;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.task-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.domain-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.domain-editor { background: rgba(0, 102, 204, 0.1); color: #0066CC; }
.domain-runtime { background: rgba(204, 68, 0, 0.1); color: #CC4400; }
.domain-interaction { background: rgba(0, 170, 34, 0.1); color: #00AA22; }
.domain-persistence { background: rgba(170, 0, 85, 0.1); color: #AA0055; }
.domain-compilation { background: rgba(102, 0, 170, 0.1); color: #6600AA; }
.domain-tooling { background: rgba(184, 134, 11, 0.1); color: #B8860B; }

.task-description {
  color: #666;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.task-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.feature-tag {
  background: #F8F9FA;
  color: #495057;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #E9ECEF;
}

.task-dependencies {
  font-size: 0.85rem;
  color: #666;
}

.dependencies-label {
  font-weight: 500;
  margin-right: 0.5rem;
}

.dependency {
  display: inline-block;
  background: #F8F8F8;
  color: #666;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  margin-right: 0.4rem;
  margin-bottom: 0.2rem;
  font-size: 0.75rem;
}

.task-actions {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-icon:hover {
  background: #F0F0F0;
  color: #333;
}

.btn-danger:hover {
  background: #FFE5E5;
  color: #CC0000;
}

.edit-form {
  padding: 1.5rem;
  background: #FAFAFA;
  border-top: 1px solid #E5E5E5;
  margin: -1.5rem -1.5rem 0 -1.5rem;
}

.ghost-task {
  opacity: 0.5;
  transform: rotate(2deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.chosen-task {
  transform: scale(1.02);
}

/* Empty state */
.task-list:empty::after {
  content: "No tasks yet. Add your first task to get started!";
  display: block;
  text-align: center;
  color: #999;
  padding: 3rem;
  font-style: italic;
}
@media (prefers-color-scheme: dark) {
  /* Define per-component accent color in dark mode */
  .task-manager { --accent-color: #007AFF; }

  /* Restore primary text color to white in dark mode */
  .task-manager { color: #fff; }
  .header h1,
  .phase-title h2,
  .task-name,
  .modal h3 { color: #fff; }

  /* Use accent for primary button + checkbox in dark mode only */
  .btn-primary { background: var(--accent-color); }
  .checkbox-container input:checked ~ .checkmark {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
  }
}

</style>
