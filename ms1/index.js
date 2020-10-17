const express = require('express')
const conf = require('dotenv').config().parsed
const app = express()
const d = require('./document')

let doc

const checker = async () => {
  try {
    const stop = await doc.check()
    if (!stop) setImmediate(checker)
  } catch (err) {
    console.error(err.message)
  }
}

app
.post('/', express.text({type: "application/xml", limit: conf.REQ_SIZE_LIMIT || "200mb"}), async (req, res) => {
  try {
    const busy = await doc.isBusy()
    if (busy) {
      res.status(409).send('busy')    
    }
    const id = await doc.process(req.body)
    setImmediate(checker)
    res.send(id)
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message + '\n' + err.stack)
  }
})
.get('/status/:id', async (req, res) => {
  try {
    const status = await doc.status(req.params.id)
    res.send(status)
  } catch (err) {
    res.status(500).send(err.message + '\n' + err.stack)
  }
})
.listen(conf.PORT || 3001, async () => {
  doc = await d(conf)
  const busy = await doc.isBusy()
  if (busy) {
    setImmediate(checker)
  }
})