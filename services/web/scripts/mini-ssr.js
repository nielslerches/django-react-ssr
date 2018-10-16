const fs = require("fs");
const path = require("path");

const express = require("express");
const { json } = require("body-parser");

const NODE_ENV = process.env.NODE_ENV || "development";
const HOST = process.env.HOST || "127.0.0.1";
const PORT = parseInt(process.env.PORT || "4000");
const STATS_FILE = process.env.STATS_FILE;

const app = express();
app.use(json());

app.get("/", (_, response) => {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.send('{"status": "ok"}');
});

if (NODE_ENV === "production") {
  const stats = JSON.parse(fs.readFile(path.resolve(STATS_FILE)));

  app.get("/:bundlename", (request, response) => {
    if (stats.status !== "done") {
      response.statusCode = 404;
      response.end();
    } else {
      
    }
  });
} else {
  app.get("/:bundlename", (request, response) => {
    const statsFilePath = path.resolve(STATS_FILE);
    const statsFileExists = fs.existsSync(statsFilePath);

    if (!statsFileExists) {
      response.statusCode = 404;
      response.end();
    } else {
      const stats = JSON.parse(fs.readFileSync(statsFilePath));

      if (stats.status !== "done") {
        response.statusCode = 404;
        response.end();
      } else {
        const bundleChunks = stats.chunks[request.params.bundlename];
        
        if (bundleChunks === undefined || bundleChunks.length === 0) {
          response.statusCode = 404;
          response.end();
        } else {
          const bundleChunk = bundleChunks[0];
          const render = require(bundleChunk.path).default;

          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.send(render);
        }
      }
    }
  });
}

app.listen(PORT, HOST, () => {
  console.log(`mini-ssr is running on http://${HOST}:${PORT}/`.replace('0.0.0.0', '127.0.0.1'));
});
