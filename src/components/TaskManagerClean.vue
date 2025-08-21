<template>
  <div class="safe-area-container">
    <div class="task-manager">
    <div class="main-header">
      <!-- Left side: Title and Controls -->
      <div class="header-left">
        <header class="header">
          <h1>Pixl Planner</h1>
          <p class="subtitle">Game Engine Development Tasks</p>
        </header>
        
        <div class="control-group">
          <button v-if="auth.isUnlocked" @click="openAddForm" class="btn btn-primary btn-icon-only" title="Add Task">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
          <button v-if="auth.isUnlocked" @click="openPhaseForm" class="btn btn-secondary btn-icon-only" title="Manage Phases">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </button>
          <button v-if="auth.isUnlocked && isDev" @click="handleResetData" class="btn btn-warning btn-icon-only" title="Reset all data to defaults">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Right side: Stats and Progress -->
      <div class="stats-progress-container">
        <div class="stats">
          <div class="stat-item">
            <span class="stat-number">{{ completedTasks }}</span>
            <span class="stat-label">done</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ store.tasks.length }}</span>
            <span class="stat-label">tasks</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ store.phases.length }}</span>
            <span class="stat-label">phases</span>
          </div>
        </div>
        
        <!-- Progress Bar contained within stats -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Mobile-only lock/unlock under stats + progress for touch devices -->
    <div class="mobile-only mobile-lock-row">
      <!-- Editing buttons first on mobile -->
      <button v-if="auth.isUnlocked" @click="openAddForm" class="btn btn-primary btn-icon-only" title="Add Task">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
        </svg>
      </button>
      <button v-if="auth.isUnlocked" @click="openPhaseForm" class="btn btn-secondary btn-icon-only" title="Manage Phases">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </button>

      <button
        class="btn btn-secondary btn-icon-only"
        :title="auth.isUnlocked ? 'Lock' : 'Unlock'"
        aria-label="Toggle lock"
        @click="auth.isUnlocked ? auth.lock() : openUnlockModal()"
      >
        <!-- Unlocked state shows an open padlock -->
        <svg v-if="auth.isUnlocked" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 11V7a4 4 0 10-8 0"/>
          <rect x="6" y="11" width="12" height="10" rx="2" ry="2" stroke-width="2.5"/>
        </svg>
        <!-- Locked state shows a closed padlock -->
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 11V7a4 4 0 00-8 0v4"/>
          <rect x="6" y="11" width="12" height="10" rx="2" ry="2" stroke-width="2.5"/>
        </svg>
      </button>

      <!-- Reset moves to the end on mobile -->
      <button v-if="auth.isUnlocked && isDev" @click="handleResetData" class="btn btn-warning btn-icon-only" title="Reset all data to defaults">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
    </div>

    <!-- Task Modal (Add/Edit) -->
    <div v-if="showTaskModal" class="modal-overlay" @click="closeTaskModal">
      <div class="modal task-modal" @click.stop>
        <div class="modal-screens" :class="{ 'show-tags': showTagsScreen }">
          <!-- Main Task Form Screen -->
          <div class="modal-screen">
            <!-- Top Toolbar -->
            <div class="modal-toolbar modal-toolbar-top">
              <div class="toolbar-spacer"></div>
              <h3 class="toolbar-title">{{ modalTitle }}</h3>
              <div class="toolbar-spacer"></div>
            </div>
            
            <!-- Scrollable Content -->
            <div class="modal-content">
              <form @submit.prevent="handleTaskSubmit" class="task-form">
                <div class="form-group">
                  <label>Name</label>
                  <input ref="taskNameInput" v-model="currentTask.name" type="text" required />
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea v-model="currentTask.description" rows="3"></textarea>
                </div>
                <div class="form-group domain-group">
                  <label>Domain</label>
                  <select v-model="currentTask.domain">
                    <option v-for="domain in store.domains" :key="domain.id" :value="domain.id">
                      {{ domain.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <div class="tags-section">
                    <div class="tags-header">
                      <label>Tags</label>
                      <button v-if="auth.isUnlocked" type="button" @click="openTagsScreen" class="btn btn-secondary btn-mini">Edit</button>
                    </div>
                    <div v-if="currentTask.features && currentTask.features.length > 0" class="current-tags">
                      <span class="tag-pill" v-for="featureId in currentTask.features" :key="featureId">
                        {{ store.getFeatureById(featureId)?.name || featureId }}
                      </span>
                    </div>
                    <div v-else class="no-tags">
                      No tags
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
          </div>

          <!-- Tags Screen -->
          <div class="modal-screen tags-screen">
            <!-- Top Toolbar -->
            <div class="modal-toolbar modal-toolbar-top">
              <button type="button" @click="closeTagsScreen" class="btn btn-secondary btn-icon-only toolbar-back-button" title="Back">
                <span class="back-arrow">←</span>
              </button>
              <h3 class="toolbar-title">Tags</h3>
              <div class="toolbar-spacer"></div>
            </div>
            
            <!-- Scrollable Content -->
            <div class="modal-content tags-content">
              <!-- Selected Tags Section -->
              <div v-if="selectedTags.length > 0" class="content-section">
                <h4 class="section-title">Selected</h4>
                <div v-for="tag in selectedTags" :key="tag.id" class="list-item" :class="{ 'item-unused': getTagUsageCount(tag.id) === 0 }">
                  <label class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="true"
                      @change="toggleTag(tag.id, $event.target.checked)"
                    />
                    <span class="checkmark"></span>
                  </label>
                  <div class="item-content">
                    <span class="item-name">{{ tag.name }}</span>
                  </div>
                  <button v-if="auth.isUnlocked" @click.stop="handleDeleteTag(tag)" class="btn-icon" :class="getTagUsageCount(tag.id) === 0 ? 'btn-secondary' : 'btn-danger'" title="Delete Tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Available Tags Section -->
              <div class="content-section">
                <h4 class="section-title">Tags</h4>
                <div v-for="tag in availableTags" :key="tag.id" class="list-item" :class="{ 'item-unused': getTagUsageCount(tag.id) === 0 }">
                  <label class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="false"
                      @change="toggleTag(tag.id, $event.target.checked)"
                    />
                    <span class="checkmark"></span>
                  </label>
                  <div class="item-content">
                    <span class="item-name">{{ tag.name }}</span>
                  </div>
                  <button v-if="auth.isUnlocked" @click.stop="handleDeleteTag(tag)" class="btn-icon" :class="getTagUsageCount(tag.id) === 0 ? 'btn-secondary' : 'btn-danger'" title="Delete Tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unlock Editing Modal -->
    <div v-if="showUnlockModal" class="modal-overlay" @click="closeUnlockModal">
      <div class="modal" @click.stop>
        <!-- Top Toolbar -->
        <div class="modal-toolbar modal-toolbar-top">
          <div class="toolbar-spacer"></div>
          <h3 class="toolbar-title">Unlock Editing</h3>
          <div class="toolbar-spacer"></div>
        </div>
        
        <!-- Scrollable Content -->
        <div class="modal-content">
          <div class="form-group">
            <label>Password</label>
            <input ref="unlockInputRef" v-model="unlockPassword" type="password" @keyup.enter="attemptUnlock" />
          </div>
          <p v-if="unlockError" class="error-text">{{ unlockError }}</p>
          <div class="form-actions">
            <button @click="closeUnlockModal" class="btn btn-secondary">Cancel</button>
            <button @click="attemptUnlock" class="btn btn-primary">Unlock</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase Management Modal -->
    <div v-if="showPhaseForm" class="modal-overlay" @click="closePhaseForm">
      <div class="modal phase-modal" @click.stop>
        <!-- Top Toolbar -->
        <div class="modal-toolbar modal-toolbar-top">
          <div class="toolbar-spacer"></div>
          <h3 class="toolbar-title">Manage Phases</h3>
          <button @click="showAddPhaseForm = true" class="btn btn-primary btn-small" title="Add Phase">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
        
        <!-- Scrollable Content -->
        <div class="modal-content">
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
              :disabled="!auth.isUnlocked"
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
                      <button v-if="auth.isUnlocked" @click.stop="togglePhaseEdit(phase.id)" class="btn-icon btn-small" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button v-if="auth.isUnlocked" @click.stop="handleRemovePhase(phase.id)" class="btn-icon btn-danger btn-small" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
            <button @click="closePhaseForm" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dependencies Management Modal -->
    <div v-if="showDependencyForm && editingDependencies" class="modal-overlay" @click="closeDependencyForm">
      <div class="modal" @click.stop>
        <!-- Top Toolbar -->
        <div class="modal-toolbar modal-toolbar-top">
          <div class="toolbar-spacer"></div>
          <h3 class="toolbar-title">Dependencies</h3>
          <div class="toolbar-spacer"></div>
        </div>
        
        <!-- Scrollable Content -->
        <div class="modal-content">
          <p class="modal-subtitle">Select which tasks "<strong>{{ editingDependencies.name }}</strong>" depends on</p>

        <div class="dependency-sections">
          <!-- Selected Dependencies Section -->
          <div v-if="selectedDependencies.length > 0" class="dependency-section">
            <h4 class="dependency-section-title">Selected</h4>
            <div class="dependency-list">
              <div v-for="task in selectedDependencies" :key="task.id" class="dependency-item">
                <label class="checkbox-container">
                  <input
                    type="checkbox"
                    :checked="true"
                    @change="toggleDependency(task.id, $event.target.checked)"
                  />
                  <span class="checkmark"></span>
                </label>
                <div class="dependency-info">
                  <span class="dependency-name">{{ task.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Available Tasks Section -->
          <div class="dependency-section">
            <h4 class="dependency-section-title">Tasks</h4>
            <div class="dependency-list">
              <div v-for="task in unselectedDependencies" :key="task.id" class="dependency-item">
                <label class="checkbox-container">
                  <input
                    type="checkbox"
                    :checked="false"
                    @change="toggleDependency(task.id, $event.target.checked)"
                  />
                  <span class="checkmark"></span>
                </label>
                <div class="dependency-info">
                  <span class="dependency-name">{{ task.name }}</span>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div class="form-actions">
            <button @click="closeDependencyForm" class="btn btn-secondary">Done</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Task List Grouped by Phases -->
    <div class="phases-container">
      <!-- Render each phase -->
      <div v-for="phase in store.phases" :key="phase.id" class="phase-group">
        <div class="phase-title">
          <div class="phase-left">
            <span class="task-drag-handle drag-handle placeholder" aria-hidden="true">⋮⋮</span>
            <span class="checkbox-placeholder" aria-hidden="true"></span>
          </div>
          <div class="phase-title-content">
            <h2>{{ phase.name }}</h2>
            <!-- Overlayed outlined circular progress to the left of the title -->
            <span
              class="phase-progress-ring"
              :aria-label="`${getPhaseCompletedTasks(getTasksForPhase(phase.id))} of ${getTasksForPhase(phase.id).length} completed`"
              role="img"
            >
              <svg viewBox="0 0 36 36" class="ring-svg">
                <circle class="ring-track" cx="18" cy="18" r="15"></circle>
                <circle
                  class="ring-progress"
                  cx="18"
                  cy="18"
                  r="15"
                  :style="{ strokeDasharray: '100 100', strokeDashoffset: (100 - getPhaseProgressPercent(phase.id)).toFixed(2) }"
                ></circle>
              </svg>
            </span>
          </div>
          <div class="phase-right">
            <span v-if="phase.goal" class="phase-goal-badge">{{ phase.goal }}</span>
          </div>
        </div>

        <div class="task-list">
          <draggable
            v-model="phase.tasks"
            handle=".task-drag-handle"
            animation="150"
            :disabled="!auth.isUnlocked"
            class="task-draggable-list"
            group="tasks"
          >
            <template #item="{ element: taskId }">
              <div class="task-item" :class="{ completed: taskMap[taskId]?.completed }">
                <div class="task-row" @click="openEditForm(taskId)">
                  <!-- Drag Handle -->
                  <span v-if="auth.isUnlocked" class="task-drag-handle drag-handle" title="Drag to reorder">⋮⋮</span>
                  <span v-else class="task-drag-handle placeholder" aria-hidden="true">⋮⋮</span>

                  <!-- Completion Checkbox -->
                  <label class="checkbox-container" :class="{ disabled: !auth.isUnlocked }" @click.stop>
                    <input
                      type="checkbox"
                      :checked="taskMap[taskId]?.completed"
                      :disabled="!auth.isUnlocked"
                      @change="auth.isUnlocked && updateTaskCompletion(taskId, $event.target.checked)"
                    />
                    <span class="checkmark"></span>
                  </label>

                  <!-- Task Content -->
                  <div class="task-content">
                    <div class="task-header">
                      <h3 class="task-name" :class="{ completed: taskMap[taskId]?.completed }">
                        {{ taskMap[taskId]?.name }}
                      </h3>
                      <div class="task-meta">
                        <span class="domain-badge" :class="`domain-${taskMap[taskId]?.domain}`">
                          {{ store.getDomainById(taskMap[taskId]?.domain)?.name || taskMap[taskId]?.domain }}
                        </span>
                      </div>
                    </div>
                    <p class="task-description" v-if="taskMap[taskId]?.description">
                      {{ taskMap[taskId]?.description }}
                    </p>
                    <div v-if="taskMap[taskId]?.features && taskMap[taskId]?.features.length > 0" class="task-features">
                      <span class="feature-tag" v-for="featureId in taskMap[taskId]?.features" :key="featureId">
                        {{ store.getFeatureById(featureId)?.name || featureId }}
                      </span>
                    </div>
                    <!-- Mobile-only meta stacked under tags/dependencies -->
                    <div class="task-meta-mobile mobile-only">
                      <span class="domain-badge" :class="`domain-${taskMap[taskId]?.domain}`">
                        {{ store.getDomainById(taskMap[taskId]?.domain)?.name || taskMap[taskId]?.domain }}
                      </span>
                    </div>
                  </div>

                  <!-- Task Actions -->
                  <div v-if="auth.isUnlocked" class="task-actions" @click.stop>
                    <button v-if="auth.isUnlocked" @click="editTaskDependencies(taskMap[taskId])" class="btn-icon" :class="{ 'btn-accent': taskMap[taskId]?.dependsOn && taskMap[taskId]?.dependsOn.length > 0 }" title="Edit Dependencies">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <button v-if="auth.isUnlocked" @click="handleRemoveTask(taskId)" class="btn-icon btn-danger" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            </template>
          </draggable>
        </div>
      </div>

      <!-- Unassigned Tasks -->
      <div v-if="unassignedTaskIds.length > 0" class="phase-group">
        <div class="phase-title">
          <div class="phase-title-content">
            <h2>Unassigned Tasks</h2>
          </div>
          <span class="phase-progress">
            {{ getPhaseCompletedTasksByIds(unassignedTaskIds) }} / {{ unassignedTaskIds.length }} completed
          </span>
        </div>

        <div class="task-list">
          <draggable
            v-model="unassignedTaskIds"
            handle=".task-drag-handle"
            animation="150"
            :disabled="!auth.isUnlocked"
            class="task-draggable-list"
            group="tasks"
          >
            <template #item="{ element: taskId }">
              <div class="task-item" :class="{ completed: taskMap[taskId]?.completed }">
                <div class="task-row">
                  <!-- Drag Handle -->
                  <span v-if="auth.isUnlocked" class="task-drag-handle drag-handle" title="Drag to reorder">⋮⋮</span>
                  <span v-else class="task-drag-handle placeholder" aria-hidden="true">⋮⋮</span>

                  <label class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="taskMap[taskId]?.completed"
                      @change="updateTaskCompletion(taskId, $event.target.checked)"
                    />
                    <span class="checkmark"></span>
                  </label>

                  <div class="task-content" @click="openEditForm(taskId)">
                    <div class="task-header">
                      <h3 class="task-name" :class="{ completed: taskMap[taskId]?.completed }">
                        {{ taskMap[taskId]?.name }}
                      </h3>
                      <div class="task-meta">
                        <span class="domain-badge" :class="`domain-${taskMap[taskId]?.domain}`">
                          {{ store.getDomainById(taskMap[taskId]?.domain)?.name || taskMap[taskId]?.domain }}
                        </span>
                      </div>
                    </div>
                    <p class="task-description" v-if="taskMap[taskId]?.description">
                      {{ taskMap[taskId]?.description }}
                    </p>
                  </div>

                  <div v-if="auth.isUnlocked" class="task-actions">
                    <button @click="editTaskDependencies(taskMap[taskId])" class="btn-icon" :class="{ 'btn-accent': taskMap[taskId]?.dependsOn && taskMap[taskId]?.dependsOn.length > 0 }" title="Edit Dependencies">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <button @click="handleRemoveTask(taskId)" class="btn-icon btn-danger" title="Delete">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useProjectStore } from '../stores/project-simple.js'
import { useAuthStore } from '../stores/auth.js'
import draggable from 'vuedraggable'

const store = useProjectStore()
const auth = useAuthStore()
const isDev = import.meta.env.DEV

// Local state
const showTaskModal = ref(false)
const editingTaskId = ref(null)
const showTagsScreen = ref(false)
const showPhaseForm = ref(false)
const showAddPhaseForm = ref(false)
const showDependencyForm = ref(false)
const showUnlockModal = ref(false)
const unlockPassword = ref('')
const unlockError = ref('')
const unlockInputRef = ref(null)
const taskNameInput = ref(null)
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

// Modal state
const isEditingMode = computed(() => editingTaskId.value !== null)
const modalTitle = computed(() => isEditingMode.value ? 'Edit task' : 'New task')
const currentTask = computed(() => {
  if (isEditingMode.value) {
    return store.tasks.find(t => t.id === editingTaskId.value) || {}
  }
  return newTask.value
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

// Split tasks into selected and unselected dependencies
const selectedDependencies = computed(() => {
  if (!editingDependencies.value) return []
  const selectedIds = editingDependencies.value.dependsOn || []
  return availableTasksForDependencies.value.filter(task => selectedIds.includes(task.id))
})

const unselectedDependencies = computed(() => {
  if (!editingDependencies.value) return []
  const selectedIds = editingDependencies.value.dependsOn || []
  return availableTasksForDependencies.value.filter(task => !selectedIds.includes(task.id))
})

// Tag management
const selectedTags = computed(() => {
  const selectedIds = currentTask.value.features || []
  return store.features.filter(tag => selectedIds.includes(tag.id))
})

const availableTags = computed(() => {
  const selectedIds = currentTask.value.features || []
  return store.features.filter(tag => !selectedIds.includes(tag.id))
})

// Map of task id -> task object for easy lookup
const taskMap = computed(() => {
  const map = {}
  for (const t of store.tasks) map[t.id] = t
  return map
})

// Computed unassigned task IDs with setter to persist order into store.tasks
const unassignedTaskIds = computed({
  get() {
    const assignedIds = new Set(store.phases.flatMap(p => p.tasks || []))
    return store.tasks.filter(t => !assignedIds.has(t.id)).map(t => t.id)
  },
  set(newIds) {
    // Safely reorder only the unassigned tasks based on newIds.
    // Consider items not present in newIds as assigned (e.g., just moved into a phase).
    const phaseAssigned = new Set(store.phases.flatMap(p => p.tasks || []))
    const idsNotInNew = new Set(store.tasks.filter(t => !newIds.includes(t.id)).map(t => t.id))
    const assignedLike = new Set([...phaseAssigned, ...idsNotInNew])

    const assignedTasks = store.tasks.filter(t => assignedLike.has(t.id))
    const unassignedById = new Map(store.tasks.filter(t => !assignedLike.has(t.id)).map(t => [t.id, t]))
    const reorderedUnassigned = newIds.map(id => unassignedById.get(id)).filter(Boolean)

    store.tasks.splice(0, store.tasks.length, ...assignedTasks, ...reorderedUnassigned)
  }
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

function getPhaseCompletedTasksByIds(taskIds) {
  const set = new Set(taskIds)
  return store.tasks.filter(t => set.has(t.id) && t.completed).length
}

// Degrees for circular progress (0-360) for a phase by id
function getPhaseProgressDegrees(phaseId) {
  const tasks = getTasksForPhase(phaseId)
  const total = tasks.length
  if (total === 0) return 0
  const done = getPhaseCompletedTasks(tasks)
  const ratio = done / total
  return Math.round(ratio * 360)
}

// Percent (0-100) for strokeDashoffset calc
function getPhaseProgressPercent(phaseId) {
  const tasks = getTasksForPhase(phaseId)
  const total = tasks.length
  if (total === 0) return 0
  const done = getPhaseCompletedTasks(tasks)
  return (done / total) * 100
}

// (removed) phase-level toggle helpers

// Methods
function handleTaskSubmit() {
  if (currentTask.value.name.trim()) {
    if (isEditingMode.value) {
      // Update existing task
      store.updateTask(editingTaskId.value, {
        name: currentTask.value.name,
        description: currentTask.value.description,
        domain: currentTask.value.domain,
        features: currentTask.value.features
      })
    } else {
      // Add new task
      store.addTask({ ...currentTask.value })
      // Reset form for next time
      newTask.value = {
        name: '',
        domain: 'runtime',
        description: '',
        features: []
      }
    }
    closeTaskModal()
  }
}

function handleRemoveTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    store.removeTask(taskId)
  }
}


function togglePhaseEdit(phaseId) {
  editingPhase.value = editingPhase.value === phaseId ? null : phaseId
}

function updateTaskCompletion(taskId, completed) {
  store.updateTask(taskId, { completed })
}

function handleResetData() {
  if (!auth.isUnlocked) return
  if (confirm('Are you sure you want to reset all data to defaults? This will remove all your progress and custom tasks/phases.')) {
    store.resetToDefaults()
  }
}

function openUnlockModal() {
  unlockPassword.value = ''
  unlockError.value = ''
  showUnlockModal.value = true
  preventBodyScroll(true)
  // Only auto-focus on desktop
  if (!isMobile()) {
    nextTick(() => {
      if (unlockInputRef.value) {
        unlockInputRef.value.focus()
        unlockInputRef.value.select?.()
      }
    })
  }
}

function closeUnlockModal() {
  showUnlockModal.value = false
  preventBodyScroll(false)
}

function openPhaseForm() {
  showPhaseForm.value = true
  preventBodyScroll(true)
}

function closePhaseForm() {
  showPhaseForm.value = false
  preventBodyScroll(false)
}

function closeDependencyForm() {
  showDependencyForm.value = false
  preventBodyScroll(false)
}

function openAddForm() {
  editingTaskId.value = null
  // Reset new task form
  newTask.value = {
    name: '',
    domain: 'runtime',
    description: '',
    features: []
  }
  showTaskModal.value = true
  // Prevent body scrolling on all devices
  preventBodyScroll(true)
  // Only auto-focus on desktop
  if (!isMobile()) {
    nextTick(() => {
      if (taskNameInput.value) {
        taskNameInput.value.focus()
        taskNameInput.value.select?.()
      }
    })
  }
}

function openEditForm(taskId) {
  if (!auth.isUnlocked) return
  editingTaskId.value = taskId
  showTaskModal.value = true
  // Prevent body scrolling on all devices
  preventBodyScroll(true)
  // Only auto-focus on desktop
  if (!isMobile()) {
    nextTick(() => {
      if (taskNameInput.value) {
        taskNameInput.value.focus()
        taskNameInput.value.select?.()
      }
    })
  }
}

function closeTaskModal() {
  showTaskModal.value = false
  editingTaskId.value = null
  showTagsScreen.value = false
  // Restore body scrolling
  preventBodyScroll(false)
}

function openTagsScreen() {
  showTagsScreen.value = true
}

function closeTagsScreen() {
  showTagsScreen.value = false
}

function toggleTag(tagId, isChecked) {
  const currentFeatures = currentTask.value.features || []
  let newFeatures
  
  if (isChecked) {
    newFeatures = [...currentFeatures, tagId]
  } else {
    newFeatures = currentFeatures.filter(id => id !== tagId)
  }
  
  // Update the current task's features
  if (isEditingMode.value) {
    // Update the actual task in the store
    store.updateTask(editingTaskId.value, { features: newFeatures })
  } else {
    // Update the new task form
    newTask.value.features = newFeatures
  }
}

function getTagUsageCount(tagId) {
  return store.tasks.filter(task => 
    task.features && task.features.includes(tagId)
  ).length
}

function handleDeleteTag(tag) {
  const usageCount = getTagUsageCount(tag.id)
  
  // If tag is unused, delete without confirmation
  if (usageCount === 0) {
    // Remove the tag from the features list
    const updatedFeatures = store.features.filter(f => f.id !== tag.id)
    store.features.splice(0, store.features.length, ...updatedFeatures)
    return
  }
  
  // If tag is used, show confirmation with usage count
  const message = `Are you sure you want to delete the tag "${tag.name}"? This tag is currently used by ${usageCount} task${usageCount === 1 ? '' : 's'}.`
  
  if (confirm(message)) {
    // Remove the tag from all tasks that use it
    store.tasks.forEach(task => {
      if (task.features && task.features.includes(tag.id)) {
        const updatedFeatures = task.features.filter(id => id !== tag.id)
        store.updateTask(task.id, { features: updatedFeatures })
      }
    })
    
    // Remove the tag from the features list
    const updatedFeatures = store.features.filter(f => f.id !== tag.id)
    store.features.splice(0, store.features.length, ...updatedFeatures)
  }
}

function attemptUnlock() {
  unlockError.value = ''
  Promise.resolve(auth.unlock(unlockPassword.value)).then(ok => {
    if (ok) {
      showUnlockModal.value = false
    } else {
      unlockError.value = 'Incorrect password'
    }
  })
}

// Body scroll prevention for mobile compatibility
let scrollPosition = 0

// Mobile detection
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

function preventBodyScroll(prevent) {
  if (prevent) {
    // Save current scroll position
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop
    
    // Apply styles to prevent scrolling
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.width = '100%'
    
    // Add touchmove event listener for mobile
    document.addEventListener('touchmove', preventTouchMove, { passive: false })
  } else {
    // Restore scrolling
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    
    // Restore scroll position
    window.scrollTo(0, scrollPosition)
    
    // Remove touchmove event listener
    document.removeEventListener('touchmove', preventTouchMove)
  }
}

function preventTouchMove(e) {
  // Allow scrolling inside modal content areas
  let target = e.target
  while (target && target !== document.body) {
    if (target.classList?.contains('modal-content') || target.classList?.contains('phase-list-compact') || target.classList?.contains('dependency-list')) {
      return // Allow scrolling in these areas
    }
    target = target.parentNode
  }
  
  // Prevent all other touch scrolling
  e.preventDefault()
}

function handleGlobalKey(e) {
  const tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '')
  const isTypingTarget = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)

  if ((e.key === 'l' || e.key === 'L') && !isTypingTarget) {
    e.preventDefault()
    e.stopPropagation()
    if (auth.isUnlocked) {
      auth.lock()
    } else {
      openUnlockModal()
    }
  }
  if (e.key === 'Escape') {
    if (showTaskModal.value) {
      if (showTagsScreen.value) {
        closeTagsScreen()
      } else {
        closeTaskModal()
      }
    } else if (showPhaseForm.value) {
      closePhaseForm()
    } else if (showAddPhaseForm.value) {
      showAddPhaseForm.value = false
    } else if (showDependencyForm.value) {
      closeDependencyForm()
    } else if (showUnlockModal.value) {
      closeUnlockModal()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKey)
  // Clean up body scroll prevention if component unmounts while modal is open
  preventBodyScroll(false)
})

function editTaskDependencies(task) {
  editingDependencies.value = { ...task }
  showDependencyForm.value = true
  preventBodyScroll(true)
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
</script>

<style scoped>
/* Force proper color scheme handling */
* {
  color-scheme: light dark;
}

/* Ensure body fills viewport and uses page background */
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

.safe-area-container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  background: light-dark(#fafafa, #0f0f0f);
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
}

.task-manager {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 3rem;
  font-family: ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.header {
  text-align: left;
  margin-bottom: 0;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0.1rem 0 0 0;
}

.stats-progress-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
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
}

.progress-bar {
  height: 8px;
  background: light-dark(#E8E8E8, #3a3a3a);
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
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
  background: light-dark(#f0f0f0, #1a1a1a);
  color: light-dark(#333, #fff);
}

.btn-secondary:hover {
  background: light-dark(#e0e0e0, #404040);
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

.btn-mini {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
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
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  overflow: hidden;
  touch-action: none;
  padding: env(safe-area-inset-top, 1rem) max(env(safe-area-inset-right), 2rem) env(safe-area-inset-bottom, 1rem) max(env(safe-area-inset-left), 2rem);
}

.modal {
  background: light-dark(#fafafa, #151515);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 53vh;
  height: 53vh;
  border: 1px solid light-dark(#e0e0e0, #2a2a2a);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Increase height on mobile where screen space is more limited */
@media (max-width: 768px) {
  .modal {
    max-height: 80vh;
    height: 80vh;
  }
}

/* Mobile landscape adjustments */
@media (max-width: 768px) and (orientation: landscape) {
  .modal {
    max-height: 85vh;
    height: 85vh;
    max-width: 600px;
    width: 85%;
  }
  
  .phase-modal {
    max-height: 85vh;
    height: 85vh;
  }
}

.phase-modal {
  max-width: 600px;
  height: 53vh;
}

/* Increase height on mobile for phase modal too */
@media (max-width: 768px) {
  .phase-modal {
    height: 80vh;
  }
}

.modal h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.form-group {
  margin-bottom: 1rem;
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
  border: 1px solid light-dark(#e0e0e0, #2a2a2a);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
  background: light-dark(white, #1a1a1a);
  color: light-dark(#1a1a1a, #e5e5e5);
}

.form-group select {
  border: none;
  background: light-dark(#f0f0f0, #1a1a1a);
  border-radius: 8px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath stroke='%23999' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 20px;
  padding-right: 3rem;
}

@media (prefers-color-scheme: dark) {
  .form-group select {
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath stroke='%23ccc' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  }
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: light-dark(#999, #777);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.add-phase-form {
  background: light-dark(#f5f5f5, #2a2a2a);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid light-dark(#e0e0e0, #404040);
}

.add-phase-form .form-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.phase-name-input {
  flex: 2;
  padding: 0.5rem;
  border: 1px solid light-dark(#ddd, #555);
  border-radius: 4px;
  font-size: 0.9rem;
  background: light-dark(white, #0f0f0f);
  color: light-dark(#1a1a1a, #e5e5e5);
}

.phase-goal-input {
  flex: 3;
  padding: 0.5rem;
  border: 1px solid light-dark(#ddd, #555);
  border-radius: 4px;
  font-size: 0.9rem;
  background: light-dark(white, #0f0f0f);
  color: light-dark(#1a1a1a, #e5e5e5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  line-height: 1.3;
}

.modal-subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
  font-weight: normal;
  line-height: 1.5;
}

.error-text {
  color: #CC0000;
  margin-top: 0.5rem;
}

.phase-list-compact {
  max-height: 400px;
  overflow-y: scroll;
  overflow-x: hidden;
  margin-bottom: 1rem;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

.phase-item-compact {
  background: light-dark(white, #1a1a1a);
  border: 1px solid light-dark(#e0e0e0, #404040);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
}

.phase-item-compact:hover {
  border-color: light-dark(#d0d0d0, #555);
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
  color: light-dark(#666, #999);
  background: light-dark(#f0f0f0, #242424);
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
  background: light-dark(#f5f5f5, #2a2a2a);
  border-top: 1px solid light-dark(#e0e0e0, #404040);
  margin: -1px;
  border-radius: 0 0 6px 6px;
}

.dependency-sections {
  margin: 1rem 0;
}

.dependency-section {
  margin-bottom: 1.5rem;
}

.dependency-section:last-child {
  margin-bottom: 0;
}

.dependency-section-title {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.dependency-list {
  max-height: 250px;
  overflow-y: scroll;
  overflow-x: hidden;
  border: 1px solid light-dark(#e0e0e0, #404040);
  border-radius: 8px;
  background: light-dark(#f5f5f5, #2a2a2a);
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
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
  background: light-dark(#f0f0f0, #2a2a2a);
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
  line-height: 1.3;
}

.phases-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.phase-group {
  background: light-dark(white, #0f0f0f);
  border-radius: 12px;
  border: 1px solid light-dark(#e0e0e0, #2a2a2a);
  overflow: hidden;
}

.phase-title {
  background: light-dark(#F8F9FA, #0f0f0f);
  padding: 1rem 1.5rem 1rem 0.5rem;
  border-bottom: 1px solid light-dark(#E5E5E5, #2a2a2a);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
}

/* Desktop: shift right to align with task content */
@media (min-width: 601px) {
  .phase-title {
    padding-left: 1rem;
  }
}

.phase-left { display: grid; grid-template-columns: 16px 20px; align-items: center; gap: 0.5rem; }

/* Desktop: match task row spacing */
@media (min-width: 601px) {
  .phase-left {
    gap: 1rem;
  }
}

.phase-title-content { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
.phase-right { display: flex; align-items: center; gap: 0.75rem; }

.phase-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
  flex: 1;
}

.phase-goal-badge {
  background: light-dark(#f0f0f0, #242424);
  color: light-dark(#666, #ccc);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 400;
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
  border-bottom: 1px solid light-dark(#e0e0e0, #333);
  transition: all 0.2s;
  background: transparent;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item:hover {
  background: transparent;
}



.task-row { display: grid; grid-template-columns: 16px 24px 1fr auto; align-items: flex-start; padding: 1rem 0.5rem 0.75rem 0.5rem; gap: 0.5rem; cursor: pointer; }

/* Desktop: double spacing between drag/checkbox/content */
@media (min-width: 601px) {
  .task-row {
    gap: 1rem;
  }
}

.checkbox-container {
  position: relative;
  cursor: pointer;
  margin-top: 0.25rem;
}

/* Extra spacing to the right of the checkbox in task rows */
.task-row .checkbox-container { padding-right: 0.25rem; }

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
  background-color: light-dark(#fff, #1a1a1a);
  border: 1px solid light-dark(#ddd, #555);
  border-radius: 4px;
  display: block;
  transition: all 0.2s;
}

.checkbox-container:hover .checkmark {
  border-color: light-dark(#999, #777);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #007AFF;
  border-color: #007AFF;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' d='M20 6L9 17l-5-5'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  transform: translate(-50%, -50%);
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
  flex: 1;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-meta-mobile { display: none; margin-top: 0.25rem; }

.domain-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 400;
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
  background: light-dark(#f0f0f0, #1a1a1a);
  color: light-dark(#666, #ccc);
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 400;
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
  background: light-dark(#f0f0f0, #2a2a2a);
  color: light-dark(#333, #ccc);
}

.btn-danger:hover {
  background: #FFE5E5;
  color: #CC0000;
}

.btn-accent {
  color: #007AFF;
}

.btn-accent:hover {
  background: light-dark(#f0f0f0, #2a2a2a);
  color: light-dark(#0056CC, #77a3ff);
}

.edit-form {
  padding: 1rem 2rem;
  background: #FAFAFA;
  border-top: 1px solid #E5E5E5;
  margin: 0 -0.25rem 0 -0.25rem;
}

/* Make title input span full width like description in edit form */
.edit-form .form-row { display: block; }

/* Task form styling to match edit form */
.task-form {
  margin: 0;
}

.task-form .form-row { 
  display: block; 
  margin-bottom: 1rem;
}

.task-form .domain-group { 
  max-width: 240px; 
  margin-bottom: 1rem; 
}

.task-form .form-actions {
  margin-top: 1.5rem;
  margin-bottom: 0;
}

/* Task Modal with Navigation */
.task-modal {
  overflow: hidden;
  position: relative;
}

.modal-screens {
  display: flex;
  width: 200%;
  height: 100%;
  transform: translateX(0);
  transition: transform 0.3s ease;
  flex: 1;
  min-height: 0;
}

.modal-screens.show-tags {
  transform: translateX(-50%);
}

.modal-screen {
  flex: 0 0 50%;
  width: 50%;
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.modal-screens:not(.show-tags) .modal-screen:first-child {
  opacity: 1;
}

.modal-screens:not(.show-tags) .modal-screen:last-child {
  opacity: 0;
}

.modal-screens.show-tags .modal-screen:first-child {
  opacity: 0;
}

.modal-screens.show-tags .modal-screen:last-child {
  opacity: 1;
}

/* Tags Section in Main Form */
.tags-section {
  margin-bottom: 0;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.tags-header label {
  margin-bottom: 0;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 1.5rem;
  align-items: center;
}

.tag-pill {
  background: light-dark(#f0f0f0, #1a1a1a);
  color: light-dark(#666, #ccc);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
}

.no-tags {
  color: #999;
  font-size: 0.9rem;
  padding: 0.5rem 0;
  font-style: italic;
}

/* Modal Screens Structure */
.modal-screen {
  flex: 0 0 50%;
  width: 50%;
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* iOS-Style Modal Toolbars */
.modal-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid light-dark(#e0e0e0, #2a2a2a);
  background: light-dark(#f5f5f5, #1a1a1a);
}

.modal-toolbar-bottom {
  border-bottom: none;
  border-top: 1px solid light-dark(#e0e0e0, #404040);
  margin-top: auto;
}

.toolbar-title {
  flex: 1;
  text-align: center;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.toolbar-spacer {
  width: 48px;
  flex-shrink: 0;
}

.modal-toolbar .btn {
  background: none !important;
  border: none !important;
  padding: 0 !important;
  min-width: auto !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
}

.modal-toolbar .btn:hover {
  background: none !important;
  transform: none !important;
}

.toolbar-back-button {
  color: light-dark(#333, #ccc) !important;
}

.toolbar-back-button .back-arrow {
  font-size: 20px;
  font-weight: bold;
  line-height: 1;
  color: light-dark(#333, #ccc);
}

.toolbar-back-button:hover .back-arrow {
  color: light-dark(#333, #ccc);
}

/* Modal Content Area */
.modal-content {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 1.5rem;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  /* Force scroll behavior even with short content */
  overscroll-behavior-y: contain;
}

/* Ensure modal content has minimum height to enable scrolling */
.modal-content > * {
  min-height: calc(100% + 1px);
}

/* Tags content has no side padding */
.tags-content {
  padding: 0;
}

.content-section {
  margin-bottom: 2rem;
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 1rem 0;
  padding: 0 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

/* List Items */
.list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  gap: 0.75rem;
  border-bottom: 1px solid light-dark(#e0e0e0, #404040);
  transition: background 0.2s;
  background: light-dark(white, #1a1a1a);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: light-dark(#f0f0f0, #2a2a2a);
}

.list-item .btn-icon {
  margin-left: auto;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.item-name {
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}

.item-unused {
  opacity: 0.6;
}

.item-unused .item-name {
  color: #999;
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
  transform: none;
}

.sortable-drag {
  opacity: 0.8;
  transform: none;
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

.task-drag-handle.placeholder { opacity: 0; pointer-events: none; }
.checkbox-placeholder { display: inline-block; width: 20px; height: 20px; }

.phase-title-content { position: relative; flex: 1; }

.phase-progress-ring {
  position: absolute;
  left: -32px; /* shift into the gutter, without affecting title flow */
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
}

/* Desktop: adjust for wider spacing */
@media (min-width: 601px) {
  .phase-progress-ring {
    left: -40px; /* shift further left to align with checkbox */
  }
}

.ring-svg { width: 20px; height: 20px; display: block; }
.ring-track {
  fill: none;
  stroke: light-dark(#E8E8E8, #3a3a3a);
  stroke-width: 3;
  stroke-linecap: round;
}
.ring-progress {
  fill: none;
  stroke: #007AFF;
  stroke-width: 6;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.3s ease;
}

/* Dark mode accent variable + usage */
@media (prefers-color-scheme: dark) {
  /* Define accent color for this component only in dark mode */
  .task-manager { --accent-color: #007AFF; }

  /* Use accent for ring, primary button, and checkbox */
  .ring-progress { stroke: var(--accent-color); }
  .btn-primary { background: var(--accent-color); }
  .checkbox-container input:checked ~ .checkmark {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
  }
}

.task-drag-handle:hover {
  color: #999;
  cursor: grab;
}

.task-drag-handle:active {
  cursor: grabbing;
}

/* Restore primary text color in dark mode */
@media (prefers-color-scheme: dark) {
  .task-manager { color: #fff; }
  .header h1,
  .modal h3,
  .toolbar-title,
  .phase-title h2,
  .task-name,
  .item-name,
  .dependency-name { color: #fff; }
  
  /* Brighten domain colors in dark mode */
  .domain-editor { color: #4D9FFF; }
  .domain-runtime { color: #FF7D4D; }
  .domain-interaction { color: #4DDD66; }
  .domain-persistence { color: #DD4D99; }
  .domain-compilation { color: #994DDD; }
  .domain-tooling { color: #E6B84D; }
}

/* Mobile tweaks */
@media (max-width: 600px) {
  .task-manager {
    padding: 1.25rem;
  }
}

/* Mobile portrait tweaks */
@media (max-width: 600px) and (orientation: portrait) {
  .main-header {
    flex-direction: column;
    align-items: center;
    margin-bottom: 3rem;
    gap: 1rem;
  }

  .header {
    text-align: center;
  }

  .stats-progress-container {
    align-items: center;
  }

  .stats {
    justify-content: center;
  }

  /* Only show padlock on mobile portrait */
  .mobile-only { display: inline-flex; }

  /* Hide top-left editing controls on mobile; use mobile row below progress */
  .control-group { display: none; }

  /* Hide goal badge on mobile to give title more room */
  .phase-goal-badge { display: none; }
}

/* Hide mobile-only controls by default (desktop / non-portrait) */
.mobile-only { display: none; }

/* Mobile lock row layout */
.mobile-lock-row {
  display: none;
  justify-content: flex-start;
  margin: 3rem 0 1.25rem 0;
  gap: 0.5rem;
}

/* Use smaller buttons/icons on mobile portrait */
@media (max-width: 600px) and (orientation: portrait) {
  .mobile-lock-row { display: flex; justify-content: flex-start; }

  .btn.btn-icon-only {
    padding: 0.5rem;
    min-width: 40px;
    height: 40px;
  }

  .btn .icon { width: 16px; height: 16px; }

  .progress-text { font-size: 0.8rem; min-width: 64px; }
  /* Domain select can stretch on mobile */
  .edit-form .domain-group { max-width: 100%; }
  .task-form .domain-group { max-width: 100%; }

  /* On mobile, hide right-aligned meta and show stacked mobile meta */
  .task-header { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
  .task-header .task-meta { display: none; }
  .task-meta-mobile { display: block; }
  .task-features { justify-content: flex-start; }
  .task-features, .task-meta-mobile { margin-left: 0; }
  .task-meta-mobile { margin-top: 0.25rem; margin-bottom: 0.5rem; }
  .task-content { width: 100%; }
}

/* Constrain only the Domain field on larger screens */
.edit-form .domain-group { max-width: 240px; margin-bottom: 0.5rem; }
</style>
