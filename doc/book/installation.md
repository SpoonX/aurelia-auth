# Installation

## Jspm/SytemJs

Run `jspm i aurelia-authentication` from your project root.

## Webpack

Run `npm i aurelia-authentication --save` from your project root.

Aurelia-authentication has submodules (currently only the authFilter). So you need to add it to the AureliaWebpackPlugin includeSubModules list.

```js
AureliaWebpackPlugin({
    includeSubModules: [
      { moduleId: 'aurelia-authentication' }
    ]
  }),
```
