import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CreditCard, IndianRupee, CheckCircle, Loader2, Shield, Clock } from "lucide-react";

interface RazorpayPaymentProps {
  booking: any;
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({ booking, product, isOpen, onClose, onSuccess }: RazorpayPaymentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [orderId, setOrderId] = useState<string>('');

  // Create Razorpay order
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/razorpay/create-order", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.orderId);
      initializeRazorpay(data.orderId, data.amount);
    },
    onError: (error) => {
      toast({ title: "Payment Error", description: "Failed to create payment order.", variant: "destructive" });
    },
  });

  // Verify payment
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", "/api/razorpay/verify-payment", paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      setPaymentStatus('success');
      toast({
        title: "Payment Successful! 🎉",
        description: "Your booking has been confirmed and payment processed successfully.",
      });
      
      // Update booking status
      updateBookingStatusMutation.mutate({
        bookingId: booking.id,
        paymentId: data.paymentId,
        orderId: orderId,
        status: 'confirmed'
      });
    },
    onError: (error) => {
      setPaymentStatus('failed');
      toast({ title: "Payment Failed", description: "Payment verification failed. Please try again.", variant: "destructive" });
    },
  });

  // Update booking status
  const updateBookingStatusMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await apiRequest("PATCH", `/api/bookings/${updateData.bookingId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error("Failed to update booking status:", error);
    },
  });

  const initializeRazorpay = (orderId: string, amount: number) => {
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        createRazorpayInstance(orderId, amount);
      };
      document.body.appendChild(script);
    } else {
      createRazorpayInstance(orderId, amount);
    }
  };

  const createRazorpayInstance = (orderId: string, amount: number) => {
    setPaymentStatus('processing');
    
    const options = {
      key: 'rzp_test_9MU2noH8ILR9Np', // Your Razorpay Key ID
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'RentalPro',
      description: `Booking for ${product.name}`,
      order_id: orderId,
      handler: function (response: any) {
        // For mock purposes, we'll simulate successful payment
        console.log('Payment successful:', response);
        
        // Simulate payment verification
        setTimeout(() => {
          verifyPaymentMutation.mutate({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: 'mock_signature_for_testing'
          });
        }, 1000);
      },
      prefill: {
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email || '',
        contact: '9999999999' // Mock contact
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: function() {
          setPaymentStatus('pending');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleStartPayment = () => {
    if (!booking || !product) return;
    
    const orderData = {
      amount: parseFloat(booking.totalAmount),
      currency: 'INR',
      receipt: `booking_${booking.id}`,
      notes: {
        bookingId: booking.id,
        productId: product.id,
        customerId: user?.id
      }
    };
    
    createOrderMutation.mutate(orderData);
  };

  const handleMockPayment = () => {
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      const mockPaymentId = 'pay_' + Math.random().toString(36).substr(2, 9);
      const mockOrderId = 'order_' + Math.random().toString(36).substr(2, 9);
      
      setOrderId(mockOrderId);
      
      // Simulate successful payment
      setTimeout(() => {
        setPaymentStatus('success');
        toast({
          title: "Payment Successful! 🎉",
          description: "Your booking has been confirmed and payment processed successfully.",
        });
        
        // Update booking status
        updateBookingStatusMutation.mutate({
          bookingId: booking.id,
          paymentId: mockPaymentId,
          orderId: mockOrderId,
          status: 'confirmed'
        });
      }, 2000);
    }, 1000);
  };

  if (!booking || !product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Status */}
          {paymentStatus === 'pending' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <IndianRupee className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Required</h3>
                <p className="text-gray-600">Complete your payment to confirm the booking</p>
              </div>
            </div>
          )}
          
          {paymentStatus === 'processing' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
              </div>
            </div>
          )}
          
          {paymentStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
                <p className="text-gray-600">Your booking has been confirmed</p>
              </div>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
                <p className="text-gray-600">Please try again or contact support</p>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product</span>
                  <span className="text-gray-900">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="text-gray-900">
                    {booking.durationType === 'hourly' ? 'Hourly' : 
                     booking.durationType === 'daily' ? 'Daily' : 
                     booking.durationType === 'weekly' ? 'Weekly' : 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="text-gray-900">{booking.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price</span>
                  <span className="text-gray-900">₹{parseFloat(booking.basePrice).toFixed(2)}</span>
                </div>
                {parseFloat(booking.discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{parseFloat(booking.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="text-gray-900">₹{parseFloat(booking.serviceFee).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-lg text-blue-600">₹{parseFloat(booking.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">Secure Payment</p>
                <p>Your payment is processed securely by Razorpay. We never store your card details.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {paymentStatus === 'pending' && (
            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleStartPayment}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Order...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay ₹{parseFloat(booking.totalAmount).toFixed(2)}
                  </div>
                )}
              </Button>
              
              {/* Mock Payment Button for Testing */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleMockPayment}
                disabled={paymentStatus !== 'pending'}
              >
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mock Payment (Testing)
                </div>
              </Button>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setPaymentStatus('pending')}
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
