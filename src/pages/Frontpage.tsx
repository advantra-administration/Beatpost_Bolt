import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService, hashtagService, Post } from '../services/api';
import { Eye, MessageCircle, Star, Clock, User, Search, Moon } from 'lucide-react';
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
      <div className="newspaper-page">
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
  const secondaryPosts = recentPosts.slice(1, 5);
  const bottomPosts = recentPosts.slice(5, 8);

  return (
    <div className="newspaper-page">
      {/* Header with date and login */}
      <div className="newspaper-header-top">
        <div className="newspaper-date-left">
          Wednesday, August 8, 2024
        </div>
        <div className="newspaper-login-right">
          <Link to="/login" className="newspaper-login-link">Log In</Link>
          <span className="mx-2">|</span>
          <Link to="/register" className="newspaper-login-link">Get Started</Link>
        </div>
      </div>

      {/* Logo */}
      <div className="newspaper-logo-section">
        <div className="newspaper-logo">
          <div className="newspaper-logo-icon">B</div>
          <span className="newspaper-logo-text">Beatpost</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="newspaper-nav">
        <div className="newspaper-nav-left">
          <Link to="/" className="newspaper-nav-item active">Home</Link>
          <Link to="/ranks" className="newspaper-nav-item">Ranking</Link>
          <Link to="/autores" className="newspaper-nav-item">Authors</Link>
        </div>
        <div className="newspaper-nav-right">
          <button className="newspaper-nav-icon">
            <Moon className="w-4 h-4" />
          </button>
          <button className="newspaper-nav-icon">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="newspaper-main-layout">
        {/* Left Content */}
        <div className="newspaper-content">
          {/* Hero Article */}
          {mainPost && (
            <div className="newspaper-hero-section">
              <div className="newspaper-hero-image">
                <img 
                  src={mainPost.image || "https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg"} 
                  alt=""
                  className="newspaper-main-image"
                />
              </div>
              <div className="newspaper-hero-content">
                <h1 className="newspaper-hero-title">
                  On the Road Again: Rediscovering the Lost Art of Wandering
                </h1>
                <p className="newspaper-hero-subtitle">
                  In an age of hyper-connectivity, we've forgotten the simple, profound joy of aimless exploration. This is a journey back to the heart of discovery, one step at a time.
                </p>
                <div className="newspaper-hero-meta">
                  <span className="newspaper-author-link">By Jack Kerouac Jr.</span>
                  <div className="newspaper-meta-stats">
                    <span className="newspaper-stat-item">8 Read</span>
                    <span className="newspaper-stat-item">4 Claps</span>
                    <span className="newspaper-stat-item">Share</span>
                    <span className="newspaper-stat-item">★ 4.8</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Articles Grid */}
          <div className="newspaper-secondary-grid">
            {secondaryPosts.slice(0, 4).map((post, index) => (
              <div key={post.id} className="newspaper-secondary-article">
                <div className="newspaper-secondary-image">
                  <img 
                    src={post.image || `https://images.pexels.com/photos/${1181467 + index}/pexels-photo-${1181467 + index}.jpeg`} 
                    alt=""
                    className="newspaper-article-image"
                  />
                </div>
                <div className="newspaper-secondary-content">
                  <h3 className="newspaper-secondary-title">
                    The Digital Scribe: Can AI Capture the Human Soul?
                  </h3>
                  <p className="newspaper-secondary-excerpt">
                    An exploration into the burgeoning world of AI-generated literature and its place in our cultural landscape.
                  </p>
                  <div className="newspaper-secondary-meta">
                    <span className="newspaper-author-small">By Ada Lovelace II</span>
                    <div className="newspaper-stats-small">
                      <span>6 Read</span>
                      <span>★ 4.2</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Articles */}
          <div className="newspaper-bottom-grid">
            {bottomPosts.map((post, index) => (
              <div key={post.id} className="newspaper-bottom-article">
                <div className="newspaper-bottom-image">
                  <img 
                    src={post.image || `https://images.pexels.com/photos/${1181470 + index}/pexels-photo-${1181470 + index}.jpeg`} 
                    alt=""
                    className="newspaper-article-image"
                  />
                </div>
                <div className="newspaper-bottom-content">
                  <h4 className="newspaper-bottom-title">
                    The Digital Scribe: Can AI Capture the Human Soul?
                  </h4>
                  <p className="newspaper-bottom-excerpt">
                    An exploration into the burgeoning world of AI-generated literature and its place in our cultural landscape.
                  </p>
                  <div className="newspaper-bottom-meta">
                    <span className="newspaper-author-tiny">By Ada Lovelace II</span>
                    <span className="newspaper-rating-tiny">★ 4.2</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="newspaper-sidebar">
          <div className="newspaper-ranking-section">
            <h2 className="newspaper-ranking-title">Top Ranking</h2>
            <div className="newspaper-ranking-list">
              {recentPosts.slice(0, 3).map((post, index) => (
                <div key={post.id} className="newspaper-ranking-item">
                  <div className="newspaper-ranking-number">{index + 1}</div>
                  <div className="newspaper-ranking-content">
                    <h4 className="newspaper-ranking-item-title">
                      Echoes in the Static: The Resurgence of Analog Media
                    </h4>
                    <p className="newspaper-ranking-excerpt">
                      Why are we turning back to vinyl, film, and print? A look at the longing behind our analog revival.
                    </p>
                    <div className="newspaper-ranking-meta">
                      <span className="newspaper-ranking-author">By Austin George Dawson</span>
                      <span className="newspaper-ranking-rating">★ 4.8</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="newspaper-footer">
        <div className="newspaper-footer-content">
          <div className="newspaper-footer-left">
            <span>© 2024 Beatpost. All Rights Reserved.</span>
          </div>
          <div className="newspaper-footer-center">
            <div className="newspaper-social-icons">
              <span>📧</span>
              <span>🐦</span>
              <span>📘</span>
            </div>
          </div>
          <div className="newspaper-footer-right">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frontpage;