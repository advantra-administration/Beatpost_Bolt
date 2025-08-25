import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, FileText, BookOpen } from 'lucide-react';

const Register: React.FC = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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

    const success = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      bio: formData.bio || undefined
    });
    
    if (success) {
      navigate('/login');
    }
    
    setLoading(false);
  };

  return (
    <div className="beat-container max-w-md mx-auto">
      <div className="beat-card p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <BookOpen className="w-12 h-12 text-newspaper-900" />
          </div>
          <h1 className="text-2xl font-bold text-newspaper-900 mb-2">
            Únete a Beatpost
          </h1>
          <p className="text-newspaper-600">
            Comienza tu viaje literario
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                required
              />
              <User className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
            {errors.username && (
              <p className="text-red-600 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-newspaper-700 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="beat-input pl-10"
                placeholder="tu@email.com"
                required
              />
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-newspaper-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`beat-input pl-10 ${errors.password ? 'border-red-300' : ''}`}
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-newspaper-700 mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`beat-input pl-10 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-newspaper-700 mb-2">
              Biografía (opcional)
            </label>
            <div className="relative">
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={`beat-input pl-10 min-h-[80px] resize-none ${errors.bio ? 'border-red-300' : ''}`}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
              />
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
            </div>
            <div className="flex justify-between items-center mt-1">
              {errors.bio && (
                <p className="text-red-600 text-xs">{errors.bio}</p>
              )}
              <p className="text-xs text-newspaper-500 ml-auto">
                {formData.bio.length}/500
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full beat-button flex items-center justify-center space-x-2 py-3"
          >
            {loading ? (
              <div className="beat-spinner"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-newspaper-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-newspaper-900 font-medium hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        {/* Terms note */}
        <div className="mt-6 p-4 bg-newspaper-100 border border-newspaper-200">
          <p className="text-xs text-newspaper-600">
            Al crear una cuenta, aceptas nuestros términos de uso y política de privacidad. 
            Beatpost es una plataforma para contenido de calidad y respeto mutuo.
          </p>
        </div>

        {/* Philosophy quote */}
        <div className="mt-6 text-center">
          <div className="beat-quote text-sm">
            "Sé loco y demasiado, y crea un nuevo mundo"
          </div>
          <p className="text-xs text-newspaper-500 mt-2">— Allen Ginsberg</p>
        </div>
      </div>
    </div>
  );
};

export default Register;