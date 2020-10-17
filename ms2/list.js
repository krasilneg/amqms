const { MongoClient } = require('mongodb')

module.exports = async ({DB_URI}) => {
  const client = new MongoClient(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  try {
    await client.connect()
    const db = client.db()
    return {
      insert: async msg => {
        await db.collection('norms').insertOne(msg)
      },
      fetch: async (offset, count) => {
        const total = await  db.collection('norms').estimatedDocumentCount()
        let result = []
        if (offset < total) {
          result = await db.collection('norms').find().skip(offset).limit(count || 10).toArray()
        } else {
          offset = total
        }

        return {
          total: total,
          limit: result.length,
          offset: offset,
          rows: result
        }
      }
    }
  } catch (err) {
    console.error(err)
    process.exit()
  }
}