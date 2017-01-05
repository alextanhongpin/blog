---
layout: post
title:  "Running a Koa Server"
date:   2017-01-03 8:52:16 +0800
categories: koa
---

Let's create a basic Koa server that will serve some api endpoints.
You can read more about [koa.js](http://koajs.com/) at the main page. We will be using the latest version of koa and its dependencies.

```bash
$ npm install koa@2 --save

$ npm install koa-router@next --save

$ npm install koa-bodyparser@next --save
```

Here's the code for a basic koa server.
```javascript
// server.js

import Koa from 'koa'
import Router from 'koa-router'

const PORT = 3000

const app = new Koa()
const route = new Router()

route.get('/', async (ctx, next) => {
    this.body = 'hello world'
})

app.use(route.routes())
app.use(route.allowedMethods())

app.listen(PORT, () => {
  console.log(`listening to port *:${PORT}.\npress ctrl + c to cancel.`)
})
```
When you run `$ node server.js` and go to `localhost:3000/` on your browser, you will see the message `hello world`.


