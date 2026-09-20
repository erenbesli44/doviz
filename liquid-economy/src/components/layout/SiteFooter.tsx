import { Link } from 'react-router-dom';

const links = [
  { to: '/', label: 'Gündem' },
  { to: '/konular', label: 'Konular' },
  { to: '/piyasa', label: 'Piyasa' },
  { to: '/uzmanlar', label: 'Uzmanlar' },
  { to: '/haberler', label: 'Haberler' },
  { to: '/metodoloji', label: 'Metodoloji' },
  { to: '/veri-kaynaklari', label: 'Veri Kaynakları' },
  { to: '/sozluk', label: 'Finans Sözlüğü' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/iletisim', label: 'İletişim' },
  { to: '/yasal-uyari', label: 'Yasal Uyarı' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-10 md:mt-14 border-t border-border pt-6 md:pt-8 pb-6 md:pb-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">
        Döviz Veri
      </div>
      <div className="flex flex-wrap gap-3">
        {links.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="text-sm text-text-muted hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
