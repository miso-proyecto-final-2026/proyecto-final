import { useState, useCallback, useEffect } from "react";

// ── i18n strings (ES/EN) ──
const i18n = {
  es: {
    appName: "Solventa",
    tagline: "Seguros inteligentes sobre Open Finance",
    nav: { home: "Inicio", quote: "Cotizar", wallet: "Mis Pólizas", claims: "Siniestros", profile: "Perfil" },
    home: {
      hero: "Protege lo que importa",
      heroSub: "Cotiza tu seguro de vida hipotecario en segundos, con la mejor prima personalizada gracias a Open Finance.",
      cta: "Cotizar ahora",
      features: [
        { title: "Cotización instantánea", desc: "Obtén tu prima personalizada en menos de 3 segundos, usando tus datos financieros con tu consentimiento." },
        { title: "100% digital", desc: "Desde la cotización hasta el pago, todo desde tu celular o computador. Sin papeleos." },
        { title: "Siniestro automático", desc: "Eventos paramétricos procesados automáticamente. Recibe tu indemnización sin trámites." },
      ],
      partners: "Integración con socios distribuidores",
      partnersDesc: "Fintechs, bancos y comercios pueden integrar nuestros seguros directamente en sus flujos de venta.",
    },
    quote: {
      title: "Cotiza tu seguro",
      step1: "Datos del inmueble",
      step2: "Consentimiento Open Finance",
      step3: "Tu cotización personalizada",
      propertyValue: "Valor del inmueble",
      propertyCity: "Ciudad del inmueble",
      loanTerm: "Plazo del crédito",
      years: "años",
      consent: "Autorizo a Solventa a consultar mis datos financieros a través de Open Finance para personalizar mi cotización.",
      consentDetail: "Puedes revocar este consentimiento en cualquier momento desde tu perfil.",
      authorize: "Autorizar consulta",
      revoke: "Revocar consentimiento",
      authorized: "✓ Datos financieros consultados exitosamente",
      generating: "Generando cotización personalizada...",
      result: "Tu cotización",
      monthlyPremium: "Prima mensual",
      coverage: "Cobertura",
      coverageItems: ["Vida hipotecario", "Incendio y terremoto", "Desempleo involuntario"],
      validUntil: "Válida hasta",
      subscribe: "Suscribir póliza",
      newQuote: "Nueva cotización",
      back: "Volver",
      next: "Siguiente",
    },
    subscription: {
      title: "Suscripción de póliza",
      step1: "Verificación de identidad",
      step2: "Método de pago",
      step3: "Firma electrónica",
      step4: "Póliza emitida",
      verifying: "Verificando identidad con KYC biométrico...",
      verified: "✓ Identidad verificada",
      cardNumber: "Número de tarjeta",
      cardHolder: "Nombre del titular",
      expiry: "Vencimiento",
      cvv: "CVV",
      tokenNote: "Tu tarjeta será tokenizada. Solventa nunca almacena el número completo.",
      pay: "Pagar prima",
      processing: "Procesando cobro...",
      paid: "✓ Cobro procesado exitosamente",
      signDoc: "Firmar contrato electrónicamente",
      signing: "Generando firma electrónica...",
      signed: "✓ Contrato firmado",
      policyTitle: "¡Póliza emitida!",
      policyNumber: "Número de póliza",
      downloadPolicy: "Descargar póliza",
      goToWallet: "Ir a Mis Pólizas",
    },
    wallet: {
      title: "Mis Pólizas",
      active: "Activas",
      expired: "Vencidas",
      empty: "No tienes pólizas activas. ¡Cotiza tu primera póliza!",
      policyNumber: "Póliza",
      product: "Producto",
      premium: "Prima mensual",
      status: "Estado",
      validFrom: "Vigencia desde",
      validTo: "Vigencia hasta",
      coverage: "Cobertura",
      viewDetails: "Ver detalles",
      statuses: { active: "Activa", pending: "Pendiente", expired: "Vencida" },
    },
    claims: {
      title: "Siniestros",
      parametric: "Eventos paramétricos",
      manual: "Reportar siniestro",
      noEvents: "No hay eventos paramétricos registrados.",
      eventType: "Tipo de evento",
      eventDate: "Fecha del evento",
      amount: "Indemnización",
      eventStatus: "Estado",
      automatic: "Pago automático",
      paid: "Pagado",
      pending: "En proceso",
      report: "Reportar siniestro",
      reportDesc: "Si has sufrido un siniestro cubierto por tu póliza, inicia el reporte aquí.",
      selectPolicy: "Seleccionar póliza",
      description: "Descripción del siniestro",
      attachEvidence: "Adjuntar evidencia",
      submit: "Enviar reporte",
    },
    profile: {
      title: "Mi Perfil",
      personalInfo: "Información personal",
      name: "Nombre",
      document: "Documento",
      email: "Correo electrónico",
      phone: "Teléfono",
      consents: "Consentimientos Open Finance",
      consentStatus: "Estado",
      granted: "Otorgado",
      revokeConsent: "Revocar",
      language: "Idioma",
      accessibility: "Accesibilidad",
      highContrast: "Alto contraste",
      fontSize: "Tamaño de fuente",
      logout: "Cerrar sesión",
    },
    a11y: { skipToContent: "Ir al contenido principal", menuToggle: "Abrir menú de navegación", langToggle: "Cambiar idioma" },
    currency: "COP",
    dateLocale: "es-CO",
  },
  en: {
    appName: "Solventa",
    tagline: "Smart insurance powered by Open Finance",
    nav: { home: "Home", quote: "Quote", wallet: "My Policies", claims: "Claims", profile: "Profile" },
    home: {
      hero: "Protect what matters",
      heroSub: "Get your personalized mortgage life insurance quote in seconds, with the best premium thanks to Open Finance.",
      cta: "Get a quote",
      features: [
        { title: "Instant quote", desc: "Get your personalized premium in under 3 seconds, using your financial data with your consent." },
        { title: "100% digital", desc: "From quote to payment, everything from your phone or computer. No paperwork." },
        { title: "Automatic claims", desc: "Parametric events processed automatically. Receive your compensation hassle-free." },
      ],
      partners: "Distribution partner integration",
      partnersDesc: "Fintechs, banks, and retailers can integrate our insurance directly into their sales flows.",
    },
    quote: {
      title: "Get your quote",
      step1: "Property details",
      step2: "Open Finance consent",
      step3: "Your personalized quote",
      propertyValue: "Property value",
      propertyCity: "Property city",
      loanTerm: "Loan term",
      years: "years",
      consent: "I authorize Solventa to access my financial data through Open Finance to personalize my quote.",
      consentDetail: "You can revoke this consent at any time from your profile.",
      authorize: "Authorize access",
      revoke: "Revoke consent",
      authorized: "✓ Financial data retrieved successfully",
      generating: "Generating personalized quote...",
      result: "Your quote",
      monthlyPremium: "Monthly premium",
      coverage: "Coverage",
      coverageItems: ["Mortgage life", "Fire and earthquake", "Involuntary unemployment"],
      validUntil: "Valid until",
      subscribe: "Subscribe policy",
      newQuote: "New quote",
      back: "Back",
      next: "Next",
    },
    subscription: {
      title: "Policy subscription",
      step1: "Identity verification",
      step2: "Payment method",
      step3: "Electronic signature",
      step4: "Policy issued",
      verifying: "Verifying identity with biometric KYC...",
      verified: "✓ Identity verified",
      cardNumber: "Card number",
      cardHolder: "Cardholder name",
      expiry: "Expiry",
      cvv: "CVV",
      tokenNote: "Your card will be tokenized. Solventa never stores the full number.",
      pay: "Pay premium",
      processing: "Processing payment...",
      paid: "✓ Payment processed successfully",
      signDoc: "Sign contract electronically",
      signing: "Generating electronic signature...",
      signed: "✓ Contract signed",
      policyTitle: "Policy issued!",
      policyNumber: "Policy number",
      downloadPolicy: "Download policy",
      goToWallet: "Go to My Policies",
    },
    wallet: {
      title: "My Policies",
      active: "Active",
      expired: "Expired",
      empty: "You don't have active policies. Get your first quote!",
      policyNumber: "Policy",
      product: "Product",
      premium: "Monthly premium",
      status: "Status",
      validFrom: "Valid from",
      validTo: "Valid to",
      coverage: "Coverage",
      viewDetails: "View details",
      statuses: { active: "Active", pending: "Pending", expired: "Expired" },
    },
    claims: {
      title: "Claims",
      parametric: "Parametric events",
      manual: "Report a claim",
      noEvents: "No parametric events recorded.",
      eventType: "Event type",
      eventDate: "Event date",
      amount: "Compensation",
      eventStatus: "Status",
      automatic: "Automatic payment",
      paid: "Paid",
      pending: "In progress",
      report: "Report a claim",
      reportDesc: "If you've experienced a covered event, start your report here.",
      selectPolicy: "Select policy",
      description: "Claim description",
      attachEvidence: "Attach evidence",
      submit: "Submit report",
    },
    profile: {
      title: "My Profile",
      personalInfo: "Personal information",
      name: "Name",
      document: "Document",
      email: "Email",
      phone: "Phone",
      consents: "Open Finance consents",
      consentStatus: "Status",
      granted: "Granted",
      revokeConsent: "Revoke",
      language: "Language",
      accessibility: "Accessibility",
      highContrast: "High contrast",
      fontSize: "Font size",
      logout: "Log out",
    },
    a11y: { skipToContent: "Skip to main content", menuToggle: "Toggle navigation menu", langToggle: "Switch language" },
    currency: "COP",
    dateLocale: "en-US",
  },
};

