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
import { Calendar, MapPin, Star, User, Plus, Minus, Package, Heart } from "lucide-react";

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
    quantity: 1,
    durationType: 'daily' as string,
  });
  
  const [pricing, setPricing] = useState({
    basePrice: 0,
    discount: 0,
    serviceFee: 8.50,
    total: 0,
  });

  const { data: productPricing = [] } = useQuery<any[]>({
    queryKey: ["/api/products", product?.id, "pricing"],
    enabled: !!product?.id,
    retry: false,
  });

  const { data: availability = { available: true } } = useQuery<{ available: boolean }>({
    queryKey: ["/api/products", product?.id, "check-availability", booking.startDate, booking.endDate],
    queryFn: async () => {
      if (!booking.startDate || !booking.endDate) return { available: true };
      
      const response = await apiRequest("POST", `/api/products/${product.id}/check-availability`, {
        startDate: booking.startDate,
        endDate: booking.endDate,
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
      toast({
        title: "Booking Created",
        description: "Your rental has been reserved successfully!",
      });
      onClose();
      // Optionally redirect to checkout or booking details
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
        title: "Booking Failed",
        description: "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate pricing when booking details change
  useEffect(() => {
    if (!productPricing || !booking.startDate || !booking.endDate) return;

    const selectedPricing = productPricing.find((p: any) => p.durationType === booking.durationType);
    if (!selectedPricing) return;

    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    
    let duration = 1;
    switch (booking.durationType) {
      case 'hourly':
        duration = Math.ceil(timeDiff / (1000 * 60 * 60));
        break;
      case 'daily':
        duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        break;
      case 'weekly':
        duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7));
        break;
      case 'monthly':
        duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30));
        break;
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

  const handleProceedToCheckout = () => {
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to make a booking.",
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
      quantity: booking.quantity,
      durationType: booking.durationType,
      basePrice: pricing.basePrice.toString(),
      discount: pricing.discount.toString(),
      serviceFee: pricing.serviceFee.toString(),
      totalAmount: pricing.total.toString(),
    };

    createBookingMutation.mutate(bookingData);
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
                <span>4.8 (47 reviews)</span>
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
            
            {/* Duration Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700 mb-2">Rental Duration</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {durationOptions.map((option: any) => (
                  <Button
                    key={option.type}
                    variant={booking.durationType === option.type ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBookingChange('durationType', option.type)}
                    className="justify-center"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Start Date</Label>
                <Input
                  type="date"
                  value={booking.startDate}
                  onChange={(e) => handleBookingChange('startDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">End Date</Label>
                <Input
                  type="date"
                  value={booking.endDate}
                  onChange={(e) => handleBookingChange('endDate', e.target.value)}
                  min={booking.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
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
              <Button
                className="w-full bg-rental-primary hover:bg-blue-700"
                onClick={handleProceedToCheckout}
                disabled={
                  createBookingMutation.isPending || 
                  !booking.startDate || 
                  !booking.endDate || 
                  (availability && !availability.available)
                }
              >
                {createBookingMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating Booking...
                  </div>
                ) : (
                  'Get Quote & Continue'
                )}
              </Button>
              <Button variant="outline" className="w-full">
                <Heart className="w-4 h-4 mr-2" />
                Save to Wishlist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
