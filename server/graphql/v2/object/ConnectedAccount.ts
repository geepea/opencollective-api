import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';

import { GraphQLConnectedAccountService } from '../enum/ConnectedAccountService.js';
import { getIdEncodeResolver, IDENTIFIER_TYPES } from '../identifiers.js';

export const GraphQLConnectedAccount = new GraphQLObjectType({
  name: 'ConnectedAccount',
  description: 'This represents a Connected Account',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Unique identifier for this connected account',
      resolve: getIdEncodeResolver(IDENTIFIER_TYPES.CONNECTED_ACCOUNT),
    },
    legacyId: {
      type: GraphQLInt,
      description: 'The internal database identifier of the Connected Account (ie: 580)',
      deprecationReason: '2020-05-01: should only be used during the transition to GraphQL API v2.',
      resolve(connectedAccount): number {
        return connectedAccount.id;
      },
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'The date on which the ConnectedAccount was created',
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'The date on which the ConnectedAccount was last updated',
    },
    settings: { type: GraphQLJSON },
    service: { type: new GraphQLNonNull(GraphQLConnectedAccountService) },
  }),
});
