"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";

export default function CreatePost({ onPostCreated }) {
  const [contenido, setContenido] = useState("");
  const [visibilidad, setVisibilidad] = useState("publica");
  const [categoria, setCategoria] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const toast = useRef(null);

  const categorias = [
    { label: "Pasteles", value: "pasteles" },
    { label: "Pastas", value: "pastas" },
    { label: "Ensaladas", value: "ensaladas" },
  ];

  const handleUpload = ({ files }) => {
    const file = files[0];
    setArchivo(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
    if (!userId) return;

    let url = null;
    if (archivo) {
      const fileName = `${userId}/${Date.now()}-${archivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("multimedia")
        .upload(fileName, archivo);

      if (uploadError) {
        toast.current.show({
          severity: "error",
          summary: "Error al subir archivo",
          detail: uploadError.message,
        });
        return;
      }

      const { data } = supabase.storage.from("multimedia").getPublicUrl(fileName);
      url = data.publicUrl;
    }

    const { error } = await supabase.from("publicaciones").insert([
      {
        usuario_id: userId,
        contenido,
        multimedia_url: url,
        visibilidad,
        fecha_creacion: new Date(),
        categoria,
      },
    ]);

    if (error) {
      toast.current.show({ severity: "error", summary: "Error", detail: error.message });
    } else {
      toast.current.show({ severity: "success", summary: "Publicado correctamente" });
      setContenido("");
      setArchivo(null);
      setPreviewUrl(null);
      setCategoria("");
      onPostCreated?.();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <Toast ref={toast} />
      <h3 className="text-xl font-bold text-gray-800 mb-4">Crear publicación</h3>

      <InputTextarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={5}
        placeholder="¿Qué estás pensando?"
        className="w-full mb-4 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500"
      />

      {previewUrl && (
        <div className="mb-4">
          {archivo?.type.startsWith("image") ? (
            <img
              src={previewUrl}
              alt="Previsualización"
              className="max-h-64 rounded-lg border border-gray-300 mx-auto"
            />
          ) : archivo?.type.startsWith("video") ? (
            <video
              src={previewUrl}
              controls
              className="max-h-64 w-full rounded-lg border border-gray-300"
            />
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <FileUpload
          mode="basic"
          name="file"
          customUpload
          uploadHandler={handleUpload}
          auto
          accept="image/*,video/*"
          chooseLabel="Subir imagen o video"
          className="p-button-outlined p-button-sm text-sm"
        />

        <Dropdown
          value={visibilidad}
          options={[
            { label: "Pública", value: "publica" },
            { label: "Privada", value: "privada" },
          ]}
          onChange={(e) => setVisibilidad(e.value)}
          placeholder="Visibilidad"
          className="w-full text-sm"
        />

        <Dropdown
          value={categoria}
          options={categorias}
          onChange={(e) => setCategoria(e.value)}
          placeholder="Categoría"
          className="w-full text-sm"
        />
      </div>

      <Button
        label="Publicar"
        icon="pi pi-send"
        iconPos="right"
        onClick={handleSubmit}
        className="bg-pink-500 border-pink-500 text-white px-5 py-2 rounded-lg hover:bg-pink-600 transition text-sm w-full sm:w-auto"
      />
    </div>
  );
}
