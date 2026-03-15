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
    backgroundColor: '#0a0a0a',
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
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  loginBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  signupBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0a0a0a',
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  // Hero Section
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '100px 40px 40px',
  },
  heroContent: {
    maxWidth: '800px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
  },
  heroTitle: {
    fontSize: '64px',
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
    fontSize: '20px',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: '#0a0a0a',
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
  },
  secondaryCTA: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
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
    padding: '120px 40px',
    backgroundColor: '#111111',
    position: 'relative',
    zIndex: 10,
  },
  featuresContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '48px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '80px',
    letterSpacing: '-1px',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
  },
  featureCard: {
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  featureCardHover: {
    transform: 'translateY(-10px)',
    border: '1px solid rgba(255, 255, 255, 0.24)',
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
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
    padding: '120px 40px',
    backgroundColor: '#0a0a0a',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '48px',
    fontWeight: '700',
    marginBottom: '16px',
    letterSpacing: '-1px',
  },
  ctaSubtitle: {
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '40px',
  },
  ctaButton: {
    padding: '18px 40px',
    fontSize: '18px',
    fontWeight: '600',
    color: '#0a0a0a',
    backgroundColor: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
  },

  // Footer
  footer: {
    padding: '60px 40px',
    backgroundColor: '#111111',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    zIndex: 10,
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

