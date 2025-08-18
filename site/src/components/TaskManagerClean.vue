<template>
  <div class="task-manager">
    <header class="header">
      <h1>Pixl Planner</h1>
      <p class="subtitle">Game Engine Development Tasks</p>
    </header>

    <div class="controls">
      <div class="control-group">
        <button @click="showAddForm = true" class="btn btn-primary btn-icon-only" title="Add Task">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        <button @click="showPhaseForm = true" class="btn btn-secondary btn-icon-only" title="Manage Phases">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </button>
        <button @click="handleResetData" class="btn btn-warning btn-icon-only" title="Reset all data to defaults">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
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
      <span class="progress-text">{{ Math.round(progressPercent) }}% Complete</span>
    </div>

    <!-- Add Task Form Modal -->
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
        <div class="modal-header">
          <h3>Manage Phases</h3>
          <button @click="showAddPhaseForm = true" class="btn btn-primary btn-small" title="Add Phase">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <!-- Add Phase Form -->
        <div v-if="showAddPhaseForm" class="add-phase-form">
          <div class="form-row">
            <input v-model="newPhase.name" type="text" placeholder="Phase name" class="phase-name-input" />
            <input v-model="newPhase.goal" type="text" placeholder="Goal or milestone" class="phase-goal-input" />
            <button @click="handleAddPhase" class="btn btn-primary btn-small">Add</button>
            <button @click="showAddPhaseForm = false" class="btn btn-secondary btn-small">Cancel</button>
          </div>
        </div>

        <!-- Compact Phase List -->
        <div class="phase-list-compact">
          <draggable
            v-model="store.phases"
            item-key="id"
            handle=".drag-handle"
            @end="handlePhaseReorder"
            animation="150"
            class="phase-draggable-list"
          >
            <template #item="{ element: phase }">
              <div class="phase-item-compact" :class="{ editing: editingPhase === phase.id }">
                <!-- Compact Phase Row -->
                <div class="phase-row" @click="togglePhaseEdit(phase.id)">
                  <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                  <div class="phase-info-compact">
                    <span class="phase-name-compact">{{ phase.name }}</span>
                    <span class="phase-goal-compact">{{ phase.goal }}</span>
                    <span class="task-count-compact">{{ (phase.tasks || []).length }} tasks</span>
                  </div>
                  <div class="phase-actions">
                    <button @click.stop="togglePhaseEdit(phase.id)" class="btn-icon btn-small" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click.stop="handleRemovePhase(phase.id)" class="btn-icon btn-danger btn-small" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Inline Edit Form -->
                <div v-if="editingPhase === phase.id" class="phase-edit-form">
                  <div class="form-group">
                    <label>Phase Name</label>
                    <input v-model="phase.name" type="text" />
                  </div>
                  <div class="form-group">
                    <label>Goal</label>
                    <input v-model="phase.goal" type="text" />
                  </div>
                  <div class="form-actions">
                    <button @click="editingPhase = null" class="btn btn-secondary btn-small">Done</button>
                  </div>
                </div>
              </div>
            </template>
          </draggable>
        </div>

        <div class="form-actions">
          <button @click="showPhaseForm = false" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Dependencies Management Modal -->
    <div v-if="showDependencyForm && editingDependencies" class="modal-overlay" @click="showDependencyForm = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Dependencies</h3>
          <p class="modal-subtitle">Select which tasks "{{ editingDependencies.name }}" depends on</p>
        </div>

        <div class="dependency-list">
          <div v-for="task in availableTasksForDependencies" :key="task.id" class="dependency-item">
            <label class="checkbox-container">
              <input
                type="checkbox"
                :checked="editingDependencies.dependsOn && editingDependencies.dependsOn.includes(task.id)"
                @change="toggleDependency(task.id, $event.target.checked)"
              />
              <span class="checkmark"></span>
            </label>
            <div class="dependency-info">
              <span class="dependency-name">{{ task.name }}</span>
              <span class="domain-badge" :class="`domain-${task.domain}`">
                {{ store.getDomainById(task.domain)?.name || task.domain }}
              </span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="showDependencyForm = false" class="btn btn-secondary">Done</button>
        </div>
      </div>
    </div>

    <!-- Task List Grouped by Phases -->
    <div class="phases-container">
      <!-- Render each phase -->
      <div v-for="phase in store.phases" :key="phase.id" class="phase-group">
        <div class="phase-title">
          <div class="phase-title-content">
            <h2>{{ phase.name }}</h2>
            <span class="phase-goal-tag">{{ phase.goal }}</span>
          </div>
          <span class="phase-progress">
            {{ getPhaseCompletedTasks(getTasksForPhase(phase.id)) }} / {{ getTasksForPhase(phase.id).length }} completed
          </span>
        </div>

        <div class="task-list">
          <draggable
            :list="getTasksForPhase(phase.id)"
            item-key="id"
            handle=".task-drag-handle"
            @end="(evt) => handleTaskReorder(phase.id, evt)"
            animation="150"
            class="task-draggable-list"
            group="tasks"
          >
            <template #item="{ element: task }">
              <div class="task-item" :class="{ completed: task.completed, editing: editingTask === task.id }">
                <div class="task-row">
                  <!-- Drag Handle -->
                  <span class="task-drag-handle drag-handle" title="Drag to reorder">⋮⋮</span>

                  <!-- Completion Checkbox -->
                  <label class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="task.completed"
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
                    <button @click="editTaskDependencies(task)" class="btn-icon" title="Edit Dependencies">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
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

      <!-- Unassigned Tasks -->
      <div v-if="getUnassignedTasks().length > 0" class="phase-group">
        <div class="phase-title">
          <div class="phase-title-content">
            <h2>Unassigned Tasks</h2>
          </div>
          <span class="phase-progress">
            {{ getPhaseCompletedTasks(getUnassignedTasks()) }} / {{ getUnassignedTasks().length }} completed
          </span>
        </div>

        <div class="task-list">
          <draggable
            :list="getUnassignedTasks()"
            item-key="id"
            handle=".task-drag-handle"
            @end="handleUnassignedTaskReorder"
            animation="150"
            class="task-draggable-list"
            group="tasks"
          >
            <template #item="{ element: task }">
              <div class="task-item" :class="{ completed: task.completed, editing: editingTask === task.id }">
                <div class="task-row">
                  <!-- Drag Handle -->
                  <span class="task-drag-handle drag-handle" title="Drag to reorder">⋮⋮</span>

                  <label class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="task.completed"
                      @change="updateTaskCompletion(task.id, $event.target.checked)"
                    />
                    <span class="checkmark"></span>
                  </label>

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
                  </div>

                  <div class="task-actions">
                    <button @click="toggleEdit(task.id)" class="btn-icon" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click="editTaskDependencies(task)" class="btn-icon" title="Edit Dependencies">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <button @click="handleRemoveTask(task.id)" class="btn-icon btn-danger" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
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
const showDependencyForm = ref(false)
const editingTask = ref(null)
const editingPhase = ref(null)
const editingDependencies = ref(null)
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

