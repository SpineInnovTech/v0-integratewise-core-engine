window.__cap = [];
window.addEventListener("error", (e) => {
  window.__cap.push("ERROR: " + (e.message || "") + " @ " + (e.filename || "") + ":" + (e.lineno || ""));
});
window.addEventListener("unhandledrejection", (e) => {
  window.__cap.push("REJECT: " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason));
});
