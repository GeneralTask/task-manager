/* eslint @typescript-eslint/no-var-requires: "off" */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld("IN_ELECTRON_ENV", true)
