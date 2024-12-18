import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client';
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { ErrorResponse, onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { RetryLink } from '@apollo/client/link/retry';

export const createApolloClient = (
  callLogout: (includeFromState?: boolean) => Promise<void>,
) => {
  const uri = `${process.env.REACT_APP_PROXY_URI}/graphql`;

  const subscriptionUri = `${uri?.replace?.('http', 'ws')}`;

  const wsLink = new GraphQLWsLink(
    createClient({
      url: subscriptionUri,
      connectionParams: {
        withCredentials: true,
      },
      retryAttempts: 5,
      lazy: true,
      shouldRetry: () => true,
    }),
  );

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
  });

  let hasLoggedOut = false;

  const errorLink: ApolloLink = onError(({ graphQLErrors }: ErrorResponse) => {
    if (graphQLErrors) {
      graphQLErrors.map(async ({ extensions }) => {
        if (extensions?.code === 'UNAUTHENTICATED' && !hasLoggedOut) {
          hasLoggedOut = true;
          await callLogout(true);
        }
      });
    }
  });

  const retryLink = new RetryLink({
    delay: {
      initial: 300,
      max: 20000,
      jitter: true,
    },
    attempts: {
      max: 3,
      retryIf: (error: any) => !!error,
    },
  });

  const opsLink: ApolloLink = from([errorLink, retryLink, httpLink]);

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    opsLink,
  );

  const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      addTypename: false,
    }),
  });

  return client;
};
