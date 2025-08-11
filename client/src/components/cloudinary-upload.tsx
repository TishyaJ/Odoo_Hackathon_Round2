import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, X, Plus, Package, MapPin } from "lucide-react";

interface CloudinaryUploadProps {
  onSuccess?: () => void;
}

export default function CloudinaryUpload({ onSuccess }: CloudinaryUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    categoryId: 'none',
    location: '',
    availableFrom: '',
    availableUntil: '',
  });
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pricing, setPricing] = useState({
    hourly: '',
    daily: '',
    weekly: '',
    monthly: '',
  });
  
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: durationOptions = [] } = useQuery<any[]>({
    queryKey: ["/api/config/durations"],
    retry: false,
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Created",
        description: "Your product has been added successfully!",
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({ title: "Unauthorized", description: "You are logged out. Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/login"; }, 300);
        return;
      }
      toast({ title: "Failed to Create Product", description: "Please check your information and try again.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      categoryId: '',
      location: '',
      availableFrom: '',
      availableUntil: '',
    });
    setUploadedImages([]);
    setPricing({
      hourly: '',
      daily: '',
      weekly: '',
      monthly: '',
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Get Cloudinary signature
        const timestamp = Math.round(Date.now() / 1000);
        const folder = 'rental-products';
        const public_id = `${folder}/${user?.id || 'anonymous'}_${timestamp}_${Math.random().toString(36).substring(7)}`;

        const signatureResponse = await apiRequest("POST", "/api/cloudinary/signature", {
          timestamp,
          public_id,
          folder,
        });
        
        const signatureData = await signatureResponse.json();

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureData.apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signatureData.signature);
        formData.append('public_id', public_id);
        formData.append('folder', folder);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadResult = await uploadResponse.json();
        setUploadedImages(prev => [...prev, uploadResult.secure_url]);
      }

      toast({
        title: "Images Uploaded",
        description: `Successfully uploaded ${files.length} image(s)`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleFormChange = (field: string, value: string) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePricingChange = (durationType: string, value: string) => {
    setPricing(prev => ({ ...prev, [durationType]: value }));
  };

  const handleSubmit = () => {
    if (!productForm.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a product name.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedImages.length === 0) {
      toast({
        title: "Missing Images",
        description: "Please upload at least one image.",
        variant: "destructive",
      });
      return;
    }

    // Prepare pricing data
    const pricingData = durationOptions
      ?.filter((option: any) => pricing[option.type as keyof typeof pricing])
      .map((option: any) => ({
        durationType: option.type,
        basePrice: pricing[option.type as keyof typeof pricing],
        discountPercentage: option.discountPercentage || 0,
        isActive: true,
      })) || [];

    const productData = {
      ...productForm,
      images: uploadedImages,
      pricing: pricingData,
    };

    createProductMutation.mutate(productData);
  };

  return (
    <div className="space-y-6">
      {/* Product Images Upload */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3">Product Images</Label>
        <div className="mt-2">
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-rental-primary transition-colors duration-200">
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full mr-3"></div>
                  <span className="text-gray-600">Uploading images...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </>
              )}
            </div>
          </label>
          <input
            id="image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
        </div>
        
        {uploadedImages.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-3">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative">
                <img 
                  src={imageUrl} 
                  alt={`Upload ${index + 1}`} 
                  className="w-full h-20 object-cover rounded-lg" 
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Basic Details */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Product Name</Label>
          <Input
            placeholder="Enter product name"
            value={productForm.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Category</Label>
          <Select value={productForm.categoryId} onValueChange={(value) => handleFormChange('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select Category</SelectItem>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Description</Label>
        <Textarea
          rows={4}
          placeholder="Describe your product..."
          value={productForm.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
        />
      </div>

      {/* Pricing Configuration */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3">Pricing Rules</Label>
        <Card className="bg-gray-50">
          <CardContent className="p-4 space-y-4">
            {durationOptions?.map((option: any) => (
              <div key={option.type} className="flex items-center space-x-4">
                <div className="w-20">
                  <Label className="text-sm text-gray-600">{option.label}</Label>
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={pricing[option.type as keyof typeof pricing]}
                    onChange={(e) => handlePricingChange(option.type, e.target.value)}
                  />
                </div>
                <div className="text-sm text-gray-500">per {option.type.slice(0, -2)}</div>
                {option.discountPercentage > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {option.discountPercentage}% discount
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Availability Settings */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3">Availability</Label>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-600 mb-2">Available From</Label>
            <Input
              type="date"
              value={productForm.availableFrom}
              onChange={(e) => handleFormChange('availableFrom', e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm text-gray-600 mb-2">Available Until</Label>
            <Input
              type="date"
              value={productForm.availableUntil}
              onChange={(e) => handleFormChange('availableUntil', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">Location</Label>
        <div className="relative">
          <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Enter pickup location"
            className="pl-10"
            value={productForm.location}
            onChange={(e) => handleFormChange('location', e.target.value)}
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={resetForm}
          disabled={createProductMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 bg-rental-primary hover:bg-blue-700"
          onClick={handleSubmit}
          disabled={createProductMutation.isPending || isUploading}
        >
          {createProductMutation.isPending ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Creating Product...
            </div>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
