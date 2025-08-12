import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, User, LogOut, Plus, Heart, BarChart3, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notifications");
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  // Check if user has products (to show owner dashboard link)
  const { data: userProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products", { ownerId: user?.id }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products?ownerId=${user?.id}`);
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;
  const hasProducts = userProducts.length > 0;

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="text-xl font-bold text-rental-primary"
              onClick={() => setLocation("/")}
            >
              RentalPro
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className={location === "/" ? "text-rental-primary" : "text-gray-600"}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/products")}
              className={location === "/products" ? "text-rental-primary" : "text-gray-600"}
            >
              Browse & Rent
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/bookings")}
              className={location === "/bookings" ? "text-rental-primary" : "text-gray-600"}
            >
              My Bookings
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation("/wishlist")}
              className={location === "/wishlist" ? "text-rental-primary" : "text-gray-600"}
            >
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </Button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Add Item Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/add-item")}
              className="hidden md:flex"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/notifications")}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl} />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-medium">{user.firstName} {user.lastName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                {hasProducts && (
                  <DropdownMenuItem onClick={() => setLocation("/owner-dashboard")}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Owner Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
