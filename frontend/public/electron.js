/* eslint @typescript-eslint/no-var-requires: "off" */
const { app, BrowserWindow, shell, session } = require('electron')
const path = require('path')
const PROTOCOL_PREFIX = 'generaltask'

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
        }
    })
    const url = process.env.APP_DEV ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`
    mainWindow.loadURL(url)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url)
        }
        return { action: 'deny' }
    })
}

app.whenReady().then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ['connect-src \'self\' *.generaltask.com default-src \'none\'img-src \'self\'manifest-src \'self\'script-src-elem \'self\'style-src-elem \'self\'']
            }
        })
    })
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length == 0) createWindow()
    })
})

app.setAsDefaultProtocolClient(PROTOCOL_PREFIX)
app.on('open-url', (event,) => {
    event.preventDefault()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
