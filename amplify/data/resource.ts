import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  InventoryItemType: a.enum(['FIREARM', 'PART', 'ACCESSORY', 'PART_ACCESSORY', 'APPAREL', 'OTHER', 'SERVICES', 'AMMUNITION']),
  InventoryStatus: a.enum([
    'DRAFT',
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'TRANSFERRED',
    'ARCHIVED',
  ]),
  FirearmType: a.enum([
    'HANDGUN',
    'RIFLE',
    'SHOTGUN',
    'RECEIVER',
    'NFA',
    'OTHER',
  ]),
  TaxMode: a.enum([
    'DEFAULT',
    'CATEGORY',
    'CUSTOM',
    'EXEMPT',
  ]),
  OrderStatus: a.enum([
    'PENDING',
    'AWAITING_PAYMENT',
    'PROCESSING',
    'READY_FOR_TRANSFER',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED',
  ]),
  PaymentStatus: a.enum([
    'UNPAID',
    'AUTHORIZED',
    'PAID',
    'PARTIALLY_REFUNDED',
    'REFUNDED',
    'FAILED',
  ]),
  FulfillmentStatus: a.enum([
    'UNFULFILLED',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'SHIPPED',
    'DELIVERED',
    'TRANSFERRED',
    'COMPLETED',
    'CANCELLED',
  ]),

  PostalAddress: a.customType({
    recipientName: a.string(),
    phone: a.phone(),
    line1: a.string().required(),
    line2: a.string(),
    city: a.string().required(),
    state: a.string().required(),
    postalCode: a.string().required(),
    country: a.string().required(),
  }),

  FflLocationSnapshot: a.customType({
    fflName: a.string().required(),
    fflNumber: a.string(),
    contactName: a.string(),
    phone: a.phone(),
    email: a.email(),
    address: a.ref('PostalAddress'),
    notes: a.string(),
  }),

  OrderItemSnapshot: a.customType({
    inventoryItemId: a.id(),
    sku: a.string(),
    internalSku: a.string(),
    upc: a.string(),
    itemType: a.ref('InventoryItemType').required(),
    category: a.string(),
    title: a.string().required(),
    description: a.string(),
    manufacturer: a.string(),
    brand: a.string(),
    model: a.string(),
    condition: a.string(),
    quantity: a.integer().required(),
    unitPrice: a.float().required(),
    unitCost: a.float(),
    serialNumber: a.string(),
    caliber: a.string(),
    gauge: a.string(),
    action: a.string(),
    barrelLength: a.string(),
    capacity: a.string(),
    firearmType: a.ref('FirearmType'),
    fflRequired: a.boolean().required(),
    size: a.string(),
    color: a.string(),
  }),

  CustomerProfile: a
    .model({
      // Use `customerId` as the app-level customer key. For first-party accounts
      // this should normally be the Cognito user sub to keep owner auth simple.
      customerId: a.string().required(),
      cognitoSub: a.string().required(),
      email: a.email().required(),
      firstName: a.string(),
      lastName: a.string(),
      phone: a.phone(),
      defaultShippingAddressId: a.id(),
      defaultFflLocationId: a.id(),
      addresses: a.hasMany('CustomerAddress', 'customerId'),
      fflLocations: a.hasMany('CustomerFflLocation', 'customerId'),
      orders: a.hasMany('Order', 'customerId'),
      favorites: a.hasMany('CustomerFavorite', 'customerId'),
    })
    .identifier(['customerId'])
    .secondaryIndexes((index) => [
      index('cognitoSub').queryField('customerProfilesByCognitoSub'),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').identityClaim('sub'),
      allow.group('ADMINS'),
    ]),

  CustomerAddress: a
    .model({
      customerId: a.string().required(),
      label: a.string(),
      recipientName: a.string(),
      phone: a.phone(),
      line1: a.string().required(),
      line2: a.string(),
      city: a.string().required(),
      state: a.string().required(),
      postalCode: a.string().required(),
      country: a.string().required(),
      isDefault: a.boolean().default(false),
      customer: a.belongsTo('CustomerProfile', 'customerId'),
    })
    .secondaryIndexes((index) => [
      index('customerId').queryField('customerAddressesByCustomerId'),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').identityClaim('sub'),
      allow.group('ADMINS'),
    ]),

  CustomerFflLocation: a
    .model({
      customerId: a.string().required(),
      fflName: a.string().required(),
      fflNumber: a.string(),
      contactName: a.string(),
      phone: a.phone(),
      email: a.email(),
      address: a.ref('PostalAddress'),
      isDefault: a.boolean().default(false),
      notes: a.string(),
      customer: a.belongsTo('CustomerProfile', 'customerId'),
    })
    .secondaryIndexes((index) => [
      index('customerId').queryField('customerFflLocationsByCustomerId'),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').identityClaim('sub'),
      allow.group('ADMINS'),
    ]),

  CustomerFavorite: a
    .model({
      customerId: a.string().required(),
      // Product snapshot — stored so the favorites page renders without a catalog fetch
      slug: a.string().required(),
      name: a.string().required(),
      sku: a.string(),
      price: a.float().required(),
      category: a.string().required(),   // "firearm" | "part" | "apparel"
      status: a.string().required(),     // AvailabilityStatus value
      imageUrl: a.string(),
      customer: a.belongsTo('CustomerProfile', 'customerId'),
    })
    .secondaryIndexes((index) => [
      index('customerId').queryField('customerFavoritesByCustomerId'),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').identityClaim('sub'),
      allow.group('ADMINS'),
    ]),

  TaxSettings: a
    .model({
      id: a.string().required(),
      defaultRate: a.float().required().default(0),
      stateRate: a.float().required().default(0),
      localRate: a.float().required().default(0),
      firearmRate: a.float(),
      firearmExempt: a.boolean().required().default(false),
      partRate: a.float(),
      partExempt: a.boolean().required().default(false),
      accessoryRate: a.float(),
      accessoryExempt: a.boolean().required().default(false),
      apparelRate: a.float(),
      apparelExempt: a.boolean().required().default(false),
      otherRate: a.float(),
      otherExempt: a.boolean().required().default(false),
      serviceRate: a.float(),
      serviceExempt: a.boolean().required().default(false),
      ammunitionRate: a.float(),
      ammunitionExempt: a.boolean().required().default(false),
    })
    .identifier(['id'])
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.groups(['ADMINS', 'STAFF']),
    ]),

  InventoryItem: a
    .model({
      sku: a.string(),
      internalSku: a
        .string()
        .required()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      upc: a.string(),
      itemType: a
        .ref('InventoryItemType')
        .required()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      category: a.string(),
      title: a
        .string()
        .required()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      description: a.string(),
      manufacturer: a.string(),
      brand: a.string(),
      model: a.string(),
      condition: a.string(),
      status: a
        .ref('InventoryStatus')
        .required()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      isSerialized: a
        .boolean()
        .required()
        .default(false)
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      quantity: a
        .integer()
        .required()
        .default(1)
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      unitPrice: a
        .float()
        .required()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      taxMode: a
        .ref('TaxMode')
        .required()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      customTaxRate: a
        .float()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      salePrice: a.float(),
      cost: a.float().authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      serialNumber: a.string().authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      caliber: a.string(),
      gauge: a.string(),
      action: a.string(),
      barrelLength: a.string(),
      capacity: a.string(),
      firearmType: a.ref('FirearmType'),
      fflRequired: a
        .boolean()
        .required()
        .default(false)
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
      size: a.string(),
      color: a.string(),
      material: a.string(),
      apparelVariants: a.json(),
      // CSV compatibility note:
      // - Map RocPay and FFLSafe identifiers/categories into the dedicated fields.
      // - Preserve full source rows in the raw JSON fields during import/export work.
      // - CSV samples were not present in the repo during this change, so these fields
      //   intentionally keep the schema flexible for unmapped columns.
      rocPayItemId: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      rocPayCategory: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      rocPayRawImport: a
        .json()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      fflSafeItemId: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      fflSafeCategory: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      fflSafeRawExport: a
        .json()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      location: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      sourceId: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      importBatchId: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      sourceSystem: a
        .string()
        .authorization((allow) => [allow.groups(['ADMINS', 'STAFF'])]),
      images: a
        .json()
        .authorization((allow) => [
          allow.publicApiKey().to(['read']),
          allow.authenticated().to(['read']),
          allow.groups(['ADMINS', 'STAFF']),
        ]),
    })
    .secondaryIndexes((index) => [
      index('status').queryField('inventoryItemsByStatus'),
      index('itemType').queryField('inventoryItemsByItemType'),
      index('category').queryField('inventoryItemsByCategory'),
      index('manufacturer').queryField('inventoryItemsByManufacturer'),
      index('sku').queryField('inventoryItemsBySku'),
      index('internalSku').queryField('inventoryItemsByInternalSku'),
      index('serialNumber').queryField('inventoryItemsBySerialNumber'),
      index('rocPayItemId').queryField('inventoryItemsByRocPayItemId'),
      index('fflSafeItemId').queryField('inventoryItemsByFflSafeItemId'),
    ])
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.groups(['ADMINS', 'STAFF']),
    ]),

  Order: a
    .model({
      // Amplify's secondary index builder only accepts explicit model fields as
      // sort keys. Until checkout/admin write paths exist, keep ordering in the
      // app layer using the implicit `createdAt` timestamp returned by Amplify.
      customerId: a.string().required(),
      orderNumber: a.string().required(),
      status: a.ref('OrderStatus').required(),
      paymentStatus: a.ref('PaymentStatus').required(),
      fulfillmentStatus: a.ref('FulfillmentStatus').required(),
      subtotal: a.float().required(),
      tax: a.float().required().default(0),
      shipping: a.float().required().default(0),
      fees: a.float().required().default(0),
      total: a.float().required(),
      shippingMethod: a.string(),
      shippingCarrier: a.string(),
      trackingNumber: a.string(),
      shippingAddressSnapshot: a.ref('PostalAddress'),
      transferFflSnapshot: a.ref('FflLocationSnapshot'),
      items: a.ref('OrderItemSnapshot').array().required(),
      customer: a.belongsTo('CustomerProfile', 'customerId'),
    })
    .secondaryIndexes((index) => [
      index('customerId').queryField('ordersByCustomerId'),
      index('orderNumber').queryField('ordersByOrderNumber'),
      index('status').queryField('ordersByStatus'),
    ])
    .authorization((allow) => [
      allow.ownerDefinedIn('customerId').identityClaim('sub').to(['read']),
      allow.group('ADMINS'),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
