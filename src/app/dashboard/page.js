"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import ShareDialog from "../components/ShareDialog";
import { Toast } from "primereact/toast";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";


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
const [mostrarDialogoReporte, setMostrarDialogoReporte] = useState(false);
const [publicacionAReportar, setPublicacionAReportar] = useState(null);
const [razonReporte, setRazonReporte] = useState("");

  const router = useRouter();
  const toast = useRef(null);


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
      // Seguimientos
      const { data: siguiendo, error: errorSeg } = await supabase
        .from("seguimientos")
        .select("seguido_id")
        .eq("seguidor_id", userId);
    
      if (errorSeg) {
        console.error("Error obteniendo seguimientos:", errorSeg.message);
        return;
      }
    
      const seguidos = siguiendo?.map((s) => s.seguido_id) || [];
    
      // Lista completa de posibles publicaciones a mostrar
      const ids = [...seguidos, userId];
    
      // Obtener lista de bloqueados y quienes bloquearon al usuario actual
      const { data: bloqueados } = await supabase
        .from("bloqueos")
        .select("bloqueado_id")
        .eq("bloqueador_id", userId);
    
      const { data: bloqueadoPor } = await supabase
        .from("bloqueos")
        .select("bloqueador_id")
        .eq("bloqueado_id", userId);
    
      const idsBloqueados = bloqueados?.map((b) => b.bloqueado_id) || [];
      const idsBloqueadoPor = bloqueadoPor?.map((b) => b.bloqueador_id) || [];
    
      // Excluir bloqueados y bloqueadores de la lista
      const idsFiltrados = ids.filter(
        (id) => !idsBloqueados.includes(id) && !idsBloqueadoPor.includes(id)
      );
    
      const { data, error: errorPub } = await supabase
        .from("publicaciones")
        .select(`
          *,
          perfiles:usuario_id(nombre, foto_perfil),
          autor:autor_original_id(nombre, id)
        `)
        .in("usuario_id", idsFiltrados)
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

  const abrirDialogoReporte = (pub) => {
    setPublicacionAReportar(pub);
    setRazonReporte("");
    setMostrarDialogoReporte(true);
  };
  
  const enviarReporte = async () => {
    if (!razonReporte.trim()) return alert("Debes ingresar una razón para reportar.");
  
    const { error } = await supabase.from("reportes_publicaciones").insert([
      {
        usuario_id: user.id,
        publicacion_id: publicacionAReportar.id,
        razon: razonReporte,
      },
    ]);    
  
    if (!error) {
      alert("Reporte enviado con éxito. Gracias por ayudarnos a mejorar la comunidad.");
      setMostrarDialogoReporte(false);
      setPublicacionAReportar(null);
      setRazonReporte("");
    } else {
      console.error("Error al reportar publicación:", error);
    }
  };
  
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
      toast.current?.show({
        severity: "warn",
        summary: "Acción no permitida",
        detail: "No puedes eliminar esta publicación",
        life: 3000,
      });
      return;
    }
  
    confirmDialog({
      message: "¿Estás seguro de que deseas eliminar esta publicación?",
      header: "Confirmar eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      rejectLabel: "No",
      acceptClassName: "p-button-danger",
      accept: async () => {
        const { error } = await supabase.from("publicaciones").delete().eq("id", pubId);
        if (!error) {
          setPublicaciones((prev) => prev.filter((p) => p.id !== pubId));
          toast.current?.show({
            severity: "success",
            summary: "Eliminada",
            detail: "La publicación fue eliminada",
            life: 3000,
          });
        } else {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.message,
            life: 3000,
          });
        }
      },
    });
  };  
  

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
        <Toast ref={toast} />
        <ConfirmDialog />
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
  className="bg-green-500 border-green-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-green-600"
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

<Button
  icon="pi pi-flag"
  label="Reportar"
  className="p-button-sm p-button-text text-red-500"
  onClick={() => abrirDialogoReporte(pub)}
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
  onClick={() => enviarComentario(pub.id)}
  disabled={!comentarios[pub.id]?.trim()}
  className={`w-full md:w-auto px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
    comentarios[pub.id]?.trim()
      ? "bg-pink-500 text-white hover:bg-pink-600 border-pink-500"
      : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
  }`}
  tooltip="Escribe algo para comentar"
  tooltipOptions={{ position: "top" }}
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
{mostrarDialogoReporte && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Reportar publicación</h3>
      <p className="text-sm text-gray-600 mb-2">
        ¿Por qué deseas reportar esta publicación?
      </p>
      <InputTextarea
        rows={3}
        value={razonReporte}
        onChange={(e) => setRazonReporte(e.target.value)}
        className="w-full mb-4"
        placeholder="Describe la razón del reporte..."
      />
      <div className="flex justify-end gap-2">
        <Button
          label="Cancelar"
          onClick={() => setMostrarDialogoReporte(false)}
          className="p-button-text"
        />
        <Button
  label="Enviar"
  icon="pi pi-send"
  onClick={enviarReporte}
  className="w-full md:w-auto px-4 py-2 text-sm font-medium rounded-md bg-red-500 border-red-500 text-white hover:bg-red-600 transition-all duration-200"
/>

      </div>
    </div>
  </div>
)}


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
