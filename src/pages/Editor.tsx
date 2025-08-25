import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/api';
import { PenTool, Image, Hash, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    hashtags: ['']
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleHashtagChange = (index: number, value: string) => {
    const newHashtags = [...formData.hashtags];
    newHashtags[index] = value.replace(/^#/, ''); // Remove # if user types it
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
          resolve(imageUrl); // Fallback to original if canvas not available
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Get image data and convert to grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          data[i] = gray;     // red
          data[i + 1] = gray; // green
          data[i + 2] = gray; // blue
          // alpha channel (data[i + 3]) remains unchanged
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const bwImageUrl = URL.createObjectURL(blob);
            resolve(bwImageUrl);
          } else {
            resolve(imageUrl); // Fallback
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = imageUrl;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede exceder 5MB');
        return;
      }

      setImageProcessing(true);
      setImage(file);
      
      // Create original preview first
      const reader = new FileReader();
      reader.onload = async (e) => {
        const originalUrl = e.target?.result as string;
        
        try {
          toast.loading('Convirtiendo imagen a blanco y negro...', { duration: 2000 });
          
          // Convert to black and white for preview
          const bwUrl = await convertImageToBW(originalUrl);
          setImagePreview(bwUrl);
          
          toast.dismiss();
          toast.success('✓ Imagen convertida a blanco y negro');
        } catch (error) {
          console.error('Error converting image:', error);
          // Fallback to original if conversion fails
          setImagePreview(originalUrl);
          toast.dismiss();
          toast.error('Conversión a B&N fallida, se usará filtro automático');
        } finally {
          setImageProcessing(false);
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
      
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        hashtags: validHashtags,
        image: image || undefined
      };

      const newPost = await postService.createPost(postData);
      toast.success('¡Artículo publicado exitosamente!');
      navigate(`/post/${newPost.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al publicar el artículo');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = formData.content.length;

  return (
    <div className="beat-container max-w-4xl mx-auto">
      <div className="beat-card p-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <PenTool className="w-8 h-8 text-newspaper-900 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-newspaper-900">
              Nuevo Artículo
            </h1>
            <p className="text-newspaper-600 mt-1">
              Escribe con intención, comparte con propósito
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
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
              className={`beat-input text-lg font-semibold ${errors.title ? 'border-red-300' : ''}`}
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
              className={`beat-input min-h-[400px] resize-none font-serif leading-relaxed ${errors.content ? 'border-red-300' : ''}`}
              placeholder="Aquí es donde tu voz cobra vida. Escribe tu historia, comparte tus ideas, deja que las palabras fluyan..."
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
              Imagen (opcional)
            </label>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label htmlFor="image" className={`beat-button-secondary cursor-pointer flex items-center space-x-2 ${imageProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Image className="w-4 h-4" />
                  <span>{imageProcessing ? 'Procesando...' : 'Seleccionar imagen'}</span>
                </label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={imageProcessing}
                />
                <div className="flex flex-col">
                  <p className="text-xs text-newspaper-500">
                    La imagen se convertirá automáticamente a blanco y negro
                  </p>
                  {imageProcessing && (
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <div className="beat-spinner w-3 h-3 mr-1"></div>
                      Convirtiendo a B&N...
                    </p>
                  )}
                </div>
              </div>
              
              {imagePreview && !imageProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-newspaper-700">Vista previa (blanco y negro):</p>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      ✕ Eliminar imagen
                    </button>
                  </div>
                  <div className="relative inline-block border-2 border-newspaper-300 p-2 bg-white">
                    <img
                      src={imagePreview}
                      alt="Vista previa en blanco y negro"
                      className="max-w-sm h-auto block"
                      style={{ filter: 'grayscale(100%) contrast(1.1)' }}
                    />
                    <div className="absolute top-1 left-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1">
                      B&N
                    </div>
                  </div>
                  <p className="text-xs text-newspaper-600 italic">
                    ✓ Esta es la versión final que verán los lectores
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="border-t border-newspaper-200 pt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-newspaper-600">
                <p>Tu artículo será visible para toda la comunidad Beatpost</p>
                <p>Asegúrate de que el contenido sea auténtico y de calidad</p>
              </div>
              
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
                    <span>Publicar Artículo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Writing Tips */}
        <div className="mt-8 p-6 bg-newspaper-100 border border-newspaper-200">
          <h3 className="text-lg font-semibold text-newspaper-900 mb-3">
            Consejos para escribir en Beatpost
          </h3>
          <ul className="text-sm text-newspaper-700 space-y-2">
            <li>• Sé auténtico: escribe desde tu experiencia personal</li>
            <li>• Profundidad sobre viralidad: prefiere contenido reflexivo</li>
            <li>• Usa hashtags relevantes que describan tu artículo</li>
            <li>• Una imagen en blanco y negro puede potenciar tu mensaje</li>
            <li>• Revisa tu ortografía y gramática antes de publicar</li>
          </ul>
          <div className="beat-quote mt-4">
            "El arte de escribir es el arte de descubrir lo que crees"
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;