import { ApolloServer, gql } from 'apollo-server';
import { GraphQLUpload } from 'graphql-upload';
import fs, { readdir } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = gql`
  input UploadFileInput {
    file: Upload!
  }

  type File {
    path: String
    filename: String!
    mimetype: String
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Query {
    uploads: [File]
  }

  type Mutation {
    uploadFile(input: UploadFileInput!): File!
  }
`;

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Mutation: {
    uploadFile: async (parent, args, context, info) => {
      try {
        const { filename, mimetype, encoding, createReadStream } = await args
          .input.file;

        const asyncPipeline = promisify(pipeline);

        await asyncPipeline(
          createReadStream(),
          fs.createWriteStream(`build/images/${filename}`),
        );

        return { filename, mimetype, path: `build/images/${filename}` };
      } catch (e) {
        console.log(e);
      }
    },
  },
  Upload: GraphQLUpload,
  Query: {
    uploads: async () => {
      const asyncReaddir = promisify(readdir);
      let allFiles = [];
      const files = (await asyncReaddir('build/images/')).map(f => ({
        path: join('build/images/', f),
        filename: f,
      }));
      return files;
    },
  },
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({ typeDefs, resolvers });

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
