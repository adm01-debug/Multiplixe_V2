import { Helmet } from 'react-helmet-async';

interface DynamicSEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'course';
  course?: {
    name: string;
    description: string;
    provider: string;
    instructor?: string;
    duration?: string;
    level?: string;
  };
}

const BASE_URL = 'https://multiplixe.lovable.app';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630';

const DynamicSEO = ({ 
  title = 'MULTIPLIXE - Plataforma de Desenvolvimento Profissional',
  description = 'Plataforma exclusiva de treinamento e desenvolvimento profissional da Promo Brindes. Cursos, trilhas e gamificação para impulsionar sua carreira.',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  course
}: DynamicSEOProps) => {
  const fullTitle = title.includes('MULTIPLIXE') ? title : `${title} | MULTIPLIXE`;
  
  // JSON-LD structured data
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MULTIPLIXE',
      url: BASE_URL,
      description: 'Plataforma de desenvolvimento profissional da Promo Brindes',
      publisher: {
        '@type': 'Organization',
        name: 'Promo Brindes',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/favicon.ico`
        }
      }
    };

    if (type === 'course' && course) {
      return {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.name,
        description: course.description,
        provider: {
          '@type': 'Organization',
          name: course.provider,
          sameAs: BASE_URL
        },
        instructor: course.instructor ? {
          '@type': 'Person',
          name: course.instructor
        } : undefined,
        courseMode: 'online',
        educationalLevel: course.level || 'Beginner',
        timeRequired: course.duration || 'PT1H',
        isAccessibleForFree: false,
        inLanguage: 'pt-BR'
      };
    }

    return baseData;
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Portuguese" />
      <meta name="author" content="Promo Brindes" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'course' ? 'article' : type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="MULTIPLIXE" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO tags */}
      <link rel="canonical" href={url} />
      <meta name="theme-color" content="#8B5CF6" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(getStructuredData())}
      </script>
    </Helmet>
  );
};

export default DynamicSEO;
