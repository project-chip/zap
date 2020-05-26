import { dialog } from 'electron'

/*
 * Created Date: Tuesday, March 10th 2020, 4:22:57 pm
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */

// You can always use this to show an exception.
export function showErrorMessage(title, err) {
  var msg
  if (err instanceof Error) {
    msg = err.toString() + '\n\nStack trace:\n' + err.stack
  } else {
    msg = err
  }
  dialog.showErrorBox(title, msg)
}
