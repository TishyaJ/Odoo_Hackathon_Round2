import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Search,
  MessageSquare,
  Star,
  MapPin,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Eye,
  Ban,
  Archive,
  Reply,
  FileText,
  Mail,
  RefreshCw,
  Package,
  Bug,
  Lightbulb,
} from "lucide-react";

interface AdminDashboardProps {}

export default function AdminDashboard({}: AdminDashboardProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteUserDialog, setDeleteUserDialog] = useState<string | null>(null);
  const [deleteProductDialog, setDeleteProductDialog] = useState<string | null>(null);

  // Fetch admin statistics
  const { data: adminStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats");
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Fetch all products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/products");
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Fetch all bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/admin/bookings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/bookings");
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Fetch feedback data
  const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/admin/feedback"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/feedback");
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Reply to feedback mutation
  const replyToFeedbackMutation = useMutation({
    mutationFn: async ({ feedbackId, reply }: { feedbackId: string; reply: string }) => {
      const response = await apiRequest("POST", `/api/admin/feedback/${feedbackId}/reply`, { reply });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      setSelectedFeedback(null);
      setReplyText('');
    },
    onError: (error) => {
      toast({
        title: "Reply Failed",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Archive feedback mutation
  const archiveFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/feedback/${feedbackId}/archive`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({
        title: "Feedback Archived",
        description: "Feedback has been archived successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Archive Failed",
        description: "Failed to archive feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect if not admin
  if (!isLoading && (!user || user.role !== 'admin')) {
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your rental platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">Date Range</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-32"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                  <SelectItem value="home-utilities">Home Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="estate">Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="new-york">New York</SelectItem>
                  <SelectItem value="los-angeles">Los Angeles</SelectItem>
                  <SelectItem value="chicago">Chicago</SelectItem>
                  <SelectItem value="miami">Miami</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usersLoading ? "..." : users.length}
                  </p>
                  <p className="text-xs text-green-600">Registered users</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productsLoading ? "..." : products.length}
                  </p>
                  <p className="text-xs text-green-600">Listed items</p>
                </div>
                <Building2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookingsLoading ? "..." : bookings.filter((b: any) => b.status === 'active').length}
                  </p>
                  <p className="text-xs text-blue-600">Currently active</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookingsLoading ? "..." : `$${bookings
                      .filter((b: any) => ['active', 'returned', 'completed'].includes(b.status))
                      .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0)
                      .toFixed(2)}`}
                  </p>
                  <p className="text-xs text-green-600">From all rentals</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="products">Product Management</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    User Registration Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder - User registration trends</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Revenue Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart placeholder - Revenue trends</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Popular Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoriesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                            <div className="h-4 bg-gray-300 rounded w-24"></div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 bg-gray-300 rounded w-12 mb-1"></div>
                            <div className="h-3 bg-gray-300 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const categoryStats = categories.map((category: any) => {
                          const categoryProducts = products.filter((p: any) => p.categoryId === category.id);
                          const categoryBookings = bookings.filter((b: any) => 
                            categoryProducts.some((p: any) => p.id === b.productId)
                          );
                          return {
                            ...category,
                            productCount: categoryProducts.length,
                            bookingCount: categoryBookings.length
                          };
                        }).sort((a: any, b: any) => b.bookingCount - a.bookingCount).slice(0, 4);

                        const totalBookings = categoryStats.reduce((sum: number, cat: any) => sum + cat.bookingCount, 0);
                        const colors = ['blue', 'green', 'yellow', 'orange'];

                        return categoryStats.map((category: any, index: number) => {
                          const percentage = totalBookings > 0 ? Math.round((category.bookingCount / totalBookings) * 100) : 0;
                          const color = colors[index] || 'gray';
                          
                          return (
                            <div key={category.id} className={`flex items-center justify-between p-3 bg-${color}-50 rounded-lg`}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 bg-${color}-500 rounded-full mr-3`}></div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-${color}-600`}>{percentage}%</p>
                                <p className="text-xs text-gray-500">{category.bookingCount} rentals</p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Top Revenue Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading || bookingsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-gray-300 rounded-full mr-3"></div>
                            <div>
                              <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                              <div className="h-3 bg-gray-300 rounded w-20"></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 bg-gray-300 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const productRevenue = products.map((product: any) => {
                          const productBookings = bookings.filter((b: any) => b.productId === product.id);
                          const totalRevenue = productBookings
                            .filter((b: any) => ['active', 'returned', 'completed'].includes(b.status))
                            .reduce((sum: number, b: any) => sum + parseFloat(b.totalAmount || 0), 0);
                          return {
                            ...product,
                            bookingCount: productBookings.length,
                            totalRevenue
                          };
                        })
                        .filter((p: any) => p.totalRevenue > 0)
                        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
                        .slice(0, 5);

                        const colors = ['blue', 'green', 'yellow', 'orange', 'purple'];

                        return productRevenue.map((product: any, index: number) => {
                          const color = colors[index] || 'gray';
                          
                          return (
                            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center">
                                <span className={`w-6 h-6 bg-${color}-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3`}>
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-500">{product.bookingCount} rentals</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">${product.totalRevenue.toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Analytics content coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Management</span>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Search users..." className="w-64" />
                    <Button variant="outline" size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Join Date</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center">
                            <div className="animate-spin w-6 h-6 border-4 border-rental-primary border-t-transparent rounded-full mx-auto"></div>
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user: any) => {
                          const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
                          const isBanned = !user.isActive;
                          
                          return (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                                    <span className="text-xs font-medium">{initials}</span>
                                  </div>
                                  <span>{user.firstName} {user.lastName}</span>
                                </div>
                              </td>
                              <td className="p-2">{user.email}</td>
                              <td className="p-2">
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <Badge variant={isBanned ? 'destructive' : 'default'}>
                                  {isBanned ? 'Banned' : 'Active'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {user.role !== 'admin' && (
                                    isBanned ? (
                                      <Button variant="outline" size="sm">
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button variant="destructive" size="sm">
                                        <Ban className="w-4 h-4" />
                                      </Button>
                                    )
                                  )}
                                  {user.role !== 'admin' && (
                                    <Dialog open={deleteUserDialog === user.id} onOpenChange={() => setDeleteUserDialog(null)}>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          onClick={() => setDeleteUserDialog(user.id)}
                                        >
                                          <XCircle className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Delete User</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <p className="text-gray-600">
                                            Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>? 
                                            This action cannot be undone and will permanently remove all their data including:
                                          </p>
                                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            <li>User account and profile</li>
                                            <li>All their products and listings</li>
                                            <li>All their bookings and rental history</li>
                                            <li>All their feedback and reviews</li>
                                            <li>All their wishlist items</li>
                                          </ul>
                                          <div className="flex space-x-2">
                                            <Button 
                                              variant="destructive"
                                              onClick={() => {
                                                deleteUserMutation.mutate(user.id);
                                                setDeleteUserDialog(null);
                                              }}
                                              disabled={deleteUserMutation.isPending}
                                            >
                                              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                                            </Button>
                                            <Button 
                                              variant="outline"
                                              onClick={() => setDeleteUserDialog(null)}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Product Management</span>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Search products..." className="w-64" />
                    <Button variant="outline" size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Owner</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Price</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsLoading ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center">
                            <div className="animate-spin w-6 h-6 border-4 border-rental-primary border-t-transparent rounded-full mx-auto"></div>
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-500">
                            No products found
                          </td>
                        </tr>
                      ) : (
                        products.map((product: any) => {
                          const owner = users.find((u: any) => u.id === product.ownerId);
                          const category = categories.find((c: any) => c.id === product.categoryId);
                          
                          return (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gray-200 rounded mr-2 flex items-center justify-center">
                                    <Package className="w-4 h-4 text-gray-500" />
                                  </div>
                                  <span className="font-medium">{product.name}</span>
                                </div>
                              </td>
                              <td className="p-2">{owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'}</td>
                              <td className="p-2">
                                <Badge variant="outline">{category?.name || 'Uncategorized'}</Badge>
                              </td>
                              <td className="p-2">
                                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                  {product.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {product.pricing && product.pricing.length > 0 
                                  ? `$${product.pricing[0].price}/${product.pricing[0].durationType}`
                                  : 'N/A'
                                }
                              </td>
                              <td className="p-2">
                                <div className="flex items-center space-x-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {!product.isActive && (
                                    <Button variant="default" size="sm">
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Dialog open={deleteProductDialog === product.id} onOpenChange={() => setDeleteProductDialog(null)}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => setDeleteProductDialog(product.id)}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Delete Product</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-gray-600">
                                          Are you sure you want to delete <strong>{product.name}</strong>? 
                                          This action cannot be undone and will permanently remove:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                          <li>Product listing and all details</li>
                                          <li>All pricing information</li>
                                          <li>All associated bookings</li>
                                          <li>All product images and media</li>
                                        </ul>
                                        <div className="flex space-x-2">
                                          <Button 
                                            variant="destructive"
                                            onClick={() => {
                                              deleteProductMutation.mutate(product.id);
                                              setDeleteProductDialog(null);
                                            }}
                                            disabled={deleteProductMutation.isPending}
                                          >
                                            {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
                                          </Button>
                                          <Button 
                                            variant="outline"
                                            onClick={() => setDeleteProductDialog(null)}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feedback Statistics */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Feedback Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Feedback</span>
                        <span className="font-bold">{feedback.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="font-bold text-yellow-600">
                          {feedback.filter((f: any) => f.status === 'pending').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Resolved</span>
                        <span className="font-bold text-green-600">
                          {feedback.filter((f: any) => f.status === 'resolved').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Urgent</span>
                        <span className="font-bold text-red-600">
                          {feedback.filter((f: any) => f.priority === 'urgent').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Archived</span>
                        <span className="font-bold text-gray-600">
                          {feedback.filter((f: any) => f.isArchived).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Feedback Management</span>
                      <div className="flex items-center space-x-2">
                        <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {feedbackLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full" />
                      </div>
                    ) : feedback.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No feedback received yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {feedback
                          .filter((f: any) => {
                            if (feedbackFilter === 'all') return true;
                            if (feedbackFilter === 'pending') return f.status === 'pending';
                            if (feedbackFilter === 'resolved') return f.status === 'resolved';
                            if (feedbackFilter === 'urgent') return f.priority === 'urgent';
                            return true;
                          })
                          .map((feedbackItem: any) => (
                            <div key={feedbackItem.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    {feedbackItem.type === 'bug' && <Bug className="w-4 h-4 text-red-500" />}
                                    {feedbackItem.type === 'feature' && <Lightbulb className="w-4 h-4 text-green-500" />}
                                    {feedbackItem.type === 'complaint' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                                    {feedbackItem.type === 'other' && <MessageSquare className="w-4 h-4 text-gray-500" />}
                                  </div>
                                  <span className="font-medium">{feedbackItem.user?.firstName || 'Anonymous'}</span>
                                  <Badge variant={feedbackItem.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                    {feedbackItem.priority}
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(feedbackItem.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{feedbackItem.message}</p>
                              {feedbackItem.adminReply && (
                                <div className="bg-blue-50 p-3 rounded-lg mb-2">
                                  <p className="text-sm text-blue-800">
                                    <strong>Admin Reply:</strong> {feedbackItem.adminReply}
                                  </p>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedFeedback(feedbackItem)}
                                    >
                                      <Reply className="w-4 h-4 mr-1" />
                                      Reply
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reply to Feedback</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Original Feedback:</Label>
                                        <p className="text-sm text-gray-600 mt-1">{selectedFeedback?.message}</p>
                                      </div>
                                      <div>
                                        <Label>Your Reply:</Label>
                                        <Textarea 
                                          placeholder="Enter your reply..." 
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                        />
                                      </div>
                                      <Button 
                                        onClick={() => {
                                          if (selectedFeedback && replyText.trim()) {
                                            replyToFeedbackMutation.mutate({
                                              feedbackId: selectedFeedback.id,
                                              reply: replyText.trim()
                                            });
                                          }
                                        }}
                                        disabled={replyToFeedbackMutation.isPending}
                                      >
                                        {replyToFeedbackMutation.isPending ? 'Sending...' : 'Send Reply'}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => archiveFeedbackMutation.mutate(feedbackItem.id)}
                                  disabled={archiveFeedbackMutation.isPending}
                                >
                                  <Archive className="w-4 h-4 mr-1" />
                                  Archive
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
