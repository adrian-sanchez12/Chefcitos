import { supabase } from './supabaseClient';

// Registrar un usuario
export const registerUser = async (nombre, correo, contraseña) => {
  const { data, error } = await supabase.from('usuarios').insert([{ nombre, correo, contraseña }]);
  if (error) throw error;
  return data;
};

// Obtener usuarios
export const getUsers = async () => {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) throw error;
  return data;
};

// Obtener publicaciones
export const getPosts = async () => {
  const { data, error } = await supabase.from('publicaciones').select('*');
  if (error) throw error;
  return data;
};

// Crear una publicación
export const createPost = async (usuario_id, contenido, tipo, visibilidad) => {
  const { data, error } = await supabase
    .from('publicaciones')
    .insert([{ usuario_id, contenido, tipo, visibilidad }]);
  if (error) throw error;
  return data;
};
