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
  const [relacion, setRelacion] = useState({ amistad: null, siguiendo: false });
  const [stats, setStats] = useState({ seguidores: 0, seguidos: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      setUsuarioActual(userData.user);

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
    };

    fetchData();
  }, [id]);

  const enviarSolicitud = async () => {
    const { error } = await supabase.from("amistades").insert([
      {
        usuario_id1: usuarioActual.id,
        usuario_id2: id,
        estado: "pendiente",
        fecha_solicitud: new Date(),
      },
    ]);
    if (!error) {
      setRelacion((r) => ({ ...r, amistad: { estado: "pendiente", usuario_id1: usuarioActual.id } }));
    }
  };

  const aceptarSolicitud = async () => {
    const { error } = await supabase
      .from("amistades")
      .update({ estado: "aceptada" })
      .eq("usuario_id1", id)
      .eq("usuario_id2", usuarioActual.id);

    if (!error) {
      setRelacion((r) => ({ ...r, amistad: { estado: "aceptada" } }));
    }
  };

  const seguirUsuario = async () => {
    await supabase.from("seguimientos").insert([
      {
        seguidor_id: usuarioActual.id,
        seguido_id: id,
        fecha_seguimiento: new Date(),
      },
    ]);
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

  if (!perfil) return <p className="p-6">Cargando perfil...</p>;

  const esMismoUsuario = usuarioActual?.id === perfil.id;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-6 mb-6">
          <Avatar
            image={perfil.foto_perfil}
            icon={!perfil.foto_perfil ? "pi pi-user" : undefined}
            size="xlarge"
            shape="circle"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{perfil.nombre}</h2>
            {perfil.ubicacion && (
              <p className="text-gray-500 text-sm">{perfil.ubicacion}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-gray-700">
              <span><strong>{stats.seguidores}</strong> seguidores</span>
              <span><strong>{stats.seguidos}</strong> seguidos</span>
            </div>
          </div>
        </div>

        {perfil.biografia && (
          <p className="mb-6 text-gray-700 whitespace-pre-line border-t pt-4">{perfil.biografia}</p>
        )}

        <div className="flex flex-wrap gap-3">
  <Button
    label="Volver al dashboard"
    icon="pi pi-arrow-left"
    className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-gray-200 text-gray-800 border-none"
    onClick={() => router.push("/dashboard")}
  />

  {!esMismoUsuario && (
    <>
      {relacion.amistad?.estado === "aceptada" && (
  <Button
    label="Eliminar amistad"
    icon="pi pi-user-minus"
    className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-red-500 text-white border-none"
    onClick={async () => {
      const { error } = await supabase
        .from("amistades")
        .delete()
        .or(`and(usuario_id1.eq.${usuarioActual.id},usuario_id2.eq.${id}),and(usuario_id1.eq.${id},usuario_id2.eq.${usuarioActual.id})`);
      if (!error) setRelacion((r) => ({ ...r, amistad: null }));
    }}
  />
)}


      {relacion.amistad?.estado === "pendiente" &&
        relacion.amistad.usuario_id1 !== usuarioActual.id && (
          <Button
            label="Aceptar solicitud"
            icon="pi pi-check-circle"
            className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-green-500 text-white border-none"
            onClick={aceptarSolicitud}
          />
        )}

{!relacion.amistad ? (
  <Button
    label="Enviar solicitud de amistad"
    icon="pi pi-user-plus"
    className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-blue-500 text-white border-none"
    onClick={enviarSolicitud}
  />
) : (
  relacion.amistad.estado === "pendiente" &&
  relacion.amistad.usuario_id1 === usuarioActual.id && (
    <Button
      label="Solicitud enviada"
      icon="pi pi-clock"
      className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-gray-300 text-gray-600 border-none"
      disabled
    />
  )
)}

      {relacion.siguiendo ? (
        <Button
          label="Dejar de seguir"
          icon="pi pi-user-minus"
          className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-gray-300 text-gray-700 border-none"
          onClick={dejarDeSeguir}
        />
      ) : (
        <Button
          label="Seguir"
          icon="pi pi-user-plus"
          className="w-full md:w-auto px-4 py-3 text-sm font-medium rounded-md bg-pink-500 text-white border-none"
          onClick={seguirUsuario}
        />
      )}
    </>
  )}
</div>

      </div>
    </div>
  );
}
