import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { asLocale, toDashboardLocale, EMPTY_LOCALE } from '@/lib/db/locale';
import { isForbiddenDoorService, PRISMA_TO_WEBSITE_SLUG } from '@/lib/db/services';
import type {
  AdminData,
  BlogPost,
  FAQItem,
  HomePageContent,
  HowWeWorkStep,
  Material,
  MaterialSpec,
  Project,
  Service,
  SiteSettings,
  Testimonial,
} from '@/lib/types';

const emptyLocalized = { he: '', ar: '', en: '' };

const emptySpec: MaterialSpec = {
  hardness: '',
  density: '',
  origin: '',
  finishType: '',
  durability: '',
  sustainability: '',
  moistureContent: '',
  grainPattern: '',
  colorTone: '',
  maintenance: '',
  jankaRating: '',
  weight: '',
};

const emptySiteSettings: SiteSettings = {
  logoUrl: '',
  siteName: '',
  tagline: { ...emptyLocalized },
  contactEmail: '',
  contactPhone: '',
  contactAddress: { ...emptyLocalized },
  navItems: [],
  footerCopyright: { ...emptyLocalized },
  footerLinks: [],
  socialLinks: [],
};

export type DashboardContentSource = 'postgres' | 'mock' | 'unavailable';

export type DashboardContentBundle = {
  source: DashboardContentSource;
  data: AdminData;
  reason?: string;
};

function mediaUrl(media: { url: string | null } | null | undefined): string {
  return media?.url?.trim() || '';
}

export function emptyAdminBundle(reason?: string): DashboardContentBundle {
  return {
    source: reason ? 'unavailable' : 'mock',
    reason,
    data: {
      siteSettings: { ...emptySiteSettings },
      homePage: {
        heroTitle: { ...emptyLocalized },
        heroSubtitle: { ...emptyLocalized },
        introTitle: { ...emptyLocalized },
        introDescription: { ...emptyLocalized },
        ctaTitle: { ...emptyLocalized },
        ctaSubtitle: { ...emptyLocalized },
      },
      howWeWorkSteps: [],
      heroSlides: [],
      aboutSettings: {
        story: { ...emptyLocalized },
        vision: { ...emptyLocalized },
        mission: { ...emptyLocalized },
        featureBanners: [],
      },
      projects: [],
      materials: [],
      services: [],
      testimonials: [],
      faqs: [],
      blogPosts: [],
    },
  };
}

