/**
 * Read-only GROQ. No user-controlled interpolation.
 * Includes unpublished (`visible`) so the Dashboard can show publish state.
 */
export const DASHBOARD_READ_QUERY = `{
  "siteSettings": *[_type == "siteSettings"][0]{
    brandName,
    tagline,
    email,
    address,
    phoneDisplay,
    "logoUrl": logo.asset->url
  },
  "aboutPage": *[_type == "aboutPage"][0]{
    body
  },
  "homePage": *[_type == "homePage"][0]{
    heroTitle,
    heroSubtitle,
    introTitle,
    introDescription,
    ctaTitle,
    ctaSubtitle,
    "heroImages": heroImages[]{ "url": asset->url, "assetId": asset->_id }
  },
  "howWeWorkPage": *[_type == "howWeWorkPage"][0]{
    "steps": steps[]{
      _key,
      number,
      title,
      description
    }
  },
  "projects": *[_type == "project"] | order(order asc){
    _id,
    title,
    description,
    category,
    materials,
    visible,
    "slug": slug.current,
    "galleryUrls": gallery[].asset->url,
    "galleryAssetIds": gallery[].asset->_id
  },
  "materials": *[_type == "material"] | order(order asc){
    _id,
    name,
    description,
    visible,
    "imageUrl": image.asset->url
  },
  "services": *[_type == "service"] | order(order asc){
    _id,
    title,
    description,
    visible,
    "slug": slug.current,
    "imageUrl": image.asset->url
  },
  "testimonials": *[_type == "testimonial"] | order(order asc){
    _id,
    name,
    rating,
    review,
    visible
  },
  "faqItems": *[_type == "faqItem"] | order(order asc){
    _id,
    question,
    answer,
    order,
    visible
  },
  "blogPosts": *[_type == "blogPost"] | order(date desc){
    _id,
    title,
    excerpt,
    content,
    author,
    date,
    visible,
    category,
    "slug": slug.current,
    "imageUrl": image.asset->url
  }
}`;
