import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorId: string | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: null
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, errorId: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: `${error.stack}\nComponent stack:\n${errorInfo.componentStack}`
    }

    console.error('[ErrorBoundary] Caught React exception:', error, errorInfo)

    // Enviar el error de renderizado al Main Process de forma asíncrona
    const electron = (window as any).electronAPI
    if (electron && electron.logRendererError) {
      electron.logRendererError(errorData)
        .then((refId: string) => {
          this.setState({ errorId: refId })
        })
        .catch((err: any) => {
          console.error('[ErrorBoundary] Failed to send error to main process:', err)
        })
    } else {
      // Generar un ID de respaldo local
      const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
      this.setState({ errorId: `ERR-LOCAL-${yyyymmdd}-${randomHex}` })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#0e0e0f] text-white p-6 font-sans selection:bg-red-500/30">
          <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
            {/* Animated Warning Icon with Glow */}
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-20 h-20 rounded-full border border-red-500/30 flex items-center justify-center bg-red-500/5 text-red-500">
                <span className="material-symbols-outlined text-4xl">terminal</span>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-red-400">
                Consola de Emergencia
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                La interfaz sufrió una excepción inesperada. Por razones de seguridad, hemos ocultado los detalles técnicos y los hemos registrado localmente.
              </p>
            </div>

            {/* Reference ID Container */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Código de Referencia
              </p>
              <p className="font-mono text-base font-bold text-red-400 tracking-wider">
                {this.state.errorId || 'GENERANDO CÓDIGO...'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-6 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 text-xs font-bold uppercase tracking-widest transition-all duration-300 transform active:scale-95 shadow-lg shadow-red-500/5"
              >
                Reiniciar Aplicación
              </button>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Los detalles completos han sido guardados en errores.log
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
