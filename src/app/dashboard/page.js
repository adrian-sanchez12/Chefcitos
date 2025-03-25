"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [comentariosAbiertos, setComentariosAbiertos] = useState({});
  const [comentarios, setComentarios] = useState({});

  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);

      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setPerfil(perfilData);
      fetchPublicaciones(data.user.id);
      fetchSugerencias(data.user.id);
    };

    const fetchPublicaciones = async (userId) => {
      const { data } = await supabase
        .from("publicaciones")
        .select("*, perfiles:usuario_id(nombre, foto_perfil)")
        .eq("usuario_id", userId)
        .order("fecha_creacion", { ascending: false });

      setPublicaciones(data || []);
    };

    const fetchSugerencias = async (userId) => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, foto_perfil")
        .neq("id", userId)
        .limit(5);

      setSugerencias(data || []);
    };

    fetchUserAndProfile();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const toggleComentarios = (pubId) => {
    setComentariosAbiertos((prev) => ({
      ...prev,
      [pubId]: !prev[pubId],
    }));
  };

  const handleComentarioChange = (pubId, texto) => {
    setComentarios((prev) => ({
      ...prev,
      [pubId]: texto,
    }));
  };

  const enviarComentario = (pubId) => {
    const texto = comentarios[pubId];
    if (texto?.trim()) {
      alert(`Comentario enviado: ${texto}`);
      setComentarios((prev) => ({ ...prev, [pubId]: "" }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
      {/* Publicaciones + Perfil */}
      <div className="flex-1 max-w-5xl">

        {/* Lista de publicaciones */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tus publicaciones</h2>
          {publicaciones.length === 0 ? (
            <p className="text-gray-500">No has publicado nada todavía.</p>
          ) : (
            publicaciones.map((pub) => (
              <div
                key={pub.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    image={pub.perfiles?.foto_perfil}
                    icon={!pub.perfiles?.foto_perfil ? "pi pi-user" : undefined}
                    shape="circle"
                    size="large"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{pub.perfiles?.nombre}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(pub.fecha_creacion).toLocaleString()}
                    </span>
                  </div>
                  <span className="ml-auto text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full capitalize">
                    {pub.visibilidad}
                  </span>
                </div>

                {pub.categoria && (
                  <span className="text-xs text-gray-600 italic mb-2 block">
                    Categoría: {pub.categoria}
                  </span>
                )}

                <p className="text-gray-800 mb-3 whitespace-pre-line">{pub.contenido}</p>

                {pub.multimedia_url && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 mb-3">
                    {pub.multimedia_url.endsWith(".mp4") ? (
                      <video
                        src={pub.multimedia_url}
                        controls
                        className="w-full max-h-[300px]"
                      />
                    ) : (
                      <img
                        src={pub.multimedia_url}
                        alt="Multimedia"
                        className="w-full object-cover max-h-[300px]"
                      />
                    )}
                  </div>
                )}

                {/* Botones de interacción */}
                <div className="flex gap-4">
                  <Button
                    icon="pi pi-heart"
                    label="Me gusta"
                    className="p-button-sm p-button-text text-pink-500"
                  />
                  <Button
                    icon="pi pi-comment"
                    label="Comentar"
                    className="p-button-sm p-button-text text-gray-600"
                    onClick={() => toggleComentarios(pub.id)}
                  />
                </div>

                {/* Caja de comentario */}
                {comentariosAbiertos[pub.id] && (
                  <div className="mt-3">
                    <InputTextarea
                      rows={2}
                      value={comentarios[pub.id] || ""}
                      onChange={(e) =>
                        handleComentarioChange(pub.id, e.target.value)
                      }
                      placeholder="Escribe un comentario..."
                      className="w-full mb-2"
                    />
                    <Button
                      label="Enviar"
                      icon="pi pi-send"
                      className="p-button-sm bg-pink-500 border-pink-500 text-white"
                      onClick={() => enviarComentario(pub.id)}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sugerencias de personas */}
      <aside className="w-full md:w-[300px] space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Personas que quizás conozcas
          </h3>
          {sugerencias.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin sugerencias por ahora.</p>
          ) : (
            sugerencias.map((persona) => (
              <div key={persona.id} className="flex items-center gap-3 mb-3">
                <Avatar
                  image={persona.foto_perfil}
                  icon={!persona.foto_perfil ? "pi pi-user" : undefined}
                  size="large"
                  shape="circle"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{persona.nombre}</p>
                  <button
                    onClick={() => router.push(`/usuarios/${persona.id}`)}
                    className="text-xs text-pink-500 hover:underline"
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
