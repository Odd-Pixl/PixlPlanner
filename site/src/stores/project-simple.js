import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import projectData from '../data/project-data.json'

export const useProjectStore = defineStore('project', () => {
  // Load from localStorage if available, otherwise use default data
  function loadPersistedData() {
    try {
      const saved = localStorage.getItem('pixl-planner-data')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          domains: parsed.domains || projectData.domains,
          features: parsed.features || projectData.features,
          phases: parsed.phases || projectData.phases,
          tasks: parsed.tasks || projectData.tasks.map(task => ({
            ...task,
            completed: task.completed || false
          }))
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted data:', error)
    }
    
    // Return default data if no saved data or error
    return {
      domains: projectData.domains,
      features: projectData.features,
      phases: projectData.phases,
      tasks: projectData.tasks.map(task => ({
        ...task,
        completed: task.completed || false
      }))
    }
  }

  const persistedData = loadPersistedData()

  // State - make sure these are reactive
  const domains = ref([...persistedData.domains])
  const features = ref([...persistedData.features])
  const phases = ref([...persistedData.phases])
  const tasks = ref([...persistedData.tasks])

  // Debug info
  console.log('Store initialized with:', {
    domains: domains.value.length,
    features: features.value.length,
    phases: phases.value.length,
    tasks: tasks.value.length
  })

  // Save to localStorage whenever data changes
  function saveToLocalStorage() {
    try {
      const dataToSave = {
        domains: domains.value,
        features: features.value,
        phases: phases.value,
        tasks: tasks.value
      }
      localStorage.setItem('pixl-planner-data', JSON.stringify(dataToSave))
      console.log('Data saved to localStorage')
    } catch (error) {
      console.error('Failed to save data to localStorage:', error)
    }
  }

  // Watch for changes and save automatically
  watch([domains, features, phases, tasks], () => {
    saveToLocalStorage()
  }, { deep: true })

  // Getters
  function getDomainById(id) {
    return domains.value.find(domain => domain.id === id)
  }

  function getFeatureById(id) {
    return features.value.find(feature => feature.id === id)
  }

  function getPhaseById(id) {
    return phases.value.find(phase => phase.id === id)
  }

  // Get tasks grouped by phase
  function getTasksByPhase() {
    const grouped = {}
    phases.value.forEach(phase => {
      grouped[phase.id] = tasks.value.filter(task =>
        phase.tasks && phase.tasks.includes(task.id)
      )
    })

    // Add unassigned tasks
    const assignedTaskIds = phases.value.flatMap(phase => phase.tasks || [])
    const unassignedTasks = tasks.value.filter(task => !assignedTaskIds.includes(task.id))
    if (unassignedTasks.length > 0) {
      grouped['unassigned'] = unassignedTasks
    }

    return grouped
  }

  // Actions
  function addTask(newTask) {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const task = {
      id,
      name: newTask.name || 'New Task',
      domain: newTask.domain || 'runtime',
      features: newTask.features || [],
      dependsOn: newTask.dependsOn || [],
      description: newTask.description || '',
      completed: false
    }
    console.log('Adding task:', task)
    tasks.value.push(task)
  }

  function removeTask(taskId) {
    console.log('Removing task:', taskId)
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value.splice(taskIndex, 1)
      console.log('Task removed, remaining:', tasks.value.length)
    }
  }

  function updateTask(taskId, updates) {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }
  }

  // Phase management
  function addPhase(newPhase) {
    const id = `phase-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const phase = {
      id,
      name: newPhase.name || 'New Phase',
      goal: newPhase.goal || '',
      tasks: newPhase.tasks || []
    }
    console.log('Adding phase:', phase)
    phases.value.push(phase)
  }

  function removePhase(phaseId, moveTasksToPhaseId) {
    const phaseIndex = phases.value.findIndex(phase => phase.id === phaseId)
    if (phaseIndex !== -1) {
      const phase = phases.value[phaseIndex]

      // Move tasks to another phase if specified
      if (moveTasksToPhaseId && phase.tasks && phase.tasks.length > 0) {
        const targetPhase = phases.value.find(p => p.id === moveTasksToPhaseId)
        if (targetPhase) {
          targetPhase.tasks = [...(targetPhase.tasks || []), ...phase.tasks]
        }
      }

      phases.value.splice(phaseIndex, 1)
      console.log('Phase removed:', phaseId)
    }
  }

  function updatePhase(phaseId, updates) {
    const phaseIndex = phases.value.findIndex(phase => phase.id === phaseId)
    if (phaseIndex !== -1) {
      phases.value[phaseIndex] = { ...phases.value[phaseIndex], ...updates }
    }
  }

  function reorderPhases(newOrder) {
    phases.value = newOrder
  }

  function resetToDefaults() {
    domains.value = [...projectData.domains]
    features.value = [...projectData.features]
    phases.value = [...projectData.phases]
    tasks.value = projectData.tasks.map(task => ({
      ...task,
      completed: false
    }))
    localStorage.removeItem('pixl-planner-data')
    console.log('Data reset to defaults')
  }

  return {
    // State
    domains,
    features,
    phases,
    tasks,
    // Methods
    getDomainById,
    getFeatureById,
    getPhaseById,
    getTasksByPhase,
    addTask,
    removeTask,
    updateTask,
    addPhase,
    removePhase,
    updatePhase,
    reorderPhases,
    resetToDefaults,
    saveToLocalStorage
  }
})
