import React, { useState, useEffect } from 'react';
import { postService, Post } from '../services/api';
import { X, Save, Image as ImageIcon, Hash, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPost: Post) => void;
}

const EditPostModal: React.FC<EditPostModalProps> = ({ post, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    hashtags: post.hashtags
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: post.title,
        content: post.content,
        hashtags: post.hashtags
      });
      setImage(null);
      setImagePreview(post.image || null);
      setErrors({});
    }
  }, [isOpen, post]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleHashtagChange = (index: number, value: string) => {
    const newHashtags = [...formData.hashtags];
    newHashtags[index] = value.replace(/^#/, '');
    setFormData({
      ...formData,
      hashtags: newHashtags
    });
  };

  const addHashtag = () => {
    if (formData.hashtags.length < 3) {
      setFormData({
        ...formData,
        hashtags: [...formData.hashtags, '']
      });
    }
  };

  const removeHashtag = (index: number) => {
    const newHashtags = formData.hashtags.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      hashtags: newHashtags
    });
  };

  const convertImageToBW = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image(); // Use window.Image to be explicit
      
      img.onload = () => {
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const bwImageUrl = URL.createObjectURL(blob);
            resolve(bwImageUrl);
          } else {
            resolve(imageUrl);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = imageUrl;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede exceder 5MB');
        return;
      }

      setImage(file);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const originalUrl = e.target?.result as string;
        
        try {
          const bwUrl = await convertImageToBW(originalUrl);
          setImagePreview(bwUrl);
        } catch (error) {
          console.error('Error converting image:', error);
          setImagePreview(originalUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.title.length < 20 || formData.title.length > 80) {
      newErrors.title = 'El título debe tener entre 20 y 80 caracteres';
    }

    if (formData.content.length < 150 || formData.content.length > 10000) {
      newErrors.content = 'El contenido debe tener entre 150 y 10,000 caracteres';
    }

    const validHashtags = formData.hashtags.filter(tag => tag.trim() !== '');
    if (validHashtags.length < 1 || validHashtags.length > 3) {
      newErrors.hashtags = 'Debes incluir entre 1 y 3 hashtags';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const validHashtags = formData.hashtags.filter(tag => tag.trim() !== '');
      
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        hashtags: validHashtags,
        image: image || undefined
      };

      const updatedPost = await postService.updatePost(post.id, updateData);
      toast.success('¡Artículo actualizado exitosamente!');
      onSuccess(updatedPost);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al actualizar el artículo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = formData.content.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-newspaper-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-newspaper-900">Editar Artículo</h2>
            <button
              onClick={onClose}
              className="text-newspaper-500 hover:text-newspaper-700 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-newspaper-700 mb-2">
              Título del artículo
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`beat-input ${errors.title ? 'border-red-300' : ''}`}
              placeholder="Un título que capture la esencia de tu artículo..."
              maxLength={80}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title && (
                <p className="text-red-600 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.title}
                </p>
              )}
              <p className="text-xs text-newspaper-500 ml-auto">
                {formData.title.length}/80 caracteres
              </p>
            </div>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-newspaper-700 mb-2">
              Contenido del artículo
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              className={`beat-input min-h-[300px] resize-none font-serif leading-relaxed ${errors.content ? 'border-red-300' : ''}`}
              placeholder="Aquí es donde tu voz cobra vida..."
              maxLength={10000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.content && (
                <p className="text-red-600 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.content}
                </p>
              )}
              <div className="flex space-x-4 text-xs text-newspaper-500 ml-auto">
                <span>{wordCount} palabras</span>
                <span>{charCount}/10,000 caracteres</span>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-newspaper-700 mb-2">
              Hashtags (1-3 requeridos)
            </label>
            <div className="space-y-2">
              {formData.hashtags.map((hashtag, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={hashtag}
                      onChange={(e) => handleHashtagChange(index, e.target.value)}
                      className="beat-input pl-8"
                      placeholder="literatura, beat, reflexion..."
                      maxLength={20}
                    />
                    <Hash className="absolute left-2.5 top-2.5 w-4 h-4 text-newspaper-400" />
                  </div>
                  {formData.hashtags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHashtag(index)}
                      className="text-red-600 hover:text-red-700 px-2 py-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {formData.hashtags.length < 3 && (
              <button
                type="button"
                onClick={addHashtag}
                className="mt-2 beat-button-secondary text-sm"
              >
                + Añadir hashtag
              </button>
            )}
            
            {errors.hashtags && (
              <p className="text-red-600 text-xs flex items-center mt-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.hashtags}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-newspaper-700 mb-2">
              Cambiar imagen (opcional)
            </label>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label htmlFor="image" className="beat-button-secondary cursor-pointer flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Seleccionar nueva imagen</span>
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-newspaper-500">
                  Se convertirá automáticamente a blanco y negro
                </p>
              </div>
              
              {imagePreview && (
                <div className="relative inline-block border-2 border-newspaper-300 p-2 bg-white">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="max-w-sm h-auto block"
                    style={{ filter: 'grayscale(100%) contrast(1.1)' }}
                  />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1">
                    B&N
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(post.image || null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="border-t border-newspaper-200 pt-6">
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="beat-button-secondary px-6 py-3"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="beat-button flex items-center space-x-2 px-8 py-3"
              >
                {loading ? (
                  <div className="beat-spinner"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;