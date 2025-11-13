import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'; 

// **IMPORTANT:** These must be set as Vercel Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- CORS Headers ---
const corsHeaders = {
    // This allows requests from ANY origin (required for local Expo testing)
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};
// --------------------


export async function POST(request) {
    // 1. Handle preflight CORS request (OPTIONS method)
    if (request.method === 'OPTIONS') {
        return NextResponse.json({}, { status: 200, headers: corsHeaders });
    }

    let client_id, license_key;
    try {
        const body = await request.json();
        client_id = body.client_id;
        license_key = body.license_key;
    } catch (e) {
        // If the body is unreadable, treat it as a bad request
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: corsHeaders });
    }
    
    // Input Validation
    if (!client_id || !license_key) {
        return NextResponse.json({ error: 'Missing client_id or license_key.' }, { status: 400, headers: corsHeaders });
    }

    try {
        // Query the database
        const { data, error } = await supabase
            .from('licenses')
            .select('valid_until')
            .eq('client_id', client_id)
            .eq('license_key', license_key) 
            .single();

        if (error) {
            // No row found or other error: returns 403
            return NextResponse.json({ error: 'Subscription expired or invalid key.' }, { status: 403, headers: corsHeaders });
        }

        // Check validity date
        const validUntil = new Date(data.valid_until);
        const now = new Date();

        if (validUntil > now) {
            // ✅ Valid License - Returns 200
            return NextResponse.json({ status: 'valid', valid_until: data.valid_until }, { status: 200, headers: corsHeaders });
        } else {
            // ❌ Expired License - Returns 403
            return NextResponse.json({ status: 'expired', valid_until: data.valid_until }, { status: 403, headers: corsHeaders });
        }
    } catch (err) {
        console.error('Unexpected Server Error:', err);
        return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500, headers: corsHeaders });
    }
};

// Optional: Explicitly block other methods (GET, PUT, etc.) if needed
export async function GET() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: corsHeaders });
}
