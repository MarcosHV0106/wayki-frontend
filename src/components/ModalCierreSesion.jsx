import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

const ModalCierreSesion = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()} // Evita que el modal se cierre al hacer clic dentro
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 relative"
          >
            {/* Icono de cierre */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full mb-4">
                <LogOut size={32} className="text-red-600 dark:text-red-400" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                ¿Confirmar Cierre de Sesión?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Serás redirigido a la página de inicio de sesión.
              </p>

              <div className="flex justify-center gap-4 w-full">
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="w-full py-2 px-4 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow-md hover:shadow-lg"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalCierreSesion;