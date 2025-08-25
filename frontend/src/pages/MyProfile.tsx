import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService, Post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import EditPostModal from '../components/EditPostModal';
import DeletePostButton from '../components/DeletePostButton';
import EditProfileModal from '../components/EditProfileModal';
import { 
  User as UserIcon, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp,
  Eye,
  Star,
  MessageCircle,
  Clock,
  PenTool,
  Edit,
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  ChevronDown
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // New state for advanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [stats, setStats] = useState({
    totalViews: 0,
    totalRatings: 0,
    averageRating: 0,
    totalComments: 0
  });

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user, sortBy, searchTerm, showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserPosts = async () => {
    try {
      if (user) {
        setLoading(true);
        
        // Use the new getUserPosts API method with filters
        const userPosts = await postService.getUserPosts(
          user.id,
          0,
          100,
          sortBy,
          searchTerm || undefined,
          showArchived
        );
        
        setPosts(userPosts);
        
        // Calculate stats from all non-archived posts
        const allPosts = await postService.getUserPosts(user.id, 0, 100, undefined, undefined, false);
        const totalViews = allPosts.reduce((sum, post) => sum + post.visits, 0);
        const totalRatings = allPosts.reduce((sum, post) => sum + post.ratings_count, 0);
        const totalComments = allPosts.reduce((sum, post) => sum + post.comments_count, 0);
        const averageRating = allPosts.length > 0 
          ? allPosts.reduce((sum, post) => sum + post.average_rating, 0) / allPosts.length
          : 0;

        setStats({
          totalViews,
          totalRatings,
          averageRating,
          totalComments
        });
      }
    } catch (error) {
      toast.error('Error cargando tus artículos');
    } finally {
      setLoading(false);
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const handleEditSuccess = (updatedPost: Post) => {
    setPosts(posts.map(post => post.id === updatedPost.id ? updatedPost : post));
    setEditingPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      throw error; // Re-throw to be handled by DeletePostButton
    }
  };

  const handleProfileUpdateSuccess = () => {
    setEditingProfile(false);
    // User data will be updated via auth context
  };

  const handleArchivePost = async (postId: string) => {
    try {
      const result = await postService.toggleArchivePost(postId);
      toast.success(result.message);
      
      // Refresh posts list
      await loadUserPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error archivando artículo');
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
      'date_desc': 'Más recientes',
      'date_asc': 'Más antiguos',
      'visits_desc': 'Más visitados',
      'visits_asc': 'Menos visitados',
      'rating_desc': 'Mejor valorados',
      'rating_asc': 'Peor valorados'
    };
    return labels[sortValue as keyof typeof labels] || 'Más recientes';
  };

  if (!user) {
    return (
      <div className="beat-container">
        <div className="beat-error">
          <h2 className="text-lg font-semibold mb-2">Acceso restringido</h2>
          <p>Debes iniciar sesión para ver tu perfil.</p>
          <Link to="/login" className="beat-button mt-4 inline-block">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="beat-container">
      {/* Profile Header */}
      <div className="beat-card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-newspaper-200 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-16 h-16 text-newspaper-600" />
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-newspaper-900 mb-2">
                  {user.username}
                </h1>
                <div className="flex items-center text-newspaper-600 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Miembro desde {format(new Date(user.created_at), 'MMMM yyyy', { locale: es })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Link to="/escribir" className="beat-button flex items-center space-x-2">
                  <PenTool className="w-4 h-4" />
                  <span>Escribir</span>
                </Link>
                <button 
                  onClick={() => setEditingProfile(true)}
                  className="beat-button-secondary flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-newspaper-700 mb-4 leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {Math.round(user.mojo)}
                </div>
                <div className="text-xs text-newspaper-600">Mojo</div>
              </div>

              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <FileText className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {user.posts_count}
                </div>
                <div className="text-xs text-newspaper-600">Artículos</div>
              </div>

              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {user.followers_count}
                </div>
                <div className="text-xs text-newspaper-600">Seguidores</div>
              </div>

              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {user.following_count}
                </div>
                <div className="text-xs text-newspaper-600">Siguiendo</div>
              </div>
            </div>

            {/* Mojo Badge */}
            <div className="beat-mojo inline-flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Tu nivel de Mojo: {Math.round(user.mojo)} puntos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="beat-card p-6 text-center">
          <Eye className="w-8 h-8 text-newspaper-700 mx-auto mb-2" />
          <div className="text-2xl font-bold text-newspaper-900">
            {stats.totalViews.toLocaleString()}
          </div>
          <div className="text-sm text-newspaper-600">Visitas totales</div>
        </div>

        <div className="beat-card p-6 text-center">
          <Star className="w-8 h-8 text-newspaper-700 mx-auto mb-2" />
          <div className="text-2xl font-bold text-newspaper-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-newspaper-600">Rating promedio</div>
        </div>

        <div className="beat-card p-6 text-center">
          <MessageCircle className="w-8 h-8 text-newspaper-700 mx-auto mb-2" />
          <div className="text-2xl font-bold text-newspaper-900">
            {stats.totalComments}
          </div>
          <div className="text-sm text-newspaper-600">Comentarios recibidos</div>
        </div>

        <div className="beat-card p-6 text-center">
          <TrendingUp className="w-8 h-8 text-newspaper-700 mx-auto mb-2" />
          <div className="text-2xl font-bold text-newspaper-900">
            {stats.totalRatings}
          </div>
          <div className="text-sm text-newspaper-600">Valoraciones recibidas</div>
        </div>
      </div>

      {/* My Posts */}
      <div className="beat-card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-newspaper-900 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            {showArchived ? 'Artículos Archivados' : 'Mis Artículos'} ({posts.length})
          </h2>
          
          <div className="flex items-center space-x-3">
            {/* Toggle between active and archived */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showArchived 
                  ? 'bg-newspaper-600 text-white' 
                  : 'bg-newspaper-100 text-newspaper-700 hover:bg-newspaper-200'
              }`}
            >
              {showArchived ? (
                <>
                  <FileText className="w-4 h-4 mr-1 inline" />
                  Ver Activos
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-1 inline" />
                  Ver Archivados
                </>
              )}
            </button>
            
            <Link to="/escribir" className="beat-button flex items-center space-x-2">
              <PenTool className="w-4 h-4" />
              <span>Nuevo artículo</span>
            </Link>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-newspaper-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por título, contenido o hashtags..."
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
                <span>Ordenar por: {getSortLabel(sortBy)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {showFilters && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-newspaper-300 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-newspaper-600 uppercase tracking-wide mb-2">
                        Por Fecha
                      </div>
                      <button
                        onClick={() => handleSortChange('date_desc')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          sortBy === 'date_desc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-2 inline" />
                        Más recientes
                      </button>
                      <button
                        onClick={() => handleSortChange('date_asc')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          sortBy === 'date_asc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-2 inline" />
                        Más antiguos
                      </button>
                    </div>

                    <div className="mb-2">
                      <div className="text-xs font-semibold text-newspaper-600 uppercase tracking-wide mb-2">
                        Por Visitas
                      </div>
                      <button
                        onClick={() => handleSortChange('visits_desc')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          sortBy === 'visits_desc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                        }`}
                      >
                        <Eye className="w-4 h-4 mr-2 inline" />
                        Más visitados
                      </button>
                      <button
                        onClick={() => handleSortChange('visits_asc')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          sortBy === 'visits_asc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                        }`}
                      >
                        <Eye className="w-4 h-4 mr-2 inline" />
                        Menos visitados
                      </button>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-newspaper-600 uppercase tracking-wide mb-2">
                        Por Valoración
                      </div>
                      <button
                        onClick={() => handleSortChange('rating_desc')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          sortBy === 'rating_desc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                        }`}
                      >
                        <Star className="w-4 h-4 mr-2 inline" />
                        Mejor valorados
                      </button>
                      <button
                        onClick={() => handleSortChange('rating_asc')}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          sortBy === 'rating_asc' ? 'bg-newspaper-100 text-newspaper-900' : 'text-newspaper-700 hover:bg-newspaper-50'
                        }`}
                      >
                        <Star className="w-4 h-4 mr-2 inline" />
                        Peor valorados
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {searchTerm && (
              <div className="text-sm text-newspaper-600">
                {posts.length} resultado{posts.length !== 1 ? 's' : ''} para "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="beat-card p-6">
                <div className="beat-loading h-6 mb-4"></div>
                <div className="beat-loading h-4 mb-2"></div>
                <div className="beat-loading h-32"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            {showArchived ? (
              <>
                <Archive className="w-16 h-16 mx-auto mb-4 text-newspaper-400" />
                <h3 className="text-xl font-semibold text-newspaper-700 mb-2">
                  No tienes artículos archivados
                </h3>
                <p className="text-newspaper-600 mb-4">
                  Los artículos que archives aparecerán aquí.
                </p>
              </>
            ) : (
              <>
                <FileText className="w-16 h-16 mx-auto mb-4 text-newspaper-400" />
                <h3 className="text-xl font-semibold text-newspaper-700 mb-2">
                  {searchTerm ? 'No se encontraron artículos' : 'Aún no has publicado'}
                </h3>
                <p className="text-newspaper-600 mb-4">
                  {searchTerm 
                    ? `No hay artículos que coincidan con "${searchTerm}"`
                    : '¡Comienza tu viaje literario escribiendo tu primer artículo!'
                  }
                </p>
                {!searchTerm && (
                  <Link to="/escribir" className="beat-button inline-flex items-center space-x-2">
                    <PenTool className="w-4 h-4" />
                    <span>Escribir mi primer artículo</span>
                  </Link>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="beat-post-card">
                <div className="md:flex md:space-x-6">
                  {post.image && (
                    <div className="md:w-1/4 mb-4 md:mb-0">
                      <img 
                        src={post.image} 
                        alt=""
                        className="w-full h-32 object-cover beat-image-bw"
                      />
                    </div>
                  )}
                  
                  <div className={post.image ? "md:w-3/4" : "w-full"}>
                      <div className="flex items-start justify-between mb-2">
                      <Link to={`/post/${post.id}`}>
                        <h3 className="beat-post-title text-xl">
                          {post.title}
                        </h3>
                      </Link>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="text-newspaper-600 hover:text-newspaper-900 p-1"
                          title="Editar artículo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleArchivePost(post.id)}
                          className="text-newspaper-600 hover:text-newspaper-900 p-1"
                          title={showArchived ? "Desarchivar artículo" : "Archivar artículo"}
                        >
                          {showArchived ? (
                            <ArchiveRestore className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </button>
                        
                        <DeletePostButton 
                          onConfirm={() => handleDeletePost(post.id)}
                          className="transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div className="beat-post-meta">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Publicado {formatDistanceToNow(new Date(post.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                        
                        {post.archived && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-newspaper-100 text-newspaper-600">
                            <Archive className="w-3 h-3 mr-1" />
                            Archivado
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="beat-post-excerpt">
                      {truncateContent(post.content)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.slice(0, 3).map((tag) => (
                          <Link
                            key={tag}
                            to={`/ranks?hashtag=${tag}`}
                            className="beat-hashtag text-sm"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-newspaper-600">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {post.visits}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {post.average_rating.toFixed(1)} ({post.ratings_count})
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Mojo Explanation */}
      <div className="beat-card p-8 mt-8">
        <h3 className="text-lg font-semibold text-newspaper-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Tu Mojo Beatnik
        </h3>
        <div className="text-sm text-newspaper-700 space-y-3">
          <p>
            Tu Mojo actual es de <strong>{Math.round(user.mojo)} puntos</strong>. 
            Este índice refleja tu reputación e impacto en la comunidad Beatpost.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Cómo se calcula:</h4>
              <ul className="space-y-1 text-xs">
                <li>• <strong>5 puntos</strong> por cada artículo publicado</li>
                <li>• <strong>10 puntos</strong> por cada punto de rating promedio</li>
                <li>• <strong>3 puntos</strong> por cada seguidor</li>
                <li>• <strong>1 punto</strong> por cada interacción (comentario/rating)</li>
                <li>• <strong>0.1 puntos</strong> por cada visita a tus artículos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mejora tu Mojo:</h4>
              <ul className="space-y-1 text-xs">
                <li>• Publica contenido de calidad regularmente</li>
                <li>• Interactúa con otros beatniks</li>
                <li>• Usa hashtags relevantes</li>
                <li>• Responde a comentarios en tus artículos</li>
                <li>• Comparte contenido auténtico y original</li>
              </ul>
            </div>
          </div>
          <div className="beat-quote mt-4">
            "El verdadero Mojo no se mide solo en números, sino en la autenticidad de tu voz"
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editingProfile}
        onClose={() => setEditingProfile(false)}
        onSuccess={handleProfileUpdateSuccess}
      />
    </div>
  );
};

export default MyProfile;