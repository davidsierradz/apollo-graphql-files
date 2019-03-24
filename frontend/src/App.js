import React, { Component } from 'react';
import gql from 'graphql-tag';
import { ApolloProvider, Query, Mutation } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createUploadLink } from 'apollo-upload-client';

import './App.css';

//const client = new ApolloClient({
//uri: 'http://localhost:4000/graphql',
//});

const client = new ApolloClient({
  link: createUploadLink({
    uri: 'http://localhost:4000/graphql',
  }),
  cache: new InMemoryCache(),
});

const UpdateFile = () => {
  let input;

  return (
    <Mutation
      mutation={gql`
        mutation UploadFile($input: UploadFileInput!) {
          uploadFile(input: $input) {
            filename
            mimetype
          }
        }
      `}
    >
      {(addFile, { data }) => (
        <div>
          <form
            onSubmit={e => {
              e.preventDefault();
              console.table(input);
              addFile({
                variables: {
                  input: {
                    file: input.files[0],
                  },
                },
              });
            }}
          >
            <input
              type="file"
              ref={node => {
                input = node;
              }}
            />
            <button type="submit">Upload File</button>
          </form>
        </div>
      )}
    </Mutation>
  );
};

const GetBooks = () => (
  <Query
    query={gql`
      query {
        books {
          title
          author
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error</p>;

      return (
        <>
          <UpdateFile />
          {data.books.map(({ title, author }) => (
            <div key={title}>
              <p>
                {author}: {title}
              </p>
            </div>
          ))}
        </>
      );
    }}
  </Query>
);

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <div className="App">
          <GetBooks />
        </div>
      </ApolloProvider>
    );
  }
}

export default App;
