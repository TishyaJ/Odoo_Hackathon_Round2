import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, X, Plus, Package, MapPin, DollarSign, Clock, AlertCircle } from "lucide-react";

interface CloudinaryUploadProps {
  onSuccess?: () => void;
}

export default function CloudinaryUpload({ onSuccess }: CloudinaryUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    categoryId: 'select-category',
    location: '',
    quantity: 1,
    availableFrom: '',
    availableUntil: '',
  });
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [pricing, setPricing] = useState({
    hourly: { enabled: false, price: '' },
    daily: { enabled: false, price: '' },
    weekly: { enabled: false, price: '' },
    monthly: { enabled: false, price: '' },
  });
  
  const [lateFees, setLateFees] = useState({
    dailyRate: '',
    description: '',
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Debug logging
  console.log('Categories loading:', categoriesLoading);
  console.log('Categories error:', categoriesError);
  console.log('Categories data:', categories);

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      console.log('Sending product data to API:', productData);
      const response = await apiRequest("POST", "/api/products", productData);
      console.log('API response status:', response.status);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Created Successfully!",
        description: "Your item has been listed and is now available for rent.",
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
      categoryId: 'select-category',
      location: '',
      quantity: 1,
      availableFrom: '',
      availableUntil: '',
    });
    setUploadedImages([]);
    setPricing({
      hourly: { enabled: false, price: '' },
      daily: { enabled: false, price: '' },
      weekly: { enabled: false, price: '' },
      monthly: { enabled: false, price: '' },
    });
    setLateFees({
      dailyRate: '',
      description: '',
    });
    setCurrentStep(1);
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
        
        if (!signatureResponse.ok) {
          const errorData = await signatureResponse.json();
          throw new Error(`Signature generation failed: ${errorData.message}`);
        }
        
        const signatureData = await signatureResponse.json();
        console.log('Cloudinary signature data:', signatureData);

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signatureData.apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signatureData.signature);
        formData.append('public_id', public_id);
        formData.append('folder', folder);
        
        console.log('Uploading to Cloudinary:', {
          cloudName: signatureData.cloudName,
          public_id,
          folder,
          timestamp,
          fileSize: file.size,
          fileType: file.type
        });

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Cloudinary upload error response:', errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const uploadResult = await uploadResponse.json();
        setUploadedImages(prev => [...prev, uploadResult.secure_url]);
      }

      toast({
        title: "Images Uploaded Successfully!",
        description: `Successfully uploaded ${files.length} image(s) to Cloudinary`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload images to Cloudinary. Please try again.",
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

  const handlePricingChange = (durationType: string, field: 'enabled' | 'price', value: boolean | string) => {
    setPricing(prev => ({
      ...prev,
      [durationType]: {
        ...prev[durationType as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleLateFeesChange = (field: string, value: string) => {
    setLateFees(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return productForm.name.trim() && productForm.categoryId && productForm.categoryId !== 'select-category';
      case 2:
        return productForm.location.trim() && productForm.quantity > 0 && Object.values(pricing).some(p => p.enabled && p.price);
      case 3:
        return true; // Late fees are optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast({
        title: "Please Complete Required Fields",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    console.log('Submitting form:', { productForm, pricing, lateFees, uploadedImages });
    console.log('Current step:', currentStep);
    console.log('Step validation:', validateStep(currentStep));
    
    if (!validateStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Prepare pricing data
    const pricingData = Object.entries(pricing)
      .filter(([_, config]) => config.enabled && config.price)
      .map(([type, config]) => ({
        durationType: type,
        basePrice: config.price,
        discountPercentage: 0,
        isActive: true,
      }));

    const productData = {
      ...productForm,
      images: uploadedImages.length > 0 ? uploadedImages : [],
      pricing: pricingData,
      lateFees: lateFees.dailyRate ? {
        dailyRate: parseFloat(lateFees.dailyRate),
        description: lateFees.description,
      } : null,
    };

    createProductMutation.mutate(productData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep 
              ? 'bg-rental-primary text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-rental-primary' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3">📸 Product Images (Optional)</Label>
        <div className="mt-2">
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-rental-primary transition-colors duration-200">
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-rental-primary border-t-transparent rounded-full mr-3"></div>
                  <span className="text-gray-600">Uploading to Cloudinary...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB (Optional)</p>
                  <p className="text-xs text-rental-primary mt-2">Images will be stored in Cloudinary</p>
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

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">🏷️ Item Name (Required)</Label>
          <Input
            placeholder="Enter product name"
            value={productForm.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">📂 Category (Required)</Label>
          <Select value={productForm.categoryId} onValueChange={(value) => handleFormChange('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select Category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-category">Select Category</SelectItem>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>Loading categories...</SelectItem>
              ) : categoriesError ? (
                <SelectItem value="error" disabled>Error loading categories</SelectItem>
              ) : categories?.length === 0 ? (
                <SelectItem value="empty" disabled>No categories available</SelectItem>
              ) : (
                categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">📝 Description</Label>
        <Textarea
          rows={4}
          placeholder="Describe your product, its condition, and any important details..."
          value={productForm.description}
          onChange={(e) => handleFormChange('description', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">📍 Location (Required)</Label>
        <div className="relative">
          <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Enter pickup/delivery location"
            className="pl-10"
            value={productForm.location}
            onChange={(e) => handleFormChange('location', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2">📦 Quantity Available (Required)</Label>
        <div className="relative">
          <Package className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="number"
            min="1"
            placeholder="1"
            className="pl-10"
            value={productForm.quantity}
            onChange={(e) => handleFormChange('quantity', parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3">💰 Pricing Options (Select at least one)</Label>
        <Card className="bg-gray-50">
          <CardContent className="p-4 space-y-4">
            {[
              { key: 'hourly', label: 'Per Hour', icon: '⏰' },
              { key: 'daily', label: 'Per Day', icon: '📅' },
              { key: 'weekly', label: 'Per Week', icon: '📆' },
              { key: 'monthly', label: 'Per Month', icon: '📊' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
                <Checkbox
                  checked={pricing[key as keyof typeof pricing].enabled}
                  onCheckedChange={(checked) => 
                    handlePricingChange(key, 'enabled', checked as boolean)
                  }
                />
                <div className="flex-1">
                  <Label className="text-sm font-medium flex items-center">
                    <span className="mr-2">{icon}</span>
                    {label}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={pricing[key as keyof typeof pricing].price}
                    onChange={(e) => handlePricingChange(key, 'price', e.target.value)}
                    disabled={!pricing[key as keyof typeof pricing].enabled}
                    className="w-24"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">📅 Available From</Label>
          <Input
            type="date"
            value={productForm.availableFrom}
            onChange={(e) => handleFormChange('availableFrom', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">📅 Available Until</Label>
          <Input
            type="date"
            value={productForm.availableUntil}
            onChange={(e) => handleFormChange('availableUntil', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3">⚠️ Late Fees Policy (Optional)</Label>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 mb-3">
                  Set your late fees policy to encourage timely returns and protect your items.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Daily Late Fee Rate (%)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5.00"
                        value={lateFees.dailyRate}
                        onChange={(e) => handleLateFeesChange('dailyRate', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-gray-500">% of daily rate per day</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Late Fees Description</Label>
                    <Textarea
                      rows={3}
                      placeholder="Explain your late fees policy, grace periods, and any additional charges..."
                      value={lateFees.description}
                      onChange={(e) => handleLateFeesChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Package className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-800">Ready to List!</h3>
        </div>
        <p className="text-sm text-green-700">
          Your item will be listed on RentalPro and available for rent. You can edit or remove it anytime from your dashboard.
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Basic Information & Images";
      case 2:
        return "Location & Pricing";
      case 3:
        return "Late Fees Policy";
      default:
        return "Add New Product";
    }
  };

  return (
    <div className="space-y-6">
      {renderStepIndicator()}
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h3>
        <p className="text-sm text-gray-600">
          Step {currentStep} of 3 - {currentStep === 1 ? "Upload images and basic details" : 
                                   currentStep === 2 ? "Set location and pricing options" : 
                                   "Configure late fees policy"}
        </p>
      </div>

      {renderCurrentStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={createProductMutation.isPending}
          >
            Cancel
          </Button>
          
          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={createProductMutation.isPending}
            >
              Next Step
            </Button>
          ) : (
            <Button
              className="bg-rental-primary hover:bg-blue-700"
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
                  List This Item
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
