"use client";
import { useEffect, useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { resetPassword } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      supabase.auth.setSession({ access_token, refresh_token });
      setShowChangePassword(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      toast.current.show({
        severity: "success",
        summary: "Correo enviado",
        detail: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message,
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    } else {
      toast.current.show({ severity: "success", summary: "Contraseña actualizada" });
      setNewPassword("");
      setTimeout(() => {
        router.push("/login"); 
      }, 2000);    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Toast ref={toast} />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {showChangePassword ? "Cambiar contraseña" : "Recuperar contraseña"}
        </h2>

        {!showChangePassword ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 text-gray-600">Correo electrónico</label>
              <InputText
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="tu@email.com"
              />
            </div>
            <Button
              label="Enviar enlace de recuperación"
              type="submit"
              className="bg-pink-500 text-white rounded-lg px-4 py-2"
            />
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="block mb-1 text-gray-600">Nueva contraseña</label>
              <InputText
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <Button
              label="Guardar nueva contraseña"
              type="submit"
              className="bg-green-500 text-white rounded-lg px-4 py-2"
            />
          </form>
        )}
      </div>
    </div>
  );
}
