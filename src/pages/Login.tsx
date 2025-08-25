import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, BookOpen } from 'lucide-react';

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(formData.email, formData.password);
    if (success) {
      // Navigation will be handled by the Navigate component above
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
            Iniciar Sesión
          </h1>
          <p className="text-newspaper-600">
            Bienvenido de vuelta a Beatpost
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="beat-input pl-10"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-newspaper-400" />
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
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-newspaper-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-newspaper-900 font-medium hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-8 p-4 bg-newspaper-100 border border-newspaper-200">
          <h3 className="text-sm font-medium text-newspaper-800 mb-2">
            Demo de prueba:
          </h3>
          <p className="text-xs text-newspaper-600">
            Puedes crear una cuenta nueva o usar estas credenciales de prueba una vez que registres un usuario.
          </p>
        </div>

        {/* Philosophy quote */}
        <div className="mt-6 text-center">
          <div className="beat-quote text-sm">
            "Los únicos que me interesan son los locos, los que están locos por vivir, 
            locos por hablar, locos por salvarse..."
          </div>
          <p className="text-xs text-newspaper-500 mt-2">— Jack Kerouac</p>
        </div>
      </div>
    </div>
  );
};

export default Login;