// ── Helpers ──
const formatCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const formatDate = (d, locale) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

// ── Mock data ──
const mockPolicies = [
  { id: "SOL-2026-001847", product: "Vida Hipotecario", productEn: "Mortgage Life", premium: 187400, status: "active", from: new Date(2026, 2, 15), to: new Date(2046, 2, 15), coverage: 380000000 },
  { id: "SOL-2026-002341", product: "Incendio y Terremoto", productEn: "Fire & Earthquake", premium: 94200, status: "active", from: new Date(2026, 5, 1), to: new Date(2027, 5, 1), coverage: 420000000 },
];
const mockEvents = [
  { type: "Sismo Mw 5.2", typeEn: "Earthquake Mw 5.2", date: new Date(2026, 7, 3), amount: 12500000, status: "paid" },
  { type: "Inundación Nivel 3", typeEn: "Flood Level 3", date: new Date(2026, 8, 18), amount: 8700000, status: "pending" },
];

// ── Styles ──
const colors = {
  navy: "#0F2B46", accent: "#1A9B8C", accentLight: "#E8F6F4", bg: "#F7F9FB",
  white: "#FFFFFF", text: "#1A2B3C", textLight: "#5A6B7C", border: "#DDE3EA",
  success: "#0D8050", successBg: "#E6F4ED", warn: "#C87D2F", warnBg: "#FFF4E5",
  error: "#C02B2B", cardShadow: "0 1px 3px rgba(15,43,70,0.08)",
};

