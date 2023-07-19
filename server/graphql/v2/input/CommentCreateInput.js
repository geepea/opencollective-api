import { GraphQLInputObjectType, GraphQLString } from 'graphql';

import { CommentType as CommentTypeEnum } from '../../../models/Comment.js';
import { GraphQLCommentType } from '../enum/CommentType.js';

import { GraphQLConversationReferenceInput } from './ConversationReferenceInput.js';
import { GraphQLExpenseReferenceInput } from './ExpenseReferenceInput.js';
import { GraphQLUpdateReferenceInput } from './UpdateReferenceInput.js';

/**
 * Input type to use as the type for the comment input in createComment mutation.
 */
export const GraphQLCommentCreateInput = new GraphQLInputObjectType({
  name: 'CommentCreateInput',
  description: 'Input to create a comment. You can only specify one entity type: expense, conversation or update',
  fields: () => ({
    html: { type: GraphQLString },
    expense: {
      type: GraphQLExpenseReferenceInput,
      description: 'If your comment is linked to an expense, set it here',
    },
    ConversationId: { type: GraphQLString, deprecationReason: '2022-08-26: Please use "conversation"' },
    conversation: { type: GraphQLConversationReferenceInput },
    update: { type: GraphQLUpdateReferenceInput },
    type: {
      type: GraphQLCommentType,
      description: 'The type of the comment',
      defaultValue: CommentTypeEnum.COMMENT,
    },
  }),
});
