"use client";
import { useEffect, useState } from 'react';
import { getUsers } from '@/lib/db';

export default function Home() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsuarios(data);
      } catch (error) {
        console.error('Error obteniendo usuarios:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Usuarios Registrados</h1>
      <ul>
        {usuarios.map((usuario) => (
          <li key={usuario.id}>{usuario.nombre} - {usuario.correo}</li>
        ))}
      </ul>
    </div>
  );
}
