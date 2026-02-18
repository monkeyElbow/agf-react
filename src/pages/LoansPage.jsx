import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useNativeEnhancements from '../hooks/useNativeEnhancements';

const loanOptions = [
  {
    title: 'Permanent',
    description: 'Permanent, first-mortgage financing to help you purchase facilities or refinance existing loans. No short-sighted balloon notes that can leave your ministry financially vulnerable.',
  },
  {
    title: 'First Permanent Location',
    description: 'Designed exclusively for young, high-performing, growing churches to purchase a first permanent facility. This loan helps establish permanent roots, and leaves leasing in the past.',
  },
  {
    title: 'Construction',
    description: 'New construction or renovation, with interest-only payments during the project. After construction, there is a guaranteed conversion-at no cost-to permanent financing.',
  },
  {
    title: 'Facelift',
    description: 'Made for a quick win for "opportunity areas" (cracked parking lot, ancient carpet, music on cassette, etc.) while keeping cash in the bank and holding fundraising for larger future needs.',
  },
  {
    title: 'Vision',
    description: "For large churches with a God-sized vision to buy a new campus, build a new facility, or refresh an existing building. Designed to be a 'war chest' of resources ready when God opens a door and time is of the essence.",
  },
  {
    title: 'Campus Startup',
    description: 'Often, a parent-affiliated church (PAC) is an effective way to reach more of the larger geographic community. This financing package was created for a PAC to plant or revitalize a daughter church.',
  },
  {
    title: 'Credit Line',
    description: 'Precisely what its name implies, a credit line is a convenient, customized alternative for short-term expenses, smaller renovation projects, and ongoing cash flow needs.',
  },
];

const valueCards = [
  {
    title: 'Smart consulting.',
    tone: 'is-atlantean',
    body: "Construction surprises usually aren't fun. Reducing those through front-of-project, detailed consultation has saved numerous churches hundreds of thousands of dollars in 'surprise' expenses and fees. Included with every construction loan.",
  },
  {
    title: 'Teamwork.',
    tone: 'is-mango',
    body: "We're part of your team. Your AGFinancial consultant is ready to answer questions, hear your dreams, listen to your concerns, and make it all as easy as possible. We don't do broker fees, so that relationship you experience? It's genuine.",
  },
  {
    title: 'Roots with values.',
    tone: 'is-sandstone',
    body: 'Over the past 75+ years, AGFinancial has funded more than $1.6 billion in loans to an impressive variety of churches and ministries. Through it all, and just like you, we want to honor Jesus in our partnerships and how we do business.',
  },
];

const testimonials = [
  {
    quote: '“With AGFinancial’s partnership, we’re excited for what’s ahead.”',
    author: 'Jen DeWeerdt, City First Church',
  },
  {
    quote: '“Their experience has been a game-changer for us.”',
    author: 'Rich Wilkerson Jr, Vous Church',
  },
  {
    quote: '“We couldn’t be more pleased with how easy it is to work with their team.”',
    author: 'Mike Santiago, Focus Church',
  },
];

const estimatedLoanAmountOptions = [
  '$100,000-$499,999',
  '$500,000-$2,999,999',
  '$3,000,000+',
];

const states = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'],
  ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'],
  ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'],
  ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const inquiryDefaults = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  ministryName: '',
  ministryWebsite: '',
  city: '',
  state: '',
  estimatedLoanAmount: '',
  purpose: '',
  attendance: '',
  heardAbout: '',
};

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function formatPhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (!digits) {
    return '';
  }
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function parseNumber(value) {
  return Number.parseFloat(String(value || '').replace(/,/g, '')) || 0;
}

