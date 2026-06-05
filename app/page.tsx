'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SERVICES } from '@/lib/constants';
import { Icon } from '@/components/Icon';

const TESTIMONIALS = [
  { name: 'Priya Sharma',  city: 'New Delhi',  rating: 5, text: 'Pandit ji\'s Kundli analysis was spot-on. He predicted career changes months before they happened. His remedies helped me through a very tough phase.' },
  { name: 'Rakesh Gupta',  city: 'Noida',      rating: 5, text: 'Got our marriage compatibility done. Every aspect was explained clearly. His Vastu suggestions for our new home have brought immense peace.' },
  { name: 'Sunita Verma',  city: 'Mumbai',     rating: 5, text: 'Online consultation was seamless. Pandit ji is extremely knowledgeable and patient. His predictions about my son\'s education were incredibly accurate.' },
  { name: 'Amit Joshi',    city: 'Gurgaon',    rating: 5, text: 'Career astrology consultation was life-changing. He guided me to switch fields at the right time. Within 6 months I was promoted.' },
  { name: 'Meera Patel',   city: 'Ahmedabad',  rating: 5, text: 'Numerology session was fascinating. Pandit ji suggested name correction for my business and we saw clear results within 3 months.' },
  { name: 'Vikram Singh',  city: 'Jaipur',     rating: 5, text: 'My family has consulted Pandit H.R. Pathak for 8 years. His accuracy in Vedic Jyotish is unmatched. A true master of this ancient science.' },
];

const FAQS = [
  { q: 'What information do I need for a Kundli Analysis?', a: 'You need your date of birth, exact time of birth, and birth city. The time of birth is crucial for accurate house calculations and predictions.' },
  { q: 'How is the online consultation conducted?', a: 'After your booking is confirmed, a Google Meet link is shared on WhatsApp. The session is conducted via video call — convenient from anywhere in the world.' },
  { q: 'Is the ₹1100 fee for Kundli Analysis paid online?', a: 'Yes, payment is made directly via UPI QR code — 100% goes to Pandit ji with zero gateway cut. Other services have a custom fee discussed after booking.' },
  { q: 'How accurate are the predictions?', a: 'Vedic Jyotish is a precise science factoring planetary positions at birth. Pandit H.R. Pathak has 60+ years of experience and a proven track record with 56,000+ Kundlis.' },
  { q: 'Can I book for a family member?', a: 'Absolutely. Many clients book for their spouse, children, or parents. Please provide the birth details of the person the consultation is for.' },
  { q: 'What if I don\'t know my exact birth time?', a: 'Pandit ji can perform Prashna Kundli (horary astrology) or use Nadi techniques. Please mention this in the query section during booking.' },
  { q: 'How far in advance should I book?', a: 'We recommend booking 2–3 days in advance. For urgent queries, contact us directly on WhatsApp.' },
  { q: 'Are the remedies expensive?', a: 'Pandit ji believes in practical, accessible remedies — mantras, optional gemstones, fasting, or charitable acts. Nothing expensive or impractical.' },
];

