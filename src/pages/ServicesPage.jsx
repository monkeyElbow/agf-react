import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

const serviceSlices = [
  {
    title: 'Loans',
    path: '/services/loans',
    color: '#00adbb',
    description: '100% customized. Every loan, from construction to lines of credit.',
    links: [
      { label: 'Loan options', path: '/services/loans' },
      { label: 'Inquiry form', path: '/services/loans#form' },
    ],
  },
  {
    title: 'Investments',
    path: '/services/investments',
    color: '#f26660',
    description: 'Growth for you, growth for Kingdom.',
    links: [
      { label: 'Rates', path: '/services/investments#rates' },
      { label: 'Demand Certificates', path: '/services/investments#certificates' },
      { label: 'Term Certificates', path: '/services/investments#certificates' },
    ],
  },
  {
    title: 'Retirement',
    path: '/services/retirement',
    color: '#76787b',
    description: 'Plan, contribute, and build for tomorrow.',
    links: [
      { label: 'IRAs', path: '/services/retirement/iras' },
      { label: 'AGFinancial 403(b)', path: '/services/retirement/403b' },
      { label: '409A', path: '/services/retirement/409a' },
    ],
  },
  {
    title: 'Legacy Giving',
    path: '/services/legacy-giving',
    color: '#c4beb6',
    description: 'Manage your giving with tax benefits and income generation.',
    links: [
      { label: 'Charitable Gift Annuities', path: '/services/legacy-giving/charitable-gift-annuities' },
      { label: 'Charitable Trusts', path: '/services/legacy-giving/charitable-trusts' },
      { label: 'Generosity Fund', path: '/services/legacy-giving/generosity-fund' },
    ],
  },
  {
    title: 'Insurance',
    path: '/services/insurance',
    color: '#ffa400',
    description: 'Protect your people and property, and manage risk.',
    links: [
      { label: 'Property & Casualty', path: '/services/insurance/property-casualty-insurance' },
      { label: 'Group Life', path: '/services/insurance/group-term-life-insurance' },
      { label: 'Mission Assure', path: '/services/insurance/mission-assure' },
    ],
  },
];

const testimonials = [
  {
    quote: '“Their experience has been a game-changer for us.”',
    author: 'Rich Wilkerson Jr, Vous Church',
  },
  {
    quote: '“Our ministry center would not be here today without AGFinancial’s creative partnership.”',
    author: 'Bryan Jarrett, Lead Pastor, Northplace Church',
  },
  {
    quote: '“We feel like we’re part of the good work AGFinancial is doing.”',
    author: 'Mike, Donor Advised Fund Corporate Client',
  },
];

function describeWedgePath(cx, cy, radius, startAngle, endAngle) {
  const polar = (angle) => ({
    x: cx + (radius * Math.cos(angle)),
    y: cy + (radius * Math.sin(angle)),
  });
  const start = polar(startAngle);
  const end = polar(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

export default function ServicesPage() {
  const pageRef = useRef(null);
  useNativeEnhancements(pageRef);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    if (hoveredIndex !== null) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % serviceSlices.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [hoveredIndex]);

  const wedgePaths = useMemo(() => {
    const cx = 540;
    const cy = 540;
    const radius = 430;
    const sliceAngle = (2 * Math.PI) / serviceSlices.length;
    return serviceSlices.map((slice, index) => {
      const start = index * sliceAngle;
      const end = start + sliceAngle;
      return { ...slice, d: describeWedgePath(cx, cy, radius, start, end) };
    });
  }, []);

  const activeSlice = serviceSlices[hoveredIndex ?? activeIndex];

  return (
    <div ref={pageRef} className="service-native-page services-native-page">
      <section className="services-pie-hero">
        <div className="ag-panel-rail services-pie-hero-grid">
          <div className="services-pie-wrap fade-up">
            <svg viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid meet" className="services-pie-chart" aria-label="Services">
              <circle cx="540" cy="540" r="180" fill="#ffffff" />
              {wedgePaths.map((slice, index) => {
                const isActive = (hoveredIndex ?? activeIndex) === index;
                return (
                  <a
                    key={slice.path}
                    href={slice.path}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <path className={`services-pie-wedge${isActive ? ' is-active' : ''}`} d={slice.d} fill={slice.color} />
                  </a>
                );
              })}
              <circle cx="540" cy="540" r="120" fill="#ffffff" />
            </svg>
          </div>

          <div className="services-pie-title fade-up">
            <h1 className="line1 line2" style={{ color: activeSlice.color }}>{activeSlice.title}</h1>
          </div>
        </div>
      </section>

      <section className="services-native-intro">
        <div className="ag-panel-rail">
          <h2>
            A complete financial strategy for
            {' '}
            <mark>your ministry</mark>
            {' '}
            and
            {' '}
            <mark className="is-gold">your family</mark>.
          </h2>
        </div>
      </section>

      <section className="services-native-grid-wrap">
        <div className="ag-panel-rail">
          <div className="services-native-grid">
            {serviceSlices.map((service) => (
              <article key={service.path} className="services-native-card card2 fade-up">
                <h3><Link to={service.path}>{service.title}</Link></h3>
                <p>{service.description}</p>
                <ul>
                  {service.links.map((item) => (
                    <li key={item.label}>
                      <Link to={item.path}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="services-native-matters">
        <div className="ag-panel-rail">
          <h2>
            What you do
            {' '}
            <mark>matters</mark>
            .
          </h2>
          <p>
            As an AGFinancial customer, your financial decisions fund real ministry work, transforming lives, including yours.
          </p>
        </div>
      </section>

      <section className="services-native-testimonials">
        <div className="ag-panel-rail">
          <h2>Let’s explore what we can do together.</h2>
          <div className="carousel-stack">
            {testimonials.map((item, index) => (
              <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p>{item.quote}</p>
                <p><strong>{item.author}</strong></p>
              </article>
            ))}
          </div>
          <p className="services-native-testimonials-note">
            Testimonials are examples only. Results differ by situation and are not guaranteed.
          </p>
        </div>
      </section>
    </div>
  );
}
