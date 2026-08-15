import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
});

// The original 30-day AppSync key expired and may have been deleted by AppSync
// before CloudFormation attempted to extend it. Give the managed key a new,
// stable logical ID so the next deployment creates a fresh public catalog key
// instead of updating the missing physical resource.
backend.data.resources.cfnResources.cfnApiKey?.overrideLogicalId(
  'PublicCatalogApiKey20260815',
);
