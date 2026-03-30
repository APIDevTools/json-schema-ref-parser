import { createServer } from "node:net";
import { spawn } from "node:child_process";

async function getOpenPort() {
  const probe = createServer();

  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });

  const address = probe.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected an ephemeral TCP port for browser tests");
  }

  await new Promise((resolve, reject) => {
    probe.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  return address.port;
}

const port = await getOpenPort();
const child = spawn(process.execPath, [".yarn/releases/yarn-4.13.0.cjs", "test"], {
  stdio: "inherit",
  env: {
    ...process.env,
    BROWSER: "true",
    TEST_HTTP_PORT: String(port),
    TEST_HTTP_BASE_URL: `http://localhost:${port}/`,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
