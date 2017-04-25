# Installation

## Aurelia-Cli

Run `npm i aurelia-authentication --save` from your project root.

Aurelia-authentication needs an installation of [aurelia-api](https://www.npmjs.com/package/aurelia-api). It also has submodules (currently only the authFilter) and makes use of `extend` and `jwt-decode`. So, add following to the `build.bundles.dependencies` section of `aurelia-project/aurelia.json`.

```js
"dependencies": [
  // ...
  "extend",
  {
    "name": "aurelia-authentication",
    "path": "../node_modules/aurelia-authentication/dist/amd",
    "main": "aurelia-authentication"
  },
  {
    "name": "jwt-decode",
    "path": "../node_modules/jwt-decode/lib",
    "main": "index"
  }
  // ...
],
```

## Jspm

Run `jspm i aurelia-authentication`

Add `aurelia-authentication` to the `bundles.dist.aurelia.includes` section of `build/bundles.js`.

Aurelia-authentication needs an installation of [aurelia-api](https://www.npmjs.com/package/aurelia-api). It also has submodules. They are imported in it's main file, so no further action is required.

If the installation results in having forks, try resolving them by running:

```sh
jspm inspect --forks
jspm resolve --only registry:package-name@version
```

E.g.

```sh
jspm inspect --forks
>     Installed Forks
>         npm:aurelia-dependency-injection 1.0.0-beta.1.2.3 1.0.0-beta.2.1.0

jspm resolve --only npm:aurelia-dependency-injection@1.0.0-beta.2.1.0
```

## Webpack

Run `npm i aurelia-authentication --save` from your project root.

Add `'aurelia-authentication'` in the `coreBundles.aurelia section` of your `webpack.config.js`.

Aurelia-authentication needs an installation of [aurelia-api](https://www.npmjs.com/package/aurelia-api). It also has submodules. They are listed as resources in the package.json. So, no further action is required.

## Typescript

Npm-based installations pick up the typings automatically. For Jspm-based installations, add to your `typings.json`:

```js
"aurelia-authentication": "github:spoonx/aurelia-authentication",
```

and run `typings i`

or run

```sh
typings i github:spoonx/aurelia-authentication
```
