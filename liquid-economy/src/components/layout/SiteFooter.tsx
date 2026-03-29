import { Link } from 'react-router-dom';

const links = [
  { to: '/doviz', label: 'Döviz' },
  { to: '/altin', label: 'Altın' },
  { to: '/kapalicarsi', label: 'Kapalıçarşı' },
  { to: '/endeksler', label: 'Endeksler' },
  { to: '/amerika-borsasi', label: 'Amerika Borsası' },
  { to: '/emtialar', label: 'Emtia' },
  { to: '/kripto', label: 'Kripto' },
  { to: '/piyasa', label: 'Enstrümanlar' },
  { to: '/metodoloji', label: 'Metodoloji' },
  { to: '/veri-kaynaklari', label: 'Veri Kaynakları' },
  { to: '/sozluk', label: 'Finans Sözlüğü' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
  { to: '/yasal-uyari', label: 'Yasal Uyarı' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-10 md:mt-14 border-t border-[var(--color-outline-variant)]/40 pt-6 md:pt-8 pb-6 md:pb-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-on-surface-variant)]/70 mb-3">
        Döviz Veri
      </div>
      <div className="flex flex-wrap gap-3">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
