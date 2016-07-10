# Installation

## Jspm/SystemJs

Run `jspm i aurelia-authentication` from your project root.

## Webpack

Run `npm i aurelia-authentication --save` from your project root.

Aurelia-authentication has submodules (currently only the `authFilterValueConverter`). So you need to add the additional resources to the "aurelia" section in your package.json

```json
...
"aurelia": {
  "build": {
    "resources": [
      "aurelia-authentication/authFilterValueConverter"
    ]
  }
}
```
