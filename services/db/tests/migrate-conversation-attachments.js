import { supabase } from './lib/supabaseClient';

async function migrateConversationAttachments() {
  console.log("Starting migration of conversation attachments...");
  
  try {
    // Step 1: Migrate graph bundle relationships
    console.log("Migrating graph bundle relationships...");
    const { data: bundleLinks, error: bundleError } = await supabase
      .from('conversation_attachments')
      .select('conversation_id, attachment_id, user_id')
      .eq('attachment_type', 'graph_bundle');
      
    if (bundleError) {
      throw bundleError;
    }
    
    console.log(`Found ${bundleLinks?.length || 0} graph bundle links to migrate`);
    
    // Update graph_bundles with conversation_id
    if (bundleLinks?.length) {
      for (const link of bundleLinks) {
        const { error: updateError } = await supabase
          .from('graph_bundles')
          .update({ conversation_id: link.conversation_id })
          .eq('id', link.attachment_id)
          .eq('user_id', link.user_id);
          
        if (updateError) {
          console.error(`Error updating graph bundle ${link.attachment_id}:`, updateError);
        }
      }
      console.log(`Successfully migrated ${bundleLinks.length} graph bundle links`);
    }
    
    // Step 2: Migrate workout relationships
    console.log("Migrating workout relationships...");
    const { data: workoutLinks, error: workoutError } = await supabase
      .from('conversation_attachments')
      .select('conversation_id, attachment_id, user_id')
      .eq('attachment_type', 'workout');
      
    if (workoutError) {
      throw workoutError;
    }
    
    console.log(`Found ${workoutLinks?.length || 0} workout links to migrate`);
    
    // Update workouts with conversation_id
    if (workoutLinks?.length) {
      for (const link of workoutLinks) {
        const { error: updateError } = await supabase
          .from('workouts')
          .update({ conversation_id: link.conversation_id })
          .eq('id', link.attachment_id)
          .eq('user_id', link.user_id);
          
        if (updateError) {
          console.error(`Error updating workout ${link.attachment_id}:`, updateError);
        }
      }
      console.log(`Successfully migrated ${workoutLinks.length} workout links`);
    }
    
    // Step 3: Verify the migration
    console.log("Verifying migration...");
    
    // Check graph bundles
    const { data: migratedBundles, error: checkBundleError } = await supabase
      .from('graph_bundles')
      .select('id, conversation_id')
      .not('conversation_id', 'is', null);
      
    if (checkBundleError) {
      throw checkBundleError;
    }
    
    // Check workouts
    const { data: migratedWorkouts, error: checkWorkoutError } = await supabase
      .from('workouts')
      .select('id, conversation_id')
      .not('conversation_id', 'is', null);
      
    if (checkWorkoutError) {
      throw checkWorkoutError;
    }
    
    console.log("Migration verification complete:");
    console.log(`- ${migratedBundles?.length || 0} graph bundles with conversation IDs`);
    console.log(`- ${migratedWorkouts?.length || 0} workouts with conversation IDs`);
    
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
migrateConversationAttachments();