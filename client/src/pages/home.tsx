import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import Calendar from "@/components/calendar";
import FeedbackForm from "@/components/feedback-form";
import {
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Building2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Eye,
  Download,
  Filter,
  Search,
  Heart,
  Star,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Bell,
  Mail,
  Phone,
  HelpCircle,
  Bug,
  Lightbulb,
  AlertTriangle,
  Info,
  Shield,
  Calendar as CalendarIcon,
} from "lucide-react";

interface HomeProps {}

export default function Home({}: HomeProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [feedbackPanelOpen, setFeedbackPanelOpen] = useState(false);

  // Redirect if not authenticated
  if (!isLoading && !user) {
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
    return null;
  }

  // Fetch user stats
  const { data: userStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/stats");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch user bookings for calendar
  const { data: userBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bookings");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch user feedback
  const { data: userFeedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/user/feedback"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/feedback");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
    retry: false,
  });

  // Fetch products for category counts
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json();
    },
    retry: false,
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await apiRequest("POST", "/api/user/feedback", feedbackData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/feedback"] });
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll get back to you soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate calendar events from real booking data
  const calendarEvents = userBookings.map((booking: any, index: number) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const product = allProducts.find((p: any) => p.id === booking.productId);
    
    return [
      {
        id: `${booking.id}-start`,
        title: `${product?.name || 'Item'} Rental Start`,
        start: startDate,
        end: startDate,
        type: "start" as const,
        color: "green",
        bookingId: booking.id
      },
      {
        id: `${booking.id}-end`,
        title: `${product?.name || 'Item'} Rental End`,
        start: endDate,
        end: endDate,
        type: "end" as const,
        color: "red",
        bookingId: booking.id
      },
      {
        id: `${booking.id}-payment`,
        title: `Payment Due - ${product?.name || 'Item'}`,
        start: new Date(startDate.getTime() + 24 * 60 * 60 * 1000), // 1 day after start
        end: new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
        type: "payment" as const,
        color: "orange",
        bookingId: booking.id
      }
    ];
  }).flat();



  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start': return <Package className="w-4 h-4" />;
      case 'end': return <Clock className="w-4 h-4" />;
      case 'payment': return <DollarSign className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getFeedbackIcon = (category: string) => {
    switch (category) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      case 'complaint': return <AlertTriangle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getFeedbackStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      
      <div className="flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="text-gray-600">Here's what's happening with your rentals today</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.activeRentals || 0}</p>
                    <p className="text-xs text-green-600">Currently active</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">${userStats.totalSpent || 0}</p>
                    <p className="text-xs text-blue-600">This month</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Items Listed</p>
                    <p className="text-2xl font-bold text-gray-900">{userStats.itemsListed || 0}</p>
                    <p className="text-xs text-purple-600">Your listings</p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earned</p>
                    <p className="text-2xl font-bold text-gray-900">${userStats.totalEarned || 0}</p>
                    <p className="text-xs text-green-600">From rentals</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/products")}>
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Items</h3>
                <p className="text-gray-600">Find items to rent from our community</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/add-item")}>
              <CardContent className="p-6 text-center">
                <Plus className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">List Your Item</h3>
                <p className="text-gray-600">Share your items with the community</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/bookings")}>
              <CardContent className="p-6 text-center">
                <CalendarIcon className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Bookings</h3>
                <p className="text-gray-600">View and manage your rentals</p>
              </CardContent>
            </Card>

            {userStats.itemsListed > 0 && (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/owner-dashboard")}>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner Dashboard</h3>
                  <p className="text-gray-600">Track your rental business analytics</p>
                </CardContent>
              </Card>
            )}
            {user?.role === 'admin' && (
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/admin")}>
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
                  <p className="text-gray-600">Manage users, products, and system settings</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Categories</h2>
            {categoriesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 text-center">
                      <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.slice(0, 4).map((category: any) => {
                  const categoryProducts = allProducts.filter((p: any) => p.categoryId === category.id);
                  const categoryIcon = category.icon || "📦";
                  
                  return (
                    <Card 
                      key={category.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setLocation(`/products?category=${category.slug}`)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{categoryIcon}</div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{categoryProducts.length} items</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right-Side Calendar Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Calendar</h2>
            <Calendar 
              events={calendarEvents}
              onDateClick={setSelectedDate}
              onEventClick={(event) => setSelectedDate(event.start)}
            />
          </div>

          {/* Upcoming Events */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-3">Upcoming Events</h3>
            <div className="space-y-2">
              {calendarEvents.slice(0, 5).map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedDate(event.start)}
                >
                  <div className={`w-3 h-3 rounded-full bg-${event.color}-500 mr-3`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {event.start.toLocaleDateString()} at {event.start.toLocaleTimeString()}
                    </p>
                  </div>
                  {getEventIcon(event.type)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feedback & Support Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <Collapsible open={feedbackPanelOpen} onOpenChange={setFeedbackPanelOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full h-12 flex items-center justify-between px-4 hover:bg-gray-50"
            >
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                <span className="font-medium">Feedback & Support</span>
              </div>
              {feedbackPanelOpen ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="p-6 border-t border-gray-100">
              <FeedbackForm
                onSubmit={submitFeedbackMutation.mutate}
                isSubmitting={submitFeedbackMutation.isPending}
                recentFeedback={userFeedback}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Event Details Modal */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Events for {selectedDate?.toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDate && calendarEvents
              .filter((event: any) => event.start.getDate() === selectedDate.getDate())
              .map((event: any) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full bg-${event.color}-500 mr-3`} />
                    <div className="flex-1">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-gray-500">
                        {event.start.toLocaleTimeString()}
                      </p>
                    </div>
                    {getEventIcon(event.type)}
                  </div>
                </div>
              ))}
            
            {selectedDate && calendarEvents.filter((event: any) => event.start.getDate() === selectedDate.getDate()).length === 0 && (
              <p className="text-gray-500 text-center py-4">No events scheduled for this date</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
