'use client';
import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import UserSearchBar from "./UserSearchBar";
import CreatePost from "./CreatePost";
import NotificationMenu from "./NotificationMenu";
import { supabase } from "@/lib/supabaseClient";

export default function Topbar() {
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border border-pink-600 rounded-md bg-pink-500 shadow-md">
        <h1 className="text-xl font-bold text-white">Inicio</h1>

        <div className="flex-1 mx-6 max-w-md">
          <UserSearchBar />
        </div>

        <div className="flex items-center gap-3">
          <Button
            icon="pi pi-plus"
            label="Crear publicación"
            onClick={() => setVisible(true)}
            className="bg-white border border-pink-500 text-pink-500 font-semibold px-4 py-2 text-sm rounded-full hover:bg-pink-50 transition-all duration-200"
          />

          {user && <NotificationMenu userId={user.id} />}
        </div>
      </div>

      <Dialog
        header="Nueva publicación"
        visible={visible}
        style={{ width: "40rem" }}
        onHide={() => setVisible(false)}
        className="p-fluid"
      >
        <CreatePost onPostCreated={() => setVisible(false)} />
      </Dialog>
    </>
  );
}
