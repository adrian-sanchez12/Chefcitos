"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";

export default function RecomendacionesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [amigos, setAmigos] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
        return;
      }

      const currentUserId = data.user.id;
      setUserId(currentUserId);

      const { data: seguidos } = await supabase
        .from("seguimientos")
        .select("seguido_id")
        .eq("seguidor_id", currentUserId);

      const seguidosIds = seguidos?.map((s) => s.seguido_id) || [];

      const { data: sugeridos } = await supabase
        .from("perfiles")
        .select("id, nombre, foto_perfil")
        .not("id", "in", `(${[...seguidosIds, currentUserId].join(",")})`)
        .limit(10);

      setAmigos(sugeridos || []);

      const { data: posts } = await supabase
        .from("publicaciones")
        .select("id, contenido, multimedia_url, categoria, perfiles:usuario_id(nombre, foto_perfil)")
        .eq("visibilidad", "publica")
        .order("fecha_creacion", { ascending: false })
        .limit(20);

      setPublicaciones(posts || []);
    };

    fetchUserAndData();
  }, [router]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recomendaciones</h1>
        <Button
          label="Volver al dashboard"
          icon="pi pi-arrow-left"
          className="p-button-text text-sm"
          onClick={() => router.push("/dashboard")}
        />
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Personas que podrías conocer</h2>
        {amigos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay recomendaciones de amigos por ahora.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {amigos.map((a) => (
              <div
                key={a.id}
                className="bg-white p-3 rounded-lg border shadow-sm text-center hover:shadow-md transition"
              >
                <Avatar
                  image={a.foto_perfil || "/user.jpg"}
                  shape="circle"
                  className="mx-auto mb-2"
                />
                <p className="font-medium text-sm text-gray-800 truncate">{a.nombre}</p>
                <Button
                  label="Ver perfil"
                  className="p-button-sm mt-2 text-xs"
                  onClick={() => router.push(`/usuarios/${a.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Publicaciones para ti</h2>
        {publicaciones.length === 0 ? (
          <p className="text-sm text-gray-500">No hay publicaciones públicas recientes.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {publicaciones.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/publicaciones/${p.id}`)}
                className="relative group overflow-hidden rounded-lg border hover:shadow-lg cursor-pointer"
              >
                {p.multimedia_url?.endsWith(".mp4") ? (
                  <video
                    src={p.multimedia_url}
                    className="w-full h-full object-cover max-h-[300px]"
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={p.multimedia_url}
                    alt="Post"
                    className="w-full h-full object-cover max-h-[300px] group-hover:scale-105 transition-transform"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 flex items-center gap-2">
                  <Avatar image={p.perfiles?.foto_perfil} size="small" shape="circle" />
                  <span>{p.perfiles?.nombre}</span>
                  <span className="ml-auto italic capitalize">{p.categoria}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
