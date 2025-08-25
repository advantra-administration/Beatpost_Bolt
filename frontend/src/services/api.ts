import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Configure axios
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  mojo: number;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  hashtags: string[];
  image?: string;
  author_id: string;
  author_username: string;
  visits: number;
  average_rating: number;
  ratings_count: number;
  comments_count: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  content: string;
  created_at: string;
  updated_at?: string; // Optional field for edited comments
}

export interface Rating {
  id: string;
  post_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Author {
  id: string;
  username: string;
  bio: string;
  avatar?: string;
  mojo: number;
  posts_count: number;
  followers_count: number;
  average_rating: number;
  total_visits: number;
  ratings_count: number;
  created_at: string;
}

export interface AuthorsResponse {
  authors: Author[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  hashtags: string[];
  image?: File;
}

// Auth Services
export const authService = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/users/me');
    return response.data;
  },
};

// User Services
export const userService = {
  getProfile: async (username: string): Promise<User> => {
    const response = await api.get(`/api/users/${username}`);
    return response.data;
  },

  updateProfile: async (profileData: {
    username?: string;
    bio?: string;
    avatar?: File;
  }): Promise<User> => {
    const formData = new FormData();
    
    if (profileData.username !== undefined) {
      formData.append('username', profileData.username);
    }
    if (profileData.bio !== undefined) {
      formData.append('bio', profileData.bio);
    }
    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }

    const response = await api.put('/api/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  followUser: async (username: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/follow/${username}`);
    return response.data;
  },
};

// Post Services
export const postService = {
  getPosts: async (skip = 0, limit = 20, hashtag?: string): Promise<Post[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (hashtag) {
      params.append('hashtag', hashtag);
    }
    const response = await api.get(`/api/posts?${params}`);
    return response.data;
  },

  getPost: async (id: string): Promise<Post> => {
    const response = await api.get(`/api/posts/${id}`);
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('hashtags', JSON.stringify(data.hashtags));
    
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await api.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePost: async (postId: string, data: CreatePostRequest): Promise<Post> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('hashtags', JSON.stringify(data.hashtags));
    
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await api.put(`/api/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deletePost: async (postId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },

  ratePost: async (postId: string, rating: number): Promise<Rating> => {
    const response = await api.post(`/api/posts/${postId}/rate`, {
      post_id: postId,
      rating,
    });
    return response.data;
  },

  getFrontpage: async (): Promise<Post[]> => {
    const response = await api.get('/api/frontpage');
    return response.data;
  },

  getRanks: async (hashtag?: string): Promise<{ posts: Post[] }> => {
    const params = hashtag ? `?hashtag=${hashtag}` : '';
    const response = await api.get(`/api/ranks${params}`);
    return response.data;
  },

  getUserPosts: async (
    userId: string,
    skip = 0,
    limit = 100,
    sortBy?: string,
    search?: string,
    archived?: boolean
  ): Promise<Post[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (sortBy) {
      params.append('sort_by', sortBy);
    }
    if (search) {
      params.append('search', search);
    }
    if (archived !== undefined) {
      params.append('archived', archived.toString());
    }
    
    const response = await api.get(`/api/users/${userId}/posts?${params}`);
    return response.data;
  },

  toggleArchivePost: async (postId: string): Promise<{ message: string; archived: boolean }> => {
    const response = await api.put(`/api/posts/${postId}/archive`);
    return response.data;
  },
};

// Comment Services
export const commentService = {
  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await api.get(`/api/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (postId: string, content: string): Promise<Comment> => {
    const response = await api.post(`/api/posts/${postId}/comments`, {
      content,
    });
    return response.data;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await api.put(`/api/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  },
};

// Hashtag Services
export const hashtagService = {
  getPopularHashtags: async (): Promise<{ hashtag: string; count: number }[]> => {
    const response = await api.get('/api/hashtags');
    return response.data;
  },
};

// Author Services
export const authorService = {
  getAuthors: async (
    skip = 0,
    limit = 20,
    sortBy?: string,
    search?: string
  ): Promise<AuthorsResponse> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (sortBy) {
      params.append('sort_by', sortBy);
    }
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/api/authors?${params}`);
    return response.data;
  },
};

export default api;