const base = {
  app: { fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", color: colors.text, background: colors.bg, minHeight: "100vh", fontSize: 15 },
  skipLink: { position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden", zIndex: 1000, background: colors.navy, color: colors.white, padding: "8px 16px", fontSize: 14, textDecoration: "none" },
  skipLinkFocus: { left: 8, top: 8, width: "auto", height: "auto" },
  header: { background: colors.navy, color: colors.white, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" },
  nav: { display: "flex", gap: 4, alignItems: "center" },
  navBtn: (active) => ({ background: active ? "rgba(26,155,140,0.2)" : "transparent", color: active ? colors.accentLight : "rgba(255,255,255,0.75)", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s" }),
  langBtn: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: colors.white, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  main: { maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" },
  card: { background: colors.white, borderRadius: 10, border: `1px solid ${colors.border}`, padding: "24px", marginBottom: 16, boxShadow: colors.cardShadow },
  h1: { fontSize: 26, fontWeight: 700, color: colors.navy, margin: "0 0 6px" },
  h2: { fontSize: 19, fontWeight: 600, color: colors.navy, margin: "0 0 12px" },
  h3: { fontSize: 16, fontWeight: 600, color: colors.text, margin: "0 0 8px" },
  sub: { fontSize: 14, color: colors.textLight, margin: "0 0 20px", lineHeight: 1.5 },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? colors.accent : variant === "outline" ? "transparent" : colors.white,
    color: variant === "primary" ? colors.white : colors.accent,
    border: variant === "outline" ? `1.5px solid ${colors.accent}` : "none",
    padding: "10px 22px", borderRadius: 7, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.15s",
    display: "inline-flex", alignItems: "center", gap: 6,
  }),
  input: { width: "100%", padding: "10px 12px", border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 14, boxSizing: "border-box", outline: "none", transition: "border 0.15s" },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: colors.textLight, marginBottom: 4 },
  badge: (type) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
    background: type === "active" || type === "paid" ? colors.successBg : type === "pending" ? colors.warnBg : colors.bg,
    color: type === "active" || type === "paid" ? colors.success : type === "pending" ? colors.warn : colors.textLight,
  }),
  stepper: { display: "flex", gap: 0, marginBottom: 24 },
  stepItem: (active, done) => ({
    flex: 1, textAlign: "center", padding: "10px 8px", fontSize: 12, fontWeight: 600,
    borderBottom: `3px solid ${active ? colors.accent : done ? colors.success : colors.border}`,
    color: active ? colors.accent : done ? colors.success : colors.textLight,
    transition: "all 0.2s",
  }),
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },
  tag: { display: "inline-block", background: colors.accentLight, color: colors.accent, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, marginRight: 4 },
  footer: { textAlign: "center", padding: "20px", fontSize: 12, color: colors.textLight, borderTop: `1px solid ${colors.border}`, marginTop: 40 },
};

