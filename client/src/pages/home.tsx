import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 300);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

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
    retry: false,
  });

  // We do not depend on PATCH /api/auth/user here to reduce coupling
  const handleNavigateToListItems = async () => {
    setLocation("/add-item");
  };

  const handleNavigateToRentItems = async () => {
    setLocation("/products");
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to RentalPro{user?.firstName && `, ${user.firstName}`}
          </h1>
          <p className="text-gray-600">Choose how you'd like to use our platform today</p>
        </div>

        {/* Customer Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-rental-primary to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={handleNavigateToListItems}>
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold ml-4">List Your Items</h2>
              </div>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Start earning by renting out your equipment, tools, or any items you own. Upload photos, set prices, and manage bookings.
              </p>
              <Button className="bg-white text-rental-primary hover:bg-gray-100 w-full">
                Start Listing Items
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
              <div className="mt-4 text-blue-100 text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Earn up to $500/month with your unused items
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rental-secondary to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={handleNavigateToRentItems}>
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold ml-4">Rent Items</h2>
              </div>
              <p className="text-purple-100 mb-6 leading-relaxed">
                Browse thousands of items available for rent. From tools to electronics, find what you need for any duration.
              </p>
              <Button className="bg-white text-rental-secondary hover:bg-gray-100 w-full">
                Browse Items
                <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
              <div className="mt-4 text-purple-100 text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Save up to 80% compared to buying new
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-status-available bg-opacity-10 rounded-full p-2">
                    <svg className="w-5 h-5 text-status-available" fill="currentColor" viewBox="0 0 20 20">
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
            
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-status-late bg-opacity-10 rounded-full p-2">
                    <svg className="w-5 h-5 text-status-late" fill="currentColor" viewBox="0 0 20 20">
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

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-green-500 bg-opacity-10 rounded-full p-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
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

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-status-reserved bg-opacity-10 rounded-full p-2">
                    <svg className="w-5 h-5 text-status-reserved" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Items Listed</p>
                    <p className="text-xl font-bold text-gray-900">{userStats.itemsListed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Popular Categories */}
        {categories && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category: any) => (
                <Card 
                  key={category.id} 
                  className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => setLocation(`/products?category=${category.id}`)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                      <span className="text-gray-600 text-xl">{category.icon || '📦'}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Review Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Share Your Experience</h2>
          <Card className="bg-gradient-to-r from-rental-primary to-blue-600 text-white border-0">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">How was your rental experience?</h3>
                <p className="text-blue-100 mb-6">Help others by sharing your feedback about items you've rented</p>
                <Button 
                  onClick={() => setLocation("/reviews")} 
                  className="bg-white text-rental-primary hover:bg-gray-100"
                >
                  Leave a Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {recentBookings && recentBookings.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              </div>
              <CardContent className="p-6">
                {recentBookings.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600">📦</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Booking #{booking.id.slice(-8)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'active' ? 'bg-status-rented bg-opacity-10 text-status-rented' :
                        booking.status === 'reserved' ? 'bg-status-reserved bg-opacity-10 text-status-reserved' :
                        booking.status === 'returned' ? 'bg-status-returned bg-opacity-10 text-status-returned' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
                        {booking.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">${booking.totalAmount}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4">
                  <Button variant="ghost" onClick={() => setLocation("/bookings")} className="w-full text-rental-primary hover:text-rental-primary">
                    View all bookings →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <Button onClick={() => setLocation("/products")} className="w-full bg-rental-primary hover:bg-blue-700">
                  Browse All Products
                </Button>
                <Button onClick={() => setLocation("/bookings")} variant="outline" className="w-full">
                  Manage Bookings
                </Button>
                {user?.role === 'admin' && (
                  <Button onClick={() => setLocation("/admin")} variant="outline" className="w-full">
                    Admin Dashboard
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
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
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
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
