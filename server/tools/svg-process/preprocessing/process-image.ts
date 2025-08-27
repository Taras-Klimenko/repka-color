import { spawn } from "node:child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runSLIC(imagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = path.resolve(__dirname, "slic_segment.py");
    const python = spawn("C:\\Users\\Taras\\AppData\\Local\\Programs\\Python\\Python311\\python.exe", [script, imagePath]);

    python.stdout.on("data", (data) => {
      console.log(`Python: ${data}`);
    });

    python.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
    });

    python.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

runSLIC(path.resolve("tools/original/4.jpg")).catch(console.error);
