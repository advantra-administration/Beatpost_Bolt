import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  PenTool, 
  Home, 
  TrendingUp, 
  Users, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus,
  Hash,
  BookOpen
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-newspaper-50">
      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-newspaper-300">
        <div className="beat-container">
          <div className="flex items-center justify-around py-3">
            <Link 
              to="/" 
              className={`beat-nav-link flex flex-col items-center space-y-1 ${isActive('/') ? 'active' : ''}`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            
            <Link 
              to="/ranks" 
              className={`beat-nav-link flex flex-col items-center space-y-1 ${isActive('/ranks') ? 'active' : ''}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Ranking</span>
            </Link>

            <Link 
              to="/autores" 
              className={`beat-nav-link flex flex-col items-center space-y-1 ${isActive('/autores') ? 'active' : ''}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Autores</span>
            </Link>

            {user && (
              <Link 
                to="/escribir" 
                className={`beat-nav-link flex flex-col items-center space-y-1 ${isActive('/escribir') ? 'active' : ''}`}
              >
                <PenTool className="w-5 h-5" />
                <span className="text-xs">Escribir</span>
              </Link>
            )}

            {user ? (
              <Link 
                to="/perfil" 
                className="beat-nav-link flex flex-col items-center space-y-1"
              >
                <User className="w-5 h-5" />
                <span className="text-xs">Perfil</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="beat-nav-link flex flex-col items-center space-y-1"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-xs">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-newspaper-900 text-newspaper-100 py-8 mt-16">
        <div className="beat-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Beatpost</h3>
              <p className="text-newspaper-300 leading-relaxed">
                Una plataforma de publicación abierta inspirada en la estética 
                y el espíritu de la Beat Generation. Escribe con intención, lee con atención.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Navegación</h3>
              <ul className="space-y-2 text-newspaper-300">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/ranks" className="hover:text-white transition-colors">Ranking</Link></li>
                <li><Link to="/autores" className="hover:text-white transition-colors">Autores</Link></li>
                {user && (
                  <li><Link to="/escribir" className="hover:text-white transition-colors">Escribir</Link></li>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Filosofía</h3>
              <p className="text-newspaper-300 text-sm leading-relaxed">
                "No compite en velocidad ni en viralidad. Compite en profundidad, 
                estilo y autenticidad."
              </p>
            </div>
          </div>
          
          <div className="border-t border-newspaper-800 mt-8 pt-8 text-center text-newspaper-400">
            <p>&copy; 2024 Beatpost. Una experiencia como una buena conversación.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;