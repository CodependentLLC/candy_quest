import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import http from "node:http";

const port = 3317;
const server = spawn(process.execPath, ["server.js"], {
  env: {...process.env, PORT:String(port)},
  stdio: ["ignore", "pipe", "pipe"]
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server did not start")), 5000);
    server.stdout.on("data", chunk => {
      if (!chunk.toString().includes(`127.0.0.1:${port}`)) return;
      clearTimeout(timer);
      resolve();
    });
    server.once("error", reject);
    server.once("exit", code => reject(new Error(`server exited with ${code}`)));
  });
}

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({host:"127.0.0.1",port,path}, res => {
      res.resume();
      res.once("end", () => resolve(res.statusCode));
    });
    req.once("error", reject);
    req.end();
  });
}

try {
  await waitForServer();
  assert.equal(await request("/%E0%A4%A"), 400, "malformed URL should return 400");
  assert.equal(await request("/assets/does-not-exist.png"), 404, "missing file should return 404");
  assert.equal(await request("/index.html"), 200, "valid asset should return 200");
  console.log("Server tests passed.");
} finally {
  server.kill();
}
