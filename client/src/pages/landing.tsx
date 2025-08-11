import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-rental-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">RentalPro</span>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-rental-primary hover:bg-blue-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            The Smart Way to
            <span className="bg-gradient-to-r from-rental-primary to-rental-secondary bg-clip-text text-transparent"> Rent & Share</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Earn money from your unused items or find exactly what you need for any project. 
            Join thousands of users saving money and reducing waste.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-rental-primary hover:bg-blue-700 text-lg px-8 py-3"
          >
            Get Started Today
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-rental-primary to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold ml-4">List Your Items</h2>
              </div>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Start earning by renting out your equipment, tools, or any items you own. 
                Upload photos, set prices, and manage bookings.
              </p>
              <div className="text-blue-100 text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Earn up to $500/month with your unused items
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rental-secondary to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold ml-4">Rent Items</h2>
              </div>
              <p className="text-purple-100 mb-6 leading-relaxed">
                Browse thousands of items available for rent. From tools to electronics, 
                find what you need for any duration.
              </p>
              <div className="text-purple-100 text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Save up to 80% compared to buying new
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: "✓", label: "Available Items", count: "1,247+", color: "status-available" },
            { icon: "🤝", label: "Active Rentals", count: "432+", color: "status-rented" },
            { icon: "↻", label: "Completed", count: "2,891+", color: "status-returned" },
            { icon: "⏰", label: "Happy Users", count: "5,632+", color: "status-reserved" },
          ].map((stat, index) => (
            <Card key={index} className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up & Choose",
                description: "Create your account and decide whether to list items or rent from others"
              },
              {
                step: "2", 
                title: "Browse or List",
                description: "Upload your items with photos and prices, or browse available rentals"
              },
              {
                step: "3",
                title: "Book & Earn",
                description: "Complete secure transactions and start earning or enjoying your rentals"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-rental-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-rental-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">RentalPro</span>
          </div>
          <p className="text-gray-400 mb-4">
            The smart way to rent and share equipment. Earn from your unused items or find what you need for any project.
          </p>
          <p className="text-gray-500 text-sm">&copy; 2024 RentalPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
