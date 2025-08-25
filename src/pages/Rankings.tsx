import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postService, hashtagService, Post } from '../services/api';
import { Search, ChevronDown, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

const Rankings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHashtag, setSelectedHashtag] = useState<string>(searchParams.get('hashtag') || '');
  const [sortBy, setSortBy] = useState('Most highest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Mock data matching the image exactly
  const mockPosts = [
    {
      id: '1',
      title: 'The Digital Scribe: Can AI Capture the Human Soul?',
      content: 'An exploration into the burgeoning world of AI-generated literature and its place in our cultural landscape.',
      author_username: 'Ada Lovelace II',
      image: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
      visits: 1200,
      comments_count: 45,
      average_rating: 4.8,
      created_at: '2024-08-07T10:00:00Z'
    },
    {
      id: '2', 
      title: 'The Digital Scribe: Can AI Capture the Human Soul?',
      content: 'An exploration into the burgeoning world of AI-generated literature and its place in our cultural landscape.',
      author_username: 'Ada Lovelace II',
      image: 'https://images.pexels.com/photos/1181468/pexels-photo-1181468.jpeg',
      visits: 1150,
      comments_count: 42,
      average_rating: 4.7,
      created_at: '2024-08-06T10:00:00Z'
    },
    {
      id: '3',
      title: 'The Digital Scribe: Can AI Capture the Human Soul?',
      content: 'An exploration into the burgeoning world of AI-generated literature and its place in our cultural landscape.',
      author_username: 'Ada Lovelace II', 
      image: 'https://images.pexels.com/photos/1181469/pexels-photo-1181469.jpeg',
      visits: 1100,
      comments_count: 38,
      average_rating: 4.6,
      created_at: '2024-08-05T10:00:00Z'
    },
    {
      id: '4',
      title: 'The Digital Scribe: Can AI Capture the Human Soul?',
      content: 'An exploration into the burgeoning world of AI-generated literature and its place in our cultural landscape.',
      author_username: 'Ada Lovelace II',
      image: 'https://images.pexels.com/photos/1181470/pexels-photo-1181470.jpeg',
      visits: 1050,
      comments_count: 35,
      average_rating: 4.5,
      created_at: '2024-08-04T10:00:00Z'
    },
    {
      id: '5',
      title: 'Quantum Gastronomy: Tasting the Future of Food',
      content: 'How molecular gastronomy is revolutionizing the culinary world, exploring how science and art intersect in the kitchen.',
      author_username: 'Ferran Adrià Jr.',
      image: 'https://images.pexels.com/photos/1181471/pexels-photo-1181471.jpeg',
      visits: 980,
      comments_count: 32,
      average_rating: 4.4,
      created_at: '2024-08-03T10:00:00Z'
    },
    {
      id: '6',
      title: 'Bio Hacking Immortality: The Ethics of Personal Life',
      content: 'A deep dive into the moral and practical implications of extending life using biohack technology.',
      author_username: 'Dr. Elizabeth Blackburn',
      image: 'https://images.pexels.com/photos/1181472/pexels-photo-1181472.jpeg',
      visits: 920,
      comments_count: 28,
      average_rating: 4.3,
      created_at: '2024-08-02T10:00:00Z'
    },
    {
      id: '7',
      title: 'The Sentient City: Urban Planning in the Age of AI',
      content: 'Exploring how interconnected smart cities work and how AI will impact the future of urban planning.',
      author_username: 'Jane Jacobs III',
      image: 'https://images.pexels.com/photos/1181473/pexels-photo-1181473.jpeg',
      visits: 860,
      comments_count: 25,
      average_rating: 4.2,
      created_at: '2024-08-01T10:00:00Z'
    },
    {
      id: '8',
      title: 'Virtual Sanctuaries: Finding Spirituality in the Metaverse',
      content: 'Can digital worlds provide the same spiritual experiences and connections as traditional religious spaces?',
      author_username: 'Thomas Merton IV',
      image: 'https://images.pexels.com/photos/1181474/pexels-photo-1181474.jpeg',
      visits: 800,
      comments_count: 22,
      average_rating: 4.1,
      created_at: '2024-07-31T10:00:00Z'
    },
    {
      id: '9',
      title: 'Decoding Dreams: Neuroscience Meets Machine Learning',
      content: 'The latest breakthroughs in technology that can understand and interpret human dreams using deep learning.',
      author_username: 'Dr. Carl Jung Jr.',
      image: 'https://images.pexels.com/photos/1181475/pexels-photo-1181475.jpeg',
      visits: 740,
      comments_count: 19,
      average_rating: 4.0,
      created_at: '2024-07-30T10:00:00Z'
    },
    {
      id: '10',
      title: 'The Last Analog Musician: A Profile',
      content: 'The portrait of one of the last musicians who still uses analog instruments in a digital world.',
      author_username: 'Brian Eno II',
      image: 'https://images.pexels.com/photos/1181476/pexels-photo-1181476.jpeg',
      visits: 680,
      comments_count: 16,
      average_rating: 3.9,
      created_at: '2024-07-29T10:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 500);
  }, [selectedHashtag, sortBy]);

  const handleHashtagClick = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    if (hashtag) {
      setSearchParams({ hashtag });
    } else {
      setSearchParams({});
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setShowSortDropdown(false);
  };

  if (loading) {
    return (
      <div className="ranking-page">
        <div className="ranking-loading">
          <div className="beat-loading h-8 mb-4"></div>
          <div className="beat-loading h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ranking-page">
      {/* Header - Same as frontpage */}
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
          <Link to="/ranks" className="newspaper-nav-item active">Ranking</Link>
          <Link to="/autores" className="newspaper-nav-item">Authors</Link>
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
      <div className="ranking-main-content">
        {/* Title and Description */}
        <div className="ranking-header-section">
          <h1 className="ranking-main-title">Top Articles by Hashtag</h1>
          <p className="ranking-main-description">
            Explore the most visited, rated, and discussed articles in each category.
          </p>
        </div>

        {/* Hashtag Filters */}
        <div className="ranking-hashtag-filters">
          <button 
            className={`ranking-hashtag-pill ${selectedHashtag === 'science' ? 'active' : ''}`}
            onClick={() => handleHashtagClick('science')}
          >
            science
          </button>
          <button 
            className={`ranking-hashtag-pill ${selectedHashtag === 'literature' ? 'active' : ''}`}
            onClick={() => handleHashtagClick('literature')}
          >
            literature
          </button>
          <button 
            className={`ranking-hashtag-pill ${selectedHashtag === 'tech' ? 'active' : ''}`}
            onClick={() => handleHashtagClick('tech')}
          >
            tech
          </button>
          <button 
            className={`ranking-hashtag-pill ${selectedHashtag === 'philosophy' ? 'active' : ''}`}
            onClick={() => handleHashtagClick('philosophy')}
          >
            philosophy
          </button>
          <button 
            className={`ranking-hashtag-pill ${selectedHashtag === 'gastronomy' ? 'active' : ''}`}
            onClick={() => handleHashtagClick('gastronomy')}
          >
            gastronomy
          </button>
          <button 
            className={`ranking-hashtag-pill ${selectedHashtag === 'bioethics' ? 'active' : ''}`}
            onClick={() => handleHashtagClick('bioethics')}
          >
            bioethics
          </button>
          <button className="ranking-hashtag-search-btn">
            <Search className="w-4 h-4 mr-1" />
            Search for more hashtags
          </button>
        </div>

        {/* Sort Controls */}
        <div className="ranking-sort-controls">
          <span className="ranking-sort-text">Sort by:</span>
          <div className="ranking-sort-dropdown-container">
            <button 
              className="ranking-sort-dropdown-btn"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              Most highest
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {showSortDropdown && (
              <div className="ranking-sort-dropdown-menu">
                <button onClick={() => handleSortChange('Most highest')}>Most highest</button>
                <button onClick={() => handleSortChange('Most visited')}>Most visited</button>
                <button onClick={() => handleSortChange('Most recent')}>Most recent</button>
              </div>
            )}
          </div>
          <span className="ranking-sort-text">Most highest</span>
          <span className="ranking-sort-text">For last</span>
        </div>

        {/* Articles List */}
        <div className="ranking-articles-list">
          {posts.map((post, index) => (
            <div key={post.id} className="ranking-article-item">
              <div className="ranking-article-number">
                #{index + 1}
              </div>
              
              <div className="ranking-article-image-container">
                <img 
                  src={post.image} 
                  alt=""
                  className="ranking-article-image"
                />
              </div>
              
              <div className="ranking-article-details">
                <h3 className="ranking-article-item-title">
                  {post.title}
                </h3>
                <p className="ranking-article-item-excerpt">
                  {post.content}
                </p>
                <div className="ranking-article-item-meta">
                  <span className="ranking-article-author-name">
                    By {post.author_username}
                  </span>
                  <div className="ranking-article-stats-row">
                    <span className="ranking-article-stat">👁 {post.visits.toLocaleString()}</span>
                    <span className="ranking-article-stat">💬 {post.comments_count} Comments</span>
                    <span className="ranking-article-stat">⭐ {post.average_rating}</span>
                  </div>
                </div>
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

export default Rankings;