"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Avatar } from "primereact/avatar";

export default function MessagesPage() {
  const [conversaciones, setConversaciones] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDatos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setUserId(user.id);

      const { data: convs } = await supabase
        .from("conversaciones")
        .select("id, usuario1(id, nombre, foto_perfil), usuario2(id, nombre, foto_perfil)")
        .or(`usuario1.eq.${user.id},usuario2.eq.${user.id}`);

      setConversaciones(convs || []);

      const { data: seguidos } = await supabase
        .from("seguimientos")
        .select("seguido_id, perfiles:seguido_id(nombre, foto_perfil)")
        .eq("seguidor_id", user.id);

      setAmigos(seguidos || []);
    };

    fetchDatos();
  }, []);

  const iniciarConversacion = async (amigoId) => {
    if (!userId || !amigoId) return;

    const [u1, u2] = [userId, amigoId].sort();

    const { data: existente } = await supabase
      .from("conversaciones")
      .select("id")
      .eq("usuario1", u1)
      .eq("usuario2", u2)
      .maybeSingle();

    if (existente?.id) {
      router.push(`/messages/${existente.id}`);
      return;
    }

    const { data, error } = await supabase
      .from("conversaciones")
      .insert([{ usuario1: u1, usuario2: u2 }])
      .select()
      .single();

    if (!error && data?.id) {
      router.push(`/messages/${data.id}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pink-600">Tus mensajes</h1>
        <Button
          icon="pi pi-arrow-left"
          label="Volver al Dashboard"
          onClick={() => router.push("/dashboard")}
          className="bg-gray-200 text-gray-800 border-none px-4 py-2 rounded-md hover:bg-gray-300 transition"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Iniciar conversación</h2>
        <div className="flex flex-wrap gap-4">
          {amigos.map((a) => (
            <div
              key={a.seguido_id}
              className="flex items-center gap-3 bg-white border p-3 rounded-lg shadow-sm w-full sm:w-auto sm:min-w-[250px]"
            >
              <Avatar image={a.perfiles.foto_perfil || "/user.jpg"} shape="circle" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{a.perfiles.nombre}</p>
              </div>
              <Button
                icon="pi pi-comment"
                className="p-button-rounded p-button-sm text-pink-600 border-pink-600"
                onClick={() => iniciarConversacion(a.seguido_id)}
                tooltip="Iniciar conversación"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Conversaciones activas</h2>
        {conversaciones.length === 0 ? (
          <p className="text-gray-500">No hay conversaciones aún.</p>
        ) : (
          <ul className="space-y-3">
            {conversaciones.map((c) => {
              const user = c.usuario1?.id === userId ? c.usuario2 : c.usuario1;
              return (
                <li
                  key={c.id}
                  onClick={() => router.push(`/messages/${c.id}`)}
                  className="flex items-center gap-3 p-4 border rounded-lg bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
                >
                  <Avatar image={user?.foto_perfil || "/user.jpg"} shape="circle" />
                  <div>
                    <p className="font-semibold text-gray-800">{user?.nombre}</p>
                    <p className="text-xs text-gray-500">Haz clic para continuar la conversación</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
