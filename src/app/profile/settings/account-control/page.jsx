"use client";
import { useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountControlPage() {
  const [showDialog, setShowDialog] = useState(false);
  const toast = useRef(null);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.current.show({ severity: "success", summary: "Cuenta desactivada" });
      router.push("/login");
    } else {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Toast ref={toast} />
      <Card title="Control de cuenta" className="shadow-md">
        <p className="mb-4 text-gray-700">
          Puedes desactivar temporalmente tu cuenta o eliminarla permanentemente. Esto eliminará tus datos.
        </p>
        <Button
  label="Desactivar / Eliminar cuenta"
  icon="pi pi-trash"
  className="w-full md:w-auto bg-red-500 border-red-500 text-white px-4 py-3 text-sm font-medium rounded-md hover:bg-red-600 transition-all duration-200"
  onClick={() => setShowDialog(true)}
/>

      </Card>

      <Dialog
        header="Confirmar eliminación"
        visible={showDialog}
        style={{ width: "90%", maxWidth: "400px" }}
        onHide={() => setShowDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button label="Cancelar" onClick={() => setShowDialog(false)} className="p-button-text" />
            <Button label="Eliminar" className="p-button-danger" onClick={handleDeleteAccount} />
          </div>
        }
      >
        <p className="text-gray-800">
          ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.
        </p>
      </Dialog>
    </div>
  );
}
