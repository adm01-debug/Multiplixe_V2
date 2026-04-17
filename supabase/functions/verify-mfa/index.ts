import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyMFARequest {
  code: string;
  factorId?: string;
}

interface VerifyMFAResponse {
  verified: boolean;
  error?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ verified: false, error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ verified: false, error: "Server misconfigured" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ verified: false, error: "Invalid session" }, 401);
    }

    const body = (await req.json()) as VerifyMFARequest;
    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return jsonResponse({ verified: false, error: "Invalid code format" }, 400);
    }

    let factorId = body.factorId;
    if (!factorId) {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) {
        return jsonResponse({ verified: false, error: factorsError.message }, 400);
      }
      const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
      if (!verifiedTotp) {
        return jsonResponse({ verified: false, error: "No verified TOTP factor" }, 400);
      }
      factorId = verifiedTotp.id;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      return jsonResponse({ verified: false, error: challengeError?.message ?? "Challenge failed" }, 400);
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: body.code,
    });

    if (verifyError) {
      return jsonResponse({ verified: false, error: verifyError.message }, 400);
    }

    await supabase
      .from("user_mfa_settings")
      .update({ last_mfa_at: new Date().toISOString() })
      .eq("user_id", userData.user.id);

    return jsonResponse({ verified: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ verified: false, error: message }, 500);
  }
});

function jsonResponse(body: VerifyMFAResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
