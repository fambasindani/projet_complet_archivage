// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import logo from '../Images/Logo.png';
import authService from '../services/auth.service';
import { toast } from '../Composant/Toast';
import {
  FaArchive,
  FaArrowRight,
  FaCheck,
  FaCheckCircle,
  FaEnvelope,
  FaExclamationCircle,
  FaEye,
  FaEyeSlash,
  FaFileInvoiceDollar,
  FaGlobe,
  FaLock,
  FaShieldAlt,
  FaSpinner,
  FaUserShield,
} from 'react-icons/fa';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email('Adresse email invalide')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  rememberMe: z.boolean().optional(),
});

const COPY = {
  fr: {
    brandSubtitle: 'Archives & Titres de perception',
    heroTitle: 'La mémoire administrative de la DGRAD,',
    heroAccent: 'centralisée et sécurisée.',
    heroText:
      "Une plateforme unique pour gérer l'archivage ordinaire, les titres de perception, la recherche OCR et la traçabilité des opérations.",
    features: [
      {
        title: 'Archivage ordinaire',
        text: 'Documents administratifs, classeurs et emplacements.',
      },
      {
        title: 'Titres de perception',
        text: 'Notes, assujettis, centres et articles budgétaires.',
      },
      {
        title: 'Contrôle et traçabilité',
        text: 'Rôles, permissions et journal d’audit centralisés.',
      },
    ],
    rights: 'Tous droits réservés',
    status: 'Système opérationnel',
    subtitle: 'Accédez à votre espace documentaire sécurisé.',
    email: 'Adresse email',
    password: 'Mot de passe',
    remember: 'Se souvenir de moi',
    forgot: 'Mot de passe oublié ?',
    forgotHint: "Contactez l'administrateur ou la DANTIC pour réinitialiser votre mot de passe.",
    submit: 'Se connecter',
    loading: 'Connexion en cours...',
    agents: 'Agents DGRAD uniquement',
    security: 'Connexion chiffrée et journalisée',
    help: 'Aide',
    language: 'Langue',
    welcome: 'Bienvenue',
  },
  en: {
    brandSubtitle: 'Archives & Payment notices',
    heroTitle: 'The administrative memory of DGRAD,',
    heroAccent: 'centralized and secure.',
    heroText:
      'A single platform to manage ordinary archiving, payment notices, OCR search and operations traceability.',
    features: [
      { title: 'Ordinary archiving', text: 'Administrative documents, binders and locations.' },
      { title: 'Payment notices', text: 'Notices, taxpayers, centers and budget items.' },
      { title: 'Control and traceability', text: 'Centralized roles, permissions and audit log.' },
    ],
    rights: 'All rights reserved',
    status: 'System operational',
    subtitle: 'Access your secure document workspace.',
    email: 'Email address',
    password: 'Password',
    remember: 'Remember me',
    forgot: 'Forgot password?',
    forgotHint: 'Contact the administrator or DANTIC to reset your password.',
    submit: 'Sign in',
    loading: 'Signing in...',
    agents: 'DGRAD agents only',
    security: 'Encrypted and logged connection',
    help: 'Help',
    language: 'Language',
    welcome: 'Welcome',
  },
};

const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
];

