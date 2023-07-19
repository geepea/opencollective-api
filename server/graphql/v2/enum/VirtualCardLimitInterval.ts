import { GraphQLEnumType } from 'graphql';

import { VirtualCardLimitIntervals } from '../../../constants/virtual-cards.js';

export const GraphQLVirtualCardLimitInterval = new GraphQLEnumType({
  name: 'VirtualCardLimitInterval',
  values: Object.keys(VirtualCardLimitIntervals).reduce((values, key) => {
    return { ...values, [key]: {} };
  }, {}),
});