function formatAmountInput(value) {
  const raw = String(value || '').replace(/[^\d.]/g, '');
  if (!raw) {
    return '';
  }
  const parts = raw.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calculateLoanSchedule({
  loanAmount, annualRatePercent, termYears, displayOption,
}) {
  const principal = parseNumber(loanAmount);
  const annualRate = Number.parseFloat(annualRatePercent) || 0;
  const years = Number.parseFloat(termYears) || 0;
  if (!principal || !annualRate || !years) {
    return { rows: [], payment: 0, totalPaid: 0, totalInterest: 0 };
  }

  const months = Math.round(years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  let balance = principal;
  const monthlyRows = [];
  for (let month = 1; month <= months; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;
    balance -= principalPaid;
    monthlyRows.push({
      term: month,
      payment,
      principal: principalPaid,
      interest,
      balance: balance > 0 ? balance : 0,
    });
  }

  const rows = displayOption === 'yearly'
    ? monthlyRows.reduce((acc, _, index) => {
      if (index % 12 !== 0) {
        return acc;
      }
      const yearSlice = monthlyRows.slice(index, index + 12);
      acc.push({
        term: `Year ${(index / 12) + 1}`,
        payment: yearSlice.reduce((sum, row) => sum + row.payment, 0),
        principal: yearSlice.reduce((sum, row) => sum + row.principal, 0),
        interest: yearSlice.reduce((sum, row) => sum + row.interest, 0),
        balance: yearSlice[yearSlice.length - 1]?.balance || 0,
      });
      return acc;
    }, [])
    : monthlyRows;

  const totalPaid = payment * months;
  const totalInterest = totalPaid - principal;
  return { rows, payment, totalPaid, totalInterest };
}

function pdfEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildLoanPdf(summaryText, rows) {
  const encoder = new TextEncoder();
  const lines = String(summaryText || '').split('\n').map(pdfEscape);

  const teal = '0 0.64 0.70';
  const gold = '0.98 0.64 0.10';

  let content = '';
  content += 'q\n';
  content += `${teal} rg\n`;
  content += '36 730 540 60 re f\n';
  content += 'Q\n';
  content += 'BT\n';
  content += '1 1 1 rg\n';
  content += '/F1 18 Tf\n';
  content += '1 0 0 1 54 758 Tm (AGFinancial Loan Payment Summary) Tj\n';
  content += 'ET\n';
  content += 'BT\n';
  content += '0 0 0 rg\n';
  content += '/F1 12 Tf\n';

  let y = 710;
  const leadLines = lines.slice(0, 10);
  leadLines.forEach((line, index) => {
    content += `1 0 0 1 54 ${y - (index * 16)} Tm (${line}) Tj\n`;
  });

  y -= (leadLines.length * 16) + 10;
  content += `${gold} rg\n`;
  content += '/F1 12 Tf\n';
  content += `1 0 0 1 54 ${y} Tm (Amortization Schedule) Tj\n`;
  content += '0 0 0 rg\n';
  y -= 18;
  content += '/F1 10 Tf\n';
  content += `${gold} rg\n`;
  content += `1 0 0 1 54 ${y} Tm (Period) Tj\n`;
  content += `1 0 0 1 140 ${y} Tm (Payment) Tj\n`;
  content += `1 0 0 1 230 ${y} Tm (Principal) Tj\n`;
  content += `1 0 0 1 330 ${y} Tm (Interest) Tj\n`;
  content += `1 0 0 1 430 ${y} Tm (Balance) Tj\n`;
  content += '0 0 0 rg\n';
  y -= 14;

  rows.forEach((row, index) => {
    const posY = y - (index * 12);
    if (posY < 80) {
      return;
    }
    content += `1 0 0 1 54 ${posY} Tm (${pdfEscape(String(row.term))}) Tj\n`;
    content += `1 0 0 1 140 ${posY} Tm ($${row.payment.toFixed(2)}) Tj\n`;
    content += `1 0 0 1 230 ${posY} Tm ($${row.principal.toFixed(2)}) Tj\n`;
    content += `1 0 0 1 330 ${posY} Tm ($${row.interest.toFixed(2)}) Tj\n`;
    content += `1 0 0 1 430 ${posY} Tm ($${row.balance.toFixed(2)}) Tj\n`;
  });
  content += 'ET\n';

  const contentBytes = encoder.encode(content);
  const header = '%PDF-1.4\n';
  const objs = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj\n',
    `4 0 obj << /Length ${contentBytes.length} >> stream\n${content}endstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];

  const offsets = [0];
  let cursor = encoder.encode(header).length;
  for (let i = 0; i < objs.length; i += 1) {
    offsets.push(cursor);
    cursor += encoder.encode(objs[i]).length;
  }

  const xrefStart = cursor;
  let xref = 'xref\n';
  xref += `0 ${offsets.length}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref += '\n';

  const trailer = `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const pdfString = `${header}${objs.join('')}${xref}${trailer}`;
  return new Blob([encoder.encode(pdfString)], { type: 'application/pdf' });
}

export default function LoansPage() {
  const pageRef = useRef(null);
  const [inquiryStep, setInquiryStep] = useState(0);
  const [inquiry, setInquiry] = useState(inquiryDefaults);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [displayOption, setDisplayOption] = useState('yearly');
  const [loanRows, setLoanRows] = useState([]);
  const [estimatedPayment, setEstimatedPayment] = useState(0);
  const [estimatedTotalPaid, setEstimatedTotalPaid] = useState(0);
  const [estimatedTotalInterest, setEstimatedTotalInterest] = useState(0);
  const [downloadName, setDownloadName] = useState('');
  const [downloadEmail, setDownloadEmail] = useState('');
  const [loanChurch, setLoanChurch] = useState('');
  const [loanState, setLoanState] = useState('');
  const [loanPhone, setLoanPhone] = useState('');
  const [loanPhoneNote, setLoanPhoneNote] = useState('');

  const [ctaName, setCtaName] = useState('');
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaPhone, setCtaPhone] = useState('');
  const [ctaMessage, setCtaMessage] = useState('');

  useNativeEnhancements(pageRef);

  const canDownload = useMemo(
    () => loanRows.length > 0 && downloadName.trim() && validEmail(downloadEmail),
    [loanRows.length, downloadEmail, downloadName],
  );

  function updateInquiryValue(key, value) {
    setInquiry((current) => ({ ...current, [key]: value }));
  }

  function validateInquiryStep(step) {
    if (step === 0) {
      if (!inquiry.firstName.trim() || !inquiry.lastName.trim() || !inquiry.phone.trim() || !validEmail(inquiry.email)) {
        return 'Enter first name, last name, phone, and a valid email to continue.';
      }
    }
    if (step === 1) {
      if (!inquiry.ministryName.trim() || !inquiry.city.trim() || !inquiry.state.trim()) {
        return 'Enter ministry name, city, and state to continue.';
      }
    }
    if (step === 2) {
      if (!inquiry.estimatedLoanAmount.trim() || !inquiry.heardAbout.trim()) {
        return 'Select estimated loan amount and tell us how you heard about us.';
      }
    }
    return '';
  }

  function onInquiryNext() {
    const error = validateInquiryStep(inquiryStep);
    if (error) {
      setInquiryError(error);
      return;
    }
    setInquiryError('');
    setInquiryStep((current) => Math.min(2, current + 1));
  }

  function onInquiryBack() {
    setInquiryError('');
    setInquiryStep((current) => Math.max(0, current - 1));
  }

  function onInquirySubmit(event) {
    event.preventDefault();
    const error = validateInquiryStep(2);
    if (error) {
      setInquiryError(error);
      return;
    }
    setInquirySubmitted(true);
    setInquiryError('');
    setInquiryStep(0);
    setInquiry(inquiryDefaults);
  }

  function runLoanCalculation() {
    const result = calculateLoanSchedule({
      loanAmount,
      annualRatePercent: interestRate,
      termYears: loanTerm,
      displayOption,
    });
    setLoanRows(result.rows);
    setEstimatedPayment(result.payment);
    setEstimatedTotalPaid(result.totalPaid);
    setEstimatedTotalInterest(result.totalInterest);
  }

  function onLoanDownload(event) {
    event.preventDefault();
    if (!canDownload) {
      return;
    }

    const summary = [
      `Prepared for: ${downloadName.trim() || 'you'}`,
      `Email: ${downloadEmail.trim() || '-'}`,
      '',
      `Loan Amount: $${formatCurrency(parseNumber(loanAmount))}`,
      `Annual Interest Rate: ${(Number.parseFloat(interestRate) || 0).toFixed(2)}%`,
      `Term: ${loanTerm || '-'} years`,
      `Display: ${displayOption === 'yearly' ? 'Yearly' : 'Monthly'}`,
      `Payment: $${formatCurrency(estimatedPayment)}`,
      `Estimated Total Paid: $${formatCurrency(estimatedTotalPaid)}`,
      `Estimated Total Interest: $${formatCurrency(estimatedTotalInterest)}`,
      '',
      'Disclosure: This calculator uses example data and is not an AGFinancial official quote or recommendation.',
    ].join('\n');

    const blob = buildLoanPdf(summary, loanRows);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const prefix = downloadName.trim() ? `${downloadName.trim().replace(/[^\w-]+/g, '-')}-` : '';
    anchor.href = url;
    anchor.download = `${prefix}AGFinancial-Loan-Payment.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function onLoanPhoneSubmit(event) {
    event.preventDefault();
    if (!loanPhone.trim()) {
      setLoanPhoneNote('Please enter a phone number.');
      return;
    }
    setLoanPhoneNote('Thanks! We will reach out soon.');
  }

  function onCtaSubmit(event) {
    event.preventDefault();
    if (!ctaName.trim() || !validEmail(ctaEmail)) {
      setCtaMessage('Add your name and email to connect.');
      return;
    }

    const payload = {
      name: ctaName.trim(),
      email: ctaEmail.trim(),
      phone: ctaPhone.trim(),
      loan: {
        amount: parseNumber(loanAmount),
        rateAnnualPct: Number.parseFloat(interestRate) || 0,
        termYears: Number.parseFloat(loanTerm) || 0,
        displayOption,
        estPayment: Number(estimatedPayment.toFixed(2)),
        estTotalPaid: Number(estimatedTotalPaid.toFixed(2)),
        estTotalInterest: Number(estimatedTotalInterest.toFixed(2)),
      },
    };

    document.dispatchEvent(new CustomEvent('agf:cta-submit', { detail: payload }));
    setCtaMessage('Got it. We will reach out soon.');
    setCtaName('');
    setCtaEmail('');
    setCtaPhone('');
  }

  return (
    <div ref={pageRef} className="service-native-page loans-native-page">
      <section className="service-native-hero">
        <div className="ag-panel-rail">
          <h1 className="lineblur loans-native-hero-line is-vision">
            <mark>Your</mark>
            {' '}
            vision
            <mark>.</mark>
          </h1>
          <h1 className="lineB loans-native-hero-line is-purpose">
            <mark>Our</mark>
            {' '}
            purpose
            <mark>.</mark>
          </h1>
        </div>
      </section>

      <section className="service-native-intro loans-native-intro">
        <div className="ag-panel-rail">
          <h2>The right loan can change everything.</h2>
          <p>
            Your vision of reaching communities and changing lives drives us. As one of the nation&apos;s largest, most
            experienced church loan providers, we want to be part of your ministry. Let&apos;s take bold steps together
            for the Kingdom.
          </p>
          <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
            <Link to="/services/loans#form" className="service-native-btn">Get started</Link>
          </div>
        </div>
      </section>

      <section className="service-native-section loans-native-options" id="loan-options">
        <div className="ag-panel-rail-wide">
          <h2 className="loans-native-options-title">Every loan, 100% customized.</h2>
          <h3 className="loans-native-options-subtitle">You won&apos;t find this at a bank.</h3>
          <p className="loans-native-options-lead">
            We&apos;re more than a financial partner. We&apos;re part of your ministry. It&apos;s our pleasure to design
            a loan with rates and flexible terms <strong>specifically for you</strong>. The loans lineup below might
            give you a great place to start.
          </p>
          <div className="service-native-grid loans-native-options-grid">
            {loanOptions.map((item) => (
              <article key={item.title} className="service-native-card loans-native-option-card card2 fade-up">
                <h3>{item.title}</h3>
                <hr />
                <p>{item.description}</p>
              </article>
            ))}
            <article className="loans-native-option-question fade-up">
              <h3>Which loan is right for me?</h3>
              <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
                <Link to="/services/loans/loans-consultant" className="service-native-btn">Ask my loan expert</Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="service-native-section loans-native-inquiry" id="form">
        <div className="ag-panel-rail-wide loans-native-inquiry-grid">
          <article className="loans-native-inquiry-card fade-up">
            {!inquirySubmitted ? (
              <form className="loans-native-inquiry-form" onSubmit={onInquirySubmit}>
                {inquiryStep === 0 ? (
                  <>
                    <label htmlFor="loan-inquiry-first-name">First Name*</label>
                    <input id="loan-inquiry-first-name" value={inquiry.firstName} onChange={(event) => updateInquiryValue('firstName', event.target.value)} required />
                    <label htmlFor="loan-inquiry-last-name">Last Name*</label>
                    <input id="loan-inquiry-last-name" value={inquiry.lastName} onChange={(event) => updateInquiryValue('lastName', event.target.value)} required />
                    <label htmlFor="loan-inquiry-phone">Phone*</label>
                    <input id="loan-inquiry-phone" value={inquiry.phone} onChange={(event) => updateInquiryValue('phone', formatPhoneInput(event.target.value))} required />
                    <label htmlFor="loan-inquiry-email">Email*</label>
                    <input id="loan-inquiry-email" type="email" value={inquiry.email} onChange={(event) => updateInquiryValue('email', event.target.value)} required />
                  </>
                ) : null}

                {inquiryStep === 1 ? (
                  <>
                    <label htmlFor="loan-inquiry-ministry">Ministry Name*</label>
                    <input id="loan-inquiry-ministry" value={inquiry.ministryName} onChange={(event) => updateInquiryValue('ministryName', event.target.value)} required />
                    <label htmlFor="loan-inquiry-website">Ministry Website</label>
                    <input id="loan-inquiry-website" value={inquiry.ministryWebsite} onChange={(event) => updateInquiryValue('ministryWebsite', event.target.value)} />
                    <label htmlFor="loan-inquiry-city">City*</label>
                    <input id="loan-inquiry-city" value={inquiry.city} onChange={(event) => updateInquiryValue('city', event.target.value)} required />
                    <label htmlFor="loan-inquiry-state">State*</label>
                    <select id="loan-inquiry-state" value={inquiry.state} onChange={(event) => updateInquiryValue('state', event.target.value)} required>
                      <option value="" disabled>Choose one</option>
                      {states.map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </>
                ) : null}

                {inquiryStep === 2 ? (
                  <>
                    <label htmlFor="loan-inquiry-estimated">Estimated Loan Amount*</label>
                    <select id="loan-inquiry-estimated" value={inquiry.estimatedLoanAmount} onChange={(event) => updateInquiryValue('estimatedLoanAmount', event.target.value)} required>
                      <option value="" disabled>Choose one</option>
                      {estimatedLoanAmountOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <label htmlFor="loan-inquiry-purpose">Purpose of Loan</label>
                    <input id="loan-inquiry-purpose" value={inquiry.purpose} onChange={(event) => updateInquiryValue('purpose', event.target.value)} />
                    <label htmlFor="loan-inquiry-attendance">Weekly attendance (if applicable)</label>
                    <input id="loan-inquiry-attendance" value={inquiry.attendance} onChange={(event) => updateInquiryValue('attendance', event.target.value)} />
                    <label htmlFor="loan-inquiry-heard-about">How did you hear about us?*</label>
                    <input id="loan-inquiry-heard-about" value={inquiry.heardAbout} onChange={(event) => updateInquiryValue('heardAbout', event.target.value)} required />
                  </>
                ) : null}

                {inquiryError ? <p className="loans-native-form-error">{inquiryError}</p> : null}

                <div className="loans-native-inquiry-actions">
                  {inquiryStep > 0 ? <button type="button" className="service-native-btn is-ghost" onClick={onInquiryBack}>Back</button> : <span />}
                  {inquiryStep < 2 ? <button type="button" className="service-native-btn" onClick={onInquiryNext}>Next</button> : <button type="submit" className="service-native-btn">Submit</button>}
                </div>

                <div className="loans-native-form-progress" aria-hidden="true">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className={`loans-native-form-dot${inquiryStep === dot ? ' is-active' : ''}`} />
                  ))}
                </div>
              </form>
            ) : (
              <div className="loans-native-form-thankyou">
                <h3>Thank you!</h3>
                <p>Your submission has been received. We&apos;ll be in touch shortly.</p>
              </div>
            )}
          </article>

          <aside className="loans-native-inquiry-copy fade-up">
            <h3>
              Ready to grow
              <br />
              <mark>when you are.</mark>
            </h3>
            <p>
              First things first, whether you&apos;re simply curious or ready to greenlight your project:
              {' '}
              <mark>complete the inquiry form</mark>
              . It&apos;s short, sweet, and vital. The information you provide will help share your vision with your consultant.
            </p>
          </aside>
        </div>
      </section>

      <section className="service-native-section loans-native-more" id="theresmore">
        <div className="ag-panel-rail-wide">
          <h2 className="loans-native-more-title">There&apos;s more to every loan.</h2>
          <div className="service-native-grid loans-native-more-grid">
            {valueCards.map((card) => (
              <article key={card.title} className="service-native-card loans-native-more-card fade-up">
                <h3 className={card.tone}>
                  <mark>{card.title}</mark>
                </h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-native-section loans-native-calculator-wrap">
        <div className="ag-panel-rail-wide">
          <h2 className="loans-native-calculator-title">
            Run some numbers.
            {' '}
            <mark>Impress your pastor.</mark>
          </h2>
          <div className="loans-native-calculator">
            <h3>Loan Payment Calculator</h3>
            <div className="loans-native-calculator-grid">
              <div>
                <label htmlFor="loan-calc-amount">Loan Amount ($)</label>
                <input
                  id="loan-calc-amount"
                  value={loanAmount}
                  inputMode="numeric"
                  onChange={(event) => setLoanAmount(formatAmountInput(event.target.value))}
                />
              </div>
              <div>
                <label htmlFor="loan-calc-rate">Annual Interest Rate (%)</label>
                <input
                  id="loan-calc-rate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="loan-calc-term">Term of Loan (years)</label>
                <select id="loan-calc-term" value={loanTerm} onChange={(event) => setLoanTerm(event.target.value)}>
                  <option value="" disabled>Choose one</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                </select>
              </div>
              <div>
                <label htmlFor="loan-calc-display">Display Table By</label>
                <select id="loan-calc-display" value={displayOption} onChange={(event) => setDisplayOption(event.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="loans-native-calc-actions">
              <button type="button" className="service-native-btn" onClick={runLoanCalculation}>Calculate</button>
              <p className="loans-native-disclaimer">
                <strong>Disclosure:</strong>
                {' '}
                This calculator is for illustration purposes only. It is neither an official AGFinancial quote nor recommendation.
              </p>
            </div>

            {loanRows.length ? (
              <div className="loans-native-calc-results">
                <h4>Amortization Schedule</h4>
                <div className="table-scroll loans-native-table-scroll">
                  <table className="ag-table has-fixed-layout">
                    <thead>
                      <tr>
                        <th>Term</th>
                        <th>Payment</th>
                        <th>Principal Paid</th>
                        <th>Interest Paid</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanRows.map((row) => (
                        <tr key={row.term}>
                          <td>{row.term}</td>
                          <td>${formatCurrency(row.payment)}</td>
                          <td>${formatCurrency(row.principal)}</td>
                          <td>${formatCurrency(row.interest)}</td>
                          <td>${formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="loans-native-gated">
                  <h4>Download your example.</h4>
                  <p className="loans-native-gated-note">Provide your name and organization to personalize your summary. None of this information is collected or retained. Your example is for illustrative purposes only.</p>
                  <div className="loans-native-gated-row">
                    <input value={downloadName} placeholder="Your name" onChange={(event) => setDownloadName(event.target.value)} />
                    <input type="email" value={downloadEmail} placeholder="you@example.com" onChange={(event) => setDownloadEmail(event.target.value)} />
                  </div>
                  <div className="loans-native-gated-actions">
                    <button type="button" className="service-native-btn" onClick={onLoanDownload} disabled={!canDownload}>Download PDF</button>
                  </div>
                </div>

                <div className="loans-native-contact">
                  <h4>Ready to share your vision?</h4>
                  <p>Your AGFinancial loan consultant will contact you, ready to discuss what you have in mind. Zero pressure.</p>
                  <div className="loans-native-contact-row">
                    <input value={loanChurch} placeholder="Organization" onChange={(event) => setLoanChurch(event.target.value)} />
                    <select value={loanState} onChange={(event) => setLoanState(event.target.value)}>
                      <option value="">State</option>
                      {states.map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="loans-native-contact-row">
                    <input value={loanPhone} placeholder="(555) 555-5555" onChange={(event) => setLoanPhone(formatPhoneInput(event.target.value))} />
                    <button type="button" className="service-native-btn" onClick={onLoanPhoneSubmit}>Call me</button>
                    {loanPhoneNote ? <span className="loans-native-contact-note">{loanPhoneNote}</span> : null}
                  </div>
                  <p className="loans-native-disclaimer">
                    <strong>Disclosure:</strong>
                    {' '}
                    This calculator uses example data and is not an AGFinancial official quote or recommendation.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="service-native-section loans-native-vision-fuel">
        <div className="ag-panel-rail">
          <h2>Vision fuel.</h2>
          <h3>One bold step at a time.</h3>
          <p>Loans guided by your ministry, driven by your mission, and powered by AGFinancial.</p>
          <div className="service-native-action-row" style={{ justifyContent: 'center' }}>
            <Link to="/services/loans#form" className="service-native-btn">Start the process</Link>
          </div>
        </div>
      </section>

      <section className="service-native-section loans-native-cta-addon">
        <div className="ag-panel-rail">
          <form className="loans-native-addon-form" onSubmit={onCtaSubmit}>
            <h4>Explore your options. Zero pressure.</h4>
            <label htmlFor="loan-addon-name">Name</label>
            <input id="loan-addon-name" value={ctaName} onChange={(event) => setCtaName(event.target.value)} required />
            <label htmlFor="loan-addon-email">Email</label>
            <input id="loan-addon-email" type="email" value={ctaEmail} onChange={(event) => setCtaEmail(event.target.value)} required />
            <label htmlFor="loan-addon-phone">Phone</label>
            <input id="loan-addon-phone" value={ctaPhone} placeholder="(555) 555-5555" onChange={(event) => setCtaPhone(formatPhoneInput(event.target.value))} />
            <h5>Let&apos;s talk about making it happen.</h5>
            <button type="submit" className="service-native-btn">Follow-up with me</button>
            {ctaMessage ? <small>{ctaMessage}</small> : null}
          </form>
        </div>
      </section>

      <section className="service-native-section loans-native-testimonials">
        <div className="ag-panel-rail">
          <div className="carousel-stack">
            {testimonials.map((item, index) => (
              <article key={item.author} className={`carousel-frame${index === 0 ? ' is-active' : ''}`}>
                <p className="loans-native-testimonial-quote"><strong>{item.quote}</strong></p>
                <p className="loans-native-testimonial-author">-<strong>{item.author}</strong></p>
              </article>
            ))}
          </div>
          <p className="loans-native-fineprint">Testimonials found on this site are examples of what we have done for other clients, and what some of our clients have said about us. However, we cannot guarantee the results in any case. Your results may vary and every situation is different. No compensation was provided for these testimonials.</p>
        </div>
      </section>

      <section className="service-native-section loans-native-tariffs">
        <div className="ag-panel-rail-wide">
          <div className="service-native-dark-feature fade-up">
            <div className="service-native-dark-feature-inner">
              <div className="service-native-dark-feature-media loans-native-tariffs-media" />
              <div className="service-native-dark-feature-copy">
                <h3>Tariffs, Timing &amp; Truth</h3>
                <p>Keep your ministry&apos;s building plan moving forward, even through chaotic markets.</p>
                <div className="service-native-action-row">
                  <Link to="/resources" className="service-native-btn">See the strategies</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
