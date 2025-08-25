import React, { useState } from 'react';
import { commentService, Comment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Trash2, Save, X, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (updatedComment: Comment) => void;
  onDelete: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAuthor = user && user.username === comment.author_username;

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    if (editContent.length > 1000) {
      toast.error('El comentario no puede exceder 1000 caracteres');
      return;
    }

    setLoading(true);
    try {
      const updatedComment = await commentService.updateComment(comment.id, editContent.trim());
      onUpdate(updatedComment);
      setIsEditing(false);
      toast.success('Comentario actualizado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al actualizar el comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await commentService.deleteComment(comment.id);
      onDelete(comment.id);
      setShowDeleteConfirm(false);
      toast.success('Comentario eliminado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al eliminar el comentario');
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  if (showDeleteConfirm) {
    return (
      <div className="beat-comment">
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <div className="flex items-center mb-3">
            <MessageCircle className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-red-800 font-semibold">Eliminar comentario</h4>
          </div>
          <p className="text-red-700 mb-4">
            ¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="beat-button-secondary text-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="beat-spinner w-4 h-4"></div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="beat-comment">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-newspaper-900">
            {comment.author_username}
          </span>
          <span className="text-xs text-newspaper-500">
            {formatDistanceToNow(new Date(comment.created_at), { 
              addSuffix: true, 
              locale: es 
            })}
          </span>
          {comment.updated_at && new Date(comment.updated_at) > new Date(comment.created_at) && (
            <span className="text-xs text-newspaper-500 italic">
              (editado)
            </span>
          )}
        </div>

        {isAuthor && !isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-newspaper-600 hover:text-newspaper-900 p-1"
              title="Editar comentario"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 p-1"
              title="Eliminar comentario"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="beat-input min-h-[80px] resize-none text-sm"
            placeholder="Escribe tu comentario..."
            maxLength={1000}
            disabled={loading}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-newspaper-500">
              {editContent.length}/1000 caracteres
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={cancelEdit}
                className="beat-button-secondary text-sm px-3 py-1"
                disabled={loading}
              >
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={loading || !editContent.trim()}
                className="beat-button text-sm px-3 py-1 flex items-center space-x-1"
              >
                {loading ? (
                  <div className="beat-spinner w-3 h-3"></div>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-newspaper-800 leading-relaxed">
          {comment.content}
        </p>
      )}
    </div>
  );
};

export default CommentItem;