export async function readDashboardContent(): Promise<DashboardContentBundle> {
  try {
    const [
      settings,
      home,
      about,
      howWeWork,
      services,
      projects,
      materials,
      testimonials,
      blogPosts,
      faq,
    ] = await Promise.all([
      prisma.siteSettings.findUnique({
        where: { id: 'default' },
        include: { logo: true },
      }),
      prisma.homePage.findUnique({
        where: { id: 'default' },
        include: { heroMedia: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.aboutPage.findUnique({ where: { id: 'default' } }),
      prisma.howWeWorkPage.findUnique({
        where: { id: 'default' },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.service.findMany({
        include: { features: { orderBy: { sortOrder: 'asc' } }, media: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.project.findMany({
        include: { media: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.material.findMany({
        include: { media: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.blogPost.findMany({ include: { featuredMedia: true }, orderBy: { publishedAt: 'desc' } }),
      prisma.faqItem.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const siteSettings: SiteSettings = settings
      ? {
          ...emptySiteSettings,
          siteName: settings.brandName,
          tagline: toDashboardLocale(settings.tagline),
          contactEmail: settings.email,
          contactPhone: settings.phoneDisplay,
          contactAddress: toDashboardLocale(settings.address),
          logoUrl: mediaUrl(settings.logo),
        }
      : { ...emptySiteSettings };

    const homePage: HomePageContent = home
      ? {
          heroTitle: toDashboardLocale(home.heroTitle),
          heroSubtitle: toDashboardLocale(home.heroSubtitle),
          introTitle: toDashboardLocale(home.introTitle),
          introDescription: toDashboardLocale(home.introDescription),
          ctaTitle: toDashboardLocale(home.ctaTitle),
          ctaSubtitle: toDashboardLocale(home.ctaSubtitle),
        }
      : emptyAdminBundle().data.homePage;

    type MediaLink = { mediaId?: string; media: { url: string | null } | null };
    type ServiceRow = {
      id: string;
      slug: string;
      title: unknown;
      description: unknown;
      published: boolean;
      features: Array<{ id: string; text: unknown }>;
      media: MediaLink[];
    };
    type ProjectRow = {
      id: string;
      slug: string;
      title: unknown;
      description: unknown;
      category: string;
      woodTypes: string[];
      published: boolean;
      featured: boolean;
      media: MediaLink[];
    };
    type MaterialRow = {
      id: string;
      slug: string;
      name: unknown;
      description: unknown;
      published: boolean;
      media: MediaLink[];
    };

    const mappedServices: Service[] = (services as ServiceRow[]).flatMap((row: ServiceRow) => {
      const slug = PRISMA_TO_WEBSITE_SLUG[row.slug];
      if (!slug) return [];
      const title = toDashboardLocale(row.title);
      if (isForbiddenDoorService({ id: row.id, slug, title: asLocale(row.title) })) return [];
      return [
        {
          id: row.id,
          title,
          icon: '',
          imageUrl: mediaUrl(row.media[0]?.media),
          description: toDashboardLocale(row.description),
          steps: row.features.map((feature: { id: string; text: unknown }, index: number) => ({
            id: feature.id,
            stepNumber: index + 1,
            title: toDashboardLocale(feature.text),
            description: { ...emptyLocalized },
          })),
          published: row.published,
          slug,
        },
      ];
    });

    const mappedProjects: Project[] = (projects as ProjectRow[]).map((row: ProjectRow) => {
      const images = row.media.map((item: MediaLink) => mediaUrl(item.media)).filter(Boolean);
      return {
        id: row.id,
        title: toDashboardLocale(row.title),
        category: row.category,
        imageUrl: images[0] || '',
        galleryImages: images,
        description: toDashboardLocale(row.description),
        woodTypes: row.woodTypes,
        published: row.published,
        featured: row.featured,
        completedDate: '',
        slug: row.slug,
        imageAssetId: row.media[0]?.mediaId,
        galleryAssetIds: row.media.map((item: MediaLink) => item.mediaId || ''),
      };
    });

    const mappedMaterials: Material[] = (materials as MaterialRow[]).map((row: MaterialRow) => {
      const name = toDashboardLocale(row.name);
      return {
        id: row.id,
        name: name.he || name.ar || name.en,
        nameLocales: name,
        type: '',
        textureImageUrl: mediaUrl(row.media[0]?.media),
        description: toDashboardLocale(row.description),
        specifications: { ...emptySpec },
        published: row.published,
        slug: row.slug,
      };
    });

    const mappedTestimonials: Testimonial[] = (
      testimonials as Array<{
        id: string;
        name: string;
        rating: number;
        review: unknown;
        published: boolean;
      }>
    ).map((row: { id: string; name: string; rating: number; review: unknown; published: boolean }) => ({
      id: row.id,
      clientName: row.name,
      clientTitle: '',
      avatarUrl: '',
      rating: row.rating,
      text: toDashboardLocale(row.review),
      published: row.published,
    }));

    const mappedFaq: FAQItem[] = (
      faq as Array<{
        id: string;
        question: unknown;
        answer: unknown;
        sortOrder: number;
        published: boolean;
      }>
    ).map((row: { id: string; question: unknown; answer: unknown; sortOrder: number; published: boolean }) => ({
      id: row.id,
      question: toDashboardLocale(row.question),
      answer: toDashboardLocale(row.answer),
      order: row.sortOrder,
      published: row.published,
    }));

    const mappedBlog: BlogPost[] = (
      blogPosts as Array<{
        id: string;
        slug: string;
        title: unknown;
        excerpt: unknown;
        content: unknown;
        author: string;
        publishedAt: Date | null;
        published: boolean;
        featuredMedia: { url: string | null } | null;
      }>
    ).map(
      (row: {
        id: string;
        slug: string;
        title: unknown;
        excerpt: unknown;
        content: unknown;
        author: string;
        publishedAt: Date | null;
        published: boolean;
        featuredMedia: { url: string | null } | null;
      }) => ({
      id: row.id,
      title: toDashboardLocale(row.title),
      slug: row.slug,
      excerpt: toDashboardLocale(row.excerpt),
      content: toDashboardLocale(row.content),
      featuredImageUrl: mediaUrl(row.featuredMedia),
      author: row.author,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : '',
      published: row.published,
      tags: [],
    }));

    const howWeWorkSteps: HowWeWorkStep[] = (
      (howWeWork?.steps || []) as Array<{
        id: string;
        number: string;
        title: unknown;
        description: unknown;
      }>
    ).map((step: { id: string; number: string; title: unknown; description: unknown }) => ({
      id: step.id,
      number: step.number,
      title: toDashboardLocale(step.title),
      description: toDashboardLocale(step.description),
    }));

    const heroSlides =
      home?.heroMedia.map((item: MediaLink & { mediaId: string }, index: number) => ({
        id: item.mediaId,
        imageUrl: mediaUrl(item.media),
        title: toDashboardLocale(home.heroTitle),
        subtitle: toDashboardLocale(home.heroSubtitle),
        ctaText: { ...emptyLocalized },
        ctaLink: '/projects',
        order: index,
        published: true,
      })) || [];

    return {
      source: 'postgres',
      data: {
        siteSettings,
        homePage,
        howWeWorkSteps,
        heroSlides,
        aboutSettings: {
          story: toDashboardLocale(about?.body ?? EMPTY_LOCALE),
          vision: { ...emptyLocalized },
          mission: { ...emptyLocalized },
          featureBanners: [],
        },
        projects: mappedProjects,
        materials: mappedMaterials,
        services: mappedServices,
        testimonials: mappedTestimonials,
        faqs: mappedFaq,
        blogPosts: mappedBlog,
      },
    };
  } catch (error) {
    console.error('[dashboard-read] postgres read failed');
    return emptyAdminBundle('PostgreSQL content is unavailable');
  }
}
