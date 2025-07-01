import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Gauge, ChevronLeft, ChevronRight, Settings, Fuel, User, X, SlidersHorizontal, Building, RefreshCw, Clock, Tag, Check } from 'lucide-react';
import { listings, supabase } from '../lib/supabase';
import NetworkErrorHandler from '../components/NetworkErrorHandler';

// Optimized category images - locally stored
const categoryImages = {
  sport: "/category-images/sport.jpg",
  touring: "/category-images/touring.jpg",
  cruiser: "/category-images/cruiser.jpg",
  adventure: "/category-images/adventure.jpg",
  naked: "/category-images/naked.jpg",
  enduro: "/category-images/enduro.jpg",
  scooter: "/category-images/scooter.jpg",
  chopper: "/category-images/chopper.jpg"
};

// Fallback image if category image is not found
const fallbackImage = "/category-images/fallback.jpg";

const HomePage = () => {
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse URL parameters for category filter
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('categorie');
    
    if (categoryParam) {
      navigate(`/?categorie=${categoryParam}`, { replace: true });
      handleCategoryClick(categoryParam);
    } else {
      loadListings();
    }
  }, [location.search]);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setNetworkError(null);

      console.log('🔄 Loading listings from Supabase...');
      
      // Get featured listings
      const { data: featuredData, error: featuredError } = await listings.getAll({ featured: true });
      
      if (featuredError) {
        console.error('❌ Error loading featured listings:', featuredError);
        if (featuredError.message?.includes('fetch') || featuredError.message?.includes('network')) {
          setNetworkError(featuredError);
          return;
        }
        setError('Nu s-au putut încărca anunțurile recomandate');
        return;
      }
      
      // Get recent listings
      const { data: recentData, error: recentError } = await listings.getAll();
      
      if (recentError) {
        console.error('❌ Error loading recent listings:', recentError);
        if (recentError.message?.includes('fetch') || recentError.message?.includes('network')) {
          setNetworkError(recentError);
          return;
        }
        setError('Nu s-au putut încărca anunțurile recente');
        return;
      }
      
      // Format listings for display
      const formattedFeatured = (featuredData || []).slice(0, 4).map(formatListing);
      const formattedRecent = (recentData || [])
        .filter(listing => !formattedFeatured.some(f => f.id === listing.id))
        .slice(0, 8)
        .map(formatListing);
      
      setFeaturedListings(formattedFeatured);
      setRecentListings(formattedRecent);
      
      console.log(`✅ Loaded ${formattedFeatured.length} featured and ${formattedRecent.length} recent listings`);
      
    } catch (err: any) {
      console.error('💥 Error in loadListings:', err);
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setNetworkError(err);
      } else {
        setError('A apărut o eroare la încărcarea anunțurilor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatListing = (listing: any) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    year: listing.year,
    mileage: listing.mileage,
    location: listing.location,
    image: listing.images && listing.images.length > 0 ? listing.images[0] : fallbackImage,
    seller: listing.seller_name,
    sellerId: listing.seller_id,
    sellerType: listing.seller_type,
    category: listing.category,
    brand: listing.brand,
    model: listing.model,
    featured: listing.featured || false,
    availability: listing.availability || "pe_stoc"
  });

  const handleCategoryClick = async (category: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setNetworkError(null);
      
      console.log(`🔍 Filtering listings by category: ${category}`);
      
      const { data, error } = await listings.getAll({ category });
      
      if (error) {
        console.error('❌ Error loading category listings:', error);
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          setNetworkError(error);
          return;
        }
        setError(`Nu s-au putut încărca anunțurile din categoria ${category}`);
        return;
      }
      
      const formattedListings = (data || []).map(formatListing);
      
      // Set both featured and recent to the filtered results
      setFeaturedListings([]);
      setRecentListings(formattedListings);
      
      console.log(`✅ Loaded ${formattedListings.length} listings for category ${category}`);
      
    } catch (err: any) {
      console.error('💥 Error in handleCategoryClick:', err);
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setNetworkError(err);
      } else {
        setError(`A apărut o eroare la filtrarea după categoria ${category}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerClick = (e: React.MouseEvent, sellerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profil/${sellerId}`);
  };

  const ListingCard = ({ listing }: { listing: any }) => (
    <Link to={`/anunt/${listing.id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 h-full border border-gray-100">
        <div className="relative">
          <img
            loading="lazy"
            src={listing.image}
            alt={listing.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = fallbackImage;
            }}
          />
          <div className="absolute top-3 left-3">
            <span className="bg-nexar-accent text-white px-3 py-1 rounded-full text-xs font-semibold">
              {listing.category}
            </span>
          </div>
          {listing.featured && (
            <div className="absolute top-3 right-3">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Premium
              </span>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-nexar-accent transition-colors">
              {listing.brand} {listing.model}
            </h3>
            <div className="text-xl font-bold text-nexar-accent mb-2">€{listing.price.toLocaleString()}</div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <div className="text-sm text-gray-600">
              Vândut de: 
              <button 
                onClick={(e) => handleSellerClick(e, listing.sellerId)}
                className="font-semibold text-nexar-accent hover:text-nexar-gold transition-colors ml-1"
              >
                {listing.seller}
              </button>
            </div>
            
            {/* BADGE DEALER MULT MAI VIZIBIL */}
            {listing.sellerType === 'dealer' ? (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-full shadow-md border border-emerald-400">
                <Building className="h-3 w-3" />
                <span className="font-bold text-xs tracking-wide">DEALER VERIFICAT</span>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-3 py-1.5 rounded-full shadow-md">
                <User className="h-3 w-3" />
                <span className="font-semibold text-xs">PRIVAT</span>
              </div>
            )}
          </div>
          
          {/* Disponibilitate pentru dealeri */}
          {listing.sellerType === 'dealer' && (
            <div className="mb-3">
              {listing.availability === "pe_stoc" ? (
                <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs">
                  <Check className="h-3 w-3" />
                  <span className="font-medium">Pe stoc</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-xs">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">La comandă</span>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{listing.year}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <Gauge className="h-4 w-4" />
              <span>{listing.mileage.toLocaleString()} km</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{listing.location}</span>
            </div>
          </div>
          
          <div className="mt-auto pt-2">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center text-sm">
              Vezi Detalii
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  // Network error handler
  if (networkError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <NetworkErrorHandler 
            error={networkError} 
            onRetry={loadListings} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-16 sm:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/hero-background.jpg"
            alt="Motorcycle background"
            className="w-full h-full object-cover opacity-40"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = fallbackImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-800/80 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Găsește Motocicleta Perfectă
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8">
              Cel mai premium marketplace pentru motociclete din România
            </p>
            
            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-2xl mx-auto">
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                if (input.value) {
                  navigate(`/anunturi?q=${input.value}`);
                } else {
                  navigate('/anunturi');
                }
              }}>
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Caută după marcă, model sau locație..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-nexar-accent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
                <button
                  type="submit"
                  className="bg-nexar-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors flex-shrink-0 flex items-center justify-center space-x-2"
                >
                  <Search className="h-5 w-5" />
                  <span>Caută</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
            Categorii Populare
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {['sport', 'touring', 'cruiser', 'adventure'].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="group relative overflow-hidden rounded-xl shadow-md h-40 sm:h-48"
              >
                <img
                  src={categoryImages[category as keyof typeof categoryImages] || fallbackImage}
                  alt={category}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = fallbackImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg sm:text-xl capitalize group-hover:tracking-wider transition-all duration-300">
                    {category}
                  </h3>
                </div>
              </button>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/anunturi"
              className="inline-flex items-center space-x-2 text-nexar-accent hover:text-nexar-gold transition-colors font-semibold"
            >
              <span>Vezi toate categoriile</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-nexar-accent/5 to-nexar-gold/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Anunțuri Premium
              </h2>
              <Link
                to="/anunturi"
                className="text-nexar-accent hover:text-nexar-gold transition-colors font-semibold flex items-center space-x-1"
              >
                <span>Vezi toate</span>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm h-80">
                    <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-800 mb-2">Eroare la încărcare</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={loadListings}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Încearcă din nou</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Listings */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Anunțuri Recente
            </h2>
            <Link
              to="/anunturi"
              className="text-nexar-accent hover:text-nexar-gold transition-colors font-semibold flex items-center space-x-1"
            >
              <span>Vezi toate</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm h-80">
                  <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">Eroare la încărcare</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={loadListings}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Încearcă din nou</span>
              </button>
            </div>
          ) : recentListings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nu am găsit anunțuri</h3>
              <p className="text-gray-600 mb-6">
                Nu există anunțuri disponibile momentan. Fii primul care adaugă un anunț!
              </p>
              <Link
                to="/adauga-anunt"
                className="bg-nexar-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-nexar-gold transition-colors"
              >
                Adaugă Anunț
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ai o motocicletă de vânzare?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Adaugă anunțul tău pe Nexar și ajunge la mii de cumpărători pasionați de motociclete.
          </p>
          <Link
            to="/adauga-anunt"
            className="bg-nexar-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-nexar-gold transition-colors inline-flex items-center space-x-2 transform hover:scale-105 duration-200"
          >
            <span>Adaugă Anunț Gratuit</span>
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;