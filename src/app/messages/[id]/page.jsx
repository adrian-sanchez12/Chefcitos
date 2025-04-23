"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";

export default function ChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [contenido, setContenido] = useState("");
  const [receptorId, setReceptorId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (!id) return;

    const cargarMensajes = async () => {
      const { data: conv } = await supabase
        .from("conversaciones")
        .select("usuario1, usuario2")
        .eq("id", id)
        .single();

      if (conv) {
        const receptor = conv.usuario1 === userId ? conv.usuario2 : conv.usuario1;
        setReceptorId(receptor);
      }

      const { data: mensajesData, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("conversacion_id", id)
        .order("fecha_envio", { ascending: true });

      if (!error) setMensajes(mensajesData);
    };

    cargarMensajes();

    const canal = supabase
      .channel(`mensajes-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${id}`,
        },
        (payload) => {
          setMensajes((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async () => {
    if (!contenido.trim() || !receptorId || !userId) return;

    const nuevoMensaje = {
      conversacion_id: id,
      emisor_id: userId,
      receptor_id: receptorId,
      contenido,
    };

    setLoading(true);

    const { data, error } = await supabase
      .from("mensajes")
      .insert([nuevoMensaje])
      .select()
      .single();

    if (error) {
      console.error(" Error al enviar mensaje:", error);
    } else {
      setMensajes((prev) => [...prev, data]);
      setContenido("");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between p-4 bg-white shadow-md border-b">
        <Button
          icon="pi pi-arrow-left"
          rounded
          severity="secondary"
          onClick={() => router.back()}
          className="p-button-sm"
        />
        <h1 className="text-xl font-bold text-gray-800">Chat privado</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`max-w-[70%] px-4 py-3 rounded-2xl shadow ${
              m.emisor_id === userId
                ? "bg-pink-100 ml-auto text-right"
                : "bg-white text-left border"
            }`}
          >
            <p className="text-sm text-gray-800">{m.contenido}</p>
            <span className="text-xs text-gray-400 block mt-1">
              {new Date(m.fecha_envio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="border-t bg-white px-4 py-3 flex items-end gap-2">
        <InputTextarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          autoResize
          rows={1}
          placeholder="Escribe un mensaje..."
          className="w-full border-gray-300"
        />
        <Button
          icon="pi pi-send"
          onClick={enviarMensaje}
          disabled={loading || !contenido.trim()}
          className="bg-pink-500 border-pink-500 text-white"
          rounded
        />
      </div>
    </div>
  );
}
