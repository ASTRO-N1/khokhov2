import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2,
  Check,
  Trophy,
  Users,
  Activity,
  Clock
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  maxTournaments: number;
  maxMatches: number;
  maxScorers: number;
  features: string[];
  isPopular?: boolean;
}

export function SubscriptionPlans() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const mockPlans: Plan[] = [
    {
      id: '1',
      name: 'Basic',
      price: 999,
      duration: 'Monthly',
      maxTournaments: 5,
      maxMatches: 30,
      maxScorers: 5,
      features: [
        'Up to 5 tournaments',
        'Up to 30 matches',
        '5 scorer accounts',
        'Basic analytics',
        'Email support',
        'Standard templates'
      ]
    },
    {
      id: '2',
      name: 'Professional',
      price: 2999,
      duration: 'Monthly',
      maxTournaments: 15,
      maxMatches: 100,
      maxScorers: 20,
      isPopular: true,
      features: [
        'Up to 15 tournaments',
        'Up to 100 matches',
        '20 scorer accounts',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'Export data',
        'Live streaming support'
      ]
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 9999,
      duration: 'Monthly',
      maxTournaments: 50,
      maxMatches: 500,
      maxScorers: 100,
      features: [
        'Up to 50 tournaments',
        'Up to 500 matches',
        '100 scorer accounts',
        'Full analytics suite',
        '24/7 phone support',
        'White-label solution',
        'API access',
        'Dedicated account manager',
        'Custom features',
        'SLA guarantee'
      ]
    },
    {
      id: '4',
      name: 'Trial',
      price: 0,
      duration: '14 Days',
      maxTournaments: 1,
      maxMatches: 5,
      maxScorers: 2,
      features: [
        '1 tournament',
        'Up to 5 matches',
        '2 scorer accounts',
        'Basic features',
        'Limited support'
      ]
    }
  ];

  const [plans, setPlans] = useState(mockPlans);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-600">Manage pricing plans and features</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            setSelectedPlan(null);
            setIsAddModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`border-2 ${plan.isPopular ? 'border-blue-600 shadow-lg' : 'border-gray-200'} hover:shadow-md transition-all relative overflow-hidden`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-3 py-1 rounded-bl-lg">
                Popular
              </div>
            )}
            
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 text-center">{plan.name}</CardTitle>
              <div className="text-center mt-2">
                <span className="text-4xl text-gray-900">₹{plan.price}</span>
                <span className="text-sm text-gray-600 ml-1">/{plan.duration}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="space-y-2 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Trophy className="w-4 h-4 text-blue-600" />
                    Tournaments
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {plan.maxTournaments}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Activity className="w-4 h-4 text-green-600" />
                    Matches
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {plan.maxMatches}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-purple-600" />
                    Scorers
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {plan.maxScorers}
                  </Badge>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-sm text-gray-900">Features:</p>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setIsAddModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Plan
                </Button>
                {!plan.isPopular && (
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Plans</p>
            <p className="text-2xl text-gray-900">{plans.length}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
            <p className="text-2xl text-gray-900">65</p>
            <Badge className="mt-1 bg-green-100 text-green-700 border-green-200 border text-xs">
              +8 this month
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
            <p className="text-2xl text-gray-900">₹1.8L</p>
            <Badge className="mt-1 bg-blue-100 text-blue-700 border-blue-200 border text-xs">
              +12% growth
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Trial Conversions</p>
            <p className="text-2xl text-gray-900">68%</p>
            <Badge className="mt-1 bg-purple-100 text-purple-700 border-purple-200 border text-xs">
              15 conversions
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Plan Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlan ? 'Update plan details and pricing' : 'Create a new subscription plan'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Plan Name</Label>
              <Input 
                id="planName" 
                placeholder="e.g., Professional"
                defaultValue={selectedPlan?.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <Input 
                id="price" 
                type="number"
                placeholder="2999"
                defaultValue={selectedPlan?.price}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input 
                id="duration" 
                placeholder="Monthly / Yearly"
                defaultValue={selectedPlan?.duration}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTournaments">Max Tournaments</Label>
              <Input 
                id="maxTournaments" 
                type="number"
                placeholder="15"
                defaultValue={selectedPlan?.maxTournaments}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMatches">Max Matches</Label>
              <Input 
                id="maxMatches" 
                type="number"
                placeholder="100"
                defaultValue={selectedPlan?.maxMatches}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxScorers">Max Scorers</Label>
              <Input 
                id="maxScorers" 
                type="number"
                placeholder="20"
                defaultValue={selectedPlan?.maxScorers}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <textarea 
                id="features"
                className="w-full min-h-[120px] rounded-md border border-gray-300 p-2 text-sm"
                placeholder="Advanced analytics&#10;Priority support&#10;Custom branding"
                defaultValue={selectedPlan?.features.join('\n')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              {selectedPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
