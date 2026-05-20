import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

export class Logger {
  private static logFilePathUserData: string | null = null
  private static logFilePathWorkspace: string | null = null

  private static getLogPaths(): { userDataPath: string; workspacePath: string } {
    if (!this.logFilePathUserData) {
      try {
        const userDataDir = app.getPath('userData')
        this.logFilePathUserData = path.join(userDataDir, 'errores.log')
      } catch {
        this.logFilePathUserData = path.join(process.cwd(), 'errores-fallback.log')
      }
    }

    if (!this.logFilePathWorkspace) {
      // Intentar colocarlo en el directorio actual del proceso (c:\Users\Giova\Downloads\Antigravity\Proyectos Geo\FYN 1.0\fyn-app)
      this.logFilePathWorkspace = path.join(process.cwd(), 'errores.log')
    }

    return {
      userDataPath: this.logFilePathUserData,
      workspacePath: this.logFilePathWorkspace
    }
  }

  /**
   * Genera un ID de error único y legible con formato ERR-FYN-YYYYMMDD-XXXX
   */
  public static generateErrorId(): string {
    const now = new Date()
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
    return `ERR-FYN-${yyyymmdd}-${randomHex}`
  }

  /**
   * Registra un error con su stack trace en los archivos locales errores.log
   * Retorna el ID de error único generado.
   */
  public static logError(error: any, context = 'GLOBAL'): string {
    const errorId = this.generateErrorId()
    const now = new Date().toISOString().replace('T', ' ').slice(0, 23)
    
    let errorMessage = ''
    let errorStack = ''
    let errorType = 'Error'

    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack || 'No stack trace available'
      errorType = error.name || 'Error'
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error)
      errorStack = error.stack || 'No stack trace available (Object thrown)'
      errorType = error.name || error.code || 'ObjectError'
    } else {
      errorMessage = String(error)
      errorStack = new Error().stack || 'No stack trace generated'
      errorType = 'PrimitiveError'
    }

    const logEntry = `
=========================================
[${now}] REFERENCE ID: ${errorId}
CONTEXT: ${context}
TYPE: ${errorType}
MESSAGE: ${errorMessage}
-----------------------------------------
STACK TRACE:
${errorStack}
=========================================
`
    // Imprimir en la consola para que sea capturado en la terminal del núcleo
    console.error(`[LOGGER ERROR - ${errorId}] Context: ${context} | Message: ${errorMessage}`)

    const { userDataPath, workspacePath } = this.getLogPaths()

    // Escritura asíncrona no bloqueante
    fs.appendFile(userDataPath, logEntry, 'utf8', (err) => {
      if (err) {
        console.error('[LOGGER] Error al escribir log en userData:', err)
      }
    })

    fs.appendFile(workspacePath, logEntry, 'utf8', (err) => {
      if (err) {
        // Ignorar si falla la escritura en workspace por temas de permisos fuera del entorno
        console.error('[LOGGER] Error al escribir log en workspace:', err)
      }
    })

    return errorId
  }

  /**
   * Registra un mensaje informativo general en el log
   */
  public static logInfo(message: string, context = 'INFO'): void {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 23)
    const logEntry = `[${now}] [${context}] ${message}\n`

    console.log(`[LOGGER INFO] [${context}] ${message}`)

    const { userDataPath, workspacePath } = this.getLogPaths()

    fs.appendFile(userDataPath, logEntry, 'utf8', () => {})
    fs.appendFile(workspacePath, logEntry, 'utf8', () => {})
  }
}
