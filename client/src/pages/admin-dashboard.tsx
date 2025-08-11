import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import AdminTimeline from "@/components/admin-timeline";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AlertTriangle, DollarSign, Clock, HandHeart, Package, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: adminStats = { activeRentals: 0, lateReturns: 0, monthlyRevenue: 0, pendingPickups: 0 } } = useQuery<{
    activeRentals: number;
    lateReturns: number;
    monthlyRevenue: number;
    pendingPickups: number;
  }>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  const { data: lateBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/late-bookings"],
    retry: false,
  });

  const { data: allBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    retry: false,
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      await apiRequest("PATCH", `/api/bookings/${bookingId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/late-bookings"] });
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-status-rented text-white';
      case 'reserved':
        return 'bg-status-reserved text-white';
      case 'returned':
        return 'bg-status-returned text-white';
      case 'late':
        return 'bg-status-late text-white';
      case 'confirmed':
        return 'bg-status-available text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, status: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage bookings, products, and view analytics</p>
        </div>

        {/* Admin Stats */}
        {adminStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-status-rented bg-opacity-10 rounded-full p-3">
                    <HandHeart className="h-6 w-6 text-status-rented" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Active Rentals</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.activeRentals}</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-status-late bg-opacity-10 rounded-full p-3">
                    <AlertTriangle className="h-6 w-6 text-status-late" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Late Returns</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.lateReturns}</p>
                    <p className="text-xs text-red-600">Requiring attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-green-500 bg-opacity-10 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Revenue (Month)</p>
                    <p className="text-2xl font-bold text-gray-900">${adminStats.monthlyRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-600">+8.2% vs last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-status-reserved bg-opacity-10 rounded-full p-3">
                    <Clock className="h-6 w-6 text-status-reserved" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pending Pickups</p>
                    <p className="text-2xl font-bold text-gray-900">{adminStats.pendingPickups}</p>
                    <p className="text-xs text-yellow-600">Next 24 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Booking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Booking Timeline</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Today</Button>
                    <Button variant="outline" size="sm">Week</Button>
                    <Button size="sm" className="bg-rental-primary hover:bg-blue-700">Month</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminTimeline bookings={allBookings || []} onUpdateStatus={handleUpdateBookingStatus} />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Products</span>
                    <Button size="sm" className="bg-rental-primary hover:bg-blue-700">
                      <Package className="h-4 w-4 mr-2" />
                      Manage Products
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allProducts?.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.location || 'No location'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-status-available text-white">
                          Available
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Late Returns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-status-late mr-2" />
                    Late Returns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lateBookings?.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <Clock className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-600">No late returns</p>
                      <p className="text-sm text-gray-500">All rentals are on time!</p>
                    </div>
                  ) : (
                    lateBookings?.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Booking #{booking.id.slice(-8)}</p>
                            <p className="text-sm text-gray-500">Customer: {booking.customerId.slice(-8)}</p>
                            <p className="text-xs text-status-late">
                              {Math.ceil((new Date().getTime() - new Date(booking.endDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-status-late">
                            +${((parseFloat(booking.basePrice) * 0.05) * Math.ceil((new Date().getTime() - new Date(booking.endDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Late fee (5%/day)</p>
                          <Button size="sm" variant="destructive" className="mt-1">
                            Contact
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allBookings?.map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Booking #{booking.id.slice(-8)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">Amount: ${booking.totalAmount}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <div className="flex space-x-1">
                          {booking.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'active')}
                              className="bg-status-rented hover:bg-blue-700 text-white"
                            >
                              Mark Picked Up
                            </Button>
                          )}
                          {booking.status === 'active' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'returned')}
                              className="bg-status-returned hover:bg-purple-700 text-white"
                            >
                              Mark Returned
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allProducts?.map((product: any) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.location}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-status-available text-white">
                          Available
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Revenue analytics would be displayed here</p>
                    <p className="text-sm text-gray-500">Integration with charting library needed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Popular items analytics would be displayed here</p>
                    <p className="text-sm text-gray-500">Based on booking frequency</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
