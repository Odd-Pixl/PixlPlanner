/**
 * GitHub Repository Storage Service
 * 
 * This service reads app data from a JSON file stored in the GitHub repository.
 * Updates are handled by committing the JSON file to the repo (manual process).
 * This provides automatic sync across devices without authentication.
 */

const REPO_OWNER = 'Odd-Pixl'
const REPO_NAME = 'PixlPlanner'
const DATA_FILE_PATH = 'data/app-state.json'
const BRANCH = 'main'

// GitHub API endpoints
const RAW_FILE_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${DATA_FILE_PATH}`
const API_FILE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`

/**
 * Loads app data from GitHub (disabled)
 * @returns {Promise<Object|null>} Always returns null
 */
export async function loadFromGitHub() {
  // GitHub loading disabled - using localStorage only
  return null
}

/**
 * Checks if the GitHub data file exists and gets its last modified date
 * @returns {Promise<{exists: boolean, lastModified: string|null}>}
 */
export async function getGitHubDataInfo() {
  try {
    const response = await fetch(API_FILE_URL)
    
    if (!response.ok) {
      return { exists: false, lastModified: null }
    }
    
    const fileInfo = await response.json()
    return {
      exists: true,
      lastModified: fileInfo.commit?.committer?.date || null
    }
  } catch (error) {
    console.warn('Failed to get GitHub data info:', error)
    return { exists: false, lastModified: null }
  }
}

/**
 * Generates the content for the app-state.json file
 * This is used when manually updating the repository
 * @param {Object} appData - The current app state
 * @returns {string} Formatted JSON string
 */
export function generateDataFileContent(appData) {
  const dataToSave = {
    ...appData,
    _lastUpdated: new Date().toISOString(),
    _version: '1.0.0'
  }
  
  return JSON.stringify(dataToSave, null, 2)
}

/**
 * Creates instructions for manually updating the data file
 * @param {Object} appData - The current app state
 * @returns {Object} Instructions and file content
 */
export function getUpdateInstructions(appData) {
  const content = generateDataFileContent(appData)
  
  return {
    filePath: DATA_FILE_PATH,
    content,
    instructions: [
      `1. Create/update the file: ${DATA_FILE_PATH}`,
      `2. Copy the generated content into the file`,
      `3. Commit and push the changes`,
      `4. The app will automatically use the new data on next reload`
    ]
  }
}
