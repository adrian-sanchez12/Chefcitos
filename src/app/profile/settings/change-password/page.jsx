"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { useRef } from "react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const toast = useRef(null);
  const router = useRouter();

  const handleChangePassword = async () => {
    const { data: session } = await supabase.auth.getSession();
    const email = session?.session?.user?.email;

    if (!email) {
      toast.current.show({ severity: "error", summary: "Error", detail: "No estás autenticado." });
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (loginError) {
      toast.current.show({ severity: "error", summary: "Error", detail: "Contraseña actual incorrecta." });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    } else {
      toast.current.show({ severity: "success", summary: "Contraseña actualizada correctamente." });
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Toast ref={toast} />
      <Card className="max-w-xl mx-auto p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuración de cuenta</h2>
        <Divider />

        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Contraseña actual</label>
          <InputText
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-3 border rounded-md"
            placeholder="••••••••"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">Nueva contraseña</label>
          <InputText
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-3 border rounded-md"
            placeholder="••••••••"
          />
        </div>

        <Button
  label="Actualizar contraseña"
  icon="pi pi-lock"
  className="w-full px-4 py-3 text-sm font-medium bg-pink-500 border-none text-white rounded-md hover:bg-pink-600 transition-all duration-200"
  onClick={handleChangePassword}
/>

      </Card>
    </div>
  );
}
