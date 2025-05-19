/* usage

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").then(() => {
    console.log("Service Worker registered.");
  });
}

*/

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("transformers-cache").then((cache) => {
      return cache.addAll([
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/ort-wasm-simd-threaded.jsep.mjs",
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/ort-wasm-simd-threaded.jsep.wasm"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.url.includes("ort-wasm-simd-threaded.jsep.mjs") ||
    event.request.url.includes("ort-wasm-simd-threaded.jsep.wasm")
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});