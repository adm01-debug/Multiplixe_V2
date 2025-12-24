import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  courseId: string;
  userName: string;
  courseTitle: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { courseId, userName, courseTitle }: CertificateRequest = await req.json();

    // Check if course is completed
    const { data: progress, error: progressError } = await supabaseClient
      .from("user_course_progress")
      .select("progress_percentage")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (progressError || !progress || progress.progress_percentage !== 100) {
      throw new Error("Course not completed");
    }

    // Issue certificate using database function
    const { data: certificate, error: certError } = await supabaseClient
      .rpc("issue_certificate", {
        p_user_id: user.id,
        p_course_id: courseId,
        p_user_name: userName,
        p_course_title: courseTitle,
      });

    if (certError) {
      console.error("Certificate error:", certError);
      throw new Error("Failed to issue certificate");
    }

    const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
    const verificationUrl = `${baseUrl}/verificar-certificado?code=${certificate.verification_code}`;

    // Generate PDF content as base64
    const pdfContent = generateCertificatePDF({
      userName,
      courseTitle,
      issuedAt: certificate.issued_at,
      verificationCode: certificate.verification_code,
      verificationUrl,
    });

    return new Response(
      JSON.stringify({
        success: true,
        certificate: {
          ...certificate,
          verificationUrl,
          pdfBase64: pdfContent,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function generateCertificatePDF(data: {
  userName: string;
  courseTitle: string;
  issuedAt: string;
  verificationCode: string;
  verificationUrl: string;
}): string {
  const { userName, courseTitle, issuedAt, verificationCode, verificationUrl } = data;
  const formattedDate = new Date(issuedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Create SVG-based certificate that can be converted to PDF
  const certificateSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffd700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d4af37;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="800" height="600" fill="url(#bgGradient)"/>
      
      <!-- Border -->
      <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#goldGradient)" stroke-width="3"/>
      <rect x="30" y="30" width="740" height="540" fill="none" stroke="url(#goldGradient)" stroke-width="1"/>
      
      <!-- Corner decorations -->
      <path d="M50,50 L100,50 L100,55 L55,55 L55,100 L50,100 Z" fill="url(#goldGradient)"/>
      <path d="M750,50 L700,50 L700,55 L745,55 L745,100 L750,100 Z" fill="url(#goldGradient)"/>
      <path d="M50,550 L100,550 L100,545 L55,545 L55,500 L50,500 Z" fill="url(#goldGradient)"/>
      <path d="M750,550 L700,550 L700,545 L745,545 L745,500 L750,500 Z" fill="url(#goldGradient)"/>
      
      <!-- Medal icon -->
      <circle cx="400" cy="100" r="35" fill="none" stroke="url(#goldGradient)" stroke-width="2"/>
      <text x="400" y="115" font-family="serif" font-size="40" fill="url(#goldGradient)" text-anchor="middle">★</text>
      
      <!-- Title -->
      <text x="400" y="180" font-family="Georgia, serif" font-size="36" fill="url(#goldGradient)" text-anchor="middle" font-weight="bold">CERTIFICADO DE CONCLUSÃO</text>
      
      <!-- Subtitle -->
      <text x="400" y="230" font-family="Arial, sans-serif" font-size="16" fill="#a0a0a0" text-anchor="middle">Certificamos que</text>
      
      <!-- Name -->
      <text x="400" y="280" font-family="Georgia, serif" font-size="32" fill="#ffffff" text-anchor="middle" font-weight="bold">${escapeXml(userName)}</text>
      
      <!-- Line under name -->
      <line x1="200" y1="295" x2="600" y2="295" stroke="url(#goldGradient)" stroke-width="1"/>
      
      <!-- Course info -->
      <text x="400" y="340" font-family="Arial, sans-serif" font-size="16" fill="#a0a0a0" text-anchor="middle">concluiu com êxito o curso</text>
      
      <!-- Course title -->
      <text x="400" y="385" font-family="Georgia, serif" font-size="24" fill="#ffffff" text-anchor="middle" font-weight="bold">${escapeXml(courseTitle)}</text>
      
      <!-- Date -->
      <text x="400" y="440" font-family="Arial, sans-serif" font-size="14" fill="#a0a0a0" text-anchor="middle">Emitido em ${formattedDate}</text>
      
      <!-- QR Code placeholder with verification info -->
      <rect x="620" y="460" width="80" height="80" fill="#ffffff" rx="5"/>
      <text x="660" y="510" font-family="monospace" font-size="8" fill="#1a1a2e" text-anchor="middle">${verificationCode}</text>
      
      <!-- Verification code -->
      <text x="400" y="520" font-family="monospace" font-size="12" fill="#666666" text-anchor="middle">Código de Verificação: ${verificationCode}</text>
      <text x="400" y="540" font-family="Arial, sans-serif" font-size="10" fill="#555555" text-anchor="middle">Verifique em: ${verificationUrl}</text>
      
      <!-- Signature area -->
      <line x1="100" y1="500" x2="280" y2="500" stroke="#666666" stroke-width="1"/>
      <text x="190" y="520" font-family="Arial, sans-serif" font-size="10" fill="#666666" text-anchor="middle">Assinatura Digital</text>
    </svg>
  `;

  // Return as base64 encoded SVG (can be converted to PDF on client)
  const base64 = btoa(unescape(encodeURIComponent(certificateSVG)));
  return base64;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
