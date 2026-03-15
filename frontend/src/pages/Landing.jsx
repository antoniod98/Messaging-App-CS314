import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Real-time messaging powered by WebSocket technology. Messages delivered instantly.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'End-to-end encryption ensures your conversations remain private and secure.',
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Create rooms, direct messages, and invite team members effortlessly.',
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Access from anywhere. Responsive design works on desktop, tablet, and mobile.',
    },
  ];

  // If already logged in, redirect to chat
  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBg}>
        <div style={styles.gradientOrb1}></div>
        <div style={styles.gradientOrb2}></div>
        <div style={styles.gradientOrb3}></div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <div style={styles.logo}>RELAY</div>
          <div style={styles.navButtons}>
            <button style={styles.loginBtn} onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button style={styles.signupBtn} onClick={() => navigate('/register')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroGlassPanel}>
            <div style={styles.heroEyebrow}>Private by Design</div>
            <h1 style={styles.heroTitle}>
              Real-Time Communication,
              <br />
              <span style={styles.heroGradient}>Simplified</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Secure, instant messaging platform built for teams who value privacy and performance.
              Connect, collaborate, and communicate in real-time.
            </p>
            <div style={styles.heroCTA}>
              <button style={styles.primaryCTA} onClick={() => navigate('/register')}>
                Start Messaging Free
              </button>
              <button style={styles.secondaryCTA} onClick={() => navigate('/login')}>
                Sign In →
              </button>
            </div>
            <div style={styles.heroStats}>
              <div style={styles.heroStatCard}>
                <span style={styles.heroStatValue}>24/7</span>
                <span style={styles.heroStatLabel}>Live syncing</span>
              </div>
              <div style={styles.heroStatCard}>
                <span style={styles.heroStatValue}>E2E</span>
                <span style={styles.heroStatLabel}>Encrypted channels</span>
              </div>
              <div style={styles.heroStatCard}>
                <span style={styles.heroStatValue}>1 tap</span>
                <span style={styles.heroStatLabel}>Team access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Grid */}
        <div style={styles.gridOverlay}>
          <div style={styles.gridLine}></div>
          <div style={{...styles.gridLine, left: '25%'}}></div>
          <div style={{...styles.gridLine, left: '50%'}}></div>
          <div style={{...styles.gridLine, left: '75%'}}></div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.featuresContent}>
          <h2 style={styles.sectionTitle}>Built for Modern Teams</h2>

          <div style={styles.featureGrid}>
            {features.map((feature, index) => {
              const isHovered = hoveredFeature === index;

              return (
                <div
                  key={feature.title}
                  style={{
                    ...styles.featureCard,
                    ...(isHovered ? styles.featureCardHover : {}),
                  }}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div
                    style={{
                      ...styles.featureIcon,
                      ...(isHovered ? styles.featureIconHover : {}),
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3
                    style={{
                      ...styles.featureTitle,
                      ...(isHovered ? styles.featureTitleHover : {}),
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={styles.featureDesc}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to get started?</h2>
          <p style={styles.ctaSubtitle}>Join thousands of teams already using RELAY</p>
          <button style={styles.ctaButton} onClick={() => navigate('/register')}>
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLogo}>RELAY</div>
          <p style={styles.footerText}>
            © 2026 RELAY. Secure real-time messaging platform.
          </p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(110, 168, 254, 0.16) 0%, transparent 32%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.09) 0%, transparent 28%), linear-gradient(180deg, #06070b 0%, #0b1020 48%, #090a0d 100%)',
    color: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },

  // Animated Background
  animatedBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  gradientOrb1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(100, 100, 100, 0.15) 0%, transparent 70%)',
    top: '-200px',
    right: '-200px',
    animation: 'float 20s ease-in-out infinite',
    filter: 'blur(60px)',
  },
  gradientOrb2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(150, 150, 150, 0.12) 0%, transparent 70%)',
    bottom: '-150px',
    left: '-150px',
    animation: 'float 15s ease-in-out infinite reverse',
    filter: 'blur(60px)',
  },
  gradientOrb3: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(200, 200, 200, 0.1) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 12s ease-in-out infinite',
    filter: 'blur(60px)',
  },

  // Navigation
  nav: {
    position: 'fixed',
    top: '18px',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'clamp(14px, 2.4vw, 18px) clamp(16px, 4vw, 28px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    borderRadius: '22px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: '#ffffff',
  },
  navButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  loginBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(14px)',
  },
  signupBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(129, 193, 255, 0.9) 0%, rgba(72, 125, 255, 0.85) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 14px 32px rgba(72, 125, 255, 0.28)',
  },

  // Hero Section
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '140px clamp(18px, 4vw, 40px) 56px',
  },
  heroContent: {
    maxWidth: '920px',
    width: '100%',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
  },
  heroGlassPanel: {
    padding: 'clamp(28px, 5vw, 56px) clamp(20px, 5vw, 52px)',
    borderRadius: '32px',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.03) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    boxShadow: '0 30px 90px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255,255,255,0.16)',
    backdropFilter: 'blur(26px)',
    WebkitBackdropFilter: 'blur(26px)',
  },
  heroEyebrow: {
    display: 'inline-flex',
    padding: '8px 14px',
    marginBottom: '24px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 'clamp(38px, 8vw, 64px)',
    fontWeight: '700',
    lineHeight: '1.1',
    marginBottom: '24px',
    letterSpacing: '-2px',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #ffffff 0%, #888888 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 'clamp(16px, 2.8vw, 20px)',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.76)',
    marginBottom: '48px',
    maxWidth: '600px',
    margin: '0 auto 48px',
  },
  heroCTA: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryCTA: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(129, 193, 255, 0.95) 0%, rgba(72, 125, 255, 0.9) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 18px 40px rgba(72, 125, 255, 0.3)',
    minWidth: '220px',
  },
  secondaryCTA: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(12px)',
    minWidth: '220px',
  },
  heroStats: {
    marginTop: '40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '14px',
  },
  heroStatCard: {
    padding: '18px 16px',
    borderRadius: '18px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  heroStatValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
  },
  heroStatLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.62)',
  },

  // Animated Grid
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '1px',
    background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
    left: '0',
  },

  // Features Section
  features: {
    padding: 'clamp(84px, 10vw, 120px) clamp(18px, 4vw, 40px)',
    backgroundColor: 'rgba(10, 12, 18, 0.55)',
    position: 'relative',
    zIndex: 10,
    backdropFilter: 'blur(18px)',
  },
  featuresContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 'clamp(32px, 6vw, 48px)',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 'clamp(40px, 7vw, 80px)',
    letterSpacing: '-1px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 'clamp(18px, 4vw, 40px)',
  },
  featureCard: {
    padding: 'clamp(24px, 4vw, 40px)',
    background:
      'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 52%, rgba(255,255,255,0.03) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.18)',
  },
  featureCardHover: {
    transform: 'translateY(-10px)',
    border: '1px solid rgba(166, 210, 255, 0.28)',
    background:
      'linear-gradient(180deg, rgba(160, 205, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%)',
    boxShadow: '0 24px 60px rgba(10, 20, 50, 0.35)',
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '24px',
    transition: 'transform 0.3s ease, filter 0.3s ease',
  },
  featureIconHover: {
    transform: 'scale(1.08)',
    filter: 'drop-shadow(0 12px 18px rgba(255, 255, 255, 0.18))',
  },
  featureTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#ffffff',
    transition: 'color 0.3s ease, transform 0.3s ease',
  },
  featureTitleHover: {
    color: '#f5f5f5',
    transform: 'translateX(4px)',
  },
  featureDesc: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // CTA Section
  ctaSection: {
    padding: 'clamp(84px, 10vw, 120px) clamp(18px, 4vw, 40px)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: 'clamp(30px, 5vw, 52px) clamp(20px, 5vw, 42px)',
    borderRadius: '30px',
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    boxShadow: '0 28px 70px rgba(0, 0, 0, 0.26)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  },
  ctaTitle: {
    fontSize: 'clamp(32px, 6vw, 48px)',
    fontWeight: '700',
    marginBottom: '16px',
    letterSpacing: '-1px',
  },
  ctaSubtitle: {
    fontSize: 'clamp(16px, 2.8vw, 20px)',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '40px',
  },
  ctaButton: {
    padding: '18px 40px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(129, 193, 255, 0.95) 0%, rgba(72, 125, 255, 0.88) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '999px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 18px 42px rgba(72, 125, 255, 0.28)',
  },

  // Footer
  footer: {
    padding: 'clamp(44px, 6vw, 60px) clamp(18px, 4vw, 40px)',
    backgroundColor: 'rgba(10, 12, 18, 0.52)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 10,
    backdropFilter: 'blur(16px)',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerLogo: {
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '2px',
    marginBottom: '16px',
  },
  footerText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
};

export default Landing;


