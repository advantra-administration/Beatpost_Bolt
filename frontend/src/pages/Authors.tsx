import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authorService, Author } from '../services/api';
import { 
  Search,
  Filter,
  ChevronDown,
  User as UserIcon,
  TrendingUp,
  FileText,
  Star,
  Users,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Authors: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('mojo_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadAuthors();
  }, [sortBy, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAuthors = async () => {
    try {
      setLoading(true);
      const response = await authorService.getAuthors(
        0,
        50, // Load more authors for better display
        sortBy,
        searchTerm || undefined
      );
      
      setAuthors(response.authors);
      setTotal(response.total);
    } catch (error) {
      toast.error('Error cargando autores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setShowFilters(false);
  };

  const getSortLabel = (sortValue: string) => {
    const labels = {
      'mojo_desc': 'Highest Rating',
      'mojo_asc': 'Lowest Rating', 
      'posts_desc': 'Más artículos',
      'posts_asc': 'Menos artículos',
      'rating_desc': 'Mejor valorados',
      'rating_asc': 'Peor valorados'
    };
    return labels[sortValue as keyof typeof labels] || 'Highest Rating';
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-200 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="beat-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-newspaper-900 mb-4">Autores</h1>
        <p className="text-newspaper-600 text-lg">
          Descubre a los beatniks que están transformando la escritura contemporánea
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-newspaper-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscador de autores por palabras clave"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border border-newspaper-300 rounded-lg focus:ring-2 focus:ring-newspaper-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-newspaper-100 text-newspaper-700 rounded-lg hover:bg-newspaper-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Sort by: {getSortLabel(sortBy)}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-newspaper-300 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <button
                    onClick={() => handleSortChange('mojo_desc')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'mojo_desc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 mr-2 inline" />
                    Highest Rating
                  </button>
                  <button
                    onClick={() => handleSortChange('posts_desc')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'posts_desc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2 inline" />
                    Más artículos publicados
                  </button>
                  <button
                    onClick={() => handleSortChange('rating_desc')}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      sortBy === 'rating_desc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                    }`}
                  >
                    <Star className="w-4 h-4 mr-2 inline" />
                    Mejor valorados
                  </button>
                </div>
              </div>
            )}
          </div>

          {searchTerm && (
            <div className="text-sm text-newspaper-600">
              {authors.length} resultado{authors.length !== 1 ? 's' : ''} para "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Authors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="beat-card p-6">
              <div className="flex items-start space-x-4">
                <div className="beat-loading w-16 h-16 rounded-full"></div>
                <div className="flex-1">
                  <div className="beat-loading h-6 mb-2"></div>
                  <div className="beat-loading h-4 mb-4"></div>
                  <div className="beat-loading h-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-newspaper-400" />
          <h3 className="text-xl font-semibold text-newspaper-700 mb-2">
            {searchTerm ? 'No se encontraron autores' : 'No hay autores disponibles'}
          </h3>
          <p className="text-newspaper-600">
            {searchTerm 
              ? `No hay autores que coincidan con "${searchTerm}"`
              : 'Aún no hay autores registrados en la plataforma'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => (
            <div key={author.id} className="beat-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4 mb-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-newspaper-200 rounded-full flex items-center justify-center">
                    {author.avatar ? (
                      <img 
                        src={author.avatar} 
                        alt={author.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-newspaper-600" />
                    )}
                  </div>
                </div>

                {/* Author Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-newspaper-900 mb-1">
                    {author.username}
                  </h3>
                  
                  {/* Stats Row */}
                  <div className="flex items-center space-x-4 text-sm text-newspaper-600 mb-2">
                    <span className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {Math.round(author.mojo)}
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      {author.posts_count}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    {renderStarRating(author.average_rating)}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {author.bio && (
                <p className="text-newspaper-700 text-sm mb-4 line-clamp-3">
                  {author.bio.length > 120 
                    ? `${author.bio.substring(0, 120)}...` 
                    : author.bio
                  }
                </p>
              )}

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-newspaper-600">
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{author.followers_count} seguidores</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  <span>{author.total_visits} visitas</span>
                </div>
              </div>

              {/* Action Button */}
              <Link 
                to={`/beatnik/${author.username}`}
                className="w-full beat-button-secondary text-center py-2 text-sm inline-block"
              >
                Ver perfil
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!loading && authors.length > 0 && (
        <div className="mt-8 text-center text-newspaper-600">
          <p>
            Mostrando {authors.length} de {total} autores
            {searchTerm && ` que coinciden con "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Authors;