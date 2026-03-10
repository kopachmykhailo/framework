const http = require("http");
const config = require("./config");
const log = require("./logger");

const server = http.createServer((req, res) => {

  if (req.method === "GET" && req.url === "/health") {

    const health = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };

    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(health));

    if (config.NODE_ENV === "development") {
      log("INFO", req.method, req.url, 200);
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");

  if (config.NODE_ENV === "development") {
    log("ERROR", req.method, req.url, 404);
  }

});

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Server running at http://${config.HOSTNAME}:${config.PORT}`);
});

function gracefulShutdown(signal) {

  console.log(`Received ${signal}`);

  const timeout = setTimeout(() => {
    console.error("Force shutdown");
    process.exit(1);
  }, 10000);

  server.close((err) => {

    clearTimeout(timeout);

    if (err) {
      console.error("Shutdown error");
      process.exit(1);
    }

    console.log("Server closed gracefully");
    process.exit(0);

  });

}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {

  console.error("Uncaught Exception:", err.message);

  gracefulShutdown("uncaughtException");

});

process.on("unhandledRejection", (reason) => {

  console.error("Unhandled Rejection:", reason);

  gracefulShutdown("unhandledRejection");

});