// profile/settings/SidebarSettings.jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
{ label: "Perfil", path: "/profile" },
  { label: "Cambiar contraseña", path: "/profile/settings/change-password" },
  { label: "Control de cuenta", path: "/profile/settings/account-control" },
  { label: "Privacidad", path: "/profile/settings/privacy" },
  { label: "Visibilidad", path: "/profile/settings/visibility" },
  { label: "Bloquear y reportar", path: "/profile/settings/block-report" },
];

export default function SidebarSettings() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-md border-r p-4">
             

      <h2 className="text-lg font-bold mb-4 text-pink-600"> <Link href="/dashboard">
          <i
            className="pi pi-arrow-left text-gray-600 hover:text-pink-500 cursor-pointer"
            title="Volver al perfil"
          />
        </Link>       Configuraciones</h2>
      <ul className="space-y-2">
        {menu.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={`block px-4 py-2 rounded-md text-sm font-medium ${
                pathname === item.path
                  ? "bg-pink-100 text-pink-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
