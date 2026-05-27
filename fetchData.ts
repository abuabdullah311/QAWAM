import { supabase } from './library/supabaseClient';

async function getData() {
    console.log("--- PROFILES ---");
    const { data: p, error: pe } = await supabase.from('profiles').select('*');
    console.log("Profiles:", p, pe);

    console.log("--- SITE STATS ---");
    const { data: s, error: se } = await supabase.from('site_stats').select('*');
    console.log("Site stats:", s, se);
}

getData().catch(console.error);
