const { connect } = require('amqplib')

module.exports = async ({AMQP_URI, DOC_QUEUE, STATUS_QUEUE, FETCH_COUNT}) => {
  FETCH_COUNT = FETCH_COUNT || 10
  const conn = await connect(AMQP_URI)
  const ch = await conn.createChannel()
  await ch.assertQueue(STATUS_QUEUE)
  await ch.assertQueue(DOC_QUEUE, {durable: true})
  return {
    length: async () => {
      const info = await ch.assertQueue(DOC_QUEUE, {durable: true})
      return info.messageCount
    },
    fetch: async (list) => {
      await ch.consume(DOC_QUEUE, async msg => {
        if (msg) {
          try {
            await list.insert(JSON.parse(msg.content.toString()))
            ch.ack(msg)
          } catch (err) {
            ch.nack(msg)
            throw err
          }
        }
      }, {noAck: false})
    },
    check: async () => {
      const info = await ch.assertQueue(DOC_QUEUE, {durable: true})
      if (info.messageCount == 0) { 
        ch.sendToQueue(STATUS_QUEUE, Buffer.from('DONE'))
      }
    }
  }
}