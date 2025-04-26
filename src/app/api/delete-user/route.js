import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { user_id } = await req.json();

  if (!user_id) {
    return new Response(JSON.stringify({ error: "Falta user_id" }), { status: 400 });
  }

  await supabaseAdmin.from("comentarios").delete().eq("usuario_id", user_id);
  await supabaseAdmin.from("megusta").delete().eq("usuario_id", user_id);
  await supabaseAdmin.from("seguimientos").delete().or(`seguidor_id.eq.${user_id},seguido_id.eq.${user_id}`);
  await supabaseAdmin.from("reportes_publicaciones").delete().eq("usuario_id", user_id);
  await supabaseAdmin.from("notificaciones").delete().eq("emisor_id", user_id);
  await supabaseAdmin.from("notificaciones").delete().eq("receptor_id", user_id);
  await supabaseAdmin.from("publicaciones").delete().eq("usuario_id", user_id);
  await supabaseAdmin.from("perfiles").delete().eq("id", user_id);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);

  if (error) {
    console.error(" Error al eliminar el usuario:", error);
    return new Response(JSON.stringify({ error: "Database error deleting user" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
