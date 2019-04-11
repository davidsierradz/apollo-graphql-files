import { graphqlExpress } from 'apollo-server-express'
import express from 'express'
import { GraphQLUpload, graphqlUploadExpress } from 'graphql-upload'
import fs, { readdir } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import { makeExecutableSchema } from 'graphql-tools'
import cors from 'cors'
import bodyParser from 'body-parser'

const PORT = 4000

const app = express()

app.use(cors())

const typeDefs = `
  scalar Upload

  input UploadFileInput {
    file: Upload!
  }

  type File {
    path: String
    filename: String!
    mimetype: String
  }

  type Query {
    uploads: [File]
  }

  type Mutation {
    uploadFile(input: UploadFileInput!): File!
  }
`

const resolvers = {
  Mutation: {
    uploadFile: async (parent, args) => {
      try {
        const { filename, mimetype, createReadStream } = await args.input.file

        const asyncPipeline = promisify(pipeline)

        await asyncPipeline(
          createReadStream(),
          fs.createWriteStream(`build/images/${filename}`)
        )

        return { filename, mimetype, path: `build/images/${filename}` }
      } catch (e) {
        console.log(e)
        throw e
      }
    },
  },
  Upload: GraphQLUpload,
  Query: {
    uploads: async () => {
      const asyncReaddir = promisify(readdir)
      const files = (await asyncReaddir('build/images/')).map(f => ({
        path: join('build/images/', f),
        filename: f,
      }))
      return files
    },
  },
}

const myGraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

app.use(
  '/graphql',
  bodyParser.json(),
  graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
  graphqlExpress({ schema: myGraphQLSchema })
)

app.listen(PORT)
