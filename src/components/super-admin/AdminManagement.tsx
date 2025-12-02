import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Ban, 
  Trash2,
  Filter,
  Download
} from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: 'active' | 'suspended' | 'pending';
  tournamentsUsed: number;
  tournamentsAllowed: number;
  matchesAllowed: number;
  scorersAllowed: number;
  joinedDate: string;
}

export function AdminManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Mock admins data
  const mockAdmins: Admin[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 98765 43210',
      plan: 'Professional',
      status: 'active',
      tournamentsUsed: 8,
      tournamentsAllowed: 15,
      matchesAllowed: 100,
      scorersAllowed: 20,
      joinedDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sarah Khan',
      email: 'sarah@example.com',
      phone: '+91 98765 43211',
      plan: 'Enterprise',
      status: 'active',
      tournamentsUsed: 12,
      tournamentsAllowed: 50,
      matchesAllowed: 500,
      scorersAllowed: 100,
      joinedDate: '2024-02-20'
    },
    {
      id: '3',
      name: 'Mike Ross',
      email: 'mike@example.com',
      phone: '+91 98765 43212',
      plan: 'Basic',
      status: 'pending',
      tournamentsUsed: 0,
      tournamentsAllowed: 5,
      matchesAllowed: 30,
      scorersAllowed: 5,
      joinedDate: '2024-11-20'
    },
    {
      id: '4',
      name: 'Lisa Marie',
      email: 'lisa@example.com',
      phone: '+91 98765 43213',
      plan: 'Professional',
      status: 'suspended',
      tournamentsUsed: 15,
      tournamentsAllowed: 15,
      matchesAllowed: 100,
      scorersAllowed: 20,
      joinedDate: '2023-12-10'
    },
  ];

  const [admins, setAdmins] = useState(mockAdmins);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200 border">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 border-red-200 border">Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 border">Enterprise</Badge>;
      case 'Professional':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">Professional</Badge>;
      case 'Basic':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">Basic</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">{plan}</Badge>;
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-gray-900">Admin Management</h2>
          <p className="text-sm text-gray-600">Manage platform administrators and their subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-gray-700 border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setSelectedAdmin(null);
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="text-gray-700 border-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Admin Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Phone</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Plan</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Usage</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{admin.name}</p>
                      <p className="text-xs text-gray-600">Joined {new Date(admin.joinedDate).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{admin.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{admin.phone}</td>
                    <td className="py-3 px-4">{getPlanBadge(admin.plan)}</td>
                    <td className="py-3 px-4">{getStatusBadge(admin.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(admin.tournamentsUsed / admin.tournamentsAllowed) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 whitespace-nowrap">
                          {admin.tournamentsUsed}/{admin.tournamentsAllowed}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-600 hover:text-blue-600"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsAddModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Admin Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAdmin ? 'Edit Admin' : 'Add New Admin'}</DialogTitle>
            <DialogDescription>
              {selectedAdmin ? 'Update admin details and subscription plan' : 'Create a new admin account with subscription plan'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Enter full name"
                defaultValue={selectedAdmin?.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="admin@example.com"
                defaultValue={selectedAdmin?.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="+91 98765 43210"
                defaultValue={selectedAdmin?.phone}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select defaultValue={selectedAdmin?.plan || 'Basic'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournaments">Max Tournaments Allowed</Label>
              <Input 
                id="tournaments" 
                type="number"
                placeholder="15"
                defaultValue={selectedAdmin?.tournamentsAllowed}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matches">Max Matches Allowed</Label>
              <Input 
                id="matches" 
                type="number"
                placeholder="100"
                defaultValue={selectedAdmin?.matchesAllowed}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scorers">Max Scorers Allowed</Label>
              <Input 
                id="scorers" 
                type="number"
                placeholder="20"
                defaultValue={selectedAdmin?.scorersAllowed}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={selectedAdmin?.status || 'active'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              {selectedAdmin ? 'Update Admin' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
