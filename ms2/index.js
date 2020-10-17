const express = require('express')
const conf = require('dotenv').config().parsed
q = require('./queue')
l = require('./list')

let queue
let list

const app = express()

const check = async () => {
  await queue.check()
  setImmediate(check)
}

app
.get('/', async (req, res) => {
  const length = await queue.length()
  res.send('' + length)
})
.get('/list', async (req, res) => {
  const result = await list.fetch(req.query.offset | 0, (req.query.count | 0) || 10)
  res.send(result)
})
.listen(conf.PORT || 3002, async () => {
  queue = await q(conf)
  list = await l(conf)
  await check()
  await queue.fetch(list);
})