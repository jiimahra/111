/**
 * Production server for Expo web build + Expo Go mobile manifests.
 *
 * Routes:
 * - GET /status                          → health check
 * - GET / or /manifest + expo-platform   → Expo Go manifest JSON
 * - GET /manifest.webmanifest            → PWA manifest
 * - GET /sw.js                           → Service worker
 * - GET /pwa-icon-*.png                  → PWA icons
 * - Everything else                      → Expo web build (SPA) or static files
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const WEB_BUILD_DIR = path.join(STATIC_ROOT, "web");
const PWA_DIR = path.resolve(__dirname, "pwa");
const ICON_SRC = path.resolve(__dirname, "..", "assets", "images", "icon.png");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
};

// PWA install prompt + meta tags injected into index.html
const PWA_INJECT = `
  <link rel="manifest" href="/manifest.webmanifest">
  <meta name="theme-color" content="#059669">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="सहारा">
  <link rel="apple-touch-icon" href="/pwa-icon-192.png">
  <style>
    #sahara-install-banner {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 99999;
      background: #064E3B;
      color: #fff;
      padding: 14px 16px;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #sahara-install-banner.show { display: flex; align-items: center; gap: 12px; }
    #sahara-install-banner img { width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0; }
    #sahara-install-banner .info { flex: 1; }
    #sahara-install-banner .info b { display: block; font-size: 15px; }
    #sahara-install-banner .info span { font-size: 12px; color: #A7F3D0; }
    #sahara-install-btn {
      background: #059669; color: #fff; border: none;
      padding: 10px 18px; border-radius: 10px; font-size: 14px;
      font-weight: 700; cursor: pointer; white-space: nowrap;
      flex-shrink: 0;
    }
    #sahara-install-btn:hover { background: #047857; }
    #sahara-install-close {
      background: none; border: none; color: rgba(255,255,255,0.6);
      font-size: 22px; cursor: pointer; padding: 0 4px; line-height: 1;
      flex-shrink: 0;
    }
    #sahara-ios-banner {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 99999;
      background: #064E3B;
      color: #fff;
      padding: 16px;
      text-align: center;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      border-radius: 16px 16px 0 0;
    }
    #sahara-ios-banner.show { display: block; }
    #sahara-ios-banner .ios-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
    #sahara-ios-banner .ios-steps { font-size: 13px; color: #A7F3D0; line-height: 1.8; }
    #sahara-ios-banner .ios-close {
      position: absolute; top: 12px; right: 16px;
      background: none; border: none; color: rgba(255,255,255,0.6);
      font-size: 22px; cursor: pointer;
    }
  </style>
  <script>
    (function() {
      var DISMISSED_KEY = "sahara_install_dismissed";
      if (localStorage.getItem(DISMISSED_KEY)) return;

      var ua = navigator.userAgent;
      var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      var isAndroid = /Android/i.test(ua);
      var isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;

      if (isStandalone) return; // Already installed

      var deferredPrompt = null;

      // Android / Chrome install prompt
      window.addEventListener("beforeinstallprompt", function(e) {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(showAndroidBanner, 2000);
      });

      function showAndroidBanner() {
        var banner = document.getElementById("sahara-install-banner");
        if (banner) banner.classList.add("show");
      }

      document.addEventListener("DOMContentLoaded", function() {
        // Android banner
        var installBtn = document.getElementById("sahara-install-btn");
        var closeBtn = document.getElementById("sahara-install-close");
        var banner = document.getElementById("sahara-install-banner");

        if (installBtn) {
          installBtn.addEventListener("click", function() {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then(function() {
                deferredPrompt = null;
                if (banner) banner.classList.remove("show");
              });
            }
          });
        }
        if (closeBtn) {
          closeBtn.addEventListener("click", function() {
            if (banner) banner.classList.remove("show");
            localStorage.setItem(DISMISSED_KEY, "1");
          });
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register("/sw.js").catch(function() {});
        }

        // iOS banner
        if (isIOS && !isStandalone) {
          var iosBanner = document.getElementById("sahara-ios-banner");
          var iosClose = document.getElementById("sahara-ios-close");
          if (iosBanner) {
            setTimeout(function() { iosBanner.classList.add("show"); }, 2000);
          }
          if (iosClose) {
            iosClose.addEventListener("click", function() {
              iosBanner.classList.remove("show");
              localStorage.setItem(DISMISSED_KEY, "1");
            });
          }
        }
      });
    })();
  </script>`;

const PWA_BANNERS = `
  <!-- Android/Chrome Install Banner -->
  <div id="sahara-install-banner">
    <img src="/pwa-icon-192.png" alt="सहारा">
    <div class="info">
      <b>सहारा App Install करें</b>
      <span>Home screen पर add करें — बिल्कुल मुफ्त</span>
    </div>
    <button id="sahara-install-btn">Install करें</button>
    <button id="sahara-install-close">&times;</button>
  </div>

  <!-- iOS Safari Install Banner -->
  <div id="sahara-ios-banner">
    <button class="ios-close" id="sahara-ios-close">&times;</button>
    <div class="ios-title">📲 सहारा App Install करें</div>
    <div class="ios-steps">
      Safari में <strong>Share button</strong> दबाएं (नीचे □↑)<br>
      फिर <strong>"Add to Home Screen"</strong> चुनें<br>
      और <strong>सहारा</strong> आपके phone में save हो जाएगी! 🎉
    </div>
  </div>`;

function hasWebBuild() {
  return fs.existsSync(path.join(WEB_BUILD_DIR, "index.html"));
}

function injectPWA(html) {
  // Inject meta tags before </head>
  html = html.replace("</head>", PWA_INJECT + "\n</head>");
  // Inject banners before </body>
  html = html.replace("</body>", PWA_BANNERS + "\n</body>");
  return html;
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Manifest not found for platform: ${platform}` }));
    return;
  }
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveWebApp(urlPath, res) {
  let filePath = path.join(WEB_BUILD_DIR, urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(WEB_BUILD_DIR, "index.html");
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "text/html; charset=utf-8";

  if (ext === ".html") {
    let html = fs.readFileSync(filePath, "utf-8");
    html = injectPWA(html);
    res.writeHead(200, { "content-type": contentType, "cache-control": "no-cache" });
    res.end(html);
  } else {
    const content = fs.readFileSync(filePath);
    const headers = { "content-type": contentType };
    if (ext === ".js" || ext === ".css") {
      headers["cache-control"] = "public, max-age=31536000, immutable";
    }
    res.writeHead(200, headers);
    res.end(content);
  }
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

const webBuildAvailable = hasWebBuild();
const manifestData = fs.readFileSync(path.join(PWA_DIR, "manifest.webmanifest"), "utf-8");
const swData = fs.readFileSync(path.join(PWA_DIR, "sw.js"), "utf-8");
const iconData = fs.existsSync(ICON_SRC) ? fs.readFileSync(ICON_SRC) : null;

console.log(`Web build available: ${webBuildAvailable}`);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  // Health check
  if (pathname === "/status") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // PWA manifest
  if (pathname === "/manifest.webmanifest") {
    res.writeHead(200, { "content-type": "application/manifest+json", "cache-control": "no-cache" });
    res.end(manifestData);
    return;
  }

  // Service worker
  if (pathname === "/sw.js") {
    res.writeHead(200, { "content-type": "application/javascript", "cache-control": "no-cache" });
    res.end(swData);
    return;
  }

  // PWA icons
  if ((pathname === "/pwa-icon-192.png" || pathname === "/pwa-icon-512.png") && iconData) {
    res.writeHead(200, { "content-type": "image/png", "cache-control": "public, max-age=86400" });
    res.end(iconData);
    return;
  }

  // Expo Go manifest requests
  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }
  }

  // Browser requests — serve web app
  if (webBuildAvailable) {
    return serveWebApp(pathname, res);
  }

  // Fallback: mobile static files
  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`सहारा server on port ${port} | web: ${webBuildAvailable} | PWA: enabled`);
});
