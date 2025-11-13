import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'; 

// Env vars (Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Global CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// --- 🔥 FIX: Add OPTIONS handler ---
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// --- POST Handler ---
export async function POST(request) {
    let client_id, license_key;

    try {
        const body = await request.json();
        client_id = body.client_id;
        license_key = body.license_key;
    } catch (e) {
        return NextResponse.json(
            { error: 'Invalid JSON body.' }, 
            { status: 400, headers: corsHeaders }
        );
    }

    if (!client_id || !license_key) {
        return NextResponse.json(
            { error: 'Missing client_id or license_key.' },
            { status: 400, headers: corsHeaders }
        );
    }

    try {
        const { data, error } = await supabase
            .from('licenses')
            .select('valid_until')
            .eq('client_id', client_id)
            .eq('license_key', license_key)
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Subscription expired or invalid key.' },
                { status: 403, headers: corsHeaders }
            );
        }

        const validUntil = new Date(data.valid_until);
        const now = new Date();

        if (validUntil > now) {
            return NextResponse.json(
                { status: 'valid', valid_until: data.valid_until },
                { status: 200, headers: corsHeaders }
            );
        } else {
            return NextResponse.json(
                { status: 'expired', valid_until: data.valid_until },
                { status: 403, headers: corsHeaders }
            );
        }

    } catch (err) {
        console.error("Unexpected server error:", err);
        return NextResponse.json(
            { error: 'Unexpected server error.' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Optional GET block
export async function GET() {
    return NextResponse.json(
        { error: 'Method Not Allowed' },
        { status: 405, headers: corsHeaders }
    );
}