// Computed property for available tasks for dependencies
const availableTasksForDependencies = computed(() => {
  if (!editingDependencies.value) return []
  return store.tasks.filter(task => task.id !== editingDependencies.value.id)
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

function getPhaseCompletedTasks(tasks) {
  return tasks.filter(task => task.completed).length
}

// Methods
function handleAddTask() {
  if (newTask.value.name.trim()) {
    store.addTask({ ...newTask.value })
    newTask.value = {
      name: '',
      domain: 'runtime',
      description: '',
      features: []
    }
    showAddForm.value = false
  }
}

function handleRemoveTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    store.removeTask(taskId)
  }
}

function toggleEdit(taskId) {
  editingTask.value = editingTask.value === taskId ? null : taskId
}

function togglePhaseEdit(phaseId) {
  editingPhase.value = editingPhase.value === phaseId ? null : phaseId
}

function updateTaskCompletion(taskId, completed) {
  store.updateTask(taskId, { completed })
}

function handleResetData() {
  if (confirm('Are you sure you want to reset all data to defaults? This will remove all your progress and custom tasks/phases.')) {
    store.resetToDefaults()
  }
}

function editTaskDependencies(task) {
  editingDependencies.value = { ...task }
  showDependencyForm.value = true
}

function toggleDependency(taskId, isChecked) {
  if (!editingDependencies.value) return

  const currentDeps = editingDependencies.value.dependsOn || []
  let newDeps

  if (isChecked) {
    newDeps = [...currentDeps, taskId]
  } else {
    newDeps = currentDeps.filter(id => id !== taskId)
  }

  editingDependencies.value.dependsOn = newDeps
  store.updateTask(editingDependencies.value.id, { dependsOn: newDeps })
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
  // The v-model on draggable automatically updates store.phases
  // This function is called after reordering is complete
  console.log('Phases reordered')
}

function handleTaskReorder(phaseId, evt) {
  // Update the phase's task list to reflect the new order
  const phase = store.getPhaseById(phaseId)
  if (!phase || !phase.tasks) return

  const tasksInPhase = getTasksForPhase(phaseId)
  const newTaskOrder = tasksInPhase.map(task => task.id)

  store.updatePhase(phaseId, { tasks: newTaskOrder })
  console.log('Tasks reordered in phase:', phaseId, newTaskOrder)
}

