import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postService, commentService, userService, Post, Comment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import EditPostModal from '../components/EditPostModal';
import DeletePostButton from '../components/DeletePostButton';
import CommentItem from '../components/CommentItem';
import { 
  Eye, 
  MessageCircle, 
  Star, 
  Clock, 
  User, 
  Send,
  Hash,
  Heart,
  UserPlus,
  UserMinus,
  Edit,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      if (id) {
        const postData = await postService.getPost(id);
        setPost(postData);
      }
    } catch (error) {
      toast.error('Error cargando el artículo');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      if (id) {
        const commentsData = await commentService.getComments(id);
        setComments(commentsData);
      }
    } catch (error) {
      toast.error('Error cargando comentarios');
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || !post) {
      toast.error('Debes iniciar sesión para valorar');
      return;
    }

    if (submittingRating) return;

    setSubmittingRating(true);
    try {
      await postService.ratePost(post.id, rating);
      setUserRating(rating);
      
      // Reload post to get updated rating
      await loadPost();
      
      toast.success('¡Valoración enviada!');
    } catch (error) {
      toast.error('Error enviando valoración');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !post) {
      toast.error('Debes iniciar sesión para comentar');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Escribe un comentario');
      return;
    }

    setSubmittingComment(true);
    try {
      const newComment = await commentService.createComment(post.id, commentText.trim());
      setComments([...comments, newComment]);
      setCommentText('');
      toast.success('Comentario añadido');
    } catch (error) {
      toast.error('Error enviando comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !post) {
      toast.error('Debes iniciar sesión para seguir usuarios');
      return;
    }

    if (post.author_username === user.username) {
      toast.error('No puedes seguirte a ti mismo');
      return;
    }

    setFollowLoading(true);
    try {
      const result = await userService.followUser(post.author_username);
      setIsFollowing(!isFollowing);
      toast.success(result.message);
    } catch (error) {
      toast.error('Error al seguir/dejar de seguir');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditSuccess = (updatedPost: Post) => {
    setPost(updatedPost);
    setEditingPost(null);
  };

  const handleDeletePost = async () => {
    if (!post) return;
    
    try {
      await postService.deletePost(post.id);
      toast.success('Artículo eliminado correctamente');
      navigate('/perfil');
    } catch (error) {
      throw error; // Re-throw to be handled by DeletePostButton
    }
  };

  const handleUpdateComment = (updatedComment: Comment) => {
    setComments(comments.map(comment => 
      comment.id === updatedComment.id ? updatedComment : comment
    ));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  if (loading) {
    return (
      <div className="beat-container">
        <div className="beat-card p-8">
          <div className="beat-loading h-8 mb-4"></div>
          <div className="beat-loading h-4 mb-2"></div>
          <div className="beat-loading h-4 mb-8"></div>
          <div className="beat-loading h-64"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="beat-container">
        <div className="beat-error">
          <h2 className="text-lg font-semibold mb-2">Artículo no encontrado</h2>
          <p>El artículo que buscas no existe o ha sido eliminado.</p>
          <Link to="/" className="beat-button mt-4 inline-block">
            Volver a la portada
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="beat-container max-w-4xl mx-auto">
      <article className="beat-card p-8 mb-8">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="beat-article text-4xl font-bold text-newspaper-900 leading-tight flex-1 mr-4">
              {post.title}
            </h1>
            
            {user && user.username === post.author_username && (
              <div className="flex space-x-2 flex-shrink-0">
                <button
                  onClick={() => setEditingPost(post)}
                  className="text-newspaper-600 hover:text-newspaper-900 p-2 hover:bg-newspaper-100 rounded"
                  title="Editar artículo"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <DeletePostButton 
                  onConfirm={handleDeletePost}
                  className="hover:bg-red-50 rounded p-2 transition-colors"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link 
                to={`/beatnik/${post.author_username}`}
                className="flex items-center space-x-2 hover:text-newspaper-900 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{post.author_username}</span>
              </Link>
              
              <span className="flex items-center text-newspaper-600">
                <Clock className="w-4 h-4 mr-1" />
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </span>
              
              {user && user.username !== post.author_username && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center space-x-1 px-3 py-1 text-sm font-medium transition-colors ${
                    isFollowing 
                      ? 'text-red-600 hover:text-red-700' 
                      : 'text-newspaper-900 hover:text-newspaper-700'
                  }`}
                >
                  {followLoading ? (
                    <div className="beat-spinner w-3 h-3"></div>
                  ) : isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>{isFollowing ? 'Siguiendo' : 'Seguir'}</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-newspaper-600">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {post.visits} visitas
              </span>
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-1" />
                {post.average_rating.toFixed(1)} ({post.ratings_count})
              </span>
              <span className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments_count} comentarios
              </span>
            </div>
          </div>
          
          {/* Hashtags */}
          <div className="flex flex-wrap gap-2 mt-4">
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
        </header>

        {/* Article Image */}
        {post.image && (
          <div className="mb-8">
            <img 
              src={post.image} 
              alt=""
              className="w-full max-w-2xl mx-auto beat-image-bw"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="beat-article prose prose-lg max-w-none">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-newspaper-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Rating Section */}
        {user && (
          <div className="mt-8 pt-8 border-t border-newspaper-200">
            <h3 className="text-lg font-semibold text-newspaper-900 mb-4">
              Valora este artículo
            </h3>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  disabled={submittingRating}
                  className={`beat-star ${
                    rating <= userRating ? 'filled text-yellow-500' : 'empty'
                  } ${submittingRating ? 'opacity-50' : 'hover:text-yellow-400'}`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
              <span className="ml-3 text-sm text-newspaper-600">
                {userRating > 0 ? `Tu valoración: ${userRating}/5` : 'Haz clic en una estrella'}
              </span>
            </div>
          </div>
        )}
      </article>

      {/* Comments Section */}
      <div className="beat-card p-8">
        <h2 className="text-2xl font-bold text-newspaper-900 mb-6 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2" />
          Comentarios ({comments.length})
        </h2>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="beat-input min-h-[100px] resize-none"
              placeholder="Comparte tu opinión sobre este artículo..."
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-newspaper-500">
                {commentText.length}/1000 caracteres
              </span>
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="beat-button flex items-center space-x-2"
              >
                {submittingComment ? (
                  <div className="beat-spinner"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Comentar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-newspaper-100 border border-newspaper-200">
            <p className="text-newspaper-700">
              <Link to="/login" className="text-newspaper-900 font-medium hover:underline">
                Inicia sesión
              </Link>{' '}
              para participar en la conversación.
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-newspaper-600">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aún no hay comentarios. ¡Sé el primero en comentar!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
              />
            ))
          )}
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
    </div>
  );
};

export default PostDetail;