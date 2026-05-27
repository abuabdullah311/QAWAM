import { supabase } from './library/supabaseClient';

async function getSwagger() {
    console.log("Fetching swagger...");
    const url = "https://uumofgotjfbzojlyovst.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1bW9mZ290amZiem9qbHlvdnN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTcyOTcsImV4cCI6MjA5NTM5MzI5N30.VgXRmrMTvr5KF84jYjqL7gN5AjEd6NCD2G_i_2bhofQ";
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

getSwagger().catch(console.error);
