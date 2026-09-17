-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('he', 'ar', 'en', 'ru');

-- CreateEnum
CREATE TYPE "ServiceSlug" AS ENUM ('kitchens', 'bedrooms', 'wardrobes', 'walk-in-closets', 'custom-furniture', 'offices', 'commercial');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('kitchens', 'bedrooms', 'wardrobes', 'furniture', 'commercial');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('owner', 'admin', 'editor', 'employee');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('R2', 'LOCAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "LegalSlug" AS ENUM ('privacy', 'cookies', 'terms');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordAlgo" TEXT NOT NULL DEFAULT 'argon2id',
    "roleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "provider" "MediaProvider" NOT NULL DEFAULT 'R2',
    "objectKey" TEXT,
    "url" TEXT,
    "filename" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "alt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "brandName" TEXT NOT NULL,
    "tagline" JSONB NOT NULL,
    "pillars" JSONB NOT NULL,
    "phoneDisplay" TEXT NOT NULL,
    "phoneTel" TEXT NOT NULL,
    "whatsappE164" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "workingHours" JSONB NOT NULL,
    "whatsappMessage" JSONB NOT NULL,
    "seoTitle" JSONB NOT NULL,
    "seoDescription" JSONB NOT NULL,
    "logoMediaId" TEXT,
    "logoDarkMediaId" TEXT,
    "qrMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_pages" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "heroTitle" JSONB NOT NULL,
    "heroSubtitle" JSONB NOT NULL,
    "introEyebrow" JSONB NOT NULL,
    "introTitle" JSONB NOT NULL,
    "introDescription" JSONB NOT NULL,
    "whyEyebrow" JSONB NOT NULL,
    "whyTitle" JSONB NOT NULL,
    "whySubtitle" JSONB NOT NULL,
    "processEyebrow" JSONB NOT NULL,
    "processTitle" JSONB NOT NULL,
    "processSubtitle" JSONB NOT NULL,
    "servicesEyebrow" JSONB NOT NULL,
    "servicesTitle" JSONB NOT NULL,
    "servicesSubtitle" JSONB NOT NULL,
    "projectsEyebrow" JSONB NOT NULL,
    "projectsTitle" JSONB NOT NULL,
    "projectsSubtitle" JSONB NOT NULL,
    "materialsEyebrow" JSONB NOT NULL,
    "materialsTitle" JSONB NOT NULL,
    "materialsSubtitle" JSONB NOT NULL,
    "testimonialsEyebrow" JSONB NOT NULL,
    "testimonialsTitle" JSONB NOT NULL,
    "testimonialsSubtitle" JSONB NOT NULL,
    "ctaTitle" JSONB NOT NULL,
    "ctaSubtitle" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_intro_features" (
    "id" TEXT NOT NULL,
    "homePageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_intro_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_why_items" (
    "id" TEXT NOT NULL,
    "homePageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_why_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_hero_media" (
    "homePageId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "home_hero_media_pkey" PRIMARY KEY ("homePageId","mediaId")
);

-- CreateTable
CREATE TABLE "about_pages" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "eyebrow" JSONB NOT NULL,
    "title" JSONB NOT NULL,
    "subtitle" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "valuesTitle" JSONB NOT NULL,
    "imageMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_values" (
    "id" TEXT NOT NULL,
    "aboutPageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "how_we_work_pages" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "eyebrow" JSONB NOT NULL,
    "title" JSONB NOT NULL,
    "subtitle" JSONB NOT NULL,
    "imageMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "how_we_work_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "how_we_work_steps" (
    "id" TEXT NOT NULL,
    "howWeWorkPageId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "how_we_work_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_pages" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "eyebrow" JSONB NOT NULL,
    "title" JSONB NOT NULL,
    "subtitle" JSONB NOT NULL,
    "imageMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui_copy" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ui_copy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "slug" "LegalSlug" NOT NULL,
    "title" JSONB NOT NULL,
    "updated" JSONB NOT NULL,
    "intro" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_sections" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "heading" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" "ServiceSlug" NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "shortDescription" JSONB,
    "seoTitle" JSONB,
    "seoDescription" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_features" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "text" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_media" (
    "serviceId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_media_pkey" PRIMARY KEY ("serviceId","mediaId")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "category" "ProjectCategory" NOT NULL,
    "woodTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_media" (
    "projectId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_media_pkey" PRIMARY KEY ("projectId","mediaId")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "characteristics" JSONB NOT NULL,
    "applications" JSONB NOT NULL,
    "finishes" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_media" (
    "materialId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "material_media_pkey" PRIMARY KEY ("materialId","mediaId")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" JSONB NOT NULL,
    "project" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "avatarMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "excerpt" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "seoTitle" JSONB,
    "seoDescription" JSONB,
    "category" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT 'Nora Group',
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "featuredMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX "users_enabled_idx" ON "users"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "media_provider_objectKey_idx" ON "media"("provider", "objectKey");

-- CreateIndex
CREATE INDEX "home_intro_features_homePageId_sortOrder_idx" ON "home_intro_features"("homePageId", "sortOrder");

-- CreateIndex
CREATE INDEX "home_why_items_homePageId_sortOrder_idx" ON "home_why_items"("homePageId", "sortOrder");

-- CreateIndex
CREATE INDEX "home_hero_media_homePageId_sortOrder_idx" ON "home_hero_media"("homePageId", "sortOrder");

-- CreateIndex
CREATE INDEX "about_values_aboutPageId_sortOrder_idx" ON "about_values"("aboutPageId", "sortOrder");

-- CreateIndex
CREATE INDEX "how_we_work_steps_howWeWorkPageId_sortOrder_idx" ON "how_we_work_steps"("howWeWorkPageId", "sortOrder");

-- CreateIndex
CREATE INDEX "ui_copy_namespace_key_idx" ON "ui_copy"("namespace", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ui_copy_locale_namespace_key_key" ON "ui_copy"("locale", "namespace", "key");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_slug_key" ON "legal_documents"("slug");

-- CreateIndex
CREATE INDEX "legal_sections_documentId_sortOrder_idx" ON "legal_sections"("documentId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "services_published_sortOrder_idx" ON "services"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "service_features_serviceId_sortOrder_idx" ON "service_features"("serviceId", "sortOrder");

-- CreateIndex
CREATE INDEX "service_media_serviceId_sortOrder_idx" ON "service_media"("serviceId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_published_sortOrder_idx" ON "projects"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "project_media_projectId_sortOrder_idx" ON "project_media"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "materials_slug_key" ON "materials"("slug");

-- CreateIndex
CREATE INDEX "materials_published_sortOrder_idx" ON "materials"("published", "sortOrder");

-- CreateIndex
CREATE INDEX "material_media_materialId_sortOrder_idx" ON "material_media"("materialId", "sortOrder");

-- CreateIndex
CREATE INDEX "testimonials_published_sortOrder_idx" ON "testimonials"("published", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_published_publishedAt_idx" ON "blog_posts"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "faq_items_published_sortOrder_idx" ON "faq_items"("published", "sortOrder");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logoDarkMediaId_fkey" FOREIGN KEY ("logoDarkMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_qrMediaId_fkey" FOREIGN KEY ("qrMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_intro_features" ADD CONSTRAINT "home_intro_features_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "home_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_why_items" ADD CONSTRAINT "home_why_items_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "home_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_hero_media" ADD CONSTRAINT "home_hero_media_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "home_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_hero_media" ADD CONSTRAINT "home_hero_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_pages" ADD CONSTRAINT "about_pages_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_values" ADD CONSTRAINT "about_values_aboutPageId_fkey" FOREIGN KEY ("aboutPageId") REFERENCES "about_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "how_we_work_pages" ADD CONSTRAINT "how_we_work_pages_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "how_we_work_steps" ADD CONSTRAINT "how_we_work_steps_howWeWorkPageId_fkey" FOREIGN KEY ("howWeWorkPageId") REFERENCES "how_we_work_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_pages" ADD CONSTRAINT "contact_pages_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_sections" ADD CONSTRAINT "legal_sections_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_features" ADD CONSTRAINT "service_features_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_media" ADD CONSTRAINT "service_media_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_media" ADD CONSTRAINT "service_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_media" ADD CONSTRAINT "material_media_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_media" ADD CONSTRAINT "material_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featuredMediaId_fkey" FOREIGN KEY ("featuredMediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

