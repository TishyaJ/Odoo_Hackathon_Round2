import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, MapPin, Star, User, Plus, Minus, Package, Heart, Clock } from "lucide-react";
import RazorpayPayment from "./razorpay-payment";

interface BookingModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  durationOptions: any[];
}

export default function BookingModal({ product, isOpen, onClose, durationOptions }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [booking, setBooking] = useState({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    quantity: 1,
    durationType: 'hourly' as string,
  });
  
  const [pricing, setPricing] = useState({
    basePrice: 0,
    discount: 0,
    serviceFee: 8.50,
    total: 0,
  });

  const [showPayment, setShowPayment] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  const { data: productPricing = [] } = useQuery<any[]>({
    queryKey: ["/api/products", product?.id, "pricing"],
    enabled: !!product?.id,
    retry: false,
  });

  // Fetch product rating
  const { data: rating = { averageRating: 0, totalReviews: 0 } } = useQuery({
    queryKey: ["/api/products", product?.id, "rating"],
    queryFn: async () => {
      if (!product?.id) return { averageRating: 0, totalReviews: 0 };
      const response = await apiRequest("GET", `/api/products/${product.id}/rating`);
      return response.json();
    },
    enabled: !!product?.id,
    retry: false,
  });

  // Check if product is in wishlist
  const { data: wishlistStatus = { isInWishlist: false } } = useQuery<{ isInWishlist: boolean }>({
    queryKey: ["/api/wishlist", product?.id, "check"],
    queryFn: async () => {
      if (!product?.id) return { isInWishlist: false };
      const response = await apiRequest("GET", `/api/wishlist/${product.id}/check`);
      return response.json();
    },
    enabled: !!product?.id && !!user,
    retry: false,
  });

  const { data: availability = { available: true } } = useQuery<{ available: boolean }>({
    queryKey: ["/api/products", product?.id, "check-availability", booking.startDate, booking.endDate, booking.startTime, booking.endTime],
    queryFn: async () => {
      if (!booking.startDate || !booking.endDate) return { available: true };
      
      const response = await apiRequest("POST", `/api/products/${product.id}/check-availability`, {
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      return response.json();
    },
    enabled: !!product?.id && !!booking.startDate && !!booking.endDate,
    retry: false,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setCreatedBooking(data);
      setShowPayment(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 300);
        return;
      }
      toast({ title: "Booking Failed", description: "Unable to create booking. Please try again.", variant: "destructive" });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("POST", `/api/wishlist/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist", product?.id, "check"] });
      toast({
        title: "Added to Wishlist",
        description: "Item has been added to your wishlist!",
      });
    },
    onError: (error) => {
      toast({ title: "Failed", description: "Unable to add to wishlist. Please try again.", variant: "destructive" });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/wishlist/${productId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist", product?.id, "check"] });
      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist.",
      });
    },
    onError: (error) => {
      toast({ title: "Failed", description: "Unable to remove from wishlist. Please try again.", variant: "destructive" });
    },
  });

  // Calculate pricing when booking details change
  useEffect(() => {
    if (!productPricing || !booking.startDate || !booking.endDate) return;

    const selectedPricing = productPricing.find((p: any) => p.durationType === booking.durationType);
    if (!selectedPricing) return;

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    
    // For hourly bookings, include time in calculation
    if (booking.durationType === 'hourly' && booking.startTime && booking.endTime) {
      const [startHour, startMinute] = booking.startTime.split(':').map(Number);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);
      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
    }
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    
    // Calculate duration based on the selected duration type
    let duration;
    switch (booking.durationType) {
      case 'hourly':
        duration = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60)));
        break;
      case 'daily':
        duration = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
        break;
      case 'weekly':
        duration = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7)));
        break;
      case 'monthly':
        duration = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30)));
        break;
      default:
        duration = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60))); // Default to hourly
    }

    const basePrice = parseFloat(selectedPricing.basePrice) * duration * booking.quantity;
    const discountPercentage = parseFloat(selectedPricing.discountPercentage) || 0;
    const discount = (basePrice * discountPercentage) / 100;
    const serviceFee = 8.50; // Could be configurable
    const total = basePrice - discount + serviceFee;

    setPricing({
      basePrice,
      discount,
      serviceFee,
      total,
    });
  }, [productPricing, booking]);

  const handleBookingChange = (field: string, value: any) => {
    setBooking(prev => ({ ...prev, [field]: value }));
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, booking.quantity + change);
    setBooking(prev => ({ ...prev, quantity: newQuantity }));
  };

  const handleWishlistToggle = () => {
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to use the wishlist.",
        variant: "destructive",
      });
      return;
    }

    if (wishlistStatus.isInWishlist) {
      removeFromWishlistMutation.mutate(product.id);
    } else {
      addToWishlistMutation.mutate(product.id);
    }
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to make a booking.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is trying to book their own item
    if (user.id === product.ownerId) {
      toast({
        title: "Cannot Book Own Item",
        description: "You cannot book your own item.",
        variant: "destructive",
      });
      return;
    }

    if (!booking.startDate || !booking.endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select start and end dates for your rental.",
        variant: "destructive",
      });
      return;
    }

    // For hourly bookings, require time selection
    if (booking.durationType === 'hourly' && (!booking.startTime || !booking.endTime)) {
      toast({
        title: "Missing Time",
        description: "Please select start and end times for hourly rental.",
        variant: "destructive",
      });
      return;
    }

    if (availability && !availability.available) {
      toast({
        title: "Not Available",
        description: "This item is not available for the selected dates.",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      productId: product.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      quantity: booking.quantity,
      durationType: booking.durationType,
      basePrice: pricing.basePrice.toString(),
      discount: pricing.discount.toString(),
      serviceFee: pricing.serviceFee.toString(),
      totalAmount: pricing.total.toString(),
    };

    createBookingMutation.mutate(bookingData);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Booking Confirmed! 🎉",
      description: "Your rental has been confirmed and payment processed successfully!",
    });
    setShowPayment(false);
    setCreatedBooking(null);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Rental</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          {/* Product Details */}
          <div>
            <div className="aspect-video bg-gray-200 rounded-xl mb-4 overflow-hidden">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-4">{product.description || 'No description available'}</p>
            
            <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
              {product.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{product.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                <span>
                  {rating.averageRating > 0 ? `${rating.averageRating} (${rating.totalReviews} reviews)` : 'No reviews'}
                </span>
              </div>
            </div>
            
            {/* Owner Info */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">Owner</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Product Owner</p>
                    <p className="text-sm text-gray-500">Member since 2021</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Booking Form */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Rental Details</h4>
            
            {/* Pricing Options */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3">💰 Available Pricing Options</Label>
              <div className="space-y-3">
                {[
                  { key: 'hourly', label: 'Per Hour', icon: '⏰', color: 'blue' },
                  { key: 'daily', label: 'Per Day', icon: '📅', color: 'green' },
                  { key: 'weekly', label: 'Per Week', icon: '📆', color: 'purple' },
                  { key: 'monthly', label: 'Per Month', icon: '📊', color: 'orange' },
                ].map(({ key, label, icon, color }) => {
                  const pricingItem = productPricing?.find((p: any) => p.durationType === key);
                  if (!pricingItem) return null;
                  
                  return (
                    <div key={key} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="mr-2">{icon}</span>
                          <h5 className={`font-medium text-${color}-900`}>{label}</h5>
                        </div>
                        <Badge className={`bg-${color}-500 text-white text-xs`}>
                          ${pricingItem.basePrice}/{key === 'hourly' ? 'hour' : key === 'daily' ? 'day' : key === 'weekly' ? 'week' : 'month'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className={`text-${color}-600 font-medium`}>Base Rate:</span>
                          <span className={`text-${color}-900 ml-1`}>${pricingItem.basePrice}</span>
                        </div>
                        <div>
                          <span className={`text-${color}-600 font-medium`}>Late Fee:</span>
                          <span className={`text-${color}-900 ml-1`}>$2.50/{key === 'hourly' ? 'hour' : 'day'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Duration Type Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-3">⏱️ Select Rental Duration Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'hourly', label: 'Hourly', icon: '⏰' },
                  { key: 'daily', label: 'Daily', icon: '📅' },
                  { key: 'weekly', label: 'Weekly', icon: '📆' },
                  { key: 'monthly', label: 'Monthly', icon: '📊' },
                ].map(({ key, label, icon }) => {
                  const pricingItem = productPricing?.find((p: any) => p.durationType === key);
                  if (!pricingItem) return null;
                  
                  return (
                    <Button
                      key={key}
                      variant={booking.durationType === key ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center space-y-1 ${
                        booking.durationType === key ? 'bg-rental-primary text-white' : ''
                      }`}
                      onClick={() => handleBookingChange('durationType', key)}
                    >
                      <span className="text-lg">{icon}</span>
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-xs opacity-75">${pricingItem.basePrice}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Date/Time Selection */}
            {booking.durationType === 'hourly' ? (
              // Hourly booking - show date and time inputs
              <div className="space-y-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">📅 Select Date</Label>
                  <Input
                    type="date"
                    value={booking.startDate}
                    onChange={(e) => handleBookingChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Start Time
                    </Label>
                    <Input
                      type="time"
                      value={booking.startTime}
                      onChange={(e) => handleBookingChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      End Time
                    </Label>
                    <Input
                      type="time"
                      value={booking.endTime}
                      onChange={(e) => handleBookingChange('endTime', e.target.value)}
                      min={booking.startTime}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Daily/Weekly/Monthly booking - show calendar inputs
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={booking.startDate}
                    onChange={(e) => handleBookingChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={booking.endDate}
                    onChange={(e) => handleBookingChange('endDate', e.target.value)}
                    min={booking.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-2">Quantity</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={booking.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 border border-gray-300 rounded-lg bg-white min-w-16 text-center">
                  {booking.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Real-time Price Calculation */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h5 className="font-medium text-gray-900 mb-3">Price Breakdown</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {booking.durationType === 'hourly' ? 'Hourly' : 
                       booking.durationType === 'daily' ? 'Daily' : 
                       booking.durationType === 'weekly' ? 'Weekly' : 'Monthly'} rate
                    </span>
                    <span className="text-gray-900">
                      ${productPricing?.find((p: any) => p.durationType === booking.durationType)?.basePrice || 0}/
                      {booking.durationType === 'hourly' ? 'hour' : 
                       booking.durationType === 'daily' ? 'day' : 
                       booking.durationType === 'weekly' ? 'week' : 'month'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rental duration</span>
                    <span className="text-gray-900">
                      {booking.startDate && booking.endDate ? 
                        (() => {
                          const startDate = new Date(booking.startDate);
                          const endDate = new Date(booking.endDate);
                          
                          // For hourly bookings, include time in calculation
                          if (booking.durationType === 'hourly' && booking.startTime && booking.endTime) {
                            const [startHour, startMinute] = booking.startTime.split(':').map(Number);
                            const [endHour, endMinute] = booking.endTime.split(':').map(Number);
                            startDate.setHours(startHour, startMinute, 0, 0);
                            endDate.setHours(endHour, endMinute, 0, 0);
                          }
                          
                          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                          const diffWeeks = Math.ceil(diffDays / 7);
                          const diffMonths = Math.ceil(diffDays / 30);
                          
                          switch(booking.durationType) {
                            case 'hourly': return `${Math.max(1, diffHours)} hours`;
                            case 'daily': return `${Math.max(1, diffDays)} days`;
                            case 'weekly': return `${Math.max(1, diffWeeks)} weeks`;
                            case 'monthly': return `${Math.max(1, diffMonths)} months`;
                            default: return `${Math.max(1, diffHours)} hours`;
                          }
                        })() : 
                        'Select dates'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity</span>
                    <span className="text-gray-900">{booking.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base price</span>
                    <span className="text-gray-900">${pricing.basePrice.toFixed(2)}</span>
                  </div>
                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${pricing.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service fee</span>
                    <span className="text-gray-900">${pricing.serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-lg text-rental-primary">${pricing.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Late Return Policy:</strong> $2.50/{booking.durationType === 'hourly' ? 'hour' : 'day'} fee for returns after scheduled end time
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Availability Check */}
            <div className="mb-6">
              {availability === undefined && booking.startDate && booking.endDate && (
                <div className="flex items-center p-3 bg-gray-100 rounded-lg">
                  <div className="animate-spin w-4 h-4 border-2 border-rental-primary border-t-transparent rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Checking availability...</span>
                </div>
              )}
              
              {availability?.available === true && (
                <div className="flex items-center p-3 bg-status-available bg-opacity-10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-status-available mr-2"></div>
                  <span className="text-sm text-gray-700">Available for selected dates</span>
                </div>
              )}
              
              {availability?.available === false && (
                <div className="flex items-center p-3 bg-status-late bg-opacity-10 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-status-late mr-2"></div>
                  <span className="text-sm text-gray-700">Not available for selected dates</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              {user?.id === product.ownerId ? (
                <Button
                  className="w-full bg-gray-400 text-white cursor-not-allowed"
                  disabled
                >
                  Your Item - Cannot Book
                </Button>
              ) : (
                <Button
                  className="w-full bg-rental-primary hover:bg-blue-700"
                  onClick={handleProceedToCheckout}
                  disabled={
                    createBookingMutation.isPending || 
                    !booking.startDate || 
                    !booking.endDate || 
                    (booking.durationType === 'hourly' && (!booking.startTime || !booking.endTime)) ||
                    (availability && !availability.available)
                  }
                >
                  {createBookingMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating Booking...
                    </div>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={handleWishlistToggle}>
                <Heart className={`w-4 h-4 mr-2 ${wishlistStatus.isInWishlist ? 'text-red-500' : 'text-gray-500'}`} />
                {wishlistStatus.isInWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Razorpay Payment Modal */}
      {showPayment && createdBooking && (
        <RazorpayPayment
          booking={createdBooking}
          product={product}
          isOpen={showPayment}
          onClose={() => {
            setShowPayment(false);
            setCreatedBooking(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Dialog>
  );
}
