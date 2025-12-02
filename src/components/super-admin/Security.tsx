import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { 
  Shield, 
  Key, 
  Lock,
  Globe,
  AlertTriangle,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export function Security() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [isAddIPModalOpen, setIsAddIPModalOpen] = useState(false);
  const [isGenerateKeyModalOpen, setIsGenerateKeyModalOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const mockAPIKeys = [
    { id: '1', name: 'Production API', key: 'sk_live_abc123...', createdAt: '2024-01-15', lastUsed: '2024-11-21' },
    { id: '2', name: 'Development API', key: 'sk_test_xyz789...', createdAt: '2024-03-20', lastUsed: '2024-11-20' },
  ];

  const mockAllowedIPs = [
    { id: '1', ip: '192.168.1.100', label: 'Office Network', addedAt: '2024-01-10' },
    { id: '2', ip: '203.0.113.0/24', label: 'Admin VPN', addedAt: '2024-02-15' },
    { id: '3', ip: '198.51.100.45', label: 'Home Office', addedAt: '2024-06-20' },
  ];

  const [apiKeys, setApiKeys] = useState(mockAPIKeys);
  const [allowedIPs, setAllowedIPs] = useState(mockAllowedIPs);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-600">Manage platform security and access controls</p>
      </div>

      {/* Security Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-900">Security Status: Protected</p>
              <p className="text-xs text-green-700 mt-1">All security features are properly configured and active</p>
            </div>
            <Badge className="bg-green-600 text-white border-green-600">
              Secure
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-gray-900">Two-Factor Authentication (2FA)</CardTitle>
          </div>
          <p className="text-sm text-gray-600">Add an extra layer of security to admin accounts</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-900">Enable 2FA for Super Admin</p>
                <p className="text-xs text-gray-600">Require authentication code during login</p>
              </div>
            </div>
            <Switch 
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-green-900">2FA is currently enabled</p>
                  <p className="text-xs text-green-700 mt-1">Your account is protected with two-factor authentication</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-gray-900">API Keys</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Manage API keys for external integrations</p>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setIsGenerateKeyModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">API Key</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Created</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Last Used</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-900">{key.name}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {showApiKey ? key.key : '••••••••••••••••'}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-900">{key.createdAt}</td>
                    <td className="py-3 px-6">
                      <Badge className="bg-green-100 text-green-700 border-green-200 border">
                        {key.lastUsed}
                      </Badge>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                          <Copy className="w-4 h-4" />
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

      {/* IP Allowlist */}
      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                <CardTitle className="text-gray-900">IP Allowlist</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Restrict admin panel access to specific IP addresses</p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setIsAddIPModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add IP Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">IP Address</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Label</th>
                  <th className="text-left py-3 px-6 text-sm text-gray-600">Added On</th>
                  <th className="text-right py-3 px-6 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowedIPs.map((ip) => (
                  <tr key={ip.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {ip.ip}
                      </code>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-900">{ip.label}</td>
                    <td className="py-3 px-6 text-sm text-gray-900">{ip.addedAt}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-end">
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

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="border-b border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </div>
          <p className="text-sm text-red-700">Critical actions that affect all platform users</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
              <div>
                <p className="text-sm text-gray-900">Force Logout All Admins</p>
                <p className="text-xs text-gray-600">Immediately log out all admin users from the platform</p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                Force Logout
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
              <div>
                <p className="text-sm text-gray-900">Reset All API Keys</p>
                <p className="text-xs text-gray-600">Revoke and regenerate all API keys (will break existing integrations)</p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                Reset Keys
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add IP Modal */}
      <Dialog open={isAddIPModalOpen} onOpenChange={setIsAddIPModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP Address to Allowlist</DialogTitle>
            <DialogDescription>
              Add a trusted IP address to allow admin panel access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input 
                id="ipAddress" 
                placeholder="192.168.1.100 or 203.0.113.0/24"
              />
              <p className="text-xs text-gray-600">You can use CIDR notation for IP ranges</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipLabel">Label</Label>
              <Input 
                id="ipLabel" 
                placeholder="e.g., Office Network"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddIPModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Add IP Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate API Key Modal */}
      <Dialog open={isGenerateKeyModalOpen} onOpenChange={setIsGenerateKeyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for external integrations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input 
                id="keyName" 
                placeholder="e.g., Production API"
              />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-900">Important</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Make sure to copy your API key now. You won't be able to see it again!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Key className="w-4 h-4 mr-2" />
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
