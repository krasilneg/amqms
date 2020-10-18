require('dotenv').config()
const express = require('express')

const q = require('./queue')
const l = require('./list')

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
.listen(process.env.PORT || 3002, async () => {
  queue = await q(process.env)
  list = await l(process.env)
  await check()
  await queue.fetch(list);
})