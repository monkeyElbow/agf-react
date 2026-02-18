import { Link } from 'react-router-dom';
import agfLogo from '../assets/agf-logo-footer.svg';

const footerCols = [
  {
    heading: 'Services',
    headingPath: '/services',
    links: [
      ['/services/loans', 'Loans'],
      ['/services/investments', 'Investments'],
      ['/services/retirement', 'Retirement'],
      ['/services/legacy-giving', 'Legacy Giving'],
      ['/services/insurance', 'Insurance'],
    ],
  },
  {
    heading: 'About',
    headingPath: '/about-us',
    links: [
      ['/contact-us', 'Contact Us'],
      ['/about-us/careers', 'Careers'],
      ['/about-us/impact', 'Impact'],
    ],
  },
  {
    heading: 'Tools',
    headingPath: '/resources',
    links: [
      ['/calculators', 'Calculators'],
      ['/terms-of-service', 'Terms of Service'],
      ['/privacy-policy', 'Privacy Policy'],
      ['/accessibility', 'Accessibility'],
      ['/sitemap', 'Sitemap'],
    ],
  },
];

const socialLinks = [
  {
    href: 'https://twitter.com/agfinancial',
    label: 'X',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18.244 2h3.308l-7.227 8.26L22.827 22h-6.658l-5.214-6.817L4.99 22H1.68l7.73-8.835L1.254 2h6.827l4.713 6.231L18.244 2Zm-1.161 18h1.833L7.08 3.895H5.118L17.083 20Z" />
      </svg>
    ),
  },
  {
    href: 'https://www.facebook.com/agfinancial/',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.78-3.88 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    ),
  },
  {
    href: 'https://www.instagram.com/agfinancial/',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm9.1 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
      </svg>
    ),
  },
  {
    href: 'https://www.youtube.com/AGFinancialSolutions',
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M23 12s0-3.15-.4-4.67a2.43 2.43 0 0 0-1.72-1.72C19.36 5.2 12 5.2 12 5.2s-7.36 0-8.88.41A2.43 2.43 0 0 0 1.4 7.33C1 8.85 1 12 1 12s0 3.15.4 4.67a2.43 2.43 0 0 0 1.72 1.72c1.52.41 8.88.41 8.88.41s7.36 0 8.88-.41a2.43 2.43 0 0 0 1.72-1.72C23 15.15 23 12 23 12Zm-13 3.2V8.8L16 12l-6 3.2Z" />
      </svg>
    ),
  },
];

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="site-footer-main">
        <div className="site-footer-inner">
          <div className="site-footer-grid">
            {footerCols.map((col) => (
              <div key={col.heading} className="site-footer-col">
                <h4>
                  <Link to={col.headingPath}>{col.heading}</Link>
                </h4>
                <ul>
                  {col.links.map(([to, label]) => (
                    <li key={to}>
                      <Link to={to}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="site-footer-col site-footer-brand">
              <Link to="/" className="site-footer-logo-link" aria-label="AGFinancial Home">
                <img src={agfLogo} alt="AGFinancial" className="site-footer-logo-white" />
              </Link>
              <div className="site-footer-social" aria-label="AGFinancial social links">
                {socialLinks.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer noopener" aria-label={item.label}>
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className="site-footer-bottom">
        <div className="site-footer-bottom-inner">
          <div>Copyright AGFinancial {currentYear} - All Rights Reserved</div>
        </div>
      </div>
    </>
  );
}
