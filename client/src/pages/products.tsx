import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import ProductCard from "@/components/product-card";
import BookingModal from "@/components/booking-modal";
import CloudinaryUpload from "@/components/cloudinary-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Products() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get('category');
  
  const [filters, setFilters] = useState({
    searchQuery: "",
    categoryId: categoryFromUrl || "all",
    minPrice: "",
    maxPrice: "",
    location: "",
    availability: "any",
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

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Debug logging
  console.log('User:', user);
  console.log('User customerType:', user?.customerType);
  console.log('Should show Add Product:', user?.customerType === 'lister');


  const { data: products = [], refetch: refetchProducts } = useQuery<any[]>({
    queryKey: ["/api/products", filters],
    queryFn: ({ queryKey }) => {
      const [url, filterParams] = queryKey as [string, typeof filters];
      const searchParams = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (!value) return;
        if (key === "categoryId" && value === "all") return;
        if (key === "availability" && value === "any") return;
        searchParams.append(key, value as string);
      });
      return fetch(`${url}?${searchParams}`).then(res => res.json());
    },
    retry: false,
  });

  const { data: durationOptions = [] } = useQuery<any[]>({
    queryKey: ["/api/config/durations"],
    retry: false,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleProductClick = (product: any) => {
    // Check if user is trying to book their own item
    if (user?.id === product.ownerId) {
      toast({
        title: "Cannot Book Own Item",
        description: "You cannot book your own item.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedProduct(product);
    setShowBookingModal(true);
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse & Rent Items</h1>
              <p className="text-gray-600">Discover thousands of items available for rent</p>
            </div>
            {(user?.customerType === 'lister' || !user?.customerType) && (
              <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
                <DialogTrigger asChild>
                  <Button className="bg-rental-primary hover:bg-blue-700">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <CloudinaryUpload onSuccess={() => {
                    setShowAddProductModal(false);
                    refetchProducts();
                    toast({ title: "Success", description: "Product added successfully!" });
                  }} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <Input placeholder="Search for items..." className="pl-10" value={filters.searchQuery} onChange={(e) => handleFilterChange("searchQuery", e.target.value)} />
                </div>
              </div>
              <div>
                <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={filters.availability} onValueChange={(value) => handleFilterChange("availability", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="available">Available Now</SelectItem>
                    <SelectItem value="upcoming">Available Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Button variant="ghost" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="text-rental-primary hover:text-rental-primary">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Advanced Filters
              </Button>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 grid md:grid-cols-3 gap-4 border-t border-gray-200 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <Input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => handleFilterChange("minPrice", e.target.value)} />
                    <span className="text-gray-500">-</span>
                    <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => handleFilterChange("maxPrice", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input placeholder="Enter location..." value={filters.location} onChange={(e) => handleFilterChange("location", e.target.value)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product: any) => (
            <ProductCard key={product.id} product={product} onClick={() => handleProductClick(product)} />
          ))}
        </div>

        {!products || products.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some(v => v && v !== 'all' && v !== 'any')
                  ? "Try adjusting your search filters to find more items."
                  : "Be the first to add a product to the marketplace!"
                }
              </p>
              {(user?.customerType === 'lister' || !user?.customerType) && (
                <Button onClick={() => setShowAddProductModal(true)} className="bg-rental-primary hover:bg-blue-700">
                  Add Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Booking Modal */}
      {selectedProduct && (
        <BookingModal
          product={selectedProduct}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedProduct(null);
          }}
          durationOptions={durationOptions || []}
        />
      )}

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
