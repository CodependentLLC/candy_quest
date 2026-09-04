import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function safePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return { error: 400 };
  }
  const requested = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(__dirname, "." + requested);
  if (!resolved.startsWith(__dirname + path.sep) && resolved !== __dirname) {
    return { error: 403 };
  }
  return { path: resolved };
}

const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method || "")) {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  try {
    const safe = safePath(req.url || "/");
    if (safe.error) {
      res.writeHead(safe.error, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(safe.error === 400 ? "Bad Request" : "Forbidden");
      return;
    }
    let filePath = safe.path;

    let info;
    try {
      info = await stat(filePath);
    } catch {
      // SPA-style fallback is intentionally not used; missing assets should 404 clearly.
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    if (info.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const body = await readFile(filePath);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
      "Cross-Origin-Resource-Policy": "same-origin",
    });

    if (req.method === "HEAD") res.end();
    else res.end(body);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Candy Quest is running at http://${HOST}:${PORT}`);
  console.log("Press Ctrl+C to stop the server.");
});
