import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Package,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

interface OwnerDashboardProps {}

export default function OwnerDashboard({}: OwnerDashboardProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (!isLoading && !user) {
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
    return null;
  }

  // Fetch owner analytics
  const { data: analytics = {
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
    uniqueRenters: 0,
    bookingsByLocation: [],
    bookingsByCategory: [],
    monthlyRevenue: [],
    topProducts: [],
    paymentAnalytics: {
      totalPayments: 0,
      successfulPayments: 0,
      pendingPayments: 0,
      averagePaymentAmount: 0,
      paymentMethods: [],
    },
  }, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ["/api/owner/analytics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/owner/analytics");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch user's products
  const { data: userProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products", { ownerId: user?.id }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products?ownerId=${user?.id}`);
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch user's bookings as owner
  const { data: ownerBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings", "owner"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bookings");
      const allBookings = await response.json();
      // Filter bookings for user's products
      return allBookings.filter((booking: any) => 
        userProducts.some((product: any) => product.id === booking.productId)
      );
    },
    enabled: !!user && userProducts.length > 0,
    retry: false,
  });

  const handleRefresh = () => {
    refetchAnalytics();
    toast({
      title: "Refreshed",
      description: "Analytics data has been updated.",
    });
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to delete product");
      return;
    },
    onSuccess: () => {
      toast({
        title: "Product Removed",
        description: "Your listing has been removed from the catalog successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/analytics"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'completed': return <Star className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your rental business performance and analytics</p>
          </div>
          <Button onClick={handleRefresh} disabled={analyticsLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analyticsLoading ? "..." : analytics.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    All time earnings
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful Payments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsLoading ? "..." : (analytics.paymentAnalytics?.successfulPayments || 0)}
                  </p>
                  <p className="text-xs text-green-600">Paid bookings</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsLoading ? "..." : analytics.activeBookings}
                  </p>
                  <p className="text-xs text-purple-600">Currently active</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Payment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${analyticsLoading ? "..." : (analytics.paymentAnalytics?.averagePaymentAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-orange-600">Per booking</p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Loading...</p>
                    </div>
                  ) : analytics.monthlyRevenue.length > 0 ? (
                    <div className="h-64">
                      <div className="flex items-end justify-between h-48 mb-4">
                        {analytics.monthlyRevenue.map((month: any, index: number) => {
                          const maxRevenue = Math.max(...analytics.monthlyRevenue.map((m: any) => m.revenue));
                          const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                          return (
                            <div key={month.month} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 rounded-t w-8 transition-all duration-300 hover:bg-blue-600"
                                style={{ height: `${height}%` }}
                              />
                              <p className="text-xs text-gray-600 mt-2 text-center">{month.month}</p>
                              <p className="text-xs font-medium">${month.revenue.toFixed(0)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No revenue data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Top Performing Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : analytics.topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topProducts.map((product: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.bookings} bookings</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${product.revenue.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No products with bookings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings by Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Bookings by Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : analytics.bookingsByLocation.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.bookingsByLocation.map((location: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                            <div>
                              <p className="font-medium text-gray-900">{location.location}</p>
                              <p className="text-sm text-gray-500">{location.count} bookings</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${location.revenue.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No location data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookings by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Bookings by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : analytics.bookingsByCategory.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.bookingsByCategory.map((category: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <BarChart3 className="w-4 h-4 text-purple-500 mr-2" />
                            <div>
                              <p className="font-medium text-gray-900">{category.category}</p>
                              <p className="text-sm text-gray-500">{category.count} bookings</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">${category.revenue.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No category data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-700">Successful Payments</p>
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.paymentAnalytics?.successfulPayments || 0}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-medium text-yellow-700">Pending Payments</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {analytics.paymentAnalytics?.pendingPayments || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-700">Average Payment Amount</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(analytics.paymentAnalytics?.averagePaymentAmount || 0).toFixed(2)}
                        </p>
                      </div>

                      {analytics.paymentAnalytics?.paymentMethods && analytics.paymentAnalytics.paymentMethods.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Payment Methods Used</p>
                          {analytics.paymentAnalytics.paymentMethods.map((method: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600">{method.method}</span>
                              <span className="text-sm font-medium">{method.count} payments</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : ownerBookings.length > 0 ? (
                  <div className="space-y-4">
                    {ownerBookings.slice(0, 10).map((booking: any) => (
                      <div key={booking.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Badge className={`mr-2 ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">#{booking.id.slice(-8)}</span>
                          </div>
                          <span className="font-bold text-green-600">${parseFloat(booking.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Period:</span> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {booking.durationType}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {booking.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Your Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userProducts.length > 0 ? (
                  <div className="space-y-4">
                    {userProducts.map((product: any) => (
                      <div key={product.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Location:</span> {product.location}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {product.quantity}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products listed yet</p>
                    <Button 
                      onClick={() => setLocation("/add-item")} 
                      className="mt-4"
                    >
                      List Your First Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
