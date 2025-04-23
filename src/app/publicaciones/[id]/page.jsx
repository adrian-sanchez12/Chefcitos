"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Avatar } from "primereact/avatar";

export default function PublicacionDetalle() {
  const { id } = useParams();
  const router = useRouter();
  const [publicacion, setPublicacion] = useState(null);

  useEffect(() => {
    const fetchPublicacion = async () => {
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*, perfiles:usuario_id(nombre, foto_perfil), autor:autor_original_id(nombre, id)")
        .eq("id", id)
        .single();

      if (!error) {
        setPublicacion(data);
      } else {
        console.error("Error al obtener publicación:", error.message);
        router.push("/404");
      }
    };

    if (id) fetchPublicacion();
  }, [id, router]);

  if (!publicacion) return <p className="p-6">Cargando publicación...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            image={publicacion.perfiles?.foto_perfil}
            icon={!publicacion.perfiles?.foto_perfil ? "pi pi-user" : undefined}
            shape="circle"
            size="large"
          />
          <div>
            <p className="font-semibold text-gray-800">{publicacion.perfiles?.nombre}</p>
            {publicacion.autor_original_id && publicacion.autor && (
              <p className="text-xs text-gray-500 italic">
                Compartido de{" "}
                <span
                  className="text-pink-500 hover:underline cursor-pointer"
                  onClick={() => router.push(`/usuarios/${publicacion.autor.id}`)}
                >
                  {publicacion.autor.nombre}
                </span>
              </p>
            )}
            <span className="text-xs text-gray-500">{new Date(publicacion.fecha_creacion).toLocaleString()}</span>
          </div>
          <span className="ml-auto text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full capitalize">
            {publicacion.visibilidad}
          </span>
        </div>

        {publicacion.categoria && (
          <span className="text-xs text-gray-600 italic mb-2 block">
            Categoría: {publicacion.categoria}
          </span>
        )}

        <p className="text-gray-800 mb-3 whitespace-pre-line">{publicacion.contenido}</p>

        {publicacion.multimedia_url && (
          <div className="rounded-lg overflow-hidden border mb-3">
            {publicacion.multimedia_url.endsWith(".mp4") ? (
              <video src={publicacion.multimedia_url} controls className="w-full max-h-[300px]" />
            ) : (
              <img
                src={publicacion.multimedia_url}
                alt="Multimedia"
                className="w-full object-cover max-h-[300px]"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
