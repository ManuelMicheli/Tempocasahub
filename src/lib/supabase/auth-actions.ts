'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { setupCornaredo } from '@/lib/census/setup-cornaredo';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });
  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.user) {
    const { data: agent } = await supabase
      .from('agents')
      .insert({
        user_id: data.user.id,
        full_name: fullName,
        phone: phone,
        email: email,
      })
      .select()
      .single();

    // Auto-setup Cornaredo census data (best-effort)
    if (agent) {
      try {
        await setupCornaredo(supabase, agent.id, null);
      } catch (e) {
        console.error('Census setup during registration failed:', e);
      }
    }
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
