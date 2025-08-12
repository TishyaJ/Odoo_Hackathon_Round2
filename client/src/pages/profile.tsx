import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/navigation";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 300);
      return;
    }
  }, [user, isLoading, toast]);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const { data: userStats = { activeRentals: 0, lateReturns: 0, totalSpent: 0, totalEarned: 0, itemsListed: 0, joinDate: new Date() } } = useQuery<{
    activeRentals: number;
    lateReturns: number;
    totalSpent: number;
    totalEarned: number;
    itemsListed: number;
    joinDate: Date;
  }>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
    retry: false,
  });

  const { data: recentBookings = [] } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
    retry: false,
  });

  const { data: userProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      const allProducts = await response.json();
      return allProducts.filter((product: any) => product.ownerId === user?.id);
    },
    enabled: !!user,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest("PUT", "/api/auth/user", data);
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to delete product");
      // Some environments may return 204 No Content; don't try to parse JSON
      return;
    },
    onSuccess: () => {
      toast({
        title: "Product Removed",
        description: "Your listing has been removed from the catalog successfully.",
      });
      // Optimistically remove from cached products
      queryClient.setQueryData<any[]>(["/api/products"], (old) => {
        if (!old) return old;
        return old.filter((p: any) => p.id !== productId);
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
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

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("DELETE", `/api/bookings/${bookingId}`);
      if (!response.ok) throw new Error("Failed to delete booking");
      return;
    },
    onSuccess: () => {
      toast({
        title: "Booking Deleted",
        description: "Your booking has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBooking = (bookingId: string) => {
    if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
    setIsEditing(false);
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and view your activity</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-rental-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </span>
                </div>
                <CardTitle className="text-xl">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                <p className="text-gray-600">{user?.email}</p>
                <Badge variant="secondary" className="mt-2">
                  {user?.role || 'Customer'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium">
                      {new Date(userStats.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Personal Information</CardTitle>
                      {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="space-x-2">
                          <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline">
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-green-500 bg-opacity-10 rounded-full p-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">Active Rentals</p>
                          <p className="text-xl font-bold text-gray-900">{userStats.activeRentals}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-red-500 bg-opacity-10 rounded-full p-2">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">Late Returns</p>
                          <p className="text-xl font-bold text-gray-900">{userStats.lateReturns}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-blue-500 bg-opacity-10 rounded-full p-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">Total Spent</p>
                          <p className="text-xl font-bold text-gray-900">${userStats.totalSpent.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="bg-purple-500 bg-opacity-10 rounded-full p-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-600">Total Earned</p>
                          <p className="text-xl font-bold text-gray-900">${userStats.totalEarned.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Items Listed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-rental-primary mb-2">{userStats.itemsListed}</div>
                      <p className="text-gray-600">Items currently listed for rent</p>
                      <Button onClick={() => setLocation("/add-item")} className="mt-4">
                        Add New Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentBookings.length > 0 ? (
                      <div className="space-y-4">
                        {recentBookings.slice(0, 5).map((booking: any) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">Booking #{booking.id.slice(-8)}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <Badge className={
                                  booking.status === 'active' ? 'bg-green-500' :
                                  booking.status === 'completed' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }>
                                  {booking.status}
                                </Badge>
                                <p className="text-sm font-medium mt-1">${booking.totalAmount}</p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteBooking(booking.id)}
                                disabled={deleteBookingMutation.isPending}
                              >
                                {deleteBookingMutation.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button onClick={() => setLocation("/bookings")} variant="outline" className="w-full">
                          View All Bookings
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No bookings yet</p>
                        <Button onClick={() => setLocation("/products")} className="mt-4">
                          Browse Items
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Listed Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userProducts.length > 0 ? (
                      <div className="space-y-4">
                        {userProducts.slice(0, 5).map((product: any) => (
                          <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">{product.location}</p>
                              <p className="text-xs text-gray-500">Quantity: {product.quantity}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-500">Listed</Badge>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProduct(product.id);
                                }}
                                disabled={deleteProductMutation.isPending}
                              >
                                {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button onClick={() => setLocation("/products")} variant="outline" className="w-full">
                          View All Items
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No items listed yet</p>
                        <Button onClick={() => setLocation("/add-item")} className="mt-4">
                          List Your First Item
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive email updates about your bookings</p>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Privacy Settings</h3>
                          <p className="text-sm text-gray-600">Manage your privacy preferences</p>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">Change Password</h3>
                          <p className="text-sm text-gray-600">Update your account password</p>
                        </div>
                        <Button variant="outline" size="sm">Change</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-red-600">Delete Account</h3>
                          <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="destructive" size="sm">Delete Account</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
                     </div>
         </div>
       </div>

       {/* Footer */}
       <footer className="bg-gray-900 text-white mt-16">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="col-span-1 md:col-span-2">
               <h3 className="text-xl font-bold mb-4">RentalPro</h3>
               <p className="text-gray-400 mb-4">
                 Your trusted platform for renting and lending items. Connect with your community and make the most of shared resources.
               </p>
             </div>
             <div>
               <h4 className="font-semibold mb-4">Quick Links</h4>
               <ul className="space-y-2 text-gray-400">
                 <li><a href="/products" className="hover:text-white transition-colors">Browse Items</a></li>
                 <li><a href="/add-item" className="hover:text-white transition-colors">List Your Item</a></li>
                 <li><a href="/bookings" className="hover:text-white transition-colors">My Bookings</a></li>
                 <li><a href="/profile" className="hover:text-white transition-colors">Profile</a></li>
               </ul>
             </div>
             <div>
               <h4 className="font-semibold mb-4">Support</h4>
               <ul className="space-y-2 text-gray-400">
                 <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                 <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
               </ul>
             </div>
           </div>
           <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
             <p>&copy; 2024 RentalPro. All rights reserved.</p>
           </div>
         </div>
       </footer>
     </div>
   );
 }
