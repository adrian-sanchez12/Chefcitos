"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/auth";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import Link from "next/link";
import Image from "next/image"; 

const menuItems = [
  { label: "Inicio", icon: "pi pi-home", href: "/dashboard" },
  { label: "Me gustas", icon: "pi pi-heart", href: "/favorites" },
  { label: "Recomendaciones", icon: "pi pi-star", href: "/recomendaciones" },
  { label: "Mensajeria", icon: "pi pi-comments", href: "/messages" },
  { label: "Comidas", icon: "pi pi-image", href: "/comidas" },
  { label: "Perfil", icon: "pi pi-user", href: "/profile" },
];

export default function Sidebar() {
  const [perfil, setPerfil] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      setPerfil(perfilData);
    };

    fetchPerfil();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="w-[250px] h-full bg-white border-r p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Image src="/chef.png" alt="Logo Chef" width={20} height={20} />
          <h2 className="text-2xl font-bold text-pink-500">Chefcitos</h2>
        </div>

        <ul className="space-y-4">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <Link href={item.href} className="flex items-center gap-3 text-gray-700 hover:text-pink-500">
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}

          {/* Si el usuario es admin, mostrar el ítem de administración */}
          {perfil?.rol === "admin" && (
            <li>
              <Link href="/admin" className="flex items-center gap-3 text-gray-700 hover:text-pink-500">
                <i className="pi pi-shield"></i>
                <span>Panel Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </div>

      {perfil && (
        <div className="border-t pt-4 mt-6 flex items-center gap-3">
          <Avatar
            image={perfil.foto_perfil || "/user.jpg"}
            icon={!perfil.foto_perfil ? "pi pi-user" : undefined}
            shape="circle"
            size="large"
          />
          <div className="flex-1">
            <p className="font-semibold text-sm truncate">{perfil.nombre}</p>
            <button
              onClick={handleLogout}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
