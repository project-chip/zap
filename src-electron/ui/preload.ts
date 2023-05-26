import { TitleBarOverlayOptions } from 'electron/common'
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  setTitleBarOverlay: (titleBarOverlay: TitleBarOverlayOptions) =>
    ipcRenderer.send('set-title-bar-overlay', titleBarOverlay),
})
