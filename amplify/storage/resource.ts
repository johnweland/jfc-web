import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'jfcInventory',
  access: (allow) => ({
    // Admins and staff can upload, update, and delete inventory images.
    // Guests (and authenticated customers) can read — required for
    // displaying product images on the public storefront.
    'inventory/*': [
      allow.groups(['ADMINS', 'STAFF']).to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  }),
});
