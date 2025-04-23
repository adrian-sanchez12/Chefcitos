"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Dropdown } from "primereact/dropdown";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";

const categorias = [
  { label: "Todas", value: "todas" },
  { label: "Pastas", value: "pastas" },
  { label: "Pasteles", value: "pasteles" },
  { label: "Ensaladas", value: "ensaladas" },
  { label: "Sopas", value: "sopas" },
  { label: "Carnes", value: "carnes" },
  { label: "Pescados", value: "pescados" },
  { label: "Postres", value: "postres" },
  { label: "Bebidas", value: "bebidas" },
];

export default function ComidasPage() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [categoria, setCategoria] = useState("todas");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("publicaciones")
        .select("id, contenido, multimedia_url, categoria, perfiles:usuario_id(nombre, foto_perfil)")
        .eq("visibilidad", "publica");

      if (categoria !== "todas") {
        query = query.eq("categoria", categoria);
      }

      const { data, error } = await query.order("fecha_creacion", { ascending: false });

      if (!error) {
        setPublicaciones(data);
      }
    };

    fetchData();
  }, [categoria]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">🍽️ Explorar comidas</h1>
        <Button
          label="Volver al dashboard"
          icon="pi pi-arrow-left"
          className="p-button-sm p-button-text text-blue-600"
          onClick={() => router.push("/dashboard")}
        />
      </div>

      <Dropdown
        value={categoria}
        options={categorias}
        onChange={(e) => setCategoria(e.value)}
        placeholder="Filtrar por categoría"
        className="w-full max-w-xs mb-8"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {publicaciones.map((pub) => (
          <div
            key={pub.id}
            className="relative group overflow-hidden rounded-xl border bg-white shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          >
            {pub.multimedia_url?.endsWith(".mp4") ? (
              <video
                src={pub.multimedia_url}
                className="w-full h-full object-cover max-h-[250px]"
                muted
                autoPlay
                loop
              />
            ) : (
              <img
                src={pub.multimedia_url}
                alt="Post"
                className="w-full h-full object-cover max-h-[250px] group-hover:scale-105 transition-transform"
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 flex items-center gap-2">
              <Avatar image={pub.perfiles?.foto_perfil} size="small" shape="circle" />
              <span className="truncate">{pub.perfiles?.nombre}</span>
              <span className="ml-auto italic capitalize">{pub.categoria}</span>
            </div>
          </div>
        ))}
      </div>

      {publicaciones.length === 0 && (
        <p className="text-center text-gray-500 mt-10">No hay publicaciones disponibles para esta categoría.</p>
      )}
    </div>
  );
}
