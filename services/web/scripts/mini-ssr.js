const fs = require("fs");
const path = require("path");

const express = require("express");
const { json } = require("body-parser");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = parseInt(process.env.PORT || "4000");
const STATS_FILE = process.env.STATS_FILE;
const PRELOADED_BUNDLES = process.env.PRELOADED_BUNDLES || "";

const app = express();
app.use(json());

class ResponseTransformer {
  constructor(statusCode, headers, body) {
    this.statusCode = statusCode;
    this.headers = headers;
    this.body = body;

    this.transform = this.transform.bind(this);
  }

  transform(response) {
    response.statusCode = this.statusCode;
    
    for (let key of Object.keys(this.headers)) {
      response.setHeader(key, this.headers[key]);
    }

    response.send(this.body);
  }
}

function serverSideRender(moduleExport) {
  switch (typeof moduleExport) {
    case 'function':
      return (request) => {
        const responseBody = moduleExport;
        return new ResponseTransformer(200, {'Content-Type': 'text/html; charset=utf-8'}, responseBody);
      }

    case 'string':
      return (_) => {
        const responseBody = moduleExport;
        return new ResponseTransformer(200, {'Content-Type': 'text/html; charset=utf-8'}, responseBody);
      }

    default:
      return (_) => {
        return new ResponseTransformer(501, {}, '');
      }
  }
}

app.get("/", (_, response) => {
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.send('{"status": "ok"}');
});

app.get("/:bundlename", (request, response) => {
  const stats = JSON.parse(fs.readFileSync(STATS_FILE));
  const preloadedBundles = {};

  let bundlesToPreload = [];
  if (PRELOADED_BUNDLES === "all") {
    bundlesToPreload = Object.keys(stats.chunks);
  } else {
    bundlesToPreload = PRELOADED_BUNDLES.split(',');
  }

  for (let bundlename of bundlesToPreload) {
    const bundleChunks = stats.chunks[bundlename];
    const bundleChunk = bundleChunks[0];
    const moduleExport = require(bundleChunk.path).default;
    preloadedBundles[bundlename] = moduleExport;
  }

  let moduleExport;

  if (request.params.bundlename in preloadedBundles) {
    moduleExport = preloadedBundles[request.params.bundlename];
  } else {
    const bundleChunks = stats.chunks[request.params.bundlename];

    if (bundleChunks === undefined) {
      response.statusCode = 404;
      response.end();
    } else {
      const bundleChunk = bundleChunks[0];
      moduleExport = require(bundleChunk.path).default;
    }
  }

  const getResponseTransformer = serverSideRender(moduleExport);
  const responseTransformer = getResponseTransformer(request);

  responseTransformer.transform(response);
});

app.listen(PORT, HOST, () => {
  console.log(
    `mini-ssr is running on http://${HOST}:${PORT}/`.replace(
      "0.0.0.0",
      "127.0.0.1"
    )
  );
});
