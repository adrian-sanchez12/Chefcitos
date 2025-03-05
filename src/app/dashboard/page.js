"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login"); // Si no hay usuario, redirigir al login
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Bienvenido al Dashboard</h1>
      {user && <p className="mt-2">Usuario: {user.email}</p>}
      <button onClick={async () => { await signOut(); router.push("/login"); }} className="bg-red-500 text-white p-2 mt-4">
        Cerrar Sesión
      </button>
    </div>
  );
}
