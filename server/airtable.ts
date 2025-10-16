import Airtable from 'airtable';

// Initialize Airtable only if credentials are available
const AIRTABLE_ENABLED = !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID);

const base = AIRTABLE_ENABLED 
  ? new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!)
  : null;

// Airtable table names
const USERS_TABLE = 'Users';
const SUBSCRIPTIONS_TABLE = 'Subscriptions';

export interface AirtableUser {
  id?: string;
  fields: {
    'User ID': string;
    'Email': string;
    'First Name'?: string;
    'Last Name'?: string;
    'Profile Image URL'?: string;
    'Created At': string;
    'Last Active': string;
    'Total Stacks': number;
    'Completed Stacks': number;
    'Subscription Status'?: string;
  };
}

export interface AirtableSubscription {
  id?: string;
  fields: {
    'User ID': string;
    'Plan Type': string;
    'Status': string;
    'Started At': string;
    'Expires At'?: string;
    'Auto Renew': boolean;
  };
}

// Sync user to Airtable
export async function syncUserToAirtable(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  profileImageUrl?: string,
  createdAt?: Date
): Promise<void> {
  if (!AIRTABLE_ENABLED || !base) {
    console.log('Airtable sync skipped: credentials not configured');
    return;
  }

  try {
    // Check if user already exists in Airtable
    const existingRecords = await base(USERS_TABLE)
      .select({
        filterByFormula: `{User ID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    const userData: AirtableUser['fields'] = {
      'User ID': userId,
      'Email': email,
      'First Name': firstName || '',
      'Last Name': lastName || '',
      'Profile Image URL': profileImageUrl || '',
      'Created At': (createdAt || new Date()).toISOString(),
      'Last Active': new Date().toISOString(),
      'Total Stacks': 0,
      'Completed Stacks': 0,
    };

    if (existingRecords.length > 0) {
      // Update existing record
      await base(USERS_TABLE).update([
        {
          id: existingRecords[0].id,
          fields: {
            'Email': email,
            'First Name': firstName || '',
            'Last Name': lastName || '',
            'Profile Image URL': profileImageUrl || '',
            'Last Active': new Date().toISOString(),
          },
        },
      ]);
    } else {
      // Create new record
      await base(USERS_TABLE).create([{ fields: userData }]);
    }
  } catch (error) {
    console.error('Error syncing user to Airtable:', error);
    // Don't throw - we don't want Airtable sync failures to break the app
  }
}

// Update user activity in Airtable
export async function updateUserActivity(
  userId: string,
  totalStacks: number,
  completedStacks: number
): Promise<void> {
  if (!AIRTABLE_ENABLED || !base) return;

  try {
    const existingRecords = await base(USERS_TABLE)
      .select({
        filterByFormula: `{User ID} = '${userId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (existingRecords.length > 0) {
      await base(USERS_TABLE).update([
        {
          id: existingRecords[0].id,
          fields: {
            'Last Active': new Date().toISOString(),
            'Total Stacks': totalStacks,
            'Completed Stacks': completedStacks,
          },
        },
      ]);
    }
  } catch (error) {
    console.error('Error updating user activity in Airtable:', error);
  }
}

// Get all users from Airtable
export async function getAllAirtableUsers(): Promise<{ configured: boolean; data: AirtableUser[] }> {
  if (!AIRTABLE_ENABLED || !base) {
    return { configured: false, data: [] };
  }

  try {
    const records = await base(USERS_TABLE)
      .select({
        sort: [{ field: 'Created At', direction: 'desc' }],
      })
      .all();

    return {
      configured: true,
      data: records.map(record => ({
        id: record.id,
        fields: record.fields as AirtableUser['fields'],
      }))
    };
  } catch (error) {
    console.error('Error fetching users from Airtable:', error);
    throw error;
  }
}

// Create or update subscription in Airtable
export async function syncSubscriptionToAirtable(
  userId: string,
  planType: string,
  status: string,
  startedAt: Date,
  expiresAt?: Date,
  autoRenew: boolean = true
): Promise<void> {
  if (!AIRTABLE_ENABLED || !base) return;

  // Check if subscription already exists
  const existingRecords = await base(SUBSCRIPTIONS_TABLE)
    .select({
      filterByFormula: `{User ID} = '${userId}'`,
      maxRecords: 1,
    })
    .firstPage();

  const subscriptionData: AirtableSubscription['fields'] = {
    'User ID': userId,
    'Plan Type': planType,
    'Status': status,
    'Started At': startedAt.toISOString(),
    'Expires At': expiresAt?.toISOString(),
    'Auto Renew': autoRenew,
  };

  if (existingRecords.length > 0) {
    // Update existing subscription
    await base(SUBSCRIPTIONS_TABLE).update([
      {
        id: existingRecords[0].id,
        fields: subscriptionData,
      },
    ]);
  } else {
    // Create new subscription
    await base(SUBSCRIPTIONS_TABLE).create([{ fields: subscriptionData }]);
  }

  // Also update the user's subscription status
  const userRecords = await base(USERS_TABLE)
    .select({
      filterByFormula: `{User ID} = '${userId}'`,
      maxRecords: 1,
    })
    .firstPage();

  if (userRecords.length > 0) {
    await base(USERS_TABLE).update([
      {
        id: userRecords[0].id,
        fields: {
          'Subscription Status': status,
        },
      },
    ]);
  }
}

// Get all subscriptions from Airtable
export async function getAllAirtableSubscriptions(): Promise<{ configured: boolean; data: AirtableSubscription[] }> {
  if (!AIRTABLE_ENABLED || !base) {
    return { configured: false, data: [] };
  }

  try {
    const records = await base(SUBSCRIPTIONS_TABLE)
      .select({
        sort: [{ field: 'Started At', direction: 'desc' }],
      })
      .all();

    return {
      configured: true,
      data: records.map(record => ({
        id: record.id,
        fields: record.fields as AirtableSubscription['fields'],
      }))
    };
  } catch (error) {
    console.error('Error fetching subscriptions from Airtable:', error);
    throw error;
  }
}
