import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface ProductCardProps {
  product: any;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const { data: pricing = [] } = useQuery<any[]>({
    queryKey: ["/api/products", product.id, "pricing"],
    retry: false,
  });

  const getAvailabilityStatus = () => {
    const now = new Date();
    const availableFrom = product.availableFrom ? new Date(product.availableFrom) : null;
    const availableUntil = product.availableUntil ? new Date(product.availableUntil) : null;
    
    // Check quantity first - if 0, it's sold out regardless of dates
    if (product.quantity <= 0) {
      return { status: 'sold_out', color: 'bg-red-500 text-white', text: 'Sold Out' };
    }
    
    // If no dates are set, assume always available
    if (!availableFrom && !availableUntil) {
      return { status: 'available', color: 'bg-green-500 text-white', text: 'Available' };
    }
    
    // Check if currently available
    const isCurrentlyAvailable = (!availableFrom || now >= availableFrom) && 
                                (!availableUntil || now <= availableUntil);
    
    if (isCurrentlyAvailable) {
      return { status: 'available', color: 'bg-green-500 text-white', text: 'Available' };
    }
    
    // Check if available in the future
    if (availableFrom && now < availableFrom) {
      const daysUntilAvailable = Math.ceil((availableFrom.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        status: 'upcoming', 
        color: 'bg-blue-500 text-white', 
        text: `Available in ${daysUntilAvailable} day${daysUntilAvailable > 1 ? 's' : ''}` 
      };
    }
    
    // Past availability
    return { status: 'unavailable', color: 'bg-gray-500 text-white', text: 'Not Available' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 text-white';
      case 'rented':
        return 'bg-red-500 text-white';
      case 'returned':
        return 'bg-blue-500 text-white';
      case 'late':
        return 'bg-orange-500 text-white';
      case 'reserved':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const primaryImage = product.images?.[0] || null;
  const basePrice = pricing?.find((p: any) => p.durationType === 'hourly')?.basePrice || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer" onClick={onClick}>
      <div className="relative">
        {primaryImage && !imageError ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {(() => {
            const availability = getAvailabilityStatus();
            return (
              <Badge className={availability.color}>
                <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
                {availability.text}
              </Badge>
            );
          })()}
        </div>
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement favorite functionality
          }}
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg group-hover:text-rental-primary transition-colors duration-200 line-clamp-1">
            {product.name}
          </h3>
          <div className="text-right ml-2">
            <p className="text-lg font-bold text-gray-900">${basePrice}</p>
            <p className="text-xs text-gray-500">/day</p>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description || 'No description available'}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{product.location || 'Location not specified'}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>4.8 (24)</span>
          </div>
        </div>
        
        {/* Quick Pricing Preview */}
        {pricing && pricing.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-600 mb-2">Quick pricing preview:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {pricing.slice(0, 3).map((price: any) => (
                <div key={price.durationType} className="text-center">
                  <p className="font-medium text-gray-900">${price.basePrice}</p>
                  <p className="text-gray-500">{price.durationType}</p>
                  {price.discountPercentage > 0 && (
                    <p className="text-green-600 text-xs">Save {price.discountPercentage}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button className="w-full bg-rental-primary text-white hover:bg-blue-700">
          Book Now
        </Button>
      </CardContent>
    </Card>
  );
}
