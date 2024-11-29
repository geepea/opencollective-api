import config from 'config';
import { orderBy, uniqBy } from 'lodash';

import cache from './cache';
import logger from './logger';
import { sentryHandleSlowRequests } from './sentry';

const minExecutionTimeToCache = parseInt(config.graphql.cache.minExecutionTimeToCache);

const enablePluginIf = (condition, plugin) => (condition ? plugin : {});

export const apolloSlowRequestPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse(requestContext) {
        const response = requestContext.response;
        const result = response?.body?.singleResult;
        if (!result) {
          return;
        }

        const req = requestContext.contextValue; // From apolloExpressMiddlewareOptions context()

        req.endAt = req.endAt || new Date();
        const executionTime = req.endAt - req.startAt;
        req.res.set('Execution-Time', executionTime);

        // Track all slow queries on Sentry performance
        sentryHandleSlowRequests(executionTime);

        // This will never happen for logged-in users as cacheKey is not set
        if (req.cacheKey && !response?.errors && executionTime > minExecutionTimeToCache) {
          cache.set(req.cacheKey, result, Number(config.graphql.cache.ttl));
        }
      },
    };
  },
};

/**
 * This plugin logs top 10 slow fields in the query execution.
 */
export const apolloDebugPlugin = enablePluginIf(config.env === 'development', {
  async requestDidStart() {
    return {
      async executionDidStart(executionRequestContext) {
        const slow = [];
        return {
          willResolveField({ info }) {
            const start = process.hrtime.bigint();
            return () => {
              const end = process.hrtime.bigint();
              slow.push({
                timeMs: Number(end - start) / 1e6,
                field: `${info.parentType.name}.${info.fieldName}`,
              });
            };
          },
          executionDidEnd() {
            uniqBy(orderBy(slow, ['timeNs'], ['desc']), 'field')
              .filter(s => s.timeMs > 10)
              .forEach(s => {
                logger.debug(
                  `${executionRequestContext.operation.name.value} slow fields: ${s.field} took ${Number(s.timeMs)}ms`,
                );
              });
          },
        };
      },
    };
  },
});
