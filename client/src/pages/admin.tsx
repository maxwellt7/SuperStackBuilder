import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Users, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AirtableUser {
  id: string;
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

interface AirtableSubscription {
  id: string;
  fields: {
    'User ID': string;
    'Plan Type': string;
    'Status': string;
    'Started At': string;
    'Expires At'?: string;
    'Auto Renew': boolean;
  };
}

interface AirtableResponse<T> {
  configured: boolean;
  data: T[];
}

export default function Admin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AirtableUser | null>(null);
  const [planType, setPlanType] = useState('Basic');
  const [status, setStatus] = useState('active');
  const [expiresAt, setExpiresAt] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);

  const { data: usersResponse, isLoading: usersLoading } = useQuery<AirtableResponse<AirtableUser>>({
    queryKey: ['/api/admin/airtable/users'],
  });

  const { data: subscriptionsResponse, isLoading: subscriptionsLoading } = useQuery<AirtableResponse<AirtableSubscription>>({
    queryKey: ['/api/admin/airtable/subscriptions'],
  });

  const users = usersResponse?.data || [];
  const subscriptions = subscriptionsResponse?.data || [];
  const airtableConfigured = usersResponse?.configured && subscriptionsResponse?.configured;

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      planType: string;
      status: string;
      expiresAt?: string;
      autoRenew: boolean;
    }) => {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        // Handle Airtable not configured error
        if (response.status === 503) {
          throw new Error('Airtable integration is not configured');
        }
        throw new Error(result.message || 'Failed to update subscription');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/airtable/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/airtable/subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
      });
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateSubscription = () => {
    if (!selectedUser) return;

    updateSubscriptionMutation.mutate({
      userId: selectedUser.fields['User ID'],
      planType,
      status,
      expiresAt: expiresAt || undefined,
      autoRenew,
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Free</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1 inline" />Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="w-3 h-3 mr-1 inline" />Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1 inline" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (usersLoading || subscriptionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeSubscriptions = subscriptions.filter(s => s.fields.Status === 'active').length;
  const totalStacks = users.reduce((sum, u) => sum + (u.fields['Total Stacks'] || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage users and subscriptions synced with Airtable
        </p>
        {!airtableConfigured && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Airtable integration is not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables to enable sync functionality.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="gap-1 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold" data-testid="text-total-users">{totalUsers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold" data-testid="text-active-subs">{activeSubscriptions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1 space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold" data-testid="text-total-stacks">{totalStacks}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* Users Table */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>All users synced from Airtable</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Stacks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.fields['User ID']}`}>
                      <TableCell className="font-medium">
                        {user.fields['First Name'] || user.fields['Last Name']
                          ? `${user.fields['First Name'] || ''} ${user.fields['Last Name'] || ''}`.trim()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{user.fields['Email']}</TableCell>
                      <TableCell>{formatDate(user.fields['Created At'])}</TableCell>
                      <TableCell>{formatDate(user.fields['Last Active'])}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{user.fields['Completed Stacks'] || 0}</span>
                          <span className="text-muted-foreground text-xs">/ {user.fields['Total Stacks'] || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.fields['Subscription Status'])}</TableCell>
                      <TableCell>
                        <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) {
                            setSelectedUser(user);
                            setPlanType('Basic');
                            setStatus('active');
                            setExpiresAt('');
                            setAutoRenew(true);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`button-manage-${user.fields['User ID']}`}
                            >
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Subscription</DialogTitle>
                              <DialogDescription>
                                Update subscription for {user.fields['Email']}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="planType">Plan Type</Label>
                                <Select value={planType} onValueChange={setPlanType}>
                                  <SelectTrigger id="planType" data-testid="select-plan-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Free">Free</SelectItem>
                                    <SelectItem value="Basic">Basic</SelectItem>
                                    <SelectItem value="Pro">Pro</SelectItem>
                                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                  <SelectTrigger id="status" data-testid="select-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                                <Input
                                  id="expiresAt"
                                  type="date"
                                  value={expiresAt}
                                  onChange={(e) => setExpiresAt(e.target.value)}
                                  data-testid="input-expires-at"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="autoRenew"
                                  checked={autoRenew}
                                  onChange={(e) => setAutoRenew(e.target.checked)}
                                  data-testid="checkbox-auto-renew"
                                  className="rounded"
                                />
                                <Label htmlFor="autoRenew">Auto Renew</Label>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleUpdateSubscription}
                                disabled={updateSubscriptionMutation.isPending}
                                data-testid="button-save-subscription"
                              >
                                {updateSubscriptionMutation.isPending ? (
                                  <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Changes'
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Table */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>All subscriptions synced from Airtable</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Auto Renew</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id} data-testid={`subscription-row-${sub.fields['User ID']}`}>
                      <TableCell className="font-mono text-xs">{sub.fields['User ID']}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sub.fields['Plan Type']}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.fields['Status'])}</TableCell>
                      <TableCell>{formatDate(sub.fields['Started At'])}</TableCell>
                      <TableCell>{formatDate(sub.fields['Expires At'])}</TableCell>
                      <TableCell>
                        {sub.fields['Auto Renew'] ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
