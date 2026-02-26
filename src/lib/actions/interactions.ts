'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentAgent } from '@/lib/supabase/agent';
import { updateLeadScore } from '@/lib/scoring/update-score';

export async function createInteraction(formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const interaction = {
    agent_id: agent.id,
    lead_id: formData.get('lead_id') as string,
    type: formData.get('type') as string,
    property_id: (formData.get('property_id') as string) || null,
    summary: (formData.get('summary') as string) || null,
    outcome: (formData.get('outcome') as string) || null,
    scheduled_at: (formData.get('scheduled_at') as string) || null,
    completed_at: (formData.get('completed_at') as string) || null,
    duration_minutes: formData.get('duration_minutes') ? Number(formData.get('duration_minutes')) : null,
  };

  const { error } = await supabase.from('interactions').insert(interaction);
  if (error) return { error: error.message };

  // Update lead's last_contact_at
  if (!interaction.scheduled_at || interaction.completed_at) {
    await supabase.from('leads').update({
      last_contact_at: new Date().toISOString(),
    }).eq('id', interaction.lead_id);
  }

  // Recalculate lead score after new interaction
  try {
    await updateLeadScore(interaction.lead_id);
  } catch {
    // Score update should not block main action
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${interaction.lead_id}`);
  revalidatePath('/calendar');
  return { success: true };
}

export async function scheduleAppointment(formData: FormData) {
  const supabase = await createClient();
  const agent = await getCurrentAgent();
  if (!agent) return { error: 'Non autenticato' };

  const interaction = {
    agent_id: agent.id,
    lead_id: formData.get('lead_id') as string,
    type: (formData.get('type') as string) || 'visit',
    property_id: (formData.get('property_id') as string) || null,
    summary: (formData.get('summary') as string) || null,
    scheduled_at: formData.get('scheduled_at') as string,
  };

  const { error } = await supabase.from('interactions').insert(interaction);
  if (error) return { error: error.message };

  revalidatePath('/calendar');
  revalidatePath(`/leads/${interaction.lead_id}`);
  return { success: true };
}

export async function completeInteraction(id: string, outcome: string, summary: string) {
  const supabase = await createClient();

  const { data: interaction, error: fetchError } = await supabase
    .from('interactions')
    .select('lead_id')
    .eq('id', id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase.from('interactions').update({
    outcome,
    summary,
    completed_at: new Date().toISOString(),
  }).eq('id', id);

  if (error) return { error: error.message };

  // Update lead's last_contact_at
  if (interaction) {
    await supabase.from('leads').update({
      last_contact_at: new Date().toISOString(),
    }).eq('id', interaction.lead_id);

    // Recalculate lead score after completing interaction
    try {
      await updateLeadScore(interaction.lead_id);
    } catch {
      // Score update should not block main action
    }
  }

  revalidatePath('/calendar');
  revalidatePath('/leads');
  return { success: true };
}

export async function deleteInteraction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('interactions').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/calendar');
  revalidatePath('/leads');
  return { success: true };
}
