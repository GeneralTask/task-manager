const { app, BrowserWindow, shell, session } = require('electron')
const path = require('path')

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        webPreferences: {
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
