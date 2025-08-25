import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postService, hashtagService, Post } from '../services/api';
import { TrendingUp, Hash, Eye, Star, MessageCircle, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Rankings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<{ hashtag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState<string>(searchParams.get('hashtag') || '');

  useEffect(() => {
    loadData();
  }, [selectedHashtag]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ranksData, hashtagsData] = await Promise.all([
        postService.getRanks(selectedHashtag || undefined),
        hashtagService.getPopularHashtags()
      ]);

      setPosts(ranksData.posts);
      setHashtags(hashtagsData);
    } catch (error) {
      toast.error('Error cargando los rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagChange = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    if (hashtag) {
      setSearchParams({ hashtag });
    } else {
      setSearchParams({});
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getRankPosition = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getRankClass = (index: number) => {
    if (index === 0) return 'bg-yellow-50 border-yellow-200';
    if (index === 1) return 'bg-gray-50 border-gray-300';
    if (index === 2) return 'bg-orange-50 border-orange-200';
    return '';
  };

  if (loading) {
    return (
      <div className="beat-container">
        <div className="beat-card p-8 mb-8">
          <div className="beat-loading h-8 mb-4"></div>
          <div className="beat-loading h-4 mb-8"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="beat-card p-6 mb-6">
                <div className="beat-loading h-6 mb-4"></div>
                <div className="beat-loading h-4 mb-2"></div>
                <div className="beat-loading h-32"></div>
              </div>
            ))}
          </div>
          <div>
            <div className="beat-card p-6">
              <div className="beat-loading h-6 mb-4"></div>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="beat-loading h-8 mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="beat-container">
      {/* Header */}
      <div className="beat-card p-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-newspaper-900 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-newspaper-900">
                Rankings
              </h1>
              <p className="text-newspaper-600 mt-1">
                {selectedHashtag 
                  ? `Artículos más populares en #${selectedHashtag}`
                  : 'Los artículos más populares de Beatpost'
                }
              </p>
            </div>
          </div>
          
          {selectedHashtag && (
            <button
              onClick={() => handleHashtagChange('')}
              className="beat-button-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Ver todos</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Rankings */}
        <div className="lg:col-span-3">
          {posts.length === 0 ? (
            <div className="beat-card p-8 text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-newspaper-400" />
              <h3 className="text-xl font-semibold text-newspaper-700 mb-2">
                No hay artículos
              </h3>
              <p className="text-newspaper-600">
                {selectedHashtag 
                  ? `No se encontraron artículos con el hashtag #${selectedHashtag}`
                  : 'Aún no hay artículos publicados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <article 
                  key={post.id} 
                  className={`beat-post-card ${getRankClass(index)}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Rank Position */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-2xl font-bold mb-1">
                        {getRankPosition(index)}
                      </div>
                      {index < 3 && (
                        <div className="text-xs text-newspaper-600">
                          TOP {index + 1}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
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
                            <h3 className="beat-post-title text-xl mb-2">
                              {post.title}
                            </h3>
                          </Link>
                          
                          <div className="beat-post-meta mb-3">
                            <Link 
                              to={`/beatnik/${post.author_username}`}
                              className="font-medium hover:text-newspaper-900"
                            >
                              {post.author_username}
                            </Link>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDistanceToNow(new Date(post.created_at), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </span>
                          </div>
                          
                          <p className="beat-post-excerpt mb-4">
                            {truncateContent(post.content)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {post.hashtags.slice(0, 3).map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => handleHashtagChange(tag)}
                                  className={`beat-hashtag ${
                                    selectedHashtag === tag ? 'bg-newspaper-300' : ''
                                  }`}
                                >
                                  #{tag}
                                </button>
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
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* All Hashtags */}
          <div className="beat-card p-6">
            <h3 className="text-lg font-semibold text-newspaper-900 mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Explorar por hashtag
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handleHashtagChange('')}
                className={`w-full text-left py-2 px-3 transition-colors ${
                  !selectedHashtag 
                    ? 'bg-newspaper-200 text-newspaper-900 font-medium' 
                    : 'hover:bg-newspaper-100'
                }`}
              >
                <span className="text-sm">📊 Todos los artículos</span>
              </button>
              
              {hashtags.map((item) => (
                <button
                  key={item.hashtag}
                  onClick={() => handleHashtagChange(item.hashtag)}
                  className={`w-full text-left flex items-center justify-between py-2 px-3 transition-colors ${
                    selectedHashtag === item.hashtag 
                      ? 'bg-newspaper-200 text-newspaper-900 font-medium' 
                      : 'hover:bg-newspaper-100'
                  }`}
                >
                  <span className="text-sm">#{item.hashtag}</span>
                  <span className="text-xs text-newspaper-600 bg-newspaper-300 px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ranking Info */}
          <div className="beat-card p-6">
            <h3 className="text-lg font-semibold text-newspaper-900 mb-4">
              ¿Cómo funcionan los rankings?
            </h3>
            <div className="text-sm text-newspaper-700 space-y-3">
              <p>
                Los artículos se ordenan por su puntuación total, que incluye:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Visitas:</strong> Número de lectores</li>
                <li>• <strong>Valoraciones:</strong> Puntuación de 1-5 estrellas</li>
                <li>• <strong>Comentarios:</strong> Participación de la comunidad</li>
                <li>• <strong>Mojo del autor:</strong> Reputación del escritor</li>
              </ul>
              <div className="beat-quote mt-4">
                "La calidad siempre supera a la cantidad"
              </div>
            </div>
          </div>

          {/* Top Writers */}
          <div className="beat-card p-6">
            <h3 className="text-lg font-semibold text-newspaper-900 mb-4">
              Escritores destacados
            </h3>
            <div className="text-sm text-newspaper-600">
              <p>Esta sección mostrará los autores con mayor Mojo próximamente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rankings;