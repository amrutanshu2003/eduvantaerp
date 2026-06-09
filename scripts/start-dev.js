import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const childProcesses = [];
let shuttingDown = false;

const startCommand = (name, workingDirectory, commandText) => {
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", commandText], {
          cwd: workingDirectory,
          stdio: "inherit",
        })
      : spawn("sh", ["-lc", commandText], {
          cwd: workingDirectory,
          stdio: "inherit",
        });

  childProcesses.push({ name, child });

  child.on("error", (error) => {
    console.error(`${name} failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code) => {
    if (shuttingDown) {
      return;
    }

    if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code || 1);
    }
  });
};

const stopChildProcess = (child) =>
  new Promise((resolve) => {
    if (!child.pid) {
      resolve();
      return;
    }

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }

    child.kill("SIGTERM");
    resolve();
  });

const shutdown = async (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await Promise.all(childProcesses.map(({ child }) => stopChildProcess(child)));
  process.exit(exitCode);
};

console.log("Starting Eduvanta ERP from the project root...");
console.log("Backend: http://localhost:5000");
console.log("Frontend: http://localhost:5173");
console.log("Use Ctrl + C in this terminal to stop both processes.");

startCommand("server", path.join(rootDir, "server"), "npm run dev");
startCommand("client", path.join(rootDir, "client"), "npm run dev -- --host 127.0.0.1");

process.on("SIGINT", () => {
  shutdown(0);
});

process.on("SIGTERM", () => {
  shutdown(0);
});
