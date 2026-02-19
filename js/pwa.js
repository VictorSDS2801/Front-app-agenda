if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      // console.log("SW registrado!");
    } catch (err) {
      console.error("Falha ao registrar SW:", err);
    }
  });
}
