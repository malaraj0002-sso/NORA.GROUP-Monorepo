'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
  CaseIcon,
  CogIcon,
  CommentIcon,
  DocumentIcon,
  EarthGlobeIcon,
  HomeIcon,
  ImagesIcon,
  InfoOutlineIcon,
  UsersIcon,
} from '@sanity/icons';
import { useClient } from 'sanity';
import { useRouter } from 'sanity/router';
import { apiVersion } from '@/sanity/env';

type Counts = {
  projects: number;
  materials: number;
  services: number;
  posts: number;
  testimonials: number;
  slides: number;
  faqs: number;
};

const EMPTY: Counts = {
  projects: 0,
  materials: 0,
  services: 0,
  posts: 0,
  testimonials: 0,
  slides: 0,
  faqs: 0,
};

const GOLD = '#cda845';
const INK = '#f7f4ea';
const MUTED = 'rgba(247,244,234,0.62)';
const CARD = '#181818';
const LINE = 'rgba(205,168,69,0.28)';

function published(type: string) {
  return `count(*[_type == "${type}" && !(_id in path("drafts.**"))])`;
}

export function Overview() {
  const client = useClient({ apiVersion });
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<{
        projects: number;
        materials: number;
        services: number;
        posts: number;
        testimonials: number;
        faqs: number;
        slides: number;
      }>(`{
        "projects": ${published('project')},
        "materials": ${published('material')},
        "services": ${published('service')},
        "posts": ${published('blogPost')},
        "testimonials": ${published('testimonial')},
        "faqs": ${published('faqItem')},
        "slides": count(*[_id == "homePage"][0].heroImages)
      }`)
      .then((data) => {
        if (!cancelled) {
          setCounts({
            projects: data.projects || 0,
            materials: data.materials || 0,
            services: data.services || 0,
            posts: data.posts || 0,
            testimonials: data.testimonials || 0,
            faqs: data.faqs || 0,
            slides: data.slides || 0,
          });
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  function openDoc(type: string, id?: string) {
    try {
      if (id) {
        router.navigateIntent('edit', { type, id });
        return;
      }
      router.navigateUrl({ path: `/structure/${type}` });
    } catch {
      window.location.assign(id ? `/studio/structure/${id}` : `/studio/structure/${type}`);
    }
  }

  const stats: {
    key: keyof Counts;
    label: string;
    icon: typeof HomeIcon;
    onClick: () => void;
  }[] = [
    { key: 'projects', label: 'المشاريع', icon: ImagesIcon, onClick: () => openDoc('project') },
    { key: 'materials', label: 'المواد', icon: EarthGlobeIcon, onClick: () => openDoc('material') },
    { key: 'services', label: 'الخدمات', icon: CaseIcon, onClick: () => openDoc('service') },
    { key: 'posts', label: 'المدونة', icon: DocumentIcon, onClick: () => openDoc('blogPost') },
    { key: 'testimonials', label: 'آراء العملاء', icon: CommentIcon, onClick: () => openDoc('testimonial') },
    { key: 'slides', label: 'صور الهيرو', icon: ImagesIcon, onClick: () => openDoc('homePage', 'homePage') },
  ];

  const actions = [
    { label: 'إعدادات الموقع', icon: CogIcon, onClick: () => openDoc('siteSettings', 'siteSettings') },
    { label: 'من نحن', icon: InfoOutlineIcon, onClick: () => openDoc('aboutPage', 'aboutPage') },
    { label: 'المشاريع', icon: ImagesIcon, onClick: () => openDoc('project') },
    { label: 'المواد', icon: EarthGlobeIcon, onClick: () => openDoc('material') },
    { label: 'الخدمات', icon: CaseIcon, onClick: () => openDoc('service') },
    { label: 'المدونة', icon: DocumentIcon, onClick: () => openDoc('blogPost') },
  ];

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100%',
        padding: '2rem 1.5rem 3rem',
        background: '#0c0c0c',
        color: INK,
        fontFamily: 'Cairo, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ margin: 0, color: GOLD, fontSize: 12, letterSpacing: '0.14em', fontWeight: 700 }}>
          Nora Group
        </p>
        <h1 style={{ margin: '0.35rem 0 0', fontSize: 32, fontWeight: 700 }}>نظرة عامة</h1>
        <p style={{ margin: '0.6rem 0 0', color: MUTED, maxWidth: 560, lineHeight: 1.6 }}>
          عدّل النصوص والصور من هنا، ثم اضغط Publish. الموقع يتحدّث بعد الحفظ. لا تغيّر تسميات الواجهة إلا عند الحاجة.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12,
            marginTop: 28,
          }}
        >
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                style={cardButton}
              >
                <Icon style={{ width: 22, height: 22, color: GOLD }} />
                <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
                  {loaded ? counts[item.key] : '—'}
                </span>
                <span style={{ color: MUTED, fontSize: 13 }}>{item.label}</span>
                <span style={{ color: GOLD, fontSize: 11 }}>منشور</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(240px, 0.8fr)',
            gap: 16,
            marginTop: 28,
          }}
          className="nora-overview-split"
        >
          <section style={panel}>
            <h2 style={panelTitle}>اختصارات</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              {actions.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" onClick={item.onClick} style={actionButton}>
                    <Icon style={{ width: 20, height: 20, color: GOLD }} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={panel}>
            <h2 style={panelTitle}>حالة الموقع</h2>
            <StatusRow label="الاسم" value="Nora Group" />
            <StatusRow label="أسئلة شائعة" value={loaded ? String(counts.faqs) : '—'} />
            <StatusRow label="آراء العملاء" value={loaded ? String(counts.testimonials) : '—'} />
            <StatusRow icon={UsersIcon} label="تواصل" value="هاتف وواتساب فقط" />
            <p style={{ margin: '1rem 0 0', color: MUTED, fontSize: 12, lineHeight: 1.5 }}>
              بعد Publish انتظر دقيقة أو أعد تحميل الموقع. الهيرو والشعار يظهران من الإعدادات / الصفحة الرئيسية.
            </p>
          </section>
        </div>
      </div>
      <style>{`
        @media (max-width: 800px) {
          .nora-overview-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function StatusRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof HomeIcon;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '0.55rem 0',
        borderBottom: `1px solid ${LINE}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: MUTED, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {Icon ? <Icon style={{ width: 14, height: 14, color: GOLD }} /> : null}
        {label}
      </span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const cardButton: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  padding: '1.1rem 1rem',
  background: CARD,
  border: `1px solid ${LINE}`,
  borderRadius: 14,
  color: INK,
  cursor: 'pointer',
  textAlign: 'right',
};

const actionButton: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  padding: '0.95rem 0.85rem',
  background: '#121212',
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  color: INK,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'right',
};

const panel: CSSProperties = {
  background: CARD,
  border: `1px solid ${LINE}`,
  borderRadius: 16,
  padding: '1.15rem 1.15rem 1.25rem',
};

const panelTitle: CSSProperties = {
  margin: '0 0 1rem',
  fontSize: 15,
  fontWeight: 700,
  color: GOLD,
};
