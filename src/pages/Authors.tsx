import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authorService, Author } from '../services/api';
import { 
  Search,
  ChevronDown,
  Moon,
  User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Authors: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('Highest Rating');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Mock data matching the image exactly
  const mockAuthors = [
    {
      id: '1',
      username: 'Allen Ginsberg',
      bio: 'ex eget velit commodo dignissim, placerat commodo lacinia lorem aliquet tincidunt. Quisque hendrerit ut elit hendrerit',
      avatar: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
      mojo: 4.8,
      posts_count: 120,
      followers_count: 1500,
      average_rating: 4.8,
      total_visits: 25000,
      ratings_count: 340,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      username: 'Allen Ginsberg',
      bio: 'ex eget velit commodo dignissim, placerat commodo lacinia lorem aliquet tincidunt. Quisque hendrerit ut elit hendrerit',
      avatar: 'https://images.pexels.com/photos/1181468/pexels-photo-1181468.jpeg',
      mojo: 4.7,
      posts_count: 98,
      followers_count: 1200,
      average_rating: 4.7,
      total_visits: 22000,
      ratings_count: 280,
      created_at: '2024-01-20T10:00:00Z'
    },
    {
      id: '3',
      username: 'Allen Ginsberg',
      bio: 'ex eget velit commodo dignissim, placerat commodo lacinia lorem aliquet tincidunt. Quisque hendrerit ut elit hendrerit',
      avatar: 'https://images.pexels.com/photos/1181469/pexels-photo-1181469.jpeg',
      mojo: 4.6,
      posts_count: 85,
      followers_count: 980,
      average_rating: 4.6,
      total_visits: 18000,
      ratings_count: 220,
      created_at: '2024-02-01T10:00:00Z'
    },
    {
      id: '4',
      username: 'Allen Ginsberg',
      bio: 'ex eget velit commodo dignissim, placerat commodo lacinia lorem aliquet tincidunt. Quisque hendrerit ut elit hendrerit',
      avatar: 'https://images.pexels.com/photos/1181470/pexels-photo-1181470.jpeg',
      mojo: 4.5,
      posts_count: 72,
      followers_count: 850,
      average_rating: 4.5,
      total_visits: 15000,
      ratings_count: 190,
      created_at: '2024-02-10T10:00:00Z'
    },
    {
      id: '5',
      username: 'Allen Ginsberg',
      bio: 'ex eget velit commodo dignissim, placerat commodo lacinia lorem aliquet tincidunt. Quisque hendrerit ut elit hendrerit',
      avatar: 'https://images.pexels.com/photos/1181471/pexels-photo-1181471.jpeg',
      mojo: 4.4,
      posts_count: 65,
      followers_count: 720,
      average_rating: 4.4,
      total_visits: 12000,
      ratings_count: 160,
      created_at: '2024-02-15T10:00:00Z'
    },
    {
      id: '6',
      username: 'Allen Ginsberg',
      bio: 'ex eget velit commodo dignissim, placerat commodo lacinia lorem aliquet tincidunt. Quisque hendrerit ut elit hendrerit',
      avatar: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg',
      mojo: 4.3,
      posts_count: 58,
      followers_count: 650,
      average_rating: 4.3,
      total_visits: 10000,
      ratings_count: 140,
      created_at: '2024-02-20T10:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setAuthors(mockAuthors);
      setLoading(false);
    }, 500);
  }, [searchTerm, sortBy]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setShowSortDropdown(false);
  };

  if (loading) {
    return (
      <div className="authors-page">
        <div className="authors-loading">
          <div className="beat-loading h-8 mb-4"></div>
          <div className="beat-loading h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="authors-page">
      {/* Header - Same as other pages */}
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

      <div className="newspaper-logo-section">
        <div className="newspaper-logo">
          <div className="newspaper-logo-icon">B</div>
          <span className="newspaper-logo-text">Beatpost</span>
        </div>
      </div>

      <div className="newspaper-nav">
        <div className="newspaper-nav-left">
          <Link to="/" className="newspaper-nav-item">Home</Link>
          <Link to="/ranks" className="newspaper-nav-item">Ranking</Link>
          <Link to="/autores" className="newspaper-nav-item active">Authors</Link>
        </div>
        <div className="newspaper-nav-right">
          <button className="newspaper-nav-icon">
            <Moon className="w-4 h-4" />
          </button>
          <span className="newspaper-nav-text">LOGIN</span>
          <button className="newspaper-nav-icon">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="authors-main-content">
        {/* Search and Sort Controls */}
        <div className="authors-controls">
          <div className="authors-search-container">
            <div className="authors-search-box">
              <Search className="authors-search-icon" />
              <input
                type="text"
                placeholder="Buscador de autores por palabras clave"
                value={searchTerm}
                onChange={handleSearchChange}
                className="authors-search-input"
              />
            </div>
          </div>

          <div className="authors-sort-container">
            <div className="authors-sort-dropdown">
              <button 
                className="authors-sort-btn"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                Sort by: Highest Rating
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {showSortDropdown && (
                <div className="authors-sort-menu">
                  <button onClick={() => handleSortChange('Highest Rating')}>Highest Rating</button>
                  <button onClick={() => handleSortChange('Most Posts')}>Most Posts</button>
                  <button onClick={() => handleSortChange('Most Followers')}>Most Followers</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Authors Grid */}
        <div className="authors-grid">
          {authors.map((author) => (
            <div key={author.id} className="author-card">
              <div className="author-avatar">
                <img 
                  src={author.avatar} 
                  alt={author.username}
                  className="author-image"
                />
              </div>
              
              <div className="author-info">
                <h3 className="author-name">{author.username}</h3>
                
                <div className="author-stats">
                  <span className="author-stat">📊 {author.posts_count}</span>
                  <span className="author-stat">👥 {author.followers_count}</span>
                </div>
                
                <p className="author-bio">
                  {author.bio}
                </p>
                
                <button className="author-profile-btn">
                  Ver perfil
                </button>
              </div>
            </div>
          ))}
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

export default Authors;