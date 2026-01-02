import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Lock,
  Loader2,
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { toast } from "sonner";

// 1. DEFINE LIMITS CONSTANT
const PLAN_LIMITS: Record<
  string,
  { tournaments: number; matches: number; scorers: number }
> = {
  Basic: { tournaments: 5, matches: 30, scorers: 5 },
  Professional: { tournaments: 15, matches: 100, scorers: 20 },
  Enterprise: { tournaments: 50, matches: 500, scorers: 100 },
  Trial: { tournaments: 1, matches: 5, scorers: 2 },
};

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: "active" | "suspended" | "pending";
  tournamentsUsed: number;
  tournamentsAllowed: number;
  matchesAllowed: number;
  scorersAllowed: number;
  joinedDate: string;
}

export function AdminManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    plan: "Basic",
    tournamentsAllowed: 5,
    matchesAllowed: 20,
    scorersAllowed: 5,
    status: "active",
  });

  // --- 1. FETCH REAL DATA ---
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (profiles) {
        const adminsWithUsage = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from("tournaments")
              .select("*", { count: "exact", head: true })
              .eq("created_by", profile.id);

            return {
              id: profile.id,
              name: profile.name || "Unknown",
              email: profile.email || "",
              phone: profile.contact_number || "",
              plan: profile.plan_type || "Basic",
              status:
                (profile.account_status as
                  | "active"
                  | "suspended"
                  | "pending") || "pending",
              tournamentsUsed: count || 0,
              tournamentsAllowed: profile.tournaments_limit || 0,
              matchesAllowed: profile.matches_limit || 0,
              scorersAllowed: profile.scorers_limit || 0,
              joinedDate: profile.created_at,
            };
          })
        );
        setAdmins(adminsWithUsage);
      }
    } catch (err: any) {
      console.error("Error fetching admins:", err);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // --- 2. AUTO-FILL LOGIC ---
  const handlePlanChange = (value: string) => {
    // Lookup the limits based on the selection
    const limits = PLAN_LIMITS[value] || PLAN_LIMITS["Basic"];

    setFormData({
      ...formData,
      plan: value,
      // Auto-fill the fields
      tournamentsAllowed: limits.tournaments,
      matchesAllowed: limits.matches,
      scorersAllowed: limits.scorers,
    });
  };

  // --- 3. HANDLE CREATE / UPDATE ---
  const handleSaveAdmin = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedAdmin) {
        const { error } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            contact_number: formData.phone,
            plan_type: formData.plan,
            account_status: formData.status,
            tournaments_limit: formData.tournamentsAllowed,
            matches_limit: formData.matchesAllowed,
            scorers_limit: formData.scorersAllowed,
          })
          .eq("id", selectedAdmin.id);

        if (error) throw error;
        toast.success("Admin updated successfully");
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error("Password is required and must be at least 6 characters");
          setIsSubmitting(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke(
          "create-admin",
          {
            body: {
              email: formData.email,
              password: formData.password,
              name: formData.name,
              contact_number: formData.phone,
              role: "admin", // Ensure role is passed
              plan_type: formData.plan,
              account_status: formData.status,
              tournaments_limit: formData.tournamentsAllowed,
              matches_limit: formData.matchesAllowed,
              scorers_limit: formData.scorersAllowed,
            },
          }
        );

        if (error) throw new Error(error.message);
        if (data && data.error) throw new Error(data.error);

        toast.success("Admin account created successfully");
      }

      setIsAddModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      console.error("Error saving admin:", err);
      toast.error(err.message || "Failed to save admin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (
      !confirm("Are you sure? This will delete the admin and ALL their data.")
    )
      return;

    setDeletingId(adminId);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: adminId },
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);

      toast.success("Admin deleted successfully");
      fetchAdmins();
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(`Failed to delete: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      phone: admin.phone,
      plan: admin.plan,
      tournamentsAllowed: admin.tournamentsAllowed,
      matchesAllowed: admin.matchesAllowed,
      scorersAllowed: admin.scorersAllowed,
      status: admin.status,
    });
    setIsAddModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedAdmin(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      plan: "Basic",
      tournamentsAllowed: 5,
      matchesAllowed: 20,
      scorersAllowed: 5,
      status: "active",
    });
    setIsAddModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 border">
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 border">
            Suspended
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">
            {status}
          </Badge>
        );
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "Enterprise":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 border">
            Enterprise
          </Badge>
        );
      case "Professional":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
            Professional
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">
            {plan || "Basic"}
          </Badge>
        );
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold text-2xl">Admin Management</h2>
          <p className="text-sm text-gray-600">
            Manage platform administrators and their subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-gray-700 border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAddClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

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

      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Admin Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Plan
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Usage
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Loading admins...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No admins found
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-900">
                          {admin.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Joined{" "}
                          {new Date(admin.joinedDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {admin.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {admin.phone}
                      </td>
                      <td className="py-3 px-4">{getPlanBadge(admin.plan)}</td>
                      <td className="py-3 px-4">
                        {getStatusBadge(admin.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px] max-w-[100px]">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (admin.tournamentsUsed /
                                    (admin.tournamentsAllowed || 1)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 whitespace-nowrap">
                            {admin.tournamentsUsed}/{admin.tournamentsAllowed}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-blue-600"
                            onClick={() => handleEditClick(admin)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-red-600"
                            onClick={() => handleDeleteAdmin(admin.id)}
                            disabled={deletingId === admin.id}
                          >
                            {deletingId === admin.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAdmin ? "Edit Admin" : "Add New Admin"}
            </DialogTitle>
            <DialogDescription>
              {selectedAdmin
                ? "Update admin details and subscription plan"
                : "Create a new admin account with credentials"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!!selectedAdmin}
              />
            </div>

            {!selectedAdmin && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">
                  Initial Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="text"
                    placeholder="Set a strong password..."
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Provide this to the admin securely. They can change it later.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select
                value={formData.plan}
                onValueChange={handlePlanChange} // UPDATED: Calls the auto-fill handler
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose plan" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tournaments">Max Tournaments Allowed</Label>
              <Input
                id="tournaments"
                type="number"
                value={formData.tournamentsAllowed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tournamentsAllowed: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="matches">Max Matches Allowed</Label>
              <Input
                id="matches"
                type="number"
                value={formData.matchesAllowed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    matchesAllowed: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scorers">Max Scorers Allowed</Label>
              <Input
                id="scorers"
                type="number"
                value={formData.scorersAllowed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scorersAllowed: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSaveAdmin}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : selectedAdmin
                ? "Update Admin"
                : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
