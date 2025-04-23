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
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    const fetchBlocked = async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session?.user) return;

      const { data } = await supabase
        .from("bloqueos")
        .select("*, perfiles_bloqueado:perfiles(*)")
        .eq("bloqueador_id", session.user.id);

      setBlockedUsers(data || []);
    };

    fetchBlocked();
  }, []);

  const handleUnblock = async (userId) => {
    const { error } = await supabase
      .from("bloqueos")
      .delete()
      .eq("bloqueado_id", userId);

    if (!error) {
      setBlockedUsers(blockedUsers.filter((u) => u.bloqueado_id !== userId));
      toast.current.show({ severity: "success", summary: "Desbloqueado correctamente" });
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

        {blockedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No has bloqueado a ningún usuario.</p>
        ) : (
          blockedUsers.map(({ perfiles_bloqueado }) => (
            <div key={perfiles_bloqueado.id} className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar image={perfiles_bloqueado.foto_perfil} size="normal" shape="circle" />
                <span>{perfiles_bloqueado.nombre}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  label="Desbloquear"
                  icon="pi pi-user-minus"
                  severity="secondary"
                  className="px-4 py-3 text-sm font-medium rounded-md transition-all duration-200"
                  onClick={() => handleUnblock(perfiles_bloqueado.id)}
                />
                <Button
                  label="Reportar"
                  icon="pi pi-flag"
                  severity="danger"
                  className="px-4 py-3 text-sm font-medium rounded-md transition-all duration-200"
                  onClick={() => {
                    setSelectedUser(perfiles_bloqueado);
                    setShowReportDialog(true);
                  }}
                />
              </div>
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