const ZODIAC_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ZODIAC_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-reveal (does NOT touch FAQ items)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Particle stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      a: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.003 + 0.001,
      color: Math.random() > 0.65 ? '#c4622d' : '#8a6008',
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.a += s.speed;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.12 + Math.abs(Math.sin(s.a)) * 0.35;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, []);

  // Stat counters
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = parseInt(el.dataset.target || '0');
        let current = 0;
        const step = target / 55;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          const n = Math.floor(current);
          el.textContent = (target >= 1000 ? n.toLocaleString('en-IN') : String(n)) + (el.dataset.suffix || '');
          if (current >= target) clearInterval(timer);
        }, 22);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll<HTMLElement>('[data-target]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="stars-canvas" aria-hidden="true" />

      {/* WhatsApp Float */}
      <a href="https://wa.me/919643437281" className="wa-float" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
        <div className="wa-pulse" />
        <Icon name="whatsapp" size={24} stroke="none" />
      </a>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-brand">
          {/* Logo placeholder — user will add their own */}
          <div className="navbar-logo-placeholder" aria-hidden="true">
            <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <circle cx="22" cy="22" r="20" stroke="var(--rust)" strokeWidth="1.2" />
              <circle cx="22" cy="22" r="14" stroke="var(--gold)" strokeWidth="0.8" />
              <circle cx="22" cy="22" r="4" fill="var(--rust)" opacity="0.7" />
              <line x1="2" y1="22" x2="42" y2="22" stroke="var(--border-md)" strokeWidth="0.6" />
              <line x1="22" y1="2" x2="22" y2="42" stroke="var(--border-md)" strokeWidth="0.6" />
              <line x1="8" y1="8" x2="36" y2="36" stroke="var(--border-md)" strokeWidth="0.6" />
              <line x1="36" y1="8" x2="8" y2="36" stroke="var(--border-md)" strokeWidth="0.6" />
            </svg>
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">Astro<span>Pathak</span></span>
            <span className="navbar-brand-sub">Vedic Jyotish Guidance</span>
          </div>
        </div>
        <ul className="navbar-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#about">Astrologer</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><Link href="/book" className="navbar-cta">Book Now</Link></li>
        </ul>
        <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
          <Icon name={mobileOpen ? 'x' : 'menu'} size={22} />
        </button>
        {mobileOpen && (
          <div className="mobile-menu">
            {[['#services','Services'],['#about','Astrologer'],['#how','How It Works'],['#testimonials','Testimonials'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="mobile-menu-link" onClick={() => setMobileOpen(false)}>{label}</a>
            ))}
            <Link href="/book" className="btn-rust" style={{ textAlign: 'center' }} onClick={() => setMobileOpen(false)}>
              Book Now
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="hero-mandala-wrap" aria-hidden="true">
          <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <g fill="none" stroke="#b8860b" strokeWidth="0.8">
              <circle cx="200" cy="200" r="190"/><circle cx="200" cy="200" r="165"/>
              <circle cx="200" cy="200" r="140"/><circle cx="200" cy="200" r="115"/>
              <circle cx="200" cy="200" r="90"/> <circle cx="200" cy="200" r="65"/>
              <circle cx="200" cy="200" r="40"/>
              <line x1="10" y1="200" x2="390" y2="200"/>
              <line x1="200" y1="10" x2="200" y2="390"/>
              <line x1="65" y1="65" x2="335" y2="335"/>
              <line x1="335" y1="65" x2="65" y2="335"/>
              <line x1="10" y1="110" x2="390" y2="290"/>
              <line x1="110" y1="10" x2="290" y2="390"/>
              <line x1="10" y1="290" x2="390" y2="110"/>
              <line x1="290" y1="10" x2="110" y2="390"/>
            </g>
          </svg>
        </div>
        <div className="hero-mandala-inner-wrap" aria-hidden="true">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <g fill="none" stroke="#c4622d" strokeWidth="1">
              <circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="70"/>
              <circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="30"/>
              <polygon points="100,10 190,55 190,145 100,190 10,145 10,55"/>
              <polygon points="100,30 170,68 170,132 100,170 30,132 30,68"/>
            </g>
          </svg>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Vedic Jyotish Acharya
          </div>
          <span className="hero-om">॥ ॐ नमः शिवाय ॥</span>
          <h1 className="hero-title">
            Astro
            <span className="line2">Pathak</span>
          </h1>
          <div className="hero-divider"><hr /><span className="sym">✦</span><hr /></div>
          <p className="hero-tagline">ज्योतिष से जानें भविष्य,<br />सही मार्ग पर बढ़ें निश्चय।</p>
          <p className="hero-sub">Personalized Vedic guidance rooted in ancient wisdom — for love, career, health &amp; destiny.</p>
          <div className="hero-pills">
            {['Ancient Wisdom','Accurate Insights','Modern Solutions','100% Confidential'].map(p => (
              <span key={p} className="pill">{p}</span>
            ))}
          </div>
          <div className="hero-actions">
            <Link href="/book" className="btn-rust">Book Your Reading</Link>
            <a href="tel:9643437281" className="btn-outline-rust">
              <Icon name="phone" size={16} /> 96434 37281
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-bar">
        {[
          { target: 56000, suffix: '+', label: 'Kundlis Analysed' },
          { target: 60,    suffix: '+', label: 'Years of Experience' },
          { target: 8,     suffix: '',  label: 'Services Offered' },
        ].map(s => (
          <div key={s.label} className="stat-item">
            <div className="stat-num" data-target={s.target} data-suffix={s.suffix}>0</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Zodiac Strip */}
      <div className="zodiac-strip" aria-hidden="true">
        <div className="zodiac-scroll">
          {[...ZODIAC_SIGNS, ...ZODIAC_SIGNS].map((sign, i) => (
            <span key={i} className="zodiac-item">
              <span className="zodiac-sym">{ZODIAC_GLYPHS[i % 12]}</span>
              {sign}
            </span>
          ))}
        </div>
      </div>

      {/* Services */}
      <section className="section-alt" id="services" style={{ padding: 'var(--section-py) 6%' }}>
        <p className="s-eyebrow fade-up">What We Offer</p>
        <div className="gold-line fade-up" />
        <h2 className="s-title fade-up">Our Consultation Services</h2>
        <p className="s-sub fade-up">Ancient wisdom applied to modern challenges — each reading personalised and actionable</p>
        <div className="services-grid">
          {SERVICES.map((svc, i) => (
            <div key={svc.name} className="svc-card fade-up" style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className="svc-icon-wrap">
                <Icon name={svc.icon} size={28} stroke="var(--rust)" />
              </div>
              <div className="svc-name">{svc.name}</div>
              <div className="svc-desc">{svc.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: 'var(--section-py) 6%', background: 'var(--cream)' }}>
        <div className="about-inner">
          <div className="about-visual fade-up">
            <div className="about-corner tl" />
            <div className="about-corner br" />
            <div className="about-frame" style={{ fontSize: 'unset', position: 'relative', overflow: 'hidden' }}>
              <Image
                src="/pandit-pathak.jpg"
                alt="Pandit H.R. Pathak — Vedic Jyotish Acharya"
                fill
                style={{ objectFit: 'cover', objectPosition: 'top center' }}
                priority
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="about-frame-label">
                <p>Pandit H.R. Pathak</p>
                <p>Jyotish Acharya — 60+ Years Practice</p>
              </div>
            </div>
          </div>
          <div className="fade-up">
            <div className="about-eyebrow">The Astrologer</div>
            <div className="gold-line" style={{ margin: '0 0 14px', background: 'linear-gradient(90deg, var(--rust), transparent)' }} />
            <h2 className="about-heading">Pandit<br />H.R. Pathak</h2>
            <p className="about-body">
              With over 55 years of dedicated practice in Vedic Jyotish, Pandit H.R. Pathak has guided 
              thousands of seekers across India and abroad. Trained in the classical traditions of North 
              Indian astrology, he combines ancient texts with intuitive insight to deliver guidance 
              that is both accurate and transformative.
            </p>
            <ul className="about-list">
              {[
                '60+ years of professional Jyotish practice',
                '56,000+ Kundlis analyzed with proven accuracy',
                'Consultations available in Hindi & English',
                'Online & in-person sessions',
                'Trained in Parashara Hora Shastra',
              ].map(cred => (
                <li key={cred}>
                  <span className="about-check"><Icon name="check" size={13} stroke="var(--rust)" /></span>
                  <span>{cred}</span>
                </li>
              ))}
            </ul>
            <Link href="/book" className="btn-rust">Book a Consultation</Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-alt" id="how" style={{ padding: 'var(--section-py) 6%' }}>
        <p className="s-eyebrow fade-up">Simple Process</p>
        <div className="gold-line fade-up" />
        <h2 className="s-title fade-up">How It Works</h2>
        <p className="s-sub fade-up">Your journey to cosmic clarity in three steps</p>
        <div className="how-grid">
          {[
            { num: '१', icon: 'clipboard', title: 'Fill Booking Form', desc: 'Choose your service, date & time slot. Share your birth details for accurate chart preparation.' },
            { num: '२', icon: 'upi',       title: 'Pay & Confirm',    desc: 'For Kundli Analysis, pay ₹1100 via UPI — direct, zero gateway cut. Other services are quoted via WhatsApp.' },
            { num: '३', icon: 'sun',       title: 'Receive Guidance', desc: 'Connect via Google Meet or visit in person. Get your personalised Vedic reading with practical remedies.' },
          ].map((step, i) => (
            <div key={i} className="how-card fade-up" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="how-num">{step.num}</div>
              <div className="how-icon-wrap">
                <Icon name={step.icon} size={26} stroke="var(--rust)" />
              </div>
              <div className="how-title">{step.title}</div>
              <div className="how-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ padding: 'var(--section-py) 6%', background: 'var(--cream)' }}>
        <p className="s-eyebrow fade-up">What Clients Say</p>
        <div className="gold-line fade-up" />
        <h2 className="s-title fade-up">Words of Gratitude</h2>
        <p className="s-sub fade-up">Thousands of lives transformed by authentic Vedic wisdom</p>
        <div className="testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testi-card fade-up" style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className="testi-quote">&ldquo;</div>
              <div className="testi-stars">
                {Array.from({ length: t.rating }, (_, j) => (
                  <Icon key={j} name="star" size={13} stroke="var(--gold-lt)" />
                ))}
              </div>
              <p className="testi-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testi-author">
                <div className="testi-avatar">{t.name[0]}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-loc">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — NO fade-up on items (prevents vanishing bug) */}
      <section className="section-alt" id="faq" style={{ padding: 'var(--section-py) 6%' }}>
        <p className="s-eyebrow fade-up">Questions Answered</p>
        <div className="gold-line fade-up" />
        <h2 className="s-title fade-up">Frequently Asked Questions</h2>
        <p className="s-sub fade-up">Everything you need to know before your consultation</p>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span className={`faq-chevron ${openFaq === i ? 'open' : ''}`}>
                  <Icon name="chevron-down" size={18} stroke="var(--rust)" />
                </span>
              </button>
              <div className="faq-answer">
                <div className="faq-answer-inner">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--section-py) 6%', background: 'var(--cream)' }}>
        <div className="cta-banner fade-up">
          <p className="s-eyebrow" style={{ marginBottom: 10 }}>Begin Your Journey</p>
          <h2>Discover Your<br /><span style={{ color: 'var(--rust)' }}>Cosmic Path Today</span></h2>
          <p>Book a consultation and gain clarity on life&apos;s most important decisions.</p>
          <div className="cta-actions">
            <Link href="/book" className="btn-rust">Book Consultation</Link>
            <a href="https://wa.me/919643437281" target="_blank" rel="noreferrer" className="btn-outline-rust">
              <Icon name="whatsapp" size={16} stroke="none" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-logo-title">Astro<span>Pathak</span></div>
            <p className="footer-brand-desc">
              Authentic Vedic Jyotish consultations by Pandit H.R. Pathak.
              60+ years guiding families across India &amp; abroad.
            </p>
            <p className="footer-brand-om">॥ ज्योतिष से जीवन को रोशन करें ॥</p>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              {SERVICES.slice(0, 5).map(s => <li key={s.name}><Link href="/book">{s.name}</Link></li>)}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Pandit ji</a></li>
              <li><a href="#how">How It Works</a></li>
              <li><a href="#testimonials">Testimonials</a></li>
              <li><a href="#faq">FAQs</a></li>
              <li><Link href="/book">Book Now</Link></li>
            </ul>
          </div>
          <div className="footer-col footer-contact">
            <h4>Contact</h4>
            <span className="footer-phone">96434 37281</span>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              <Icon name="map" size={13} />{' '}
              1503, Tower I, Rajhans Residency,<br />
              Bishrakh Jalalpur, Sector 1,<br />
              Greater Noida West – 201308
            </p>
            <p><Icon name="clock" size={13} /> Mon–Sat: 7 AM – 8 PM</p>
            <a href="https://wa.me/919643437281" className="footer-wa-btn" target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={14} stroke="none" /> WhatsApp Us
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Astro Pathak. All Rights Reserved.</span>
          <span>For spiritual guidance purposes only.</span>
          <Link href="/admin/login" style={{ opacity: 0.3, letterSpacing: '2px', fontSize: 9 }}>Admin</Link>
        </div>
      </footer>
    </>
  );
}