function handleUnassignedTaskReorder() {
  // For unassigned tasks, we don't need to update phase task lists
  // The drag reorder already updated the tasks array order
  console.log('Unassigned tasks reordered')
}
</script>

<style scoped>
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
  gap: 1rem;
  margin-bottom: 2rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #E5E5E5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007AFF, #0056CC);
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

.btn-warning {
  background: #FF9500;
  color: white;
}

.btn-warning:hover {
  background: #E6850E;
  transform: translateY(-1px);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-icon-only {
  padding: 0.75rem;
  min-width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-only .icon {
  width: 20px;
  height: 20px;
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

.phase-modal {
  max-width: 600px;
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
  border: 2px solid #E5E5E5;
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

.add-phase-form {
  background: #F8F9FA;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #E9ECEF;
}

.add-phase-form .form-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.phase-name-input {
  flex: 2;
  padding: 0.5rem;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 0.9rem;
}

.phase-goal-input {
  flex: 3;
  padding: 0.5rem;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 0.9rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
}

.modal-subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: normal;
}

.phase-list-compact {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.phase-item-compact {
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.phase-item-compact:hover {
  border-color: #D0D0D0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.phase-item-compact.editing {
  border-color: #007AFF;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.1);
}

.phase-row {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 0.75rem;
  cursor: pointer;
}

.phase-info-compact {
  flex: 1;
  display: grid;
  grid-template-columns: 2fr 2fr auto;
  gap: 0.75rem;
  align-items: center;
}

.phase-name-compact {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.95rem;
}

.phase-goal-compact {
  color: #666;
  font-size: 0.85rem;
}

.task-count-compact {
  font-size: 0.8rem;
  color: #999;
  background: #F8F9FA;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  white-space: nowrap;
}

.phase-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.phase-item-compact:hover .phase-actions {
  opacity: 1;
}

.phase-edit-form {
  padding: 1rem;
  background: #FAFAFA;
  border-top: 1px solid #E5E5E5;
  margin: -1px;
  border-radius: 0 0 6px 6px;
}

.dependency-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 1rem 0;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  background: #FAFAFA;
}

.dependency-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 0.75rem;
  border-bottom: 1px solid #E5E5E5;
  transition: background 0.2s;
}

.dependency-item:last-child {
  border-bottom: none;
}

.dependency-item:hover {
  background: #F0F0F0;
}

.dependency-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dependency-name {
  font-weight: 500;
  color: #1a1a1a;
}

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
  background: #F0F2F7;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #E5E5E5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phase-title-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.phase-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.phase-goal-tag {
  background: #E8F4FD;
  color: #0066CC;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
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
  background: #FAFAFA;
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.completed .task-name {
  text-decoration: line-through;
  color: #999;
}

.task-row {
  display: flex;
  align-items: flex-start;
  padding: 1rem 0.25rem;
  gap: 0.75rem;
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
  border: 2px solid #DDD;
  border-radius: 4px;
  display: block;
  transition: all 0.2s;
}

.checkbox-container:hover .checkmark {
  border-color: #007AFF;
}

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

.domain-editor { background: #E8F4FD; color: #0066CC; }
.domain-runtime { background: #FFF2E8; color: #CC4400; }
.domain-interaction { background: #F0FFF4; color: #00AA22; }
.domain-persistence { background: #FFF0F5; color: #AA0055; }
.domain-compilation { background: #F5F0FF; color: #6600AA; }
.domain-tooling { background: #FFFACD; color: #B8860B; }

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
  padding: 0.4rem;
  border-radius: 4px;
  transition: all 0.2s;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.btn-small {
  padding: 0.3rem;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-icon.btn-small svg {
  width: 14px;
  height: 14px;
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
  padding: 1rem 1rem;
  background: #FAFAFA;
  border-top: 1px solid #E5E5E5;
  margin: -1rem -0.25rem 0 -0.25rem;
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
  user-select: none;
  font-weight: bold;
  font-size: 14px;
}

.drag-handle:hover {
  color: #999;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Dragging styles */
.phase-draggable-list,
.task-draggable-list {
  width: 100%;
}

.sortable-ghost {
  opacity: 0.5;
  background: #F0F8FF;
  border: 2px dashed #007AFF;
}

.sortable-chosen {
  background: #F8F9FA;
  border: 1px solid #007AFF;
  transform: rotate(2deg);
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(5deg);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.task-drag-handle {
  width: 16px;
  height: 16px;
  color: #CCC;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  font-weight: bold;
  font-size: 12px;
  margin-right: 0.5rem;
}

.task-drag-handle:hover {
  color: #999;
  cursor: grab;
}

.task-drag-handle:active {
  cursor: grabbing;
}
</style>
