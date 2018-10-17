const fs = require("fs");
const path = require("path");
const BundleTracker = require("webpack-bundle-tracker");

const NODE_ENV = process.env.NODE_ENV || "development";
const filename = NODE_ENV === "development" ? "[name]" : "[name]-[hash]";

class StaticRenderPlugin {
  constructor(options) {
    this.options = options;

    this.apply = this.apply.bind(this);
  }

  apply(compiler) {
    compiler.hooks.done.tap("StaticRenderPlugin", stats => {
      const chunks = stats.compilation.chunks.filter(
        chunk => this.options.entries.indexOf(chunk.id) >= 0
      );

      for (let chunk of chunks) {
        const inputFilename = chunk.files[0]; // assuming the first file acts as the entry point
        const inputFilePath = path.join(
          compiler.options.output.path,
          inputFilename
        );
        const inputFile = require(inputFilePath).default;

        const outputFilename = stats.compilation.getPath(
          this.options.output.filename,
          { chunk }
        );
        const outputFilePath = path.join(this.options.output.path, outputFilename);

        fs.writeFileSync(
          outputFilePath,
          typeof inputFile === "function" ? inputFile() : inputFile
        );
      }
    });
  }
}

const baseConfig = {
  mode: NODE_ENV,
  context: __dirname,
  entry: {},
  output: {
    path: path.resolve(__dirname, "assets", "bundles"),
    filename: filename + ".js"
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env"], ["@babel/preset-react"]]
            }
          }
        ]
      }
    ]
  }
};

const webConfig = Object.assign({}, baseConfig, {
  output: Object.assign({}, baseConfig.output, {
    path: path.resolve(baseConfig.output.path, "web")
  }),
  entry: Object.assign({}, baseConfig.entry, {
    "cms-hydrate": path.resolve(__dirname, "assets", "js", "cms", "hydrate.js"),
    "cms-client": path.resolve(__dirname, "assets", "js", "cms", "client.js")
  }),
  plugins: [
    new BundleTracker({
      path: path.resolve(__dirname, "assets", "stats"),
      filename: "web.json"
    })
  ]
});

const nodeConfig = Object.assign({}, baseConfig, {
  target: "node",
  output: Object.assign({}, baseConfig.output, {
    path: path.resolve(baseConfig.output.path, "node")
  }),
  entry: Object.assign({}, baseConfig.entry, {
    "cms-render": path.resolve(__dirname, "assets", "js", "cms", "render.js")
  }),
  plugins: [
    new BundleTracker({
      path: path.resolve(__dirname, "assets", "stats"),
      filename: "node.json"
    }),
    new StaticRenderPlugin({
      entries: ["cms-render"],
      output: {
        path: path.resolve(__dirname, "assets", "static_renders"),
        filename: filename + ".html"
      },
      stats: {
        path: path.resolve(__dirname, "assets", "stats"),
        filename: "static.json"
      }
    })
  ]
});

module.exports = [webConfig, nodeConfig];
