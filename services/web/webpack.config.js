const path = require("path");
const BundleTracker = require("webpack-bundle-tracker");

const NODE_ENV = process.env.NODE_ENV || "development";
const outputFilename = NODE_ENV === "development" ? "[name]" : "[name]-[hash]";

const baseConfig = {
  mode: NODE_ENV,
  context: __dirname,
  entry: {},
  output: {
    path: path.resolve(__dirname, "assets", "bundles"),
    filename: outputFilename + ".js"
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
    "cms-render": path
      .resolve(__dirname, "assets", "js", "cms", "render.js")
      .toString()
  }),
  plugins: [
    new BundleTracker({
      path: path.resolve(__dirname, "assets", "stats"),
      filename: "node.json"
    })
  ]
});



module.exports = [webConfig, nodeConfig];
