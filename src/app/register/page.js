"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const toast = useRef(null);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
      return;
    }

    // Crear perfil en tabla 'perfiles'
    const { user } = data;
    const userId = user?.id || data.session?.user?.id;

    if (userId) {
      const { error: perfilError } = await supabase.from("perfiles").insert([
        {
          id: userId,
          nombre,
          email,
          rol: "usuario",
          recibir_correos: true,
          fecha_registro: new Date(),
        },
      ]);

      if (perfilError) {
        toast.current.show({
          severity: "warn",
          summary: "Cuenta creada pero...",
          detail: "No se pudo crear el perfil.",
          life: 4000,
        });
        return;
      }
    }

    toast.current.show({
      severity: "success",
      summary: "Registro exitoso",
      detail: "Redirigiendo al dashboard...",
      life: 2000,
    });

    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFFFFF]">
      <Toast ref={toast} />
      <Card className="w-[400px] p-6 shadow-lg rounded-xl bg-white">
        <h1 className="text-3xl font-bold text-center text-[#5A3E2B] mb-4">Registro</h1>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[#5A3E2B] font-semibold mb-1">Nombre</label>
            <InputText
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese su nombre"
              required
              className="w-full p-3 border border-[#B07D62] rounded-lg focus:ring-2 focus:ring-[#FF914D]"
            />
          </div>

          <div>
            <label className="block text-[#5A3E2B] font-semibold mb-1">Correo</label>
            <InputText
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese su correo"
              required
              className="w-full p-3 border border-[#B07D62] rounded-lg focus:ring-2 focus:ring-[#FF914D]"
            />
          </div>

          <div>
            <label className="block text-[#5A3E2B] font-semibold mb-1">Contraseña</label>
            <Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              feedback={false}
              toggleMask
              placeholder="Ingrese su contraseña"
              required
              className="w-full p-3 border border-[#B07D62] rounded-lg focus:ring-2 focus:ring-[#FF914D]"
            />
          </div>

          <Button
            type="submit"
            label="Registrarse"
            icon="pi pi-user-plus"
            className="w-full p-3 bg-[#FF914D] text-white font-semibold rounded-lg hover:bg-[#E07A3E] transition duration-300"
          />
        </form>

        <p className="text-sm text-center mt-4 text-[#5A3E2B]">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="text-[#FF914D] font-semibold hover:underline">Inicia sesión</a>
        </p>
      </Card>
    </div>
  );
}
