import log from 'electron-log/main'
import { app } from 'electron'
import * as path from 'node:path'

log.initialize()

// 获取应用的安装目录路径
const installPath = path.dirname(app.getPath('exe'))

// 设置日志文件路径到安装路径
log.transports.file.resolvePath = () => path.join(installPath + '/logs', 'app.log')

log.transports.console.level = 'debug' // 控制台输出的日志等级
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] {level}: {text}' // 自定义控制台输出的日志格式
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}]: {text}' // 自定义文件日志格式
log.transports.file.level = process.env.NODE_ENV === 'development' ? false : 'info' // 设置日志写入文件的级别

// 设置日志文件最大大小为 5MB，超过该大小会自动滚动
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB

export default log
