import WebSocket from 'ws'
import { DbType } from '../../src-shared/types/db-types'

export enum StudioRestAPI {
  GetProjectInfo = '/rest/clic/components/all/project/',
  AddComponent = '/rest/clic/component/add/project/',
  RemoveComponent = '/rest/clic/component/remove/project/',
  DependsComponent = '/rest/clic/component/depends/project/',
}

export enum StudioWsAPI {
  WsServerNotification = '/ws/clic/server/notifications/project/',
}

export type StudioProjectPath = string
export type StudioQueryParams = { [key: string]: string }
export type StudioWsMessage = (
  db: DbType,
  session: any,
  message: string
) => void
export type StudioWsConnection = { [sessionId: number]: WebSocket | null }
