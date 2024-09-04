# electron-publisher-cos

Electron builder publish plugin for Tencent Cloud COS

腾讯云 COS `electron-builder` 发布插件

# Install

```bash
npm install --save-dev electron-publisher-cos
```

or

```bash
yarn add electron-publisher-cos -D
```

# Usage

1. Update the `electron-builder` configuration options for the `publish` provider.

```js
// electron-builder.config.js
{
  "publish": [
    {
      "provider": "generic",
      "publishAutoUpdate": true,
      // or your cdn url
      "url": "https:///${name}/${os}/${arch}/"
    },
    {
        "provider": "custom",
        "providerName": "cos",
        "publishAutoUpdate": true,
        "bucket": "your-cos-bucket",
        "region": "your-cos-region",
        "path": "your-cos-path",

        /**
         * If you are using the environment variables COS_SECRET_ID and COS_SECRET_KEY, you can omit the settings here.
         */
        "secretId": process.env.secretId,
        "secretKey": process.env.secretKey,
    }
  ]
}
```

2. Add `electron-publisher-custom.js` on `build` folder.

```js
// build/electron-publisher-custom.js
const COSPublisher = require('electron-publisher-cos');
module.exports = COSPublisher;
```
