"use client";
import { useState, useRef } from "react";
import { signIn, supabase } from "@/lib/auth";
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
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Inicio de sesión exitoso",
        life: 2000,
      });
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err.message,
        life: 3000,
      });
    }
  };

  const signInWithOAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`, // Redirige después del login
      },
    });

    if (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
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
              <a
                href="/recuperar"
                className="text-blue-500 hover:underline"
              >
                ¿Olvidó su contraseña?
              </a>
            </div>
            <Button
              type="submit"
              label="Iniciar sesión"
              icon="pi pi-sign-in"
              className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
            />
          </form>

          {/* Divider visual */}
          <div className="my-4 border-t text-center text-gray-400 text-sm">
            <span className="px-2 bg-white relative top-[-14px]">o</span>
          </div>

          {/* Login con Google */}
          <button
  onClick={() => signInWithOAuth("google")}
  className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 rounded-lg py-2 hover:bg-gray-100 transition"
>
  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
  <span className="text-sm font-medium">Iniciar sesión con Google</span>
</button>


          <p className="text-sm text-center mt-6">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="text-blue-500 font-semibold hover:underline">
              Regístrate
            </a>
          </p>
        </div>

        {/* LADO DERECHO - IMAGEN O ICONO */}
        <div className="w-1/2 bg-blue-500 flex items-center justify-center p-4">
          <i className="pi pi-sign-in text-white text-7xl"></i>
        </div>
      </div>
    </div>
  );
}
