import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import CloudinaryUpload from "@/components/cloudinary-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus } from "lucide-react";

export default function AddItemPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to add items.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-rental-primary hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-rental-primary rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
              <p className="text-gray-600">List your item for rent and start earning</p>
            </div>
          </div>
          
          {user.customerType !== 'lister' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800">
                  <strong>Note:</strong> You're currently registered as a "renter". 
                  To list items, you can update your account type in your profile settings.
                </p>
              </div>
            </div>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Item Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <CloudinaryUpload onSuccess={() => {
              toast({ 
                title: "Success!", 
                description: "Your item has been listed successfully. You can view it in the products page." 
              });
              setTimeout(() => {
                window.location.href = '/products';
              }, 2000);
            }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
