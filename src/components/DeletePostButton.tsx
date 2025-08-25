import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeletePostButtonProps {
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const DeletePostButton: React.FC<DeletePostButtonProps> = ({ onConfirm, disabled, className }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setShowConfirmation(false);
      toast.success('Artículo eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el artículo');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-newspaper-900">Confirmar eliminación</h3>
            <button
              onClick={() => setShowConfirmation(false)}
              className="text-newspaper-500 hover:text-newspaper-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-newspaper-700 mb-6">
            ¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className="beat-button-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 font-medium hover:bg-red-700 transition-colors flex-1 flex items-center justify-center space-x-2"
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
    <button
      onClick={() => setShowConfirmation(true)}
      disabled={disabled}
      className={`text-red-600 hover:text-red-700 p-1 ${className || ''}`}
      title="Eliminar artículo"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};

export default DeletePostButton;