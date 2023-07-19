import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from 'graphql';

import { AccountFields, GraphQLAccount } from '../interface/Account.js';
import {
  AccountWithContributionsFields,
  GraphQLAccountWithContributions,
} from '../interface/AccountWithContributions.js';
import { AccountWithHostFields, GraphQLAccountWithHost } from '../interface/AccountWithHost.js';
import { AccountWithParentFields, GraphQLAccountWithParent } from '../interface/AccountWithParent.js';

export const GraphQLProject = new GraphQLObjectType({
  name: 'Project',
  description: 'This represents an Project account',
  interfaces: () => [GraphQLAccount, GraphQLAccountWithHost, GraphQLAccountWithContributions, GraphQLAccountWithParent],
  isTypeOf: collective => collective.type === 'PROJECT',
  fields: () => {
    return {
      ...AccountFields,
      ...AccountWithHostFields,
      ...AccountWithContributionsFields,
      ...AccountWithParentFields,
      isApproved: {
        description: "Returns whether it's approved by the Fiscal Host",
        type: new GraphQLNonNull(GraphQLBoolean),
        async resolve(project, _, req) {
          if (!project.ParentCollectiveId) {
            return false;
          } else {
            const parent = await req.loaders.Collective.byId.load(project.ParentCollectiveId);
            return Boolean(parent?.isApproved());
          }
        },
      },
    };
  },
});
