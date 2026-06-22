import http from "node:http";

const paths = [
  "/documents/images/pmam-brasao.png",
  "/documents/images/cfap-brasao.jpg",
  "/logo/IMG_7728.PNG"
];

const ports = [3000, 3001, 3002, 3003, 3004, 5173, 5174];

async function checkPortAndPath(port, path) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: "127.0.0.1",
      port: port,
      path: path,
      timeout: 1000
    }, (res) => {
      resolve({
        port,
        path,
        status: res.statusCode,
        contentType: res.headers["content-type"],
        contentLength: res.headers["content-length"]
      });
    });

    req.on("error", () => {
      resolve({ port, path, status: "CONN_ERR" });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({ port, path, status: "TIMEOUT" });
    });
  });
}

async function main() {
  console.log("Iniciando varredura de portas locais e caminhos de imagens...");
  for (const port of ports) {
    console.log(`\nTestando Porta: ${port}`);
    let active = false;
    for (const path of paths) {
      const result = await checkPortAndPath(port, path);
      if (result.status !== "CONN_ERR") {
        active = true;
        console.log(`  Path ${path}: Status ${result.status}, Type: ${result.contentType || "N/A"}, Size: ${result.contentLength || "N/A"} bytes`);
      }
    }
    if (!active) {
      console.log(`  Porta ${port} inativa ou sem conexões HTTP respondendo.`);
    }
  }
}

main().catch(console.error);
