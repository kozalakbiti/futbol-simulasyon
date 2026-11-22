// Club Manager: Glory Road - Node.js ile basit yerel statik sunucu.
// Kullanim: node sunucu.js [port]   (varsayilan 8000)
// Yalnizca 127.0.0.1'e baglanir; yerel agdan erisilemez. Harici paket gerektirmez.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const HOST = "127.0.0.1";
const PORT = Number(process.argv[2]) || 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function send(res, code, msg) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(msg);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Yontem desteklenmiyor");

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "Gecersiz adres");
  }

  // Null bayt fs çağrılarında eşzamanlı hata fırlatır (süreç çöker); .git servis edilmez
  if (urlPath.includes("\0")) return send(res, 400, "Gecersiz adres");
  if (/(^|[\\/])\.git([\\/]|$)/i.test(urlPath)) return send(res, 403, "Erisim engellendi");

  let filePath = path.normalize(path.join(ROOT, urlPath));
  // Klasor disina cikmayi (../) engelle
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return send(res, 403, "Erisim engellendi");

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      return fs.stat(filePath, (err2, st2) => serveFile(err2, st2));
    }
    serveFile(err, st);
  });

  function serveFile(err, st) {
    if (err || !st.isFile()) return send(res, 404, "Bulunamadi: " + urlPath);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": st.size,
      // Gelistirme sirasinda degisiklikler hemen gorunsun
      "Cache-Control": "no-cache",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(filePath).on("error", () => res.destroy()).pipe(res);
  }
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`${PORT} portu baska bir program tarafindan kullaniliyor. Oyun zaten acik olabilir.`);
  } else {
    console.error("Sunucu hatasi:", e.message);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Oyun http://${HOST}:${PORT} adresinde calisiyor. Kapatmak icin bu pencereyi kapatin (veya Ctrl+C).`);
});
