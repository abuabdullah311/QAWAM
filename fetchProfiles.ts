import { supabase } from './library/supabaseClient';

async function getProfilesSchema() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profiles data:", JSON.stringify(data, null, 2));
    }
}

getProfilesSchema().catch(console.error);
