import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { Calendar, Package, Search, Filter } from "lucide-react";

export default function Bookings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
      setTimeout(() => { window.location.href = "/login"; }, 300);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: bookings = [], error: bookingsError } = useQuery<any[]>({
    queryKey: ["/api/bookings", filters],
    queryFn: ({ queryKey }) => {
      const [url, filterParams] = queryKey as [string, typeof filters];
      const searchParams = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (!value || value === 'all') return;
        searchParams.append(key, value as string);
      });
      return fetch(`${url}?${searchParams}`).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
    },
    retry: false,
  });



  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-status-reserved text-white';
      case 'confirmed':
        return 'bg-status-available text-white';
      case 'active':
        return 'bg-status-rented text-white';
      case 'returned':
        return 'bg-status-returned text-white';
      case 'late':
        return 'bg-status-late text-white';
      case 'cancelled':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reserved':
        return '⏰';
      case 'confirmed':
        return '✅';
      case 'active':
        return '🤝';
      case 'returned':
        return '↻';
      case 'late':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter((booking: any) => {
    const matchesSearch = !searchQuery || 
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.productId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) : [];

  const groupedBookings = {
    active: filteredBookings.filter((b: any) => ['confirmed', 'active'].includes(b.status)),
    completed: filteredBookings.filter((b: any) => ['returned'].includes(b.status)),
    upcoming: filteredBookings.filter((b: any) => ['reserved'].includes(b.status)),
    cancelled: filteredBookings.filter((b: any) => ['cancelled', 'late'].includes(b.status)),
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Track and manage all your rental bookings</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search bookings..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              Active ({groupedBookings.active.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({groupedBookings.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({groupedBookings.completed.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Issues ({groupedBookings.cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {groupedBookings.active.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Package className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active bookings</h3>
                  <p className="text-gray-600 mb-4">You don't have any active rentals at the moment.</p>
                  <Button onClick={() => window.location.href = "/products"} className="bg-rental-primary hover:bg-blue-700">
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              groupedBookings.active.map((booking: any) => (
                <BookingCard key={booking.id} booking={booking} products={products} />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {groupedBookings.upcoming.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
                  <p className="text-gray-600">You don't have any upcoming rentals scheduled.</p>
                </CardContent>
              </Card>
            ) : (
              groupedBookings.upcoming.map((booking: any) => (
                <BookingCard key={booking.id} booking={booking} products={products} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {groupedBookings.completed.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Package className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed bookings</h3>
                  <p className="text-gray-600">Your completed rentals will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              groupedBookings.completed.map((booking: any) => (
                <BookingCard key={booking.id} booking={booking} products={products} />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {groupedBookings.cancelled.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Package className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No issues</h3>
                  <p className="text-gray-600">All your bookings are on track!</p>
                </CardContent>
              </Card>
            ) : (
              groupedBookings.cancelled.map((booking: any) => (
                <BookingCard key={booking.id} booking={booking} products={products} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: any;
  products?: any[];
}

function BookingCard({ booking, products }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-status-reserved text-white';
      case 'confirmed':
        return 'bg-status-available text-white';
      case 'active':
        return 'bg-status-rented text-white';
      case 'returned':
        return 'bg-status-returned text-white';
      case 'late':
        return 'bg-status-late text-white';
      case 'cancelled':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reserved':
        return '⏰';
      case 'confirmed':
        return '✅';
      case 'active':
        return '🤝';
      case 'returned':
        return '↻';
      case 'late':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  const product = products?.find(p => p.id === booking.productId);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              {product?.images?.[0] ? (
                <img src={product.images[0]} alt={product?.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <Package className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {product?.name || `Product ${booking.productId.slice(-8)}`}
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Booking #{booking.id.slice(-8)}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <span>Qty: {booking.quantity}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-3 mb-2">
              <Badge className={getStatusColor(booking.status)}>
                <span className="mr-1">{getStatusIcon(booking.status)}</span>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            <p className="text-lg font-bold text-gray-900">${booking.totalAmount}</p>
            <p className="text-sm text-gray-500">{booking.durationType} rental</p>
            
            {booking.status === 'active' && (
              <div className="mt-2">
                <p className="text-xs text-gray-500">
                  Due: {new Date(booking.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {booking.status === 'late' && (
              <div className="mt-2">
                <p className="text-xs text-status-late font-medium">
                  {Math.ceil((new Date().getTime() - new Date(booking.endDate).getTime()) / (1000 * 60 * 60 * 24))} days overdue
                </p>
                <p className="text-xs text-gray-500">
                  Late fee: ${((parseFloat(booking.basePrice) * 0.05) * Math.ceil((new Date().getTime() - new Date(booking.endDate).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {product?.location && (
              <span>📍 {product.location}</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            {booking.status === 'reserved' && (
              <Button size="sm" variant="destructive">
                Cancel
              </Button>
            )}
            {booking.status === 'active' && (
              <Button size="sm" className="bg-rental-primary hover:bg-blue-700">
                Contact Owner
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
