import React, { useEffect, useState, useRef } from 'react'
import { Card } from '../../components/ui'

interface LogEntry {
  timestamp: string
  type: 'INFO' | 'ERROR' | 'DEBUG'
  message: string
}

export default function Terminal() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const electron = (window as any).electronAPI
    if (electron && electron.onLog) {
      electron.onLog((newLog: LogEntry) => {
        setLogs(prev => [...prev.slice(-200), newLog]) // Guardar solo los últimos 200 logs
      })
    }
  }, [])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const clearLogs = () => setLogs([])

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-3 opacity-80">System Monitor</p>
          <h1 className="display-sm text-atelier-text-main-light dark:text-atelier-text-main-dark">
            Consola del <span className="text-primary/60 italic">Núcleo.</span>
          </h1>
        </div>
        <button 
          onClick={clearLogs}
          className="px-6 py-2 rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors"
        >
          Limpiar Pantalla
        </button>
      </div>

      <Card className="!p-0 overflow-hidden bg-black shadow-2xl border-primary/20 ring-1 ring-primary/10">
        {/* Terminal Header */}
        <div className="bg-[#1a1a1b] px-4 py-2 flex items-center gap-2 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">fyn-os-kernel-v1.5.0 --zsh</p>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 h-[500px] overflow-y-auto font-mono text-sm custom-scrollbar bg-black/90">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
              <span className="material-symbols-outlined text-6xl mb-4">terminal</span>
              <p className="text-xs uppercase tracking-widest">Esperando señales del sistema...</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 animate-fade-in border-b border-white/5 pb-1">
                  <span className="text-white/20 whitespace-nowrap">[{log.timestamp}]</span>
                  <span className={`font-bold whitespace-nowrap ${log.type === 'ERROR' ? 'text-danger' : 'text-primary'}`}>
                    {log.type}
                  </span>
                  <span className="text-white/80 break-all leading-relaxed">
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="bg-[#1a1a1b] px-4 py-1.5 flex justify-between items-center text-[9px] font-bold text-white/40 uppercase tracking-widest">
          <div className="flex gap-4">
            <span>STATUS: ACTIVE</span>
            <span>MEM: {Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>EN LÍNEA</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 p-6 glass !rounded-3xl border-primary/5">
        <span className="material-symbols-outlined text-primary text-2xl">info</span>
        <p className="text-xs text-atelier-text-muted-light dark:text-atelier-text-muted-dark leading-relaxed">
          Esta terminal muestra la comunicación interna entre la interfaz de usuario y la base de datos local SQLite. 
          Cualquier error durante el procesamiento de PDFs o carga de datos aparecerá aquí en tiempo real.
        </p>
      </div>
    </div>
  )
}
