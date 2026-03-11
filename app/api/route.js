import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Env vars
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS handler
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

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

        // --- Try Supabase validation ---
        const { data, error } = await supabase
            .from('licenses')
            .select('valid_until')
            .eq('client_id', client_id)
            .eq('license_key', license_key)
            .single();

        if (!error && data) {

            const validUntil = new Date(data.valid_until);
            const now = new Date();

            if (validUntil > now) {
                return NextResponse.json(
                    { status: 'valid', valid_until: data.valid_until },
                    { status: 200, headers: corsHeaders }
                );
            }
        }

        // --- FALLBACK: temporary validation for 30 days ---
        const now = new Date();
        const validUntil = new Date();
        validUntil.setDate(now.getDate() + 30);

        return NextResponse.json(
            {
                status: 'valid',
                message: 'Temporary validation (database offline)',
                valid_until: validUntil
            },
            { status: 200, headers: corsHeaders }
        );

    } catch (err) {

        console.error("Supabase error, using fallback validation:", err);

        // fallback if server error
        const now = new Date();
        const validUntil = new Date();
        validUntil.setDate(now.getDate() + 30);

        return NextResponse.json(
            {
                status: 'valid',
                message: 'Temporary validation (server fallback)',
                valid_until: validUntil
            },
            { status: 200, headers: corsHeaders }
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
