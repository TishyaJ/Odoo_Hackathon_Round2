import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/navigation";
import ProductCard from "@/components/product-card";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Package, ArrowLeft } from "lucide-react";

export default function Wishlist() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
    return null;
  }

  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/wishlist");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/products");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/wishlist/${productId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from Wishlist",
        description: "Item has been removed from your wishlist.",
      });
    },
    onError: (error) => {
      toast({ title: "Failed", description: "Unable to remove from wishlist. Please try again.", variant: "destructive" });
    },
  });

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlistMutation.mutate(productId);
  };

  const handleProductClick = (product: any) => {
    // Navigate to products page with the specific product
    setLocation(`/products?product=${product.id}`);
  };

  // Filter products to only show wishlist items
  const wishlistProducts = products.filter(product => 
    wishlistItems.some(wishlistItem => wishlistItem.productId === product.id)
  );

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
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">Your saved items for future rentals</p>
            </div>
          </div>
        </div>

        {wishlistLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full" />
          </div>
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} onClick={() => handleProductClick(product)} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWishlist(product.id);
                  }}
                  disabled={removeFromWishlistMutation.isPending}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">
                Start exploring items and add them to your wishlist for easy access later.
              </p>
              <Button onClick={() => setLocation("/products")} className="bg-rental-primary hover:bg-blue-700">
                Browse Items
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
