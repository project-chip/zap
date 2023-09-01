import path from 'path'
import { StudioProjectPath } from '../ide-integration/studio-types'

/**
 *  Extract project name from the Studio project path
 * @param {} db
 * @param {*} sessionId
 * @returns '' if parsing fails
 */
export function projectName(studioProjectPath: StudioProjectPath) {
  // undo the manual trickery from the Studio side.
  try {
    let p = path.parse(decodeURIComponent(studioProjectPath.replace(/_/g, '%')))
    return p.name
  } catch (error) {
    return ''
  }
}
