import React, { useState, useEffect } from 'react';
import { userService, User } from '../services/api';
import { X, Save, User as UserIcon, FileText, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    bio: ''
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username,
        bio: user.bio || ''
      });
      setAvatar(null);
      setAvatarPreview(user.avatar || null);
      setErrors({});
    }
  }, [isOpen, user]);

  if (!user) return null;

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no puede exceder 2MB');
        return;
      }

      setAvatar(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.username.length < 3 || formData.username.length > 30) {
      newErrors.username = 'El nombre de usuario debe tener entre 3 y 30 caracteres';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'La biografía no puede exceder 500 caracteres';
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
      const updateData: { username?: string; bio?: string; avatar?: File } = {};
      
      // Only send fields that changed
      if (formData.username !== user.username) {
        updateData.username = formData.username.trim();
      }
      if (formData.bio !== (user.bio || '')) {
        updateData.bio = formData.bio.trim();
      }
      if (avatar) {
        updateData.avatar = avatar;
      }

      if (Object.keys(updateData).length === 0) {
        toast.error('No se han realizado cambios');
        return;
      }

      const updatedUser = await userService.updateProfile(updateData);
      
      // Update auth context
      updateUser(updatedUser);
      
      toast.success('¡Perfil actualizado exitosamente!');
      onSuccess(updatedUser);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-newspaper-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-newspaper-900">Editar Perfil</h2>
            <button
              onClick={onClose}
              className="text-newspaper-500 hover:text-newspaper-700 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="text-center">
            <label className="block text-sm font-medium text-newspaper-700 mb-4">
              Foto de perfil
            </label>
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-newspaper-200 rounded-full flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-16 h-16 text-newspaper-600" />
                )}
              </div>
              <label 
                htmlFor="avatar" 
                className="absolute bottom-0 right-0 bg-newspaper-900 text-white rounded-full p-2 cursor-pointer hover:bg-newspaper-800 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {avatar && (
              <button
                type="button"
                onClick={() => {
                  setAvatar(null);
                  setAvatarPreview(user.avatar || null);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                Cancelar cambio de imagen
              </button>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-newspaper-700 mb-2">
              Nombre de usuario
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`beat-input pl-10 ${errors.username ? 'border-red-300' : ''}`}
                placeholder="tu_username"
                maxLength={30}
              />
              <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
            {errors.username && (
              <p className="text-red-600 text-xs flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.username}
              </p>
            )}
            <p className="text-xs text-newspaper-500 mt-1">
              {formData.username.length}/30 caracteres
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-newspaper-700 mb-2">
              Biografía
            </label>
            <div className="relative">
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={`beat-input pl-10 min-h-[100px] resize-none ${errors.bio ? 'border-red-300' : ''}`}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
              />
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
            <div className="flex justify-between items-center mt-1">
              {errors.bio && (
                <p className="text-red-600 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.bio}
                </p>
              )}
              <p className="text-xs text-newspaper-500 ml-auto">
                {formData.bio.length}/500 caracteres
              </p>
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

        {/* Info */}
        <div className="px-6 pb-6">
          <div className="bg-newspaper-100 p-4 rounded border border-newspaper-200">
            <p className="text-xs text-newspaper-600">
              <strong>Nota:</strong> Los cambios en tu nombre de usuario se aplicarán 
              inmediatamente y se reflejarán en todos tus posts y comentarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;