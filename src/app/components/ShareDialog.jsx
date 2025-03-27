"use client";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

export default function ShareDialog({ visible, onHide, onConfirm }) {
  return (
    <Dialog
      header="Compartir publicación"
      visible={visible}
      onHide={onHide}
      style={{ width: "100%", maxWidth: "400px" }}
      className="rounded-lg shadow-md"
      breakpoints={{ '960px': '95vw', '640px': '90vw' }}
      modal
    >
      <div className="text-center">
        <p className="text-gray-700 text-sm mb-4">
          ¿Quieres compartir esta publicación en tu perfil?
        </p>

        <div className="flex justify-center gap-4 mt-6">
          <Button
            label="Cancelar"
            className="p-button-outlined text-sm"
            onClick={onHide}
          />
          <Button
            label="Compartir"
            icon="pi pi-share-alt"
            className="bg-pink-500 border-pink-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-pink-600 transition"
            onClick={onConfirm}
          />
        </div>
      </div>
    </Dialog>
  );
}
