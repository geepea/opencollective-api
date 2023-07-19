import { GraphQLNonNull } from 'graphql';
import { pick } from 'lodash-es';

import roles from '../../../constants/roles.js';
import { isCollectiveSlugReserved } from '../../../lib/collectivelib.js';
import models from '../../../models/index.js';
import { checkRemoteUserCanUseAccount } from '../../common/scope-check.js';
import { Forbidden, NotFound } from '../../errors.js';
import { fetchAccountWithReference, GraphQLAccountReferenceInput } from '../input/AccountReferenceInput.js';
import { GraphQLProjectCreateInput } from '../input/ProjectCreateInput.js';
import { GraphQLProject } from '../object/Project.js';

const DEFAULT_PROJECT_SETTINGS = {
  collectivePage: {
    sections: [
      {
        name: 'BUDGET',
        type: 'CATEGORY',
        isEnabled: true,
        sections: [{ name: 'budget', type: 'SECTION', isEnabled: true, restrictedTo: null }],
      },
      {
        name: 'ABOUT',
        type: 'CATEGORY',
        isEnabled: true,
        sections: [{ type: 'SECTION', name: 'about', isEnabled: true, restrictedTo: null }],
      },
    ],
  },
};

async function createProject(_, args, req) {
  checkRemoteUserCanUseAccount(req);

  const parent = await fetchAccountWithReference(args.parent);
  if (!parent) {
    throw new NotFound('Parent not found');
  }
  if (!req.remoteUser.hasRole([roles.ADMIN, roles.MEMBER], parent.id)) {
    throw new Forbidden(`You must be logged in as a member of the ${parent.slug} collective to create a Project`);
  }

  const projectData = {
    type: 'PROJECT',
    slug: args.project.slug.toLowerCase(),
    ...pick(args.project, ['name', 'description']),
    ...pick(parent, ['currency', 'isActive', 'platformFeePercent', 'hostFeePercent', 'data.useCustomHostFee']),
    approvedAt: parent.isActive ? new Date() : null,
    ParentCollectiveId: parent.id,
    CreatedByUserId: req.remoteUser.id,
    settings: { ...DEFAULT_PROJECT_SETTINGS, ...args.project.settings },
  };

  if (isCollectiveSlugReserved(projectData.slug)) {
    throw new Error(`The slug '${projectData.slug}' is not allowed.`);
  }
  const checkSlug = await models.Collective.findOne({ where: { slug: projectData.slug } });
  if (checkSlug) {
    throw new Error(`The slug '${projectData.slug}' is already taken. Please use another slug for your Project.`);
  }

  const project = await models.Collective.create(projectData);

  if (parent.HostCollectiveId) {
    const host = await req.loaders.Collective.byId.load(parent.HostCollectiveId);
    if (host) {
      await project.addHost(host, req.remoteUser);

      // Inherit fees from parent collective after setting its host
      await project.update({
        hostFeePercent: parent.hostFeePercent,
        data: { ...project.data, useCustomHostFee: Boolean(parent.data?.useCustomHostFee) },
      });
    }
  }

  project.generateCollectiveCreatedActivity(req.remoteUser, req.userToken);
  return project;
}

const createProjectMutation = {
  type: GraphQLProject,
  description: 'Create a Project. Scope: "account".',
  args: {
    project: {
      description: 'Information about the Project to create (name, slug, description, tags, settings)',
      type: new GraphQLNonNull(GraphQLProjectCreateInput),
    },
    parent: {
      description: 'Reference to the parent Account creating the Project.',
      type: GraphQLAccountReferenceInput,
    },
  },
  resolve: (_, args, req) => {
    return createProject(_, args, req);
  },
};

export default createProjectMutation;
