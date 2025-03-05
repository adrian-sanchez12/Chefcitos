import { supabase } from './supabaseClient';

// Registro de usuario
export const signUp = async (email, password, nombre) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre }, // Guardar nombre en metadata del usuario
    },
  });

  if (error) throw error;
  return data;
};

// Login de usuario
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  return data;
};

// Logout
export const signOut = async () => {
  await supabase.auth.signOut();
};
