export const isElectron = navigator?.userAgent?.indexOf?.('Electron') >= 0
export const isMac = navigator?.userAgent?.toUpperCase?.().indexOf?.('MAC') >= 0
export const isWin =
  navigator?.userAgent?.toUpperCase?.().indexOf?.('WINDOWS') >= 0
