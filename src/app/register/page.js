"use client";
import { useState } from "react";
import { signUp } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await signUp(email, password, nombre);
      router.push("/dashboard"); // Redirigir al dashboard después del registro
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFFFFF]">
      <Card className="w-[400px] p-6 shadow-lg rounded-xl bg-white">
        <h1 className="text-3xl font-bold text-center text-[#5A3E2B] mb-4">Registro</h1>

        {error && <Message severity="error" text={error} className="mb-3" />}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-[#5A3E2B] font-semibold mb-1">Nombre</label>
            <InputText 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              className="w-full p-3 border border-[#B07D62]  rounded-lg focus:ring-2 focus:ring-[#FF914D]"
              placeholder="Ingrese su nombre"
              required 
            />
          </div>

          <div>
            <label className="block text-[#5A3E2B] font-semibold mb-1">Correo</label>
            <InputText 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3 border border-[#B07D62]  rounded-lg focus:ring-2 focus:ring-[#FF914D]"
              placeholder="Ingrese su correo"
              required 
            />
          </div>

          <div>
            <label className="block text-[#5A3E2B] font-semibold mb-1">Contraseña</label>
            <Password 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              feedback={false} 
              toggleMask 
              className="w-full p-3 border border-[#B07D62]  rounded-lg focus:ring-2 focus:ring-[#FF914D]"
              placeholder="Ingrese su contraseña"
              required
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
          ¿Ya tienes una cuenta? <a href="/login" className="text-[#FF914D] font-semibold hover:underline">Inicia sesión</a>
        </p>
      </Card>
    </div>
  );
}
