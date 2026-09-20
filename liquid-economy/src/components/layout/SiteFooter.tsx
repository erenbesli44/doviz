import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const CONTENT = [
  { to: '/', label: 'Gündem' },
  { to: '/haberler', label: 'Haberler' },
  { to: '/konular', label: 'Konular' },
  { to: '/uzmanlar', label: 'Uzmanlar' },
  { to: '/piyasa', label: 'Piyasa' },
];

const ABOUT = [
  { to: '/hakkimizda', label: 'Hakkımızda' },
  { to: '/metodoloji', label: 'Metodoloji' },
  { to: '/veri-kaynaklari', label: 'Veri Kaynakları' },
  { to: '/sozluk', label: 'Finans Sözlüğü' },
  { to: '/iletisim', label: 'İletişim' },
  { to: '/yasal-uyari', label: 'Yasal Uyarı' },
];

function Column({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="kicker mb-3">{title}</p>
      <ul className="m-0 list-none space-y-2 p-0">
        {items.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-[14px] text-text-muted no-underline hover:text-text hover:underline underline-offset-4">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t-2 border-rule pt-8 pb-6">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo height={28} />
          <p className="mt-4 max-w-[44ch] text-[14px] leading-6 text-text-muted">
            Finans YouTube kanallarındaki uzman yorumlarını özetler, konu bazında derler ve kaynağıyla
            birlikte sunar.
          </p>
        </div>
        <Column title="İçerik" items={CONTENT} />
        <Column title="Kurumsal" items={ABOUT} />
      </div>

      <p className="mt-8 border-t border-border pt-4 text-[12px] leading-5 text-text-subtle">
        Bu sitedeki özetler, kaynak videolardan otomatik olarak derlenir; yatırım tavsiyesi değildir.
        Her özetin kaynağı ilgili sayfada belirtilir.
      </p>
    </footer>
  );
}