const LoginScreen = () => {
  const history = useHistory();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('login_lang') || 'fr');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  const t = COPY[lang] || COPY.fr;
  const currentLang = LANGUAGES.find((item) => item.code === lang) || LANGUAGES[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('remembered_email') || '',
      password: '',
      rememberMe: !!localStorage.getItem('remembered_email'),
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (localStorage.getItem('token')) {
      history.replace('/dashboard');
      return;
    }

    setCurrentDate(
      new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, [history]);

  useEffect(() => {
    localStorage.setItem('login_lang', lang);
  }, [lang]);

  const features = useMemo(
    () => [
      { icon: FaArchive, title: t.features[0].title, text: t.features[0].text },
      { icon: FaFileInvoiceDollar, title: t.features[1].title, text: t.features[1].text },
      { icon: FaShieldAlt, title: t.features[2].title, text: t.features[2].text },
    ],
    [t]
  );

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      const result = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      const payload = result?.data ?? result;
      const permissions = payload?.permissions?.codes || [];
      toast.success(
        `${t.welcome} ${payload?.user?.prenom || ''} ${payload?.user?.nom || ''}`.trim()
      );

      let target = '/dashboard';
      if (!permissions.includes('dashboard')) {
        if (permissions.includes('archiv_doc') || permissions.includes('archives.view')) {
          target = '/archives';
        } else if (permissions.includes('note_perception') || permissions.includes('titres.view')) {
          target = '/titres';
        } else {
          target = '/profil';
        }
      }

      history.replace(target);
    } catch (error) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        (status === 401
          ? 'Email ou mot de passe incorrect.'
          : status === 403
            ? "Ce compte n'est pas autorisé à se connecter."
            : 'Connexion impossible. Veuillez réessayer.');

      setLoginError(message);
      reset({ email: data.email, password: '', rememberMe: data.rememberMe });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-navy-600 focus:ring-4 focus:ring-navy-100 disabled:cursor-not-allowed disabled:bg-slate-50';

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Paramètres */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangDropdown((value) => !value)}
            aria-label={t.language}
            className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-2 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:text-navy-700"
          >
            <FaGlobe size={14} />
            <span className="text-[10px] font-extrabold tracking-wider">{currentLang.short}</span>
          </button>
          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLang(item.code);
                    setShowLangDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition ${
                    lang === item.code
                      ? 'bg-slate-50 font-semibold text-navy-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[9px] font-extrabold text-slate-500">
                    {item.short}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {lang === item.code && <FaCheck size={10} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.info(t.forgotHint)}
          aria-label={t.help}
          title={t.help}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur transition hover:text-navy-700"
        >
          <FaShieldAlt size={14} />
        </button>
      </div>

      {/* Panneau de marque */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy-950 p-12 text-white lg:flex xl:p-16">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-gold-500/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex animate-fade-up items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-lg shadow-black/30">
            <img src={logo} alt="DGRAD" className="h-full w-auto object-contain" />
          </div>
          <div>
            <p className="font-display text-base font-extrabold leading-tight">DGRAD</p>
            <p className="text-[11px] text-blue-100/60">{t.brandSubtitle}</p>
          </div>
        </div>

        <div className="relative max-w-md animate-fade-up">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            {t.heroTitle}{' '}
            <span className="text-gold-300">{t.heroAccent}</span>
          </h1>
          <p className="mt-4 text-sm leading-7 text-blue-100/60">{t.heroText}</p>

          <div className="mt-8 space-y-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5 backdrop-blur-sm"
              >
                <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/20">
                  <feature.icon size={13} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="text-xs leading-5 text-blue-100/60">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex animate-fade-up items-center justify-between border-t border-white/10 pt-6 text-[11px] text-blue-100/50">
          <span>© {new Date().getFullYear()} DGRAD — {t.rights}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.status}
          </span>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-up rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5 sm:p-10">
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 lg:hidden">
              <img src={logo} alt="DGRAD" className="h-full w-auto object-contain" />
            </div>
            <p className="text-center text-sm text-slate-500">{t.subtitle}</p>
          </div>

          {loginError && (
            <div
              className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
              role="alert"
            >
              <FaExclamationCircle className="mt-0.5 flex-none" size={14} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                {t.email}
              </label>
              <div className="relative">
                <FaEnvelope
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="prenom.nom@dgrad.cd"
                  disabled={isSubmitting}
                  {...register('email')}
                  className={`${inputClass} ${
                    errors.email
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  {t.password}
                </label>
                <button
                  type="button"
                  onClick={() => toast.info(t.forgotHint)}
                  className="text-xs font-medium text-navy-700 transition hover:text-navy-900 hover:underline"
                >
                  {t.forgot}
                </button>
              </div>
              <div className="relative">
                <FaLock
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  disabled={isSubmitting}
                  {...register('password')}
                  className={`${inputClass} pr-11 ${
                    errors.password
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 accent-navy-900 focus:ring-navy-200"
                />
                {t.remember}
              </label>
              <span className="text-[11px] font-medium text-slate-400">{t.agents}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-navy-900 to-navy-700 text-sm font-semibold text-white shadow-lg shadow-navy-900/25 transition-all hover:from-navy-800 hover:to-navy-600 hover:shadow-navy-900/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-navy-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" size={14} /> {t.loading}
                </>
              ) : (
                <>
                  <FaUserShield size={14} /> {t.submit}
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" size={12} />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <FaShieldAlt className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-center text-xs text-slate-400">{t.security}</p>
            </div>
          </form>
        </div>

        <p className="absolute bottom-5 text-xs text-slate-400 lg:hidden">
          © {new Date().getFullYear()} DGRAD
        </p>
      </main>
    </div>
  );
};

export default LoginScreen;
