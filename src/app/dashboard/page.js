"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import ShareDialog from "../components/ShareDialog";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [comentariosAbiertos, setComentariosAbiertos] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [likes, setLikes] = useState({});
  const [comentariosPorPublicacion, setComentariosPorPublicacion] = useState({});
  const [mostrarDialogoCompartir, setMostrarDialogoCompartir] = useState(false);
const [publicacionACompartir, setPublicacionACompartir] = useState(null);
const [editando, setEditando] = useState({});
const [contenidoEditado, setContenidoEditado] = useState({});


  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
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
      // Obtener a quién sigue el usuario
      const { data: siguiendo, error: errorSeg } = await supabase
        .from("seguimientos")
        .select("seguido_id")
        .eq("seguidor_id", userId);
    
      if (errorSeg) {
        console.error("Error obteniendo seguimientos:", errorSeg.message);
        return;
      }
    
      // IDs: los que sigue + él mismo
      const ids = siguiendo?.map((s) => s.seguido_id) || [];
      ids.push(userId);
    
      const { data, error: errorPub } = await supabase
      .from("publicaciones")
      .select(`
        *,
        perfiles:usuario_id(nombre, foto_perfil),
        autor:autor_original_id(nombre, id)
      `)
      .in("usuario_id", ids)
      .order("fecha_creacion", { ascending: false });
    
    
      if (errorPub) {
        console.error("Error obteniendo publicaciones:", errorPub.message);
        return;
      }
    
      if (data) {
        setPublicaciones(data);
        for (const pub of data) {
          fetchLikes(pub.id, userId);
          fetchComentarios(pub.id);
        }
      }
    };
    

    const fetchLikes = async (pubId, userId) => {
      const { data } = await supabase
        .from("megusta")
        .select("*")
        .eq("publicacion_id", pubId);

      const liked = data.some((like) => like.usuario_id === userId);
      setLikes((prev) => ({
        ...prev,
        [pubId]: { liked, count: data.length },
      }));
    };

    const fetchComentarios = async (pubId) => {
      const { data } = await supabase
        .from("comentarios")
        .select("*, perfiles:usuario_id(nombre)")
        .eq("publicacion_id", pubId)
        .order("fecha", { ascending: true });

      setComentariosPorPublicacion((prev) => ({
        ...prev,
        [pubId]: data || [],
      }));
    };

    const fetchSugerencias = async (userId) => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, foto_perfil")
        .neq("id", userId)
        .limit(5);

      setSugerencias(data || []);
    };

    fetchUserAndData();
  }, [router]);
  const toggleComentarios = (pubId) => {
    setComentariosAbiertos((prev) => ({
      ...prev,
      [pubId]: !prev[pubId],
    }));
  };
  const toggleLike = async (pubId) => {
    const current = likes[pubId];
    if (current?.liked) {
      await supabase
        .from("megusta")
        .delete()
        .eq("usuario_id", user.id)
        .eq("publicacion_id", pubId);
      setLikes((prev) => ({
        ...prev,
        [pubId]: { liked: false, count: prev[pubId].count - 1 },
      }));
    } else {
      await supabase.from("megusta").insert([
        { usuario_id: user.id, publicacion_id: pubId },
      ]);
      setLikes((prev) => ({
        ...prev,
        [pubId]: { liked: true, count: prev[pubId]?.count + 1 || 1 },
      }));
    }
  };

  const abrirDialogoCompartir = (pub) => {
    setPublicacionACompartir(pub);
    setMostrarDialogoCompartir(true);
  };

  const compartirPublicacion = async () => {
    if (!publicacionACompartir || !user) return;
  
    const nuevaPublicacion = {
      usuario_id: user.id,
      contenido: publicacionACompartir.contenido,
      multimedia_url: publicacionACompartir.multimedia_url,
      visibilidad: "publica",
      fecha_creacion: new Date(),
      categoria: publicacionACompartir.categoria,
      autor_original_id: publicacionACompartir.usuario_id,
    };
  
    const { data, error } = await supabase
      .from("publicaciones")
      .insert([nuevaPublicacion])
      .select(`*, perfiles:usuario_id(nombre, foto_perfil), autor:autor_original_id(nombre, id)`)
      .single();
  
    if (!error && data) {
      setPublicaciones((prev) => [data, ...prev]);
      setMostrarDialogoCompartir(false);
      setPublicacionACompartir(null);
    }
  };
  
  
  const empezarEdicion = (pubId, contenidoActual) => {
    setEditando((prev) => ({ ...prev, [pubId]: true }));
    setContenidoEditado((prev) => ({ ...prev, [pubId]: contenidoActual }));
  };
  
  const cancelarEdicion = (pubId) => {
    setEditando((prev) => ({ ...prev, [pubId]: false }));
    setContenidoEditado((prev) => ({ ...prev, [pubId]: "" }));
  };
  
  const guardarEdicion = async (pubId) => {
    const nuevoContenido = contenidoEditado[pubId];
    const { error } = await supabase
      .from("publicaciones")
      .update({ contenido: nuevoContenido })
      .eq("id", pubId);
  
    if (!error) {
      setEditando((prev) => ({ ...prev, [pubId]: false }));
      setPublicaciones((prev) =>
        prev.map((pub) =>
          pub.id === pubId ? { ...pub, contenido: nuevoContenido } : pub
        )
      );
    }
  };
  
  
  const handleComentarioChange = (pubId, texto) => {
    setComentarios((prev) => ({
      ...prev,
      [pubId]: texto,
    }));
  };  

  const enviarComentario = async (pubId) => {
    const texto = comentarios[pubId];
    if (texto?.trim()) {
      const { error } = await supabase.from("comentarios").insert([
        {
          usuario_id: user.id,
          publicacion_id: pubId,
          contenido: texto,
          fecha: new Date(),
        },
      ]);

      if (!error) {
        setComentarios((prev) => ({ ...prev, [pubId]: "" }));
        const { data } = await supabase
          .from("comentarios")
          .select("*, perfiles:usuario_id(nombre)")
          .eq("publicacion_id", pubId)
          .order("fecha", { ascending: true });
        setComentariosPorPublicacion((prev) => ({ ...prev, [pubId]: data || [] }));
      }
    }
  };

  const eliminarPublicacion = async (pubId) => {
    const publicacion = publicaciones.find((p) => p.id === pubId);
    if (publicacion?.usuario_id !== user.id) {
      alert("No puedes eliminar esta publicación");
      return;
    }
  
    const confirmacion = confirm("¿Estás seguro de que deseas eliminar esta publicación?");
    if (!confirmacion) return;
  
    const { error } = await supabase.from("publicaciones").delete().eq("id", pubId);
    if (!error) {
      setPublicaciones((prev) => prev.filter((p) => p.id !== pubId));
    }
  };
  

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
      <div className="flex-1 max-w-5xl">
        {publicaciones.map((pub) => (
          <div key={pub.id} className="bg-white border rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                image={pub.perfiles?.foto_perfil}
                icon={!pub.perfiles?.foto_perfil ? "pi pi-user" : undefined}
                shape="circle"
                size="large"
              />
              <div>
                <p className="font-semibold text-gray-800">{pub.perfiles?.nombre}</p>
                {pub.autor_original_id && pub.autor && (
  <p className="text-xs text-gray-500 italic">
    Compartido de{" "}
    <span
      className="text-pink-500 hover:underline cursor-pointer"
      onClick={() => router.push(`/usuarios/${pub.autor.id}`)}
    >
      {pub.autor.nombre}
    </span>
  </p>
)}

                <span className="text-xs text-gray-500">{new Date(pub.fecha_creacion).toLocaleString()}</span>
              </div>
              <span className="ml-auto text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full capitalize">
                {pub.visibilidad}
              </span>
            </div>

            {pub.categoria && (
              <span className="text-xs text-gray-600 italic mb-2 block">Categoría: {pub.categoria}</span>
            )}

{editando[pub.id] ? (
  <>
    <InputTextarea
      rows={3}
      value={contenidoEditado[pub.id]}
      onChange={(e) =>
        setContenidoEditado((prev) => ({
          ...prev,
          [pub.id]: e.target.value,
        }))
      }
      className="w-full mb-2"
    />
    <div className="flex gap-2">
  <Button
    label="Guardar"
    icon="pi pi-check"
    className="p-button-sm bg-green-500 border-green-500 text-white"
    onClick={() => guardarEdicion(pub.id)}
  />
  <Button
    label="Cancelar"
    icon="pi pi-times"
    className="p-button-sm p-button-text text-gray-600"
    onClick={() => cancelarEdicion(pub.id)}
  />
</div>

  </>
) : (
  <p className="text-gray-800 mb-3 whitespace-pre-line">{pub.contenido}</p>
)}
            {pub.multimedia_url && (
              <div className="rounded-lg overflow-hidden border mb-3">
                {pub.multimedia_url.endsWith(".mp4") ? (
                  <video src={pub.multimedia_url} controls className="w-full max-h-[300px]" />
                ) : (
                  <img src={pub.multimedia_url} alt="Multimedia" className="w-full object-cover max-h-[300px]" />
                )}
              </div>
            )}

            <div className="flex gap-4 items-center">
              <Button
                icon="pi pi-heart"
                label={`${likes[pub.id]?.count || 0} Me gusta`}
                className={`p-button-sm p-button-text ${
                  likes[pub.id]?.liked ? "text-pink-500" : "text-gray-500"
                }`}
                onClick={() => toggleLike(pub.id)}
              />
             <Button
  icon="pi pi-comment"
  label="Comentar"
  className="p-button-sm p-button-text text-gray-600"
  onClick={() => toggleComentarios(pub.id)} 
/>

              <Button
                icon="pi pi-trash"
                className="p-button-sm p-button-text text-red-500"
                onClick={() => eliminarPublicacion(pub.id)}
                label="Eliminar"
              />
              {pub.usuario_id === user.id && (
  <Button
    icon="pi pi-pencil"
    label="Editar"
    className="p-button-sm p-button-text text-yellow-600"
    onClick={() => empezarEdicion(pub.id, pub.contenido)}
  />
)}
              <Button
                icon="pi pi-share-alt"
                label="Compartir"
                className="p-button-sm p-button-text text-blue-500"
                onClick={() => abrirDialogoCompartir(pub)}
              />

            </div>

            {comentariosAbiertos[pub.id] && (
              <div className="mt-3 space-y-2">
                {comentariosPorPublicacion[pub.id]?.map((c) => (
                  <div key={c.id} className="border border-gray-200 p-2 rounded">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{c.perfiles?.nombre}</span>: {c.contenido}
                    </p>
                  </div>
                ))}
                <InputTextarea
                  rows={2}
                  value={comentarios[pub.id] || ""}
                  onChange={(e) => handleComentarioChange(pub.id, e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="w-full mb-2"
                />
                <Button
                  label="Enviar"
                  icon="pi pi-send"
                  iconPos="left"
                  className="p-button-sm bg-pink-500 border-pink-500 text-white"
                  onClick={() => enviarComentario(pub.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <ShareDialog
  visible={mostrarDialogoCompartir}
  onHide={() => setMostrarDialogoCompartir(false)}
  onConfirm={compartirPublicacion}
/>


      {/* Sugerencias */ }
      <aside className="w-full md:w-[300px] space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Personas que quizás conozcas</h3>
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
