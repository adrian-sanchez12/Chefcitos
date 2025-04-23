"use client";
import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function UserSearchBar() {
  const [search, setSearch] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.trim() === "") {
        setUsuarios([]);
        setPublicaciones([]);
        return;
      }

      const { data: users, error: errorUsers } = await supabase
        .from("perfiles")
        .select("id, nombre, foto_perfil")
        .ilike("nombre", `%${search}%`);
      setUsuarios(errorUsers ? [] : users || []);

      if (search.startsWith("#")) {
        const tag = search.slice(1).toLowerCase();
        const { data: hashtagData, error: errorHashtags } = await supabase
          .from("hashtags")
          .select("publicacion_id")
          .ilike("tag", `%${tag}%`);

        const pubIds = hashtagData?.map((h) => h.publicacion_id) || [];

        if (pubIds.length > 0) {
          const { data: posts, error: errorPosts } = await supabase
            .from("publicaciones")
            .select("id, contenido")
            .in("id", pubIds);
          setPublicaciones(errorPosts ? [] : posts || []);
        } else {
          setPublicaciones([]);
        }
      } else {
        const { data: posts, error: errorPosts } = await supabase
          .from("publicaciones")
          .select("id, contenido")
          .ilike("contenido", `%${search}%`);
        setPublicaciones(errorPosts ? [] : posts || []);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="relative w-full max-w-md">
      <span className="p-input-icon-left w-full">
        <InputText
          placeholder="Buscar usuarios o publicaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-full px-4 py-2 text-sm"
        />
      </span>

      {(usuarios.length > 0 || publicaciones.length > 0) && (
        <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded shadow z-50 max-h-64 overflow-y-auto">
          {usuarios.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 font-semibold">Usuarios</div>
              {usuarios.map((user) => (
                <Link
                  key={`user-${user.id}`}
                  href={`/usuarios/${user.id}`}
                  className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <img
                    src={user.foto_perfil || "/default.jpg"}
                    alt="foto"
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{user.nombre}</span>
                </Link>
              ))}
            </>
          )}

          {publicaciones.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 font-semibold">Publicaciones</div>
              {publicaciones.map((post) => (
                <Link
                  key={`post-${post.id}`}
                  href={`/publicaciones/${post.id}`}
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {post.contenido.length > 60
                    ? `${post.contenido.slice(0, 60)}...`
                    : post.contenido}
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
