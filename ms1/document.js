const { MongoClient, ObjectID } = require('mongodb')
const { DOMParser } = require('xmldom')
const { select } = require('xpath')
const { connect } = require('amqplib')

function walk(el, cb) {
  if (!el.childNodes)
    return
  for (let i = 0; i < el.childNodes.length; i++) {
    if (el.childNodes.item(i).nodeType == 1)
      cb(el.childNodes.item(i))
  }
}

module.exports = async ({DB_URI, AMQP_URI, DOC_QUEUE, STATUS_QUEUE}) => {
  const client = new MongoClient(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  try {
    await client.connect()
    const db = client.db()
    const conn = await connect(AMQP_URI)
    const ch = await conn.createChannel()
    await ch.assertQueue(DOC_QUEUE, {durable: true})
    await ch.assertQueue(STATUS_QUEUE, {durable: true})
    return {
      isBusy: async () => {
        const docs = await db.collection('docs').find().sort({_id: -1}).limit(1).toArray()
        if (docs.length && !docs[0].done)
          return true
        return false
      },
      process: async (xml) => {
        const doc = new DOMParser().parseFromString(xml, 'text/xml')
        const sections = select('/base/ResourcesDirectory/ResourceCategory/Section', doc)
        const msgs = []
        sections[0].nodeType
        for (collection of sections) {
          walk(collection, section => {
            walk (section, subSection => {
              walk(subSection, table => {
                msgs.push({
                  collection: collection.getAttribute('Name'),
                  collectionCode: collection.getAttribute('Code'),
                  section: section.getAttribute('Name'),
                  sectionCode: section.getAttribute('Code'),
                  subSection: subSection.getAttribute('Name'),
                  subSectionCode: subSection.getAttribute('Code'),
                  table: table.getAttribute('Name'),
                  tableCode: table.getAttribute('Code')                    
                })
              })
            })
          })
        }
        for (msg of msgs) {
          ch.sendToQueue(DOC_QUEUE, Buffer.from(JSON.stringify(msg)))
        }
        const d = await db.collection('docs').insertOne({done: false})
        return d.insertedId
      },
      status: async id => {
        const d = await db.collection('docs').findOne({_id: ObjectID(id)})
        return d ? (d.done ? 'FINISHED' : 'PARSING') : 'UNKNOWN'
      },
      check: async () => {
        const msg = await ch.get(STATUS_QUEUE, {noAck: false})
        if (msg) {
          if (msg.content.toString() == 'DONE') {
            const docs = await db.collection('docs').find().sort({_id: -1}).limit(1).toArray()
            if (docs.length && !docs[0].done) {
              await db.collection('docs').updateOne({_id: docs[0]._id}, {$set: {done: true}})
            }
            ch.ack(msg)
            return true
          }
        }
        return false
      }
    }
  } catch (err) {
    console.error(err)
    process.exit()
  }
}