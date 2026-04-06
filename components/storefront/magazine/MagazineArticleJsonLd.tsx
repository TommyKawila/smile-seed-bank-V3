type Props = {
  title: string;
  description: string;
  imageUrls: string[];
  datePublished: string;
  dateModified: string;
  url: string;
};

export function MagazineArticleJsonLd({
  title,
  description,
  imageUrls,
  datePublished,
  dateModified,
  url,
}: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: imageUrls.length ? imageUrls : undefined,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: "Smile Seed Bank Editorial",
    },
    publisher: {
      "@type": "Organization",
      name: "Smile Seed Bank",
    },
    description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
