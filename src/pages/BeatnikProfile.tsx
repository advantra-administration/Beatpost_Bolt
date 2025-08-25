import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService, postService, User, Post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  User as UserIcon, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp,
  UserPlus,
  UserMinus,
  Eye,
  Star,
  MessageCircle,
  Clock,
  PenTool
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const BeatnikProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (username) {
      loadProfile();
      loadUserPosts();
    }
  }, [username]);

  const loadProfile = async () => {
    try {
      if (username) {
        const profileData = await userService.getProfile(username);
        setProfile(profileData);
      }
    } catch (error) {
      toast.error('Error cargando el perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      if (username) {
        // Get posts by this user (we'll filter by author_username)
        const allPosts = await postService.getPosts(0, 50);
        const userPosts = allPosts.filter(post => post.author_username === username);
        setPosts(userPosts);
      }
    } catch (error) {
      toast.error('Error cargando los artículos');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) {
      toast.error('Debes iniciar sesión para seguir usuarios');
      return;
    }

    if (profile.username === currentUser.username) {
      toast.error('No puedes seguirte a ti mismo');
      return;
    }

    setFollowLoading(true);
    try {
      const result = await userService.followUser(profile.username);
      setIsFollowing(!isFollowing);
      
      // Update follower count
      setProfile({
        ...profile,
        followers_count: isFollowing ? profile.followers_count - 1 : profile.followers_count + 1
      });
      
      toast.success(result.message);
    } catch (error) {
      toast.error('Error al seguir/dejar de seguir');
    } finally {
      setFollowLoading(false);
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="beat-container">
        <div className="beat-card p-8 mb-8">
          <div className="beat-loading h-32 mb-4"></div>
          <div className="beat-loading h-8 mb-2"></div>
          <div className="beat-loading h-4 mb-4"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="beat-container">
        <div className="beat-error">
          <h2 className="text-lg font-semibold mb-2">Usuario no encontrado</h2>
          <p>El perfil que buscas no existe.</p>
          <Link to="/" className="beat-button mt-4 inline-block">
            Volver a la portada
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <div className="beat-container">
      {/* Profile Header */}
      <div className="beat-card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-newspaper-200 rounded-full flex items-center justify-center">
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.username}
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
                  {profile.username}
                </h1>
                <div className="flex items-center text-newspaper-600 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Se unió {format(new Date(profile.created_at), 'MMMM yyyy', { locale: es })}</span>
                </div>
              </div>

              {/* Follow Button */}
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center space-x-2 px-4 py-2 font-medium transition-colors ${
                    isFollowing 
                      ? 'text-red-600 hover:text-red-700 border border-red-300 hover:bg-red-50' 
                      : 'beat-button'
                  }`}
                >
                  {followLoading ? (
                    <div className="beat-spinner"></div>
                  ) : isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isFollowing ? 'Dejar de seguir' : 'Seguir'}</span>
                </button>
              )}

              {isOwnProfile && (
                <Link to="/perfil" className="beat-button flex items-center space-x-2">
                  <UserIcon className="w-4 h-4" />
                  <span>Editar perfil</span>
                </Link>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-newspaper-700 mb-4 leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {Math.round(profile.mojo)}
                </div>
                <div className="text-xs text-newspaper-600">Mojo</div>
              </div>

              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <FileText className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {profile.posts_count}
                </div>
                <div className="text-xs text-newspaper-600">Artículos</div>
              </div>

              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {profile.followers_count}
                </div>
                <div className="text-xs text-newspaper-600">Seguidores</div>
              </div>

              <div className="text-center p-3 bg-newspaper-100">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-5 h-5 text-newspaper-700 mr-1" />
                </div>
                <div className="text-2xl font-bold text-newspaper-900">
                  {profile.following_count}
                </div>
                <div className="text-xs text-newspaper-600">Siguiendo</div>
              </div>
            </div>

            {/* Mojo Badge */}
            <div className="mt-4">
              <div className="beat-mojo inline-flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Beatnik con {Math.round(profile.mojo)} puntos de Mojo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div className="beat-card p-8">
        <h2 className="text-2xl font-bold text-newspaper-900 mb-6 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Artículos de {profile.username}
        </h2>

        {postsLoading ? (
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
            <FileText className="w-16 h-16 mx-auto mb-4 text-newspaper-400" />
            <h3 className="text-xl font-semibold text-newspaper-700 mb-2">
              No hay artículos
            </h3>
            <p className="text-newspaper-600">
              {isOwnProfile 
                ? 'Aún no has publicado ningún artículo. ¡Comienza a escribir!'
                : `${profile.username} aún no ha publicado ningún artículo.`
              }
            </p>
            {isOwnProfile && (
              <Link 
                to="/escribir" 
                className="beat-button mt-4 inline-block flex items-center space-x-2"
              >
                <PenTool className="w-4 h-4" />
                <span>Escribir artículo</span>
              </Link>
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
                    <Link to={`/post/${post.id}`}>
                      <h3 className="beat-post-title text-xl">
                        {post.title}
                      </h3>
                    </Link>
                    
                    <div className="beat-post-meta">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDistanceToNow(new Date(post.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
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
                          {post.average_rating.toFixed(1)}
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
    </div>
  );
};

export default BeatnikProfile;