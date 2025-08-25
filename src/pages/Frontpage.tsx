import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService, hashtagService, Post } from '../services/api';
import { Eye, MessageCircle, Star, Hash, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Frontpage: React.FC = () => {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [popularHashtags, setPopularHashtags] = useState<{ hashtag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [frontpageData, recentData, hashtagsData] = await Promise.all([
          postService.getFrontpage(),
          postService.getPosts(0, 10),
          hashtagService.getPopularHashtags()
        ]);

        setFeaturedPosts(frontpageData);
        setRecentPosts(recentData);
        setPopularHashtags(hashtagsData);
      } catch (error) {
        toast.error('Error cargando la portada');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="beat-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Loading skeleton */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="beat-card p-6">
              <div className="beat-loading h-6 mb-4"></div>
              <div className="beat-loading h-4 mb-2"></div>
              <div className="beat-loading h-4 mb-2"></div>
              <div className="beat-loading h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="beat-container">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="beat-frontpage-title">
          Beatpost
        </h1>
        <p className="beat-frontpage-subtitle">
          Escribe con intención. Lee con atención.
        </p>
        <div className="w-24 h-0.5 bg-newspaper-900 mx-auto mt-4"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Featured Posts */}
          {featuredPosts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-newspaper-900 mb-6 flex items-center">
                <Star className="w-6 h-6 mr-2" />
                Destacados del día
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredPosts.slice(0, 4).map((post) => (
                  <article key={post.id} className="beat-post-card">
                    {post.image && (
                      <img 
                        src={post.image} 
                        alt="" 
                        className="w-full h-48 object-cover beat-image-bw mb-4"
                      />
                    )}
                    
                    <Link to={`/post/${post.id}`}>
                      <h3 className="beat-post-title">{post.title}</h3>
                    </Link>
                    
                    <div className="beat-post-meta">
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
                    
                    <p className="beat-post-excerpt">
                      {truncateContent(post.content, 150)}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.hashtags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/ranks?hashtag=${tag}`}
                          className="beat-hashtag"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                    
                    <div className="beat-post-footer">
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
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Recent Posts */}
          <section>
            <h2 className="text-2xl font-bold text-newspaper-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-2" />
              Publicaciones recientes
            </h2>
            
            <div className="space-y-6">
              {recentPosts.map((post) => (
                <article key={post.id} className="beat-post-card">
                  <div className="md:flex md:space-x-6">
                    {post.image && (
                      <div className="md:w-1/3 mb-4 md:mb-0">
                        <img 
                          src={post.image} 
                          alt="" 
                          className="w-full h-32 md:h-24 object-cover beat-image-bw"
                        />
                      </div>
                    )}
                    
                    <div className={post.image ? "md:w-2/3" : "w-full"}>
                      <Link to={`/post/${post.id}`}>
                        <h3 className="beat-post-title text-lg">{post.title}</h3>
                      </Link>
                      
                      <div className="beat-post-meta">
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
                      
                      <p className="beat-post-excerpt text-sm">
                        {truncateContent(post.content, 120)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.slice(0, 2).map((tag) => (
                            <Link
                              key={tag}
                              to={`/ranks?hashtag=${tag}`}
                              className="beat-hashtag text-xs"
                            >
                              #{tag}
                            </Link>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-newspaper-600">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {post.visits}
                          </span>
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {post.average_rating.toFixed(1)}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {post.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Popular Hashtags */}
          <div className="beat-card p-6">
            <h3 className="text-lg font-semibold text-newspaper-900 mb-4 flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              Hashtags populares
            </h3>
            
            <div className="space-y-2">
              {popularHashtags.slice(0, 10).map((item) => (
                <Link
                  key={item.hashtag}
                  to={`/ranks?hashtag=${item.hashtag}`}
                  className="flex items-center justify-between py-2 px-3 hover:bg-newspaper-100 transition-colors"
                >
                  <span className="text-sm font-medium">#{item.hashtag}</span>
                  <span className="text-xs text-newspaper-600 bg-newspaper-200 px-2 py-1 rounded-full">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="beat-card p-6">
            <h3 className="text-lg font-semibold text-newspaper-900 mb-4">
              Sobre Beatpost
            </h3>
            <div className="text-sm text-newspaper-700 space-y-3">
              <p>
                Una plataforma de publicación abierta inspirada en la estética 
                y el espíritu de la Beat Generation.
              </p>
              <p>
                Aquí, los artículos hablan por sí solos: sin vídeos, sin pop-ups, 
                sin ruido. Solo contenido de calidad.
              </p>
              <div className="beat-quote">
                "No compite en velocidad ni en viralidad. Compite en profundidad, 
                estilo y autenticidad."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frontpage;