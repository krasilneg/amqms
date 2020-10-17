const { connect } = require('amqplib')

module.exports = async ({AMQP_URI, DOC_QUEUE, STATUS_QUEUE, FETCH_COUNT}) => {
  FETCH_COUNT = FETCH_COUNT || 10
  const conn = await connect(AMQP_URI)
  const ch = await conn.createChannel()
  await ch.assertQueue(STATUS_QUEUE)
  return {
    length: async () => {
      const info = await ch.assertQueue(DOC_QUEUE, {durable: true})
      return info.messageCount
    },
    fetch: async (list) => {
      let info = await ch.assertQueue(DOC_QUEUE, {durable: true})
      const n = info.messageCount < FETCH_COUNT ? info.messageCount : FETCH_COUNT
      for (let i = 0; i < n; i++) {
        const msg = await ch.get(DOC_QUEUE, {noAck: true})
        if (msg) {
          list.insert(JSON.parse(msg.content.toString()))
        }
      }
      info = await ch.assertQueue(DOC_QUEUE, {durable: true})
      if (info.messageCount == 0) { 
        ch.sendToQueue(STATUS_QUEUE, Buffer.from('DONE'))
      }
    }
  }
}