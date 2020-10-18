require('dotenv').config()
const express = require('express')
const app = express()
const d = require('./document')

let doc

app
.post('/', express.text({type: "application/xml", limit: process.env.REQ_SIZE_LIMIT || "200mb"}), async (req, res) => {
  try {
    const busy = await doc.isBusy()
    if (busy) {
      res.status(409).send('busy')    
    }
    const id = await doc.process(req.body)
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
.listen(process.env.PORT || 3001, async () => {
  doc = await d(process.env)
  await doc.check()
})