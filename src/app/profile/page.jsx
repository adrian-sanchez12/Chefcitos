"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Avatar } from "primereact/avatar";
import { FileUpload } from "primereact/fileupload";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";


export default function ProfilePage() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seguidores, setSeguidores] = useState([]);
  const [mostrarSeguidores, setMostrarSeguidores] = useState(false);
const [mostrarSeguidos, setMostrarSeguidos] = useState(false);

const [seguidos, setSeguidos] = useState([]);

  const toast = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData?.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", sessionData.user.id)
        .single();

      if (error) {
        toast.current.show({ severity: "error", summary: "Error", detail: error.message });
      } else {
        setPerfil(data);
        // Cargar seguidores (usuarios que me siguen)
const { data: seguidoresData } = await supabase
.from("seguimientos")
.select("seguidor_id, perfiles!seguimientos_seguidor_id_fkey(*)")
.eq("seguido_id", sessionData.user.id);

setSeguidores(seguidoresData?.map((s) => s.perfiles) || []);

// Cargar seguidos (usuarios que sigo)
const { data: seguidosData } = await supabase
.from("seguimientos")
.select("seguido_id, perfiles!seguimientos_seguido_id_fkey(*)")
.eq("seguidor_id", sessionData.user.id);

setSeguidos(seguidosData?.map((s) => s.perfiles) || []);

      }

      setLoading(false);
    };

    fetchProfile();
  }, [router]);
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("perfiles")
      .update({
        nombre: perfil.nombre,
        ubicacion: perfil.ubicacion,
        biografia: perfil.biografia,
      })
      .eq("id", perfil.id);
  
    if (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message,
      });
    } else {
      toast.current.show({
        severity: "success",
        summary: "Perfil actualizado",
      });
    }
  };
  

  const handleImageUpload = async ({ files }) => {
    const file = files[0];
    const fileName = `${perfil.id}/${file.name}`;
  
    const { error: uploadError } = await supabase
      .storage
      .from("fotos-perfil")
      .upload(fileName, file, { upsert: true });
  
    if (!uploadError) {
      const { data } = supabase.storage.from("fotos-perfil").getPublicUrl(fileName);
  
      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ foto_perfil: data.publicUrl })
        .eq("id", perfil.id);
  
      if (!updateError) {
        setPerfil({ ...perfil, foto_perfil: data.publicUrl });
        toast.current.show({
          severity: "success",
          summary: "Foto actualizada",
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error al guardar la foto",
          detail: updateError.message,
        });
      }
    } else {
      toast.current.show({
        severity: "error",
        summary: "Error al subir la imagen",
        detail: uploadError.message,
      });
    }
  };  
  

  if (loading || !perfil) return <p className="p-6 text-center">Cargando perfil...</p>;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-md">
        <Toast ref={toast} />
        <div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
  <Button
    icon="pi pi-cog"
    className="p-button-text text-gray-600 hover:text-pink-500"
    onClick={() => router.push("/settings")}
    tooltip="Configuración y Privacidad"
    tooltipOptions={{ position: "top" }}
    rounded
    text
  />
</div>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
  <div className="flex items-center gap-4">
    <Avatar
      image={perfil.foto_perfil}
      icon={!perfil.foto_perfil ? "pi pi-user" : undefined}
      size="xlarge"
      shape="circle"
      className="shadow-md"
    />
    <FileUpload
      mode="basic"
      name="demo[]"
      accept="image/*"
      customUpload
      uploadHandler={handleImageUpload}
      chooseLabel="Cambiar foto"
      auto
      className="w-full sm:w-auto"
    />
  </div>

  {/* Contadores de seguidores / siguiendo */}
  <div className="flex gap-6 mt-4 sm:mt-0">
    <button
      onClick={() => setMostrarSeguidores(true)}
      className="text-sm text-gray-700 hover:underline"
    >
      <strong>{seguidores.length}</strong> seguidores
    </button>
    <button
      onClick={() => setMostrarSeguidos(true)}
      className="text-sm text-gray-700 hover:underline"
    >
      <strong>{seguidos.length}</strong> seguidos
    </button>
  </div>
</div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold mb-2 text-gray-700">Nombre</label>
            <InputText
              name="nombre"
              value={perfil.nombre || ""}
              onChange={handleInputChange}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2 text-gray-700">Ubicación</label>
            <InputText
              name="ubicacion"
              value={perfil.ubicacion || ""}
              onChange={handleInputChange}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold mb-2 text-gray-700">Biografía</label>
            <InputTextarea
              name="biografia"
              value={perfil.biografia || ""}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <Button
          label="Guardar cambios"
          icon="pi pi-save"
          onClick={handleSave}
          className="mt-8 bg-pink-500 border-pink-500 text-white px-6 py-2 text-sm rounded-lg hover:bg-pink-600 transition"
        />
        <Button
  label="Volver al Dashboard"
  icon="pi pi-arrow-left"
  onClick={() => router.push("/dashboard")}
  className="mt-4 bg-gray-200 text-gray-800 px-6 py-2 text-sm rounded-lg hover:bg-gray-300 transition"
/>
{/* Dialogo Seguidores */}
<Dialog
  header="Tus Seguidores"
  visible={mostrarSeguidores}
  onHide={() => setMostrarSeguidores(false)}
  style={{ width: '90%', maxWidth: '500px' }}
>
  {seguidores.length > 0 ? seguidores.map((user) => (
    <div key={user.id} className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <Avatar image={user.foto_perfil} icon={!user.foto_perfil ? "pi pi-user" : undefined} size="normal" shape="circle" />
        <span className="text-sm">{user.nombre}</span>
      </div>
      <Button label="Ver perfil" icon="pi pi-user" className="p-button-sm" onClick={() => router.push(`/usuarios/${user.id}`)} />
    </div>
  )) : <p className="text-sm text-gray-500">No tienes seguidores aún.</p>}
</Dialog>

{/* Dialogo Siguiendo */}
<Dialog
  header="Personas que sigues"
  visible={mostrarSeguidos}
  onHide={() => setMostrarSeguidos(false)}
  style={{ width: '90%', maxWidth: '500px' }}
>
  {seguidos.length > 0 ? seguidos.map((user) => (
    <div key={user.id} className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <Avatar image={user.foto_perfil} icon={!user.foto_perfil ? "pi pi-user" : undefined} size="normal" shape="circle" />
        <span className="text-sm">{user.nombre}</span>
      </div>
      <Button label="Ver perfil" icon="pi pi-user" className="p-button-sm" onClick={() => router.push(`/usuarios/${user.id}`)} />
    </div>
  )) : <p className="text-sm text-gray-500">No sigues a nadie aún.</p>}
</Dialog>

      </div>
    </div>
  );
}
