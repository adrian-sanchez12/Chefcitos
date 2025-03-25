"use client";
import { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import UserSearchBar from "./UserSearchBar";
import CreatePost from "./CreatePost";

export default function Topbar() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-8 py-4 border-b bg-white shadow-sm">
        {/* Título */}
        <h1 className="text-xl font-bold text-gray-800">Inicio</h1>

        {/* Buscador */}
        <div className="flex-1 mx-10 max-w-md">
          <UserSearchBar />
        </div>

        {/* Botón de publicación */}
        <Button
          icon="pi pi-plus"
          label="Crear publicación"
          onClick={() => setVisible(true)}
          className="bg-pink-500 border-pink-500 text-white px-4 py-2 text-sm rounded-full hover:bg-pink-600 transition"
        />
      </div>

      {/* Dialog con CreatePost */}
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
