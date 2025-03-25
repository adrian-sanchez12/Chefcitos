import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const signInWithOAuth = async (provider) => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider, // 'google' o 'facebook'
    options: {
      redirectTo: `${window.location.origin}/dashboard`, // o cualquier ruta protegida
    },
  });

  if (error) console.error("Error al iniciar sesión con OAuth:", error.message);
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/recuperar`, // Ruta a la que se enviará tras hacer clic en el email
  });
  if (error) throw new Error(error.message);
};



// Registro
export const signUp = async (email, password, nombre) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  const userId = data.user?.id;

  if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

  const { error: profileError } = await supabase.from('perfiles').insert([
    {
      id: userId,
      nombre,
    },
  ]);

  if (profileError) throw new Error(profileError.message);
};

// Login
export const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
};

// Logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

export { supabase };
