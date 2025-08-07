import React from "react";

const ModalConfirmarLogout = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4">¿Cerrar sesión?</h2>
        <p className="text-gray-600 mb-6">¿Estás seguro de que deseas cerrar sesión?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmarLogout;
