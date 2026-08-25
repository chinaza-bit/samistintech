import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
//This client stores the session in cookies (not just localStorage), 
//So the middleware (which runs on the server) can see when you are logged in.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClientComponentClient();
