# git-lfs-loader

[![NPM Version][shield-npm]][npm-url]
[![Downloads Stats][shield-downloads]][npm-url]

[npm-url]: https://npmjs.org/package/git-lfs-loader
[shield-npm]: https://img.shields.io/npm/v/git-lfs-loader.svg
[shield-downloads]: https://img.shields.io/npm/dm/git-lfs-loader.svg

A Webpack loader to prevent accidentally importing Git LFS pointer files.

## Installation

```sh
npm install --save-dev git-lfs-loader
```

## Usage

```js
// webpack.config.js

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

```

### Options

#### `errorEncountered`

You can control what happens if an error is encountered (e.g. if Git LFS is not installed) by setting this option to either `"error"` or `"warning"`.

#### `pointerFileFound`

You can control what happens if a Git LFS pointer file is found by setting this option to either `"error"` or `"warning"`.

## Contribute

Build and test:

```sh
npm ci
npm run make
```

[`embedme`](https://github.com/zakhenry/embedme) is used for code examples in the readme.
