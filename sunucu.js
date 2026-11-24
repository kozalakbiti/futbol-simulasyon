// Club Manager: Glory Road - Node.js ile basit yerel statik sunucu.
// Kullanim: node sunucu.js [port] [--lan]   (varsayilan 8000)
//   Varsayilan: yalnizca 127.0.0.1 (bu bilgisayar).
//   --lan: 0.0.0.0 (ayni Wi-Fi'daki telefon/tablet de acabilir); yerel ag IP'leri yazdirilir.
// Nokta ile baslayan yollar (.git, .claude ...) hicbir modda sunulmaz. Harici paket gerektirmez.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = __dirname;
const ARGS = process.argv.slice(2);
const LAN = ARGS.includes("--lan");
const HOST = LAN ? "0.0.0.0" : "127.0.0.1";
const PORT_ARG = Number(ARGS.find((a) => /^\d+$/.test(a)));
const PORT = PORT_ARG >= 1 && PORT_ARG <= 65535 ? PORT_ARG : 8000;
let ROOT_REAL = ROOT;
try { ROOT_REAL = fs.realpathSync.native(ROOT); } catch (e) {}

// Gizli yol: koke gore herhangi bir parca nokta ile basliyorsa (.git, .claude ...)
function hiddenRel(rel) {
  return rel.split(/[\\/]+/).some((p) => p.startsWith("."));
}
// DNS rebinding'e karsi: yalnizca localhost ya da IP adresiyle gelen istekler
function hostOk(h) {
  if (!h) return false;
  const name = h.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
  return name === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(name) || name.includes(":");
}

// Yerel ag IPv4 adresleri (Wi-Fi/kablosuz once; sanal adaptorler sona)
function lanAddresses() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] || []) {
      const v4 = n.family === "IPv4" || n.family === 4;
      if (!v4 || n.internal || n.address.startsWith("169.254.")) continue;
      const virt = /vethernet|virtual|vmware|vbox|hyper-v|wsl|docker|loopback|tailscale|zerotier/i.test(name);
      const wifi = /wi-?fi|wlan|wireless|kablosuz/i.test(name);
      out.push({ name, address: n.address, rank: wifi ? 0 : virt ? 2 : 1 });
    }
  }
  return out.sort((a, b) => a.rank - b.rank);
}

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
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
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
  if (!hostOk(req.headers.host)) return send(res, 403, "Erisim engellendi");

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "Gecersiz adres");
  }

  // Null bayt fs çağrılarında eşzamanlı hata fırlatır (süreç çöker); .git servis edilmez
  if (urlPath.includes("\0")) return send(res, 400, "Gecersiz adres");
  if (/(^|[\\/])\./.test(urlPath)) return send(res, 403, "Erisim engellendi"); // .git, .claude vb.
  // Windows 8.3 kisa adlari (GIT~1 = .git) ve alternatif veri akislari (dosya::$DATA)
  if (urlPath.includes("~") || urlPath.includes(":")) return send(res, 403, "Erisim engellendi");

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
    // Gercek yol (kisa ad, baglanti, buyuk/kucuk harf cozulmus) kok icinde ve gizli olmamali
    let real;
    try { real = fs.realpathSync.native(filePath); } catch (e) { return send(res, 404, "Bulunamadi: " + urlPath); }
    const rel = path.relative(ROOT_REAL, real);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || hiddenRel(rel)) return send(res, 403, "Erisim engellendi");
    filePath = real;
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
  console.log(`Oyun bu bilgisayarda: http://127.0.0.1:${PORT}`);
  if (LAN) {
    const ips = lanAddresses();
    console.log("");
    if (!ips.length) {
      console.log("Yerel ag IP adresi bulunamadi (Wi-Fi bagli mi?).");
    } else {
      console.log("TELEFONDAN ACMAK ICIN (ayni Wi-Fi aginda olmali):");
      for (const ip of ips) console.log(`  http://${ip.address}:${PORT}    (${ip.name})`);
      console.log("Windows Guvenlik Duvari sorarsa 'Ozel aglar' icin izin verin.");
    }
  }
  console.log("");
  console.log("Kapatmak icin bu pencereyi kapatin (veya Ctrl+C).");
});
