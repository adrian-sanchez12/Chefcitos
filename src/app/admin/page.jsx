"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";

export default function AdminPage() {
  const router = useRouter();
  const toast = useRef(null);
  const [perfil, setPerfil] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [reportes, setReportes] = useState([]);

  useEffect(() => {
    const validarAcceso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!perfilData || perfilData.rol !== "admin") {
        router.push("/");
      } else {
        setPerfil(perfilData);
        fetchUsuarios();
        fetchPublicaciones();
        fetchReportes();
      }
    };
    validarAcceso();
  }, [router]);

  const fetchUsuarios = async () => {
    const { data } = await supabase.from("perfiles").select("id, nombre, foto_perfil, rol");
    setUsuarios(data || []);
  };

  const fetchPublicaciones = async () => {
    const { data } = await supabase
      .from("publicaciones")
      .select("id, contenido, fecha_creacion, usuario_id");
    setPublicaciones(data || []);
  };

  const fetchReportes = async () => {
    const { data } = await supabase
      .from("reportes_publicaciones")
      .select(`
        id,
        razon,
        fecha,
        usuario_id,
        publicacion_id,
        perfiles:usuario_id(nombre),
        publicaciones(id, contenido, usuario_id)
      `);
    setReportes(data || []);
  };

  const suspenderUsuario = async (userId) => {
    const { error } = await supabase
      .from("perfiles")
      .update({ rol: "suspendido" })
      .eq("id", userId);

    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 4000,
      });
    } else {
      toast.current?.show({
        severity: "success",
        summary: "Usuario suspendido",
        detail: "El usuario fue suspendido correctamente.",
        life: 3000,
      });
      fetchUsuarios();
    }
  };

  const reactivarUsuario = async (userId) => {
    const { error } = await supabase
      .from("perfiles")
      .update({ rol: "usuario" })
      .eq("id", userId);

    if (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 4000,
      });
    } else {
      toast.current?.show({
        severity: "success",
        summary: "Usuario reactivado",
        detail: "El usuario ha sido reactivado con éxito.",
        life: 3000,
      });
      fetchUsuarios();
    }
  };

  const eliminarPublicacion = async (pubId) => {
    const { error } = await supabase
      .from("publicaciones")
      .delete()
      .eq("id", pubId);

    if (!error) {
      fetchPublicaciones();
      fetchReportes();
    }
  };

  if (!perfil) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6 space-y-8">
      <Toast ref={toast} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-pink-600">Panel de Administración</h1>
        <Button
          label="Volver al Dashboard"
          icon="pi pi-arrow-left"
          className="p-button-outlined p-button-sm"
          onClick={() => router.push("/dashboard")}
        />
      </div>

      {/* Usuarios */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Usuarios</h2>
        <div className="space-y-3">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center gap-4 bg-white p-3 rounded shadow-sm">
              <Avatar image={u.foto_perfil} icon={!u.foto_perfil ? "pi pi-user" : undefined} />
              <p className="flex-1 font-semibold">{u.nombre}</p>
              <Tag
                value={u.rol}
                severity={
                  u.rol === "admin"
                    ? "info"
                    : u.rol === "suspendido"
                    ? "danger"
                    : "success"
                }
              />
              {u.rol !== "admin" &&
                (u.rol === "suspendido" ? (
                  <Button
                    label="Reactivar"
                    icon="pi pi-refresh"
                    severity="success"
                    onClick={() => reactivarUsuario(u.id)}
                    className="p-button-sm"
                  />
                ) : (
                  <Button
                    label="Suspender"
                    icon="pi pi-ban"
                    severity="danger"
                    onClick={() => suspenderUsuario(u.id)}
                    className="p-button-sm"
                  />
                ))}
            </div>
          ))}
        </div>
      </section>

      {/* Publicaciones */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Publicaciones</h2>
        <div className="space-y-3">
          {publicaciones.map((p) => (
            <div key={p.id} className="border p-4 rounded bg-white shadow-sm">
              <p className="text-sm text-gray-800">{p.contenido}</p>
              <div className="text-xs text-gray-400 mt-1">
                Publicación ID: {p.id} — Usuario: {p.usuario_id}
              </div>
              <Button
                label="Eliminar"
                icon="pi pi-trash"
                className="mt-2 p-button-sm"
                severity="danger"
                onClick={() => eliminarPublicacion(p.id)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Reportes */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Reportes de Publicaciones</h2>
        <div className="space-y-3">
          {reportes.map((r) => (
            <div key={r.id} className="border p-4 rounded bg-yellow-50 shadow-sm">
              <p className="text-sm mb-1">
                <strong>Reportado por:</strong> {r.perfiles?.nombre}
              </p>
              <p className="text-sm mb-1"><strong>Razón:</strong> {r.razon}</p>
              <p className="text-sm mb-2"><strong>Contenido:</strong> {r.publicaciones?.contenido}</p>
              <div className="flex gap-2">
                <Button
                  label="Eliminar publicación"
                  icon="pi pi-trash"
                  severity="danger"
                  className="p-button-sm"
                  onClick={() => eliminarPublicacion(r.publicacion_id)}
                />
                <Button
                  label="Suspender autor"
                  icon="pi pi-ban"
                  severity="warning"
                  className="p-button-sm"
                  onClick={() => suspenderUsuario(r.publicaciones.usuario_id)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
