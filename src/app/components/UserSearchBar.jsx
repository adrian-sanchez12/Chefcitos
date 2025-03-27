"use client";
import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function UserSearchBar() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.trim() === "") {
        setResults([]);
        return;
      }

      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, foto_perfil")
        .ilike("nombre", `%${search}%`);

      if (!error) {
        setResults(data);
      }
    }, 300); // debounce

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  return (
    <div className="relative w-full max-w-md">
      <span className="p-input-icon-left w-full">
        
        <InputText
          placeholder="Buscar usuarios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-full px-4 py-2 text-sm"
        />
      </span>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded shadow z-50 max-h-64 overflow-y-auto">
          {results.map((user) => (
            <Link
              key={user.id}
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
        </div>
      )}
    </div>
  );
}
