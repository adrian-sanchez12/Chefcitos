"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Avatar } from "primereact/avatar";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchLikedPosts = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        router.push("/login");
        return;
      }

      setUser(userData.user);

      const { data: likes } = await supabase
        .from("megusta")
        .select("publicacion_id")
        .eq("usuario_id", userData.user.id);

      const pubIds = likes?.map((like) => like.publicacion_id) || [];

      if (pubIds.length === 0) {
        setPublicaciones([]);
        return;
      }

      const { data: publicaciones } = await supabase
        .from("publicaciones")
        .select("*, perfiles:usuario_id(nombre, foto_perfil)")
        .in("id", pubIds)
        .order("fecha_creacion", { ascending: false });

      setPublicaciones(publicaciones || []);
    };

    fetchLikedPosts();
  }, [router]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Publicaciones que te gustaron</h1>
        <Button
          icon="pi pi-arrow-left"
          label="Volver al Dashboard"
          className="p-button-outlined p-button-sm"
          onClick={() => router.push("/dashboard")}
        />
      </div>

      {publicaciones.length === 0 ? (
        <p className="text-gray-500">No has dado me gusta a ninguna publicación aún.</p>
      ) : (
        publicaciones.map((pub) => (
          <div key={pub.id} className="bg-white border p-5 rounded-lg mb-6 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                image={pub.perfiles?.foto_perfil}
                icon={!pub.perfiles?.foto_perfil ? "pi pi-user" : undefined}
                shape="circle"
                size="large"
              />
              <div>
                <p className="font-semibold text-gray-800">{pub.perfiles?.nombre}</p>
                <p className="text-xs text-gray-500">
                  {new Date(pub.fecha_creacion).toLocaleString()}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-3 whitespace-pre-wrap">{pub.contenido}</p>

            {pub.multimedia_url && (
              <div className="rounded-lg overflow-hidden border mb-3">
                {pub.multimedia_url.endsWith(".mp4") ? (
                  <video
                    src={pub.multimedia_url}
                    controls
                    className="w-full max-h-[300px] rounded"
                  />
                ) : (
                  <img
                    src={pub.multimedia_url}
                    alt="Multimedia"
                    className="w-full object-cover max-h-[300px] rounded"
                  />
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