// ── Stepper component ──
function Stepper({ steps, current }) {
  return (
    <div style={base.stepper} role="navigation" aria-label="Pasos del proceso">
      {steps.map((s, i) => (
        <div key={i} style={base.stepItem(i === current, i < current)} aria-current={i === current ? "step" : undefined}>
          {i < current ? "✓ " : ""}{s}
        </div>
      ))}
    </div>
  );
}

// ── Pages ──
function HomePage({ t, onNavigate }) {
  return (
    <div>
      <div style={{ ...base.card, background: `linear-gradient(135deg, ${colors.navy} 0%, #1A4A6B 100%)`, color: colors.white, padding: "48px 32px", textAlign: "center", border: "none" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px", color: colors.white }}>{t.home.hero}</h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", margin: "0 0 28px", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>{t.home.heroSub}</p>
        <button style={{ ...base.btn(), padding: "14px 32px", fontSize: 16 }} onClick={() => onNavigate("quote")} aria-label={t.home.cta}>{t.home.cta}</button>
      </div>
      <div style={{ ...base.grid, marginTop: 24 }}>
        {t.home.features.map((f, i) => (
          <div key={i} style={base.card}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: colors.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>
              {["⚡", "📱", "🔄"][i]}
            </div>
            <h3 style={base.h3}>{f.title}</h3>
            <p style={{ fontSize: 13, color: colors.textLight, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>
      <div style={{ ...base.card, marginTop: 24, textAlign: "center" }}>
        <h2 style={base.h2}>{t.home.partners}</h2>
        <p style={{ fontSize: 14, color: colors.textLight, margin: 0, lineHeight: 1.5 }}>{t.home.partnersDesc}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
          {["Fintech A", "Banco B", "Comercio C"].map((p, i) => (
            <div key={i} style={{ padding: "10px 20px", borderRadius: 8, background: colors.bg, fontSize: 13, fontWeight: 500, color: colors.textLight }}>{p}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuotePage({ t, lang, onNavigate }) {
  const [step, setStep] = useState(0);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ value: "380000000", city: "Bogotá", term: "20" });
  const steps = [t.quote.step1, t.quote.step2, t.quote.step3];

  const handleConsent = () => { setLoading(true); setTimeout(() => { setConsented(true); setLoading(false); }, 1500); };
  const handleGenerate = () => { setLoading(true); setTimeout(() => { setLoading(false); setStep(2); }, 2000); };

  return (
    <div>
      <h1 style={base.h1}>{t.quote.title}</h1>
      <p style={base.sub}>{t.tagline}</p>
      <Stepper steps={steps} current={step} />
      <div style={base.card}>
        {step === 0 && (
          <div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={base.label} htmlFor="propValue">{t.quote.propertyValue}</label>
                <input id="propValue" style={base.input} value={formatCOP(parseInt(form.value))} onChange={(e) => setForm({ ...form, value: e.target.value.replace(/\D/g, "") })} aria-describedby="propValueHelp" />
                <span id="propValueHelp" style={{ fontSize: 11, color: colors.textLight }}>COP</span>
              </div>
              <div>
                <label style={base.label} htmlFor="propCity">{t.quote.propertyCity}</label>
                <select id="propCity" style={base.input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  {["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={base.label} htmlFor="loanTerm">{t.quote.loanTerm}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input id="loanTerm" type="range" min="5" max="30" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} style={{ flex: 1 }} aria-valuemin={5} aria-valuemax={30} aria-valuenow={parseInt(form.term)} />
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 60 }}>{form.term} {t.quote.years}</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button style={base.btn()} onClick={() => setStep(1)}>{t.quote.next} →</button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ padding: 20, background: colors.bg, borderRadius: 8, marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 14, lineHeight: 1.5 }}>{t.quote.consent}</p>
              <p style={{ margin: 0, fontSize: 12, color: colors.textLight }}>{t.quote.consentDetail}</p>
            </div>
            {consented ? (
              <div style={{ padding: 12, background: colors.successBg, borderRadius: 6, color: colors.success, fontSize: 14, fontWeight: 500 }} role="status">{t.quote.authorized}</div>
            ) : loading ? (
              <div style={{ padding: 12, textAlign: "center", color: colors.textLight, fontSize: 14 }} role="status" aria-live="polite">⏳ {t.quote.generating}</div>
            ) : (
              <button style={base.btn()} onClick={handleConsent}>{t.quote.authorize}</button>
            )}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
              <button style={base.btn("outline")} onClick={() => setStep(0)}>← {t.quote.back}</button>
              {consented && <button style={base.btn()} onClick={handleGenerate}>{loading ? "..." : `${t.quote.next} →`}</button>}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ ...base.h2, fontSize: 22 }}>{t.quote.result}</h2>
              <div style={{ fontSize: 38, fontWeight: 700, color: colors.accent }}>{formatCOP(187400)}</div>
              <div style={{ fontSize: 14, color: colors.textLight }}>{t.quote.monthlyPremium}</div>
            </div>
            <div style={{ padding: 16, background: colors.bg, borderRadius: 8, marginBottom: 16 }}>
              <h3 style={base.h3}>{t.quote.coverage}</h3>
              {t.quote.coverageItems.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 14 }}>
                  <span style={{ color: colors.success }}>✓</span> {c}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 20 }}>
              {t.quote.validUntil}: {formatDate(new Date(2026, 9, 11), t.dateLocale)}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={base.btn()} onClick={() => onNavigate("subscribe")}>{t.quote.subscribe}</button>
              <button style={base.btn("outline")} onClick={() => { setStep(0); setConsented(false); }}>{t.quote.newQuote}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionPage({ t, lang, onNavigate }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const steps = [t.subscription.step1, t.subscription.step2, t.subscription.step3, t.subscription.step4];

  const advance = (delay = 1800) => { setLoading(true); setTimeout(() => { setLoading(false); setStep(s => s + 1); }, delay); };

  return (
    <div>
      <h1 style={base.h1}>{t.subscription.title}</h1>
      <p style={base.sub}>{t.tagline}</p>
      <Stepper steps={steps} current={step} />
      <div style={base.card}>
        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            {loading ? (
              <div role="status" aria-live="polite" style={{ padding: 40, color: colors.textLight }}>⏳ {t.subscription.verifying}</div>
            ) : (
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                <p style={{ fontSize: 14, color: colors.textLight, marginBottom: 20 }}>{t.subscription.step1}</p>
                <button style={base.btn()} onClick={() => advance(2000)}>{t.subscription.step1}</button>
              </div>
            )}
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ display: "grid", gap: 14 }}>
              <div><label style={base.label} htmlFor="cardNum">{t.subscription.cardNumber}</label><input id="cardNum" style={base.input} placeholder="4242 4242 4242 4242" /></div>
              <div><label style={base.label} htmlFor="cardName">{t.subscription.cardHolder}</label><input id="cardName" style={base.input} placeholder="STIVEN CARDONA" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={base.label} htmlFor="expiry">{t.subscription.expiry}</label><input id="expiry" style={base.input} placeholder="12/28" /></div>
                <div><label style={base.label} htmlFor="cvv">{t.subscription.cvv}</label><input id="cvv" style={base.input} placeholder="***" type="password" /></div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 10, background: colors.warnBg, borderRadius: 6, fontSize: 12, color: colors.warn }}>🔒 {t.subscription.tokenNote}</div>
            <div style={{ marginTop: 20 }}>
              {loading ? (
                <div role="status" aria-live="polite" style={{ color: colors.textLight, fontSize: 14 }}>⏳ {t.subscription.processing}</div>
              ) : (
                <button style={base.btn()} onClick={() => advance()}>{t.subscription.pay} — {formatCOP(187400)}</button>
              )}
            </div>
          </div>
        )}
        {step === 2 && (
          <div style={{ textAlign: "center" }}>
            {loading ? (
              <div role="status" aria-live="polite" style={{ padding: 40, color: colors.textLight }}>⏳ {t.subscription.signing}</div>
            ) : (
              <div>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
                <p style={{ fontSize: 14, color: colors.textLight, marginBottom: 20 }}>{t.subscription.step3}</p>
                <button style={base.btn()} onClick={() => advance(1500)}>{t.subscription.signDoc}</button>
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
            <h2 style={{ ...base.h2, color: colors.success }}>{t.subscription.policyTitle}</h2>
            <div style={{ padding: 16, background: colors.successBg, borderRadius: 8, marginBottom: 20, display: "inline-block" }}>
              <div style={{ fontSize: 12, color: colors.success }}>{t.subscription.policyNumber}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.success }}>SOL-2026-003192</div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={base.btn("outline")}>{t.subscription.downloadPolicy}</button>
              <button style={base.btn()} onClick={() => onNavigate("wallet")}>{t.subscription.goToWallet}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WalletPage({ t, lang }) {
  const [tab, setTab] = useState("active");
  const [expanded, setExpanded] = useState(null);
  const policies = tab === "active" ? mockPolicies : [];

  return (
    <div>
      <h1 style={base.h1}>{t.wallet.title}</h1>
      <p style={base.sub}>{mockPolicies.length} {t.wallet.active.toLowerCase()}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["active", "expired"].map(tb => (
          <button key={tb} style={{ ...base.btn(tab === tb ? "primary" : "outline"), fontSize: 13, padding: "7px 16px" }} onClick={() => setTab(tb)}>{t.wallet[tb]}</button>
        ))}
      </div>
      {policies.length === 0 ? (
        <div style={{ ...base.card, textAlign: "center", padding: 40, color: colors.textLight }}>{t.wallet.empty}</div>
      ) : (
        policies.map((p, i) => (
          <div key={i} style={base.card} role="article" aria-label={`${t.wallet.policyNumber} ${p.id}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: colors.textLight }}>{t.wallet.policyNumber}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{p.id}</div>
              </div>
              <span style={base.badge(p.status)}>{t.wallet.statuses[p.status]}</span>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <div><span style={{ fontSize: 12, color: colors.textLight }}>{t.wallet.product}</span><div style={{ fontSize: 14, fontWeight: 500 }}>{lang === "es" ? p.product : p.productEn}</div></div>
              <div><span style={{ fontSize: 12, color: colors.textLight }}>{t.wallet.premium}</span><div style={{ fontSize: 14, fontWeight: 600, color: colors.accent }}>{formatCOP(p.premium)}</div></div>
              <div><span style={{ fontSize: 12, color: colors.textLight }}>{t.wallet.coverage}</span><div style={{ fontSize: 14, fontWeight: 500 }}>{formatCOP(p.coverage)}</div></div>
            </div>
            {expanded === i && (
              <div style={{ marginTop: 12, padding: 12, background: colors.bg, borderRadius: 6, fontSize: 13 }}>
                <div style={{ display: "flex", gap: 24 }}>
                  <span>{t.wallet.validFrom}: {formatDate(p.from, t.dateLocale)}</span>
                  <span>{t.wallet.validTo}: {formatDate(p.to, t.dateLocale)}</span>
                </div>
              </div>
            )}
            <button style={{ ...base.btn("outline"), marginTop: 12, fontSize: 12, padding: "6px 14px" }} onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i}>{t.wallet.viewDetails}</button>
          </div>
        ))
      )}
    </div>
  );
}

function ClaimsPage({ t, lang }) {
  const [tab, setTab] = useState("parametric");

  return (
    <div>
      <h1 style={base.h1}>{t.claims.title}</h1>
      <p style={base.sub}>{t.tagline}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={{ ...base.btn(tab === "parametric" ? "primary" : "outline"), fontSize: 13, padding: "7px 16px" }} onClick={() => setTab("parametric")}>{t.claims.parametric}</button>
        <button style={{ ...base.btn(tab === "manual" ? "primary" : "outline"), fontSize: 13, padding: "7px 16px" }} onClick={() => setTab("manual")}>{t.claims.manual}</button>
      </div>
      {tab === "parametric" ? (
        <div>
          {mockEvents.map((e, i) => (
            <div key={i} style={base.card} role="article">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={base.tag}>{t.claims.automatic}</span>
                  <h3 style={{ ...base.h3, marginTop: 8 }}>{lang === "es" ? e.type : e.typeEn}</h3>
                </div>
                <span style={base.badge(e.status)}>{e.status === "paid" ? t.claims.paid : t.claims.pending}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div><span style={{ fontSize: 12, color: colors.textLight }}>{t.claims.eventDate}</span><div style={{ fontSize: 14 }}>{formatDate(e.date, t.dateLocale)}</div></div>
                <div><span style={{ fontSize: 12, color: colors.textLight }}>{t.claims.amount}</span><div style={{ fontSize: 14, fontWeight: 600, color: colors.accent }}>{formatCOP(e.amount)}</div></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={base.card}>
          <p style={{ fontSize: 14, color: colors.textLight, marginBottom: 16 }}>{t.claims.reportDesc}</p>
          <div style={{ display: "grid", gap: 14 }}>
            <div><label style={base.label} htmlFor="claimPolicy">{t.claims.selectPolicy}</label>
              <select id="claimPolicy" style={base.input}>{mockPolicies.map(p => <option key={p.id}>{p.id} — {lang === "es" ? p.product : p.productEn}</option>)}</select>
            </div>
            <div><label style={base.label} htmlFor="claimDesc">{t.claims.description}</label><textarea id="claimDesc" style={{ ...base.input, minHeight: 80, resize: "vertical" }} /></div>
            <div><label style={base.label}>{t.claims.attachEvidence}</label>
              <div style={{ padding: 20, border: `2px dashed ${colors.border}`, borderRadius: 8, textAlign: "center", color: colors.textLight, fontSize: 13, cursor: "pointer" }}>📎 {t.claims.attachEvidence}</div>
            </div>
          </div>
          <button style={{ ...base.btn(), marginTop: 16 }}>{t.claims.submit}</button>
        </div>
      )}
    </div>
  );
}

function ProfilePage({ t, lang, onLangChange }) {
  return (
    <div>
      <h1 style={base.h1}>{t.profile.title}</h1>
      <p style={base.sub}>{t.tagline}</p>
      <div style={base.card}>
        <h2 style={base.h2}>{t.profile.personalInfo}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            [t.profile.name, "Stiven Cardona Monsalve"],
            [t.profile.document, "CC 1.XXX.XXX.XXX"],
            [t.profile.email, "stiven@email.com"],
            [t.profile.phone, "+57 3XX XXX XXXX"],
          ].map(([label, value], i) => (
            <div key={i}><span style={{ fontSize: 12, color: colors.textLight }}>{label}</span><div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div></div>
          ))}
        </div>
      </div>
      <div style={base.card}>
        <h2 style={base.h2}>{t.profile.consents}</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${colors.border}` }}>
          <div><div style={{ fontSize: 14, fontWeight: 500 }}>Open Finance — {lang === "es" ? "Datos financieros" : "Financial data"}</div>
            <div style={{ fontSize: 12, color: colors.textLight }}>{t.profile.consentStatus}: <span style={{ color: colors.success, fontWeight: 600 }}>{t.profile.granted}</span></div>
          </div>
          <button style={{ ...base.btn("outline"), fontSize: 12, padding: "5px 12px", color: colors.error, borderColor: colors.error }}>{t.profile.revokeConsent}</button>
        </div>
      </div>
      <div style={base.card}>
        <h2 style={base.h2}>{t.profile.language} / {t.profile.accessibility}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{t.profile.language}:</span>
          <button style={{ ...base.btn(lang === "es" ? "primary" : "outline"), padding: "5px 14px", fontSize: 12 }} onClick={() => onLangChange("es")}>Español</button>
          <button style={{ ...base.btn(lang === "en" ? "primary" : "outline"), padding: "5px 14px", fontSize: 12 }} onClick={() => onLangChange("en")}>English</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{t.profile.fontSize}:</span>
          {["S", "M", "L"].map(s => (
            <button key={s} style={{ ...base.btn("outline"), padding: "4px 12px", fontSize: 12 }}>{s}</button>
          ))}
        </div>
      </div>
      <button style={{ ...base.btn("outline"), color: colors.error, borderColor: colors.error, marginTop: 8 }}>{t.profile.logout}</button>
    </div>
  );
}

// ── App ──
export default function SolventaPrototype() {
  const [lang, setLang] = useState("es");
  const [page, setPage] = useState("home");
  const [skipFocused, setSkipFocused] = useState(false);
  const t = i18n[lang];

  const navItems = [
    { key: "home", icon: "🏠" },
    { key: "quote", icon: "📋" },
    { key: "wallet", icon: "🛡️" },
    { key: "claims", icon: "⚡" },
    { key: "profile", icon: "👤" },
  ];

  const navigate = useCallback((p) => { setPage(p); window.scrollTo?.(0, 0); }, []);

  return (
    <div style={base.app}>
      {/* Skip to content — Accessibility */}
      <a href="#main-content" style={{ ...base.skipLink, ...(skipFocused ? base.skipLinkFocus : {}) }} onFocus={() => setSkipFocused(true)} onBlur={() => setSkipFocused(false)} onClick={(e) => { e.preventDefault(); document.getElementById("main-content")?.focus(); }}>
        {t.a11y.skipToContent}
      </a>

      {/* Header */}
      <header style={base.header} role="banner">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={base.logo} onClick={() => navigate("home")} role="button" tabIndex={0} aria-label={t.appName}>{t.appName}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>Prototype v1.0</span>
        </div>
        <nav style={base.nav} aria-label="Navegación principal">
          {navItems.map(n => (
            <button key={n.key} style={base.navBtn(page === n.key)} onClick={() => navigate(n.key)} aria-current={page === n.key ? "page" : undefined} title={t.nav[n.key]}>
              <span aria-hidden="true">{n.icon}</span> {t.nav[n.key]}
            </button>
          ))}
          <button style={base.langBtn} onClick={() => setLang(l => l === "es" ? "en" : "es")} aria-label={t.a11y.langToggle} title={t.a11y.langToggle}>
            {lang === "es" ? "EN" : "ES"}
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main id="main-content" style={base.main} tabIndex={-1} role="main">
        {page === "home" && <HomePage t={t} onNavigate={navigate} />}
        {page === "quote" && <QuotePage t={t} lang={lang} onNavigate={navigate} />}
        {page === "subscribe" && <SubscriptionPage t={t} lang={lang} onNavigate={navigate} />}
        {page === "wallet" && <WalletPage t={t} lang={lang} />}
        {page === "claims" && <ClaimsPage t={t} lang={lang} />}
        {page === "profile" && <ProfilePage t={t} lang={lang} onLangChange={setLang} />}
      </main>

      {/* Footer */}
      <footer style={base.footer} role="contentinfo">
        <div>© 2026 Solventa — {t.tagline}</div>
        <div style={{ marginTop: 4, fontSize: 11 }}>
          MISW4501 · Proyecto Final · Grupo 10 · Universidad de los Andes
        </div>
        <div style={{ marginTop: 6 }}>
          <span style={base.tag}>Accesibilidad</span>
          <span style={base.tag}>i18n ES/EN</span>
          <span style={base.tag}>L10n Colombia</span>
        </div>
      </footer>
    </div>
  );
}
