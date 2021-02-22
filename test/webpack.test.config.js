const path = require("path")

module.exports = {
  mode: "development",
  devtool: false,
  entry: {
    index: path.resolve(__dirname, "index.js"),
  },
  output: {
    publicPath: "/",
  },
  stats: {
    errorDetails: false,
  },
}
