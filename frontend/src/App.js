import React, { Component } from 'react';
import gql from 'graphql-tag';
import { ApolloProvider, Query, Mutation } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createUploadLink } from 'apollo-upload-client';

import './App.css';

const client = new ApolloClient({
  link: createUploadLink({
    uri: 'http://localhost:4000/graphql',
  }),
  cache: new InMemoryCache(),
});

const UpdateFile = ({ updateUploads }) => {
  let input;

  return (
    <Mutation
      mutation={gql`
        mutation UploadFile($input: UploadFileInput!) {
          uploadFile(input: $input) {
            filename
            path
          }
        }
      `}
      update={(cache, { data: { uploadFile } }) => {
        uploadFile && updateUploads(uploadFile);
      }}
    >
      {(addFile, { loading, error }) => {
        return (
          <div>
            <form
              onSubmit={e => {
                e.preventDefault();
                addFile({
                  variables: {
                    input: {
                      file: input.files[0],
                    },
                  },
                });
                input.value = '';
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
            {loading && <p>Loading...</p>}
            {error && <p>Error :( Please try again</p>}
          </div>
        );
      }}
    </Mutation>
  );
};

const GetUploadsQuery = () => (
  <Query
    query={gql`
      query {
        uploads {
          filename
          path
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error</p>;

      return <GetUploads uploads={data.uploads} />;
    }}
  </Query>
);

class GetUploads extends Component {
  constructor(props) {
    super(props);

    this.state = {
      uploads: props.uploads,
    };
  }

  updateUploads = upload => {
    this.setState({
      uploads: [...this.state.uploads, upload],
    });
  };

  render() {
    return (
      <>
        <UpdateFile updateUploads={this.updateUploads} />
        {this.state.uploads.map(({ filename, path }) => (
          <div key={path}>
            <p>
              {path}: {filename}
            </p>
          </div>
        ))}
      </>
    );
  }
}

class App extends Component {
  render() {
    return (
      <ApolloProvider client={client}>
        <div className="App">
          <GetUploadsQuery />
        </div>
      </ApolloProvider>
    );
  }
}

export default App;
