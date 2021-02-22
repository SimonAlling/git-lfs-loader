module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|jpe?g)$/,
        use: [
          {
            loader: "file-loader",
          },
          {
            loader: "git-lfs-loader",
            options: {
              errorEncountered: "error",
              pointerFileFound: "warning",
            },
          },
        ],
      },
    ],
  },
}
