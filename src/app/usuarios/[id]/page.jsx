"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";

export default function PerfilPublico() {
  const { id } = useParams();
  const router = useRouter();
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [perfilPrivado, setPerfilPrivado] = useState(false);
  const [relacion, setRelacion] = useState({ amistad: null, siguiendo: false });
  const [stats, setStats] = useState({ seguidores: 0, seguidos: 0 });
  const [publicaciones, setPublicaciones] = useState([]);
  const [visibilidadPublicaciones, setVisibilidadPublicaciones] = useState("Todos");

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      setUsuarioActual(userData.user);

      const { data: visibilidad } = await supabase
        .from("configuracion_visibilidad")
        .select("perfil, publicaciones")
        .eq("usuario_id", id)
        .single();

      if (visibilidad?.perfil === "Solo yo" && userData.user.id !== id) {
        setPerfilPrivado(true);
        return;
      }

      setVisibilidadPublicaciones(visibilidad?.publicaciones || "Todos");

      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", id)
        .single();
      setPerfil(perfilData);

      const { data: amistad } = await supabase
        .from("amistades")
        .select("estado, usuario_id1, usuario_id2")
        .or(`and(usuario_id1.eq.${userData.user.id},usuario_id2.eq.${id}),and(usuario_id1.eq.${id},usuario_id2.eq.${userData.user.id})`)
        .maybeSingle();

      const { data: seguimiento } = await supabase
        .from("seguimientos")
        .select("*")
        .eq("seguidor_id", userData.user.id)
        .eq("seguido_id", id)
        .maybeSingle();

      const { count: totalSeguidores } = await supabase
        .from("seguimientos")
        .select("*", { count: "exact", head: true })
        .eq("seguido_id", id);

      const { count: totalSeguidos } = await supabase
        .from("seguimientos")
        .select("*", { count: "exact", head: true })
        .eq("seguidor_id", id);

      setRelacion({
        amistad: amistad || null,
        siguiendo: !!seguimiento,
      });

      setStats({
        seguidores: totalSeguidores || 0,
        seguidos: totalSeguidos || 0,
      });

      // Validar visibilidad de publicaciones
      const puedeVerPublicaciones =
        visibilidad?.publicaciones === "Todos" ||
        (visibilidad?.publicaciones === "Amigos" && amistad?.estado === "aceptada") ||
        userData.user.id === id;

      if (!puedeVerPublicaciones) return;

      const { data: pubs } = await supabase
        .from("publicaciones")
        .select("*, perfiles:usuario_id(nombre, foto_perfil)")
        .eq("usuario_id", id)
        .order("fecha_creacion", { ascending: false });

      setPublicaciones(pubs || []);
    };

    fetchData();
  }, [id]);

  const esMismoUsuario = usuarioActual?.id === perfil?.id;

  const enviarSolicitud = async () => {
    await supabase.from("amistades").insert([{
      usuario_id1: usuarioActual.id,
      usuario_id2: id,
      estado: "pendiente",
      fecha_solicitud: new Date(),
    }]);
    setRelacion((r) => ({ ...r, amistad: { estado: "pendiente", usuario_id1: usuarioActual.id } }));
  };

  const aceptarSolicitud = async () => {
    await supabase
      .from("amistades")
      .update({ estado: "aceptada" })
      .eq("usuario_id1", id)
      .eq("usuario_id2", usuarioActual.id);
    setRelacion((r) => ({ ...r, amistad: { estado: "aceptada" } }));
  };

  const seguirUsuario = async () => {
    await supabase.from("seguimientos").insert([{
      seguidor_id: usuarioActual.id,
      seguido_id: id,
      fecha_seguimiento: new Date(),
    }]);
    setRelacion((r) => ({ ...r, siguiendo: true }));
    setStats((prev) => ({ ...prev, seguidores: prev.seguidores + 1 }));
  };

  const dejarDeSeguir = async () => {
    await supabase
      .from("seguimientos")
      .delete()
      .eq("seguidor_id", usuarioActual.id)
      .eq("seguido_id", id);
    setRelacion((r) => ({ ...r, siguiendo: false }));
    setStats((prev) => ({ ...prev, seguidores: prev.seguidores - 1 }));
  };

  if (perfilPrivado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Este perfil es privado</h2>
          <p className="text-gray-600 text-sm mb-4">El usuario ha configurado su perfil para que no sea visible públicamente.</p>
          <Button label="Volver al dashboard" icon="pi pi-arrow-left" className="bg-pink-500 text-white px-4 py-2 rounded-md" onClick={() => router.push("/dashboard")} />
        </div>
      </div>
    );
  }

  if (!perfil) return <p className="p-6">Cargando perfil...</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-6 mb-6">
          <Avatar image={perfil.foto_perfil} icon={!perfil.foto_perfil ? "pi pi-user" : undefined} size="xlarge" shape="circle" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{perfil.nombre}</h2>
            {perfil.ubicacion && <p className="text-gray-500 text-sm">{perfil.ubicacion}</p>}
            <div className="flex gap-4 mt-2 text-sm text-gray-700">
              <span><strong>{stats.seguidores}</strong> seguidores</span>
              <span><strong>{stats.seguidos}</strong> seguidos</span>
            </div>
          </div>
        </div>

        {perfil.biografia && (
          <p className="mb-6 text-gray-700 whitespace-pre-line border-t pt-4">{perfil.biografia}</p>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <Button label="Volver al dashboard" icon="pi pi-arrow-left" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-gray-200 text-gray-800 border-none" onClick={() => router.push("/dashboard")} />
          {!esMismoUsuario && (
            <>
              {relacion.amistad?.estado === "aceptada" && (
                <Button label="Eliminar amistad" icon="pi pi-user-minus" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-red-500 text-white border-none"
                  onClick={async () => {
                    await supabase.from("amistades").delete().or(`and(usuario_id1.eq.${usuarioActual.id},usuario_id2.eq.${id}),and(usuario_id1.eq.${id},usuario_id2.eq.${usuarioActual.id})`);
                    setRelacion((r) => ({ ...r, amistad: null }));
                  }}
                />
              )}
              {relacion.amistad?.estado === "pendiente" && relacion.amistad.usuario_id1 !== usuarioActual.id && (
                <Button label="Aceptar solicitud" icon="pi pi-check-circle" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-green-500 text-white border-none" onClick={aceptarSolicitud} />
              )}
              {!relacion.amistad ? (
                <Button label="Enviar solicitud de amistad" icon="pi pi-user-plus" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-blue-500 text-white border-none" onClick={enviarSolicitud} />
              ) : (
                relacion.amistad.estado === "pendiente" && relacion.amistad.usuario_id1 === usuarioActual.id && (
                  <Button label="Solicitud enviada" icon="pi pi-clock" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-gray-300 text-gray-600 border-none" disabled />
                )
              )}
              {relacion.siguiendo ? (
                <Button label="Dejar de seguir" icon="pi pi-user-minus" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-gray-300 text-gray-700 border-none" onClick={dejarDeSeguir} />
              ) : (
                <Button label="Seguir" icon="pi pi-user-plus" className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-pink-500 text-white border-none" onClick={seguirUsuario} />
              )}
            </>
          )}
        </div>

        {publicaciones.length > 0 && (
          <div className="mt-10 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Publicaciones</h3>
            {publicaciones.map((pub) => (
              <div key={pub.id} className="bg-white border rounded-md p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar image={pub.perfiles?.foto_perfil} icon={!pub.perfiles?.foto_perfil ? "pi pi-user" : undefined} size="large" shape="circle" />
                  <div>
                    <p className="font-semibold">{pub.perfiles?.nombre}</p>
                    <p className="text-xs text-gray-500">{new Date(pub.fecha_creacion).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-gray-800 whitespace-pre-line mb-2">{pub.contenido}</p>
                {pub.multimedia_url && (
                  <div className="rounded overflow-hidden border">
                    {pub.multimedia_url.endsWith(".mp4") ? (
                      <video src={pub.multimedia_url} controls className="w-full max-h-[300px]" />
                    ) : (
                      <img src={pub.multimedia_url} alt="Multimedia" className="w-full object-cover max-h-[300px]" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
