const { contextBridge: s, ipcRenderer: o } = require("electron");
s.exposeInMainWorld("electronAPI", {
  invoke: (e, ...n) => o.invoke(e, ...n),
  parseAndSavePDF: (e) => o.invoke("pdf:parseAndSave", e),
  showOpenDialog: () => o.invoke("show-open-dialog"),
  logRendererError: (e) => o.invoke("system:log-renderer-error", e),
  onLog: (e) => {
    o.on("system:log", (n, r) => e(r));
  },
  on: (e, n) => {
    o.on(e, (r, ...i) => n(...i));
  }
});
//# sourceMappingURL=preload.js.map
