"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

export default function VisibilitySettings() {
  const [config, setConfig] = useState({
    perfil: "Todos",
    publicaciones: "Amigos",
    amigos: "Solo yo",
  });
  const [loading, setLoading] = useState(true);
  const toast = useRef(null);

  const opciones = [
    { label: "Todos", value: "Todos" },
    { label: "Amigos", value: "Amigos" },
    { label: "Solo yo", value: "Solo yo" },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: session, error: sessionError } = await supabase.auth.getUser();
      const userId = session?.user?.id;
      if (sessionError || !userId) return;

      const { data, error } = await supabase
        .from("configuracion_visibilidad")
        .select("*")
        .eq("usuario_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        toast.current.show({ severity: "error", summary: "Error", detail: error.message });
      }

      if (data) {
        setConfig(data);
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleChange = (e, field) => {
    setConfig({ ...config, [field]: e.value });
  };

  const handleSave = async () => {
    const { data: session, error: sessionError } = await supabase.auth.getUser();
    const userId = session?.user?.id;
    if (sessionError || !userId) return;

    const { error } = await supabase
      .from("configuracion_visibilidad")
      .upsert(
        { ...config, usuario_id: userId },
        { onConflict: ["usuario_id"] }
      );

    if (error) {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    } else {
      toast.current.show({ severity: "success", summary: "Configuración guardada" });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toast ref={toast} />

      <Card title="Configuración de Visibilidad" className="shadow-md">
        {loading ? (
          <div className="flex justify-center py-6">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                ¿Quién puede ver tu perfil?
              </label>
              <Dropdown
                value={config.perfil}
                options={opciones}
                onChange={(e) => handleChange(e, "perfil")}
                className="w-full"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                ¿Quién puede ver tus publicaciones?
              </label>
              <Dropdown
                value={config.publicaciones}
                options={opciones}
                onChange={(e) => handleChange(e, "publicaciones")}
                className="w-full"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                ¿Quién puede ver tu lista de amigos?
              </label>
              <Dropdown
                value={config.amigos}
                options={opciones}
                onChange={(e) => handleChange(e, "amigos")}
                className="w-full"
              />
            </div>
            <Button
              label="Guardar configuración"
              icon="pi pi-save"
              className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-pink-500 border-pink-500 text-white hover:bg-pink-600 transition-all duration-200"
              onClick={handleSave}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
