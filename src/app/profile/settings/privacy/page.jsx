"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "primereact/card";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";

export default function PrivacySettings() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useRef(null);

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!error) setPerfil(data);
      setLoading(false);
    };

    fetchPerfil();
  }, []);

  const handleSave = async () => {
    const { error } = await supabase
      .from("perfiles")
      .update({
        perfil_publico: perfil.perfil_publico,
        mensajes_de: perfil.mensajes_de,
      })
      .eq("id", perfil.id);

    if (error) {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    } else {
      toast.current.show({ severity: "success", summary: "Privacidad actualizada" });
    }
  };

  if (loading || !perfil) return <p className="p-4">Cargando configuración...</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-5">
      <Toast ref={toast} />
      <Card className="max-w-2xl mx-auto p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuración de privacidad</h2>

        <div className="mb-6">
          <p className="font-medium text-gray-700 mb-2">¿Quién puede ver tu perfil?</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioButton
                inputId="publico"
                name="perfil"
                value={true}
                onChange={(e) => setPerfil({ ...perfil, perfil_publico: e.value })}
                checked={perfil.perfil_publico === true}
              />
              <label htmlFor="publico" className="text-sm">Público</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioButton
                inputId="privado"
                name="perfil"
                value={false}
                onChange={(e) => setPerfil({ ...perfil, perfil_publico: e.value })}
                checked={perfil.perfil_publico === false}
              />
              <label htmlFor="privado" className="text-sm">Privado</label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="font-medium text-gray-700 mb-2">¿Quién puede enviarte mensajes?</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioButton
                inputId="todos"
                name="mensajes"
                value="todos"
                onChange={(e) => setPerfil({ ...perfil, mensajes_de: e.value })}
                checked={perfil.mensajes_de === "todos"}
              />
              <label htmlFor="todos" className="text-sm">Todos</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioButton
                inputId="amigos"
                name="mensajes"
                value="amigos"
                onChange={(e) => setPerfil({ ...perfil, mensajes_de: e.value })}
                checked={perfil.mensajes_de === "amigos"}
              />
              <label htmlFor="amigos" className="text-sm">Solo amigos</label>
            </div>
          </div>
        </div>

        <Button
          label="Guardar cambios"
          icon="pi pi-save"
          onClick={handleSave}
          className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 bg-pink-500 text-white hover:bg-pink-600"
        />
      </Card>
    </div>
  );
}
