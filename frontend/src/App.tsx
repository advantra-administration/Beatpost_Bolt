import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Frontpage from './pages/Frontpage';
import PostDetail from './pages/PostDetail';
import Rankings from './pages/Rankings';
import Authors from './pages/Authors';
import BeatnikProfile from './pages/BeatnikProfile';
import MyProfile from './pages/MyProfile';
import Editor from './pages/Editor';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Frontpage />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/ranks" element={<Rankings />} />
          <Route path="/autores" element={<Authors />} />
          <Route path="/beatnik/:username" element={<BeatnikProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/escribir" element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;