"use client";
import { useState, useRef } from "react";
import { signIn } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const toast = useRef(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      toast.current.show({ severity: "success", summary: "Éxito", detail: "Inicio de sesión exitoso", life: 2000 });
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Error", detail: err.message, life: 3000 });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Toast ref={toast} />
      <div className="flex bg-white rounded-lg shadow-lg overflow-hidden w-[850px]">
        {/* LADO IZQUIERDO - FORMULARIO */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Bienvenido</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Correo</label>
              <InputText 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese su correo"
                required 
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Contraseña</label>
              <Password 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                feedback={false} 
                toggleMask 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Checkbox 
                  inputId="rememberMe" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.checked)} 
                  className="mr-2" 
                />
                <label htmlFor="rememberMe" className="text-gray-600">Mantener sesión iniciada</label>
              </div>
              <a href="#" className="text-blue-500 hover:underline">Olvidé mi contraseña</a>
            </div>
            <Button 
              type="submit" 
              label="Iniciar sesión" 
              icon="pi pi-sign-in" 
              className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
            />
          </form>
          <p className="text-sm text-center mt-4">
            No tienes cuenta? <a href="/register" className="text-blue-500 font-semibold hover:underline">Regístrate</a>
          </p>
        </div>

        {/* LADO DERECHO - IMAGEN */}
        <div className="w-1/2 bg-blue-500 flex items-center justify-center p-4">
  <i className="pi pi-sign-in text-white text-7xl"></i>
</div>

      </div>
    </div>
  );
}
