"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { Avatar } from "primereact/avatar";
import { Dialog } from "primereact/dialog";

export default function BlockReport() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session?.user) return;
  
      const userId = session.user.id;
  
      // 1. Obtener bloqueos
      const { data: bloqueos } = await supabase
        .from("bloqueos")
        .select("bloqueado_id, perfiles_bloqueado:bloqueado_id(id, nombre, foto_perfil)")
        .eq("bloqueador_id", userId);
  
      setBlockedUsers(bloqueos || []);
      const bloqueadosIds = (bloqueos || []).map(b => b.bloqueado_id);
  
      const { data: amistades } = await supabase
        .from("amistades")
        .select("usuario_id1, usuario_id2, perfiles1:usuario_id1(id, nombre, foto_perfil), perfiles2:usuario_id2(id, nombre, foto_perfil)")
        .eq("estado", "aceptada");
  
      const amigosFiltrados = (amistades || []).map((a) => {
        const amigo = a.usuario_id1 === userId ? a.perfiles2 : a.perfiles1;
        return {
          id: a.usuario_id1 === userId ? a.usuario_id2 : a.usuario_id1,
          ...amigo,
        };
      }).filter(a => a.id !== userId && !bloqueadosIds.includes(a.id));
  
      setAmigos(amigosFiltrados);
    };
  
    fetchData();
  }, []);
  

  const handleUnblock = async (userId) => {
    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;
  
    const { error } = await supabase
      .from("bloqueos")
      .delete()
      .eq("bloqueado_id", userId)
      .eq("bloqueador_id", session.user.id);
  
    if (!error) {
      setBlockedUsers(prev => prev.filter(u => u.bloqueado_id !== userId));
      toast.current.show({ severity: "success", summary: "Desbloqueado correctamente" });
  
      const { data: amistad } = await supabase
        .from("amistades")
        .select("usuario_id1, usuario_id2")
        .or(`and(usuario_id1.eq.${session.user.id},usuario_id2.eq.${userId}),and(usuario_id1.eq.${userId},usuario_id2.eq.${session.user.id})`)
        .eq("estado", "aceptada")
        .maybeSingle();
  
      if (amistad) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("id, nombre, foto_perfil")
          .eq("id", userId)
          .single();
  
        if (perfil) {
          setAmigos(prev => [...prev, perfil]);
        }
      }
    } else {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    }
  };
  

  const handleBlock = async (userId) => {
    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;
  
    const insertData = {
      bloqueador_id: session.user.id,
      bloqueado_id: userId,
      fecha: new Date().toISOString(),
    };
  
    const { error } = await supabase.from("bloqueos").insert([insertData]);
  
    if (!error) {
      const amigo = amigos.find((a) => a.id === userId);
      toast.current.show({ severity: "success", summary: "Usuario bloqueado" });
  
      setBlockedUsers((prev) => [
        ...prev,
        {
          bloqueado_id: userId,
          perfiles_bloqueado: amigo,
        },
      ]);
  
      setAmigos((prev) => prev.filter((a) => a.id !== userId));
    } else {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    }
  };
  
  const handleReport = async () => {
    if (!reportReason.trim()) return;

    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;

    const { error } = await supabase.from("reportes").insert([
      {
        reportador_id: session.user.id,
        reportado_id: selectedUser.id,
        motivo: reportReason,
      },
    ]);

    if (!error) {
      toast.current.show({ severity: "success", summary: "Reporte enviado" });
      setShowReportDialog(false);
      setReportReason("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <Toast ref={toast} />
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Bloquear y reportar</h2>

        <h3 className="font-semibold text-lg mb-2">Usuarios bloqueados</h3>
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">No has bloqueado a ningún usuario.</p>
        ) : (
          blockedUsers.map((b) => {
            const perfil = b.perfiles_bloqueado;
            if (!perfil) return null;
            return (
              <div key={perfil.id} className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar image={perfil.foto_perfil} size="normal" shape="circle" />
                  <span>{perfil.nombre}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    label="Desbloquear"
                    icon="pi pi-user-minus"
                    severity="secondary"
                    className="px-4 py-3 text-sm font-medium rounded-md"
                    onClick={() => handleUnblock(perfil.id)}
                  />
                  <Button
                    label="Reportar"
                    icon="pi pi-flag"
                    severity="danger"
                    className="px-4 py-3 text-sm font-medium rounded-md"
                    onClick={() => {
                      setSelectedUser(perfil);
                      setShowReportDialog(true);
                    }}
                  />
                </div>
              </div>
            );
          })
        )}

        <h3 className="font-semibold text-lg mt-6 mb-2">Tus amigos</h3>
        {amigos.length === 0 ? (
          <p className="text-sm text-gray-500">No tienes amigos agregados.</p>
        ) : (
          amigos.map((a) => (
            <div key={a.id} className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar image={a.foto_perfil} size="normal" shape="circle" />
                <span>{a.nombre}</span>
              </div>
              <Button
                label="Bloquear"
                icon="pi pi-ban"
                className="px-4 py-3 text-sm font-medium rounded-md bg-red-500 text-white"
                onClick={() => handleBlock(a.id)}
              />
            </div>
          ))
        )}
      </Card>

      <Dialog
        header="Reportar usuario"
        visible={showReportDialog}
        onHide={() => setShowReportDialog(false)}
        style={{ width: "90%", maxWidth: "500px" }}
      >
        <p className="mb-2">Escribe el motivo del reporte:</p>
        <InputTextarea
          rows={4}
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder="Motivo del reporte..."
          className="w-full"
        />
        <div className="mt-4 flex justify-end">
          <Button
            label="Enviar"
            icon="pi pi-send"
            className="bg-pink-500 text-white px-4 py-3 text-sm font-medium rounded-md"
            onClick={handleReport}
          />
        </div>
      </Dialog>
    </div>
  );
}
