"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { OverlayPanel } from "primereact/overlaypanel";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";

export default function NotificationMenu({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const opRef = useRef(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("receptor_id", userId)
      .order("fecha", { ascending: false });

    if (!error && data) {
      setNotifications(data);
      setNewCount(data.filter((n) => !n.leida).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `receptor_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setNewCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const togglePanel = (e) => {
    opRef.current?.toggle(e);
  };

  const handleNotificationClick = async (notification) => {
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", notification.id);

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, leida: true } : n
      )
    );
    setNewCount((prev) => Math.max(0, prev - 1));

    if (notification.emisor_id) {
      router.push(`/usuarios/${notification.emisor_id}`);
    }
  };

  return (
    <>
      <div className="relative">
      <Button
  icon="pi pi-bell"
  className="!text-pink-500 !bg-white !border !border-pink-500 hover:!bg-pink-50 transition-all duration-200"
  onClick={togglePanel}
  aria-label="Notificaciones"
/>

        {newCount > 0 && (
          <span className="absolute -top-1 -right-1">
            <Badge value={newCount} severity="danger" />
          </span>
        )}
      </div>

      <OverlayPanel ref={opRef} dismissable className="w-80">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Notificaciones</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No hay notificaciones.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2 text-sm mb-1 rounded cursor-pointer transition-all ${
                  n.leida ? "bg-gray-100" : "bg-pink-100 font-medium"
                }`}
                onClick={() => handleNotificationClick(n)}
              >
                <p>{n.mensaje}</p>
                <p className="text-xs text-gray-500">
                  {new Date(n.fecha).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </OverlayPanel>
    </>
  );
}
