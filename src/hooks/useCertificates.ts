import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  buildCertificatePdf,
  certificateFileName,
  type CertificatePdfData,
} from '@/lib/certificatePdf';

interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
  user_name: string;
  course_title: string;
}

interface CertificateWithPDF extends Certificate {
  verificationUrl: string;
  pdfBase64: string;
}

export function useCertificates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCertificate = useCallback(async (
    courseId: string,
    userName: string,
    courseTitle: string
  ): Promise<CertificateWithPDF | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-certificate', {
        body: { courseId, userName, courseTitle },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.certificate as CertificateWithPDF;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar certificado';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserCertificates = useCallback(async (userId: string): Promise<Certificate[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch {
      return [];
    }
  }, []);

  const verifyCertificate = useCallback(async (code: string): Promise<Certificate | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .rpc('verify_certificate_by_code', { p_code: code });

      if (fetchError || !data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        id: row.verification_code,
        user_id: '',
        course_id: '',
        verification_code: row.verification_code,
        issued_at: row.issued_at,
        user_name: row.user_name,
        course_title: row.course_title,
      };
    } catch {
      return null;
    }
  }, []);

  const downloadCertificate = useCallback((data: CertificatePdfData) => {
    const doc = buildCertificatePdf(data);
    doc.save(certificateFileName(data.verificationCode));
  }, []);

  return {
    loading,
    error,
    generateCertificate,
    getUserCertificates,
    verifyCertificate,
    downloadCertificate,
  };
}
