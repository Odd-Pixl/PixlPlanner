import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import projectData from '../data/project-data.json'

export const useProjectStore = defineStore('project', () => {
  // State
  const domains = ref([...projectData.domains])
  const features = ref([...projectData.features])
  const phases = ref([...projectData.phases])
  const tasks = ref([...projectData.tasks])

  // Getters
  const tasksByDomain = computed(() => {
    const grouped = {}
    domains.value.forEach(domain => {
      grouped[domain.id] = tasks.value.filter(task => task.domain === domain.id)
    })
    return grouped
  })

  const getDomainById = computed(() => {
    return (id) => domains.value.find(domain => domain.id === id)
  })

  const getFeatureById = computed(() => {
    return (id) => features.value.find(feature => feature.id === id)
  })

  const getTaskDependencies = computed(() => {
    return (taskId) => {
      const task = tasks.value.find(t => t.id === taskId)
      if (!task || !task.dependsOn) return []
      return task.dependsOn.map(depId => tasks.value.find(t => t.id === depId)).filter(Boolean)
    }
  })

  // Actions
  function addTask(newTask) {
    const id = generateId('task')
    tasks.value.push({
      id,
      name: newTask.name || 'New Task',
      domain: newTask.domain || 'runtime',
      features: newTask.features || [],
      dependsOn: newTask.dependsOn || [],
      description: newTask.description || ''
    })
  }

  function removeTask(taskId) {
    // Remove the task
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value.splice(taskIndex, 1)
    }

    // Remove dependencies on this task from other tasks
    tasks.value.forEach(task => {
      if (task.dependsOn && task.dependsOn.includes(taskId)) {
        task.dependsOn = task.dependsOn.filter(dep => dep !== taskId)
      }
    })

    // Remove from phases
    phases.value.forEach(phase => {
      if (phase.tasks && phase.tasks.includes(taskId)) {
        phase.tasks = phase.tasks.filter(id => id !== taskId)
      }
    })
  }

  function updateTask(taskId, updates) {
    const taskIndex = tasks.value.findIndex(task => task.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }
  }

  function reorderTasks(newOrder) {
    tasks.value = newOrder
  }

  function generateId(prefix) {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `${prefix}-${timestamp}-${random}`
  }

  return {
    // State
    domains,
    features,
    phases,
    tasks,
    // Getters
    tasksByDomain,
    getDomainById,
    getFeatureById,
    getTaskDependencies,
    // Actions
    addTask,
    removeTask,
    updateTask,
    reorderTasks
  }
})
