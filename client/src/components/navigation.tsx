import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-rental-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">RentalPro</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6 ml-8">
              <Link href="/">
                <Button variant={location === "/" ? "default" : "ghost"} size="sm">Dashboard</Button>
              </Link>
              <Link href="/products">
                <Button variant={location === "/products" ? "default" : "ghost"} size="sm">Products</Button>
              </Link>
              <Link href="/add-item">
                <Button variant={location === "/add-item" ? "default" : "ghost"} size="sm" className="bg-rental-primary hover:bg-blue-700 text-white">
                  + Add Item
                </Button>
              </Link>
              <Link href="/bookings">
                <Button variant={location === "/bookings" ? "default" : "ghost"} size="sm">My Bookings</Button>
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant={location === "/admin" ? "default" : "ghost"} size="sm">Admin</Button>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-gray-600">Welcome back,</span>
              <span className="text-sm font-medium text-gray-900">{user?.firstName || user?.email || 'User'}</span>
              <Badge variant="secondary" className="bg-rental-primary text-white">{user?.role || 'Customer'}</Badge>
            </div>
            
            <div className="relative">
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="relative">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">{unreadCount}</Badge>
                  )}
                </Button>
              </Link>
            </div>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
