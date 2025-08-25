import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService, hashtagService, Post } from '../services/api';
import { Eye, MessageCircle, Star, Clock, User } from 'lucide-react';
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
          postService.getPosts(0, 20),
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

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="newspaper-container">
        <div className="newspaper-loading">
          <div className="beat-loading h-8 mb-4"></div>
          <div className="beat-loading h-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="beat-loading h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mainPost = recentPosts[0];
  const secondaryPosts = recentPosts.slice(1, 7);
  const bottomPosts = recentPosts.slice(7, 10);

  return (
    <div className="newspaper-container">
      {/* Header Date */}
      <div className="newspaper-date">
        {new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>

      <div className="newspaper-layout">
        {/* Main Content Area */}
        <div className="newspaper-main">
          {/* Hero Article */}
          {mainPost && (
            <article className="newspaper-hero">
              {mainPost.image && (
                <div className="newspaper-hero-image">
                  <img 
                    src={mainPost.image} 
                    alt=""
                    className="newspaper-image"
                  />
                </div>
              )}
              
              <div className="newspaper-hero-content">
                <Link to={`/post/${mainPost.id}`}>
                  <h1 className="newspaper-hero-title">
                    {mainPost.title}
                  </h1>
                </Link>
                
                <p className="newspaper-hero-excerpt">
                  {truncateContent(mainPost.content, 200)}
                </p>
                
                <div className="newspaper-meta">
                  <span className="newspaper-byline">
                    By <Link to={`/beatnik/${mainPost.author_username}`} className="newspaper-author">
                      {mainPost.author_username}
                    </Link>
                  </span>
                  <div className="newspaper-stats">
                    <span className="newspaper-stat">
                      <Eye className="w-3 h-3" />
                      {mainPost.visits}
                    </span>
                    <span className="newspaper-stat">
                      <Star className="w-3 h-3" />
                      {mainPost.average_rating.toFixed(1)}
                    </span>
                    <span className="newspaper-stat">
                      <MessageCircle className="w-3 h-3" />
                      {mainPost.comments_count}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Secondary Articles Grid */}
          <div className="newspaper-grid">
            {secondaryPosts.map((post) => (
              <article key={post.id} className="newspaper-card">
                {post.image && (
                  <div className="newspaper-card-image">
                    <img 
                      src={post.image} 
                      alt=""
                      className="newspaper-image"
                    />
                  </div>
                )}
                
                <div className="newspaper-card-content">
                  <Link to={`/post/${post.id}`}>
                    <h3 className="newspaper-card-title">
                      {post.title}
                    </h3>
                  </Link>
                  
                  <p className="newspaper-card-excerpt">
                    {truncateContent(post.content, 100)}
                  </p>
                  
                  <div className="newspaper-card-meta">
                    <span className="newspaper-byline-small">
                      By <Link to={`/beatnik/${post.author_username}`} className="newspaper-author">
                        {post.author_username}
                      </Link>
                    </span>
                    <div className="newspaper-stats-small">
                      <span className="newspaper-stat">
                        <Eye className="w-3 h-3" />
                        {post.visits}
                      </span>
                      <span className="newspaper-stat">
                        <Star className="w-3 h-3" />
                        {post.average_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom Articles */}
          <div className="newspaper-bottom">
            {bottomPosts.map((post) => (
              <article key={post.id} className="newspaper-bottom-card">
                {post.image && (
                  <div className="newspaper-bottom-image">
                    <img 
                      src={post.image} 
                      alt=""
                      className="newspaper-image"
                    />
                  </div>
                )}
                
                <div className="newspaper-bottom-content">
                  <Link to={`/post/${post.id}`}>
                    <h4 className="newspaper-bottom-title">
                      {post.title}
                    </h4>
                  </Link>
                  
                  <p className="newspaper-bottom-excerpt">
                    {truncateContent(post.content, 80)}
                  </p>
                  
                  <div className="newspaper-bottom-meta">
                    <span className="newspaper-byline-small">
                      By <Link to={`/beatnik/${post.author_username}`} className="newspaper-author">
                        {post.author_username}
                      </Link>
                    </span>
                    <div className="newspaper-stats-small">
                      <span className="newspaper-stat">
                        <Eye className="w-3 h-3" />
                        {post.visits}
                      </span>
                      <span className="newspaper-stat">
                        <Star className="w-3 h-3" />
                        {post.average_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="newspaper-sidebar">
          <div className="newspaper-ranking">
            <h2 className="newspaper-ranking-title">Top Ranking</h2>
            
            <div className="newspaper-ranking-list">
              {recentPosts.slice(0, 3).map((post, index) => (
                <div key={post.id} className="newspaper-ranking-item">
                  <div className="newspaper-ranking-number">
                    {index + 1}
                  </div>
                  
                  <div className="newspaper-ranking-content">
                    <Link to={`/post/${post.id}`}>
                      <h4 className="newspaper-ranking-item-title">
                        {post.title}
                      </h4>
                    </Link>
                    
                    <p className="newspaper-ranking-excerpt">
                      {truncateContent(post.content, 60)}
                    </p>
                    
                    <div className="newspaper-ranking-meta">
                      <span className="newspaper-byline-tiny">
                        By <Link to={`/beatnik/${post.author_username}`} className="newspaper-author">
                          {post.author_username}
                        </Link>
                      </span>
                      <div className="newspaper-stats-tiny">
                        <span className="newspaper-stat">
                          <Star className="w-2 h-2" />
                          {post.average_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <div className="newspaper-footer">
        <div className="newspaper-footer-content">
          <span>© 2024 Beatpost - All Rights Reserved</span>
          <div className="newspaper-footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frontpage;