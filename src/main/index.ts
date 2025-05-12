import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import log from '../utils/log'
import { Tray, Menu } from 'electron'

let tray: Tray | null = null

function restartApp(): void {
  app.relaunch() // 重新启动应用
  app.exit(0) // 退出当前应用实例
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 监听关闭事件，阻止默认的退出行为，改为最小化窗口
  mainWindow.on('close', (event) => {
    event.preventDefault() // 阻止窗口关闭
    mainWindow?.minimize() // 最小化窗口
    mainWindow?.setSkipTaskbar(true)
  })

  tray = new Tray(join(__dirname, '../../resources/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => mainWindow?.show() }, // 恢复窗口
    {
      label: '重启',
      click: () => {
        restartApp()
      }
    },
    {
      label: '退出',
      click: () => {
        mainWindow?.destroy()
      }
    }
  ])
  tray.setToolTip('我的app')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    // 我们这里模拟桌面程序点击通知区图标实现打开关闭应用的功能
    mainWindow?.isVisible() ? mainWindow?.hide() : mainWindow?.show()
    mainWindow?.isVisible() ? mainWindow?.setSkipTaskbar(false) : mainWindow?.setSkipTaskbar(true)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev) {
    const rendererUrl = process.env['ELECTRON_RENDERER_URL'] || 'http://localhost:3000'
    mainWindow.loadURL(rendererUrl).catch((err) => {
      console.error('Failed to load URL:', err)
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch((err) => {
      console.error('Failed to load file:', err)
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => log.info('pong'))

  createWindow()
  log.info('App started')
  log.info('App version:', app.getVersion())
  log.info('App path:', app.getPath('userData'))
  log.info('App name:', app.getName())
  log.info('App is packaged:', app.isPackaged)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
