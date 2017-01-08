---
layout: post
title:  "Setting up Babel for node.js"
date:   2017-01-05 8:58:16 +0800
categories: koa
comments: true
---

Previously I wrote about running a Koa server. If you have trouble running the example, you probably haven't setup Babel. For our example, Babel is required
to compile our ES5 codes to ES7.

Here's how our `package.json` will look like.

```json
// package.json
//...not shown
  "devDependencies": {
    "babel-cli": "^6.18.0",
    "babel-plugin-syntax-async-functions": "^6.13.0",
    "babel-plugin-transform-async-to-generator": "^6.16.0",
    "babel-preset-es2015": "^6.18.0",
    "babel-preset-stage-3": "^6.17.0"
  }
```


Create a `.bablerc` file too. It will contain the config for our babel.

```
{
  "presets": ["es2015", "stage-3"],
  "plugins": ["transform-async-to-generator"]
}
```


To run our server with babel, add this to our start command in package.json.

```
  "scripts": {
    "start": "nodemon server.js --exec babel-node",
    "build": "babel . -d dist",
  }
```

Now you can write your node.js server side code in ES7 :smile:.
