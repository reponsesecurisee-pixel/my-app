import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  Copy,
  CheckCircle
} from 'lucide-react';

const LEMON_SQUEEZY_LINK =
  'https://reponse-securisee.lemonsqueezy.com/checkout/buy/a5cb0bbf-7abc-4af0-945c-b9dc207a3ab2';

export default function App() {
  const [step, setStep] = useState('landing');
  const [adminMode, setAdminMode] = useState(false);

  const [formData, setFormData] = useState({
    situation: '',
    ton: '',
    context: '',
    userMessage: ''
  });

  const [riskScore, setRiskScore] = useState(null);
  const [riskWarnings, setRiskWarnings] = useState([]);
  const [previewText, setPreviewText] = useState('');

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState({ free: 143, paid: 0 });

  /* ================= INIT ================= */

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get('admin') === 'true') {
      setAdminMode(true);
      setStep('results');
    }

    const storedStats = JSON.parse(
      localStorage.getItem('stats') || '{"free":143,"paid":0}'
    );
    setStats(storedStats);

    if (query.get('success') === 'true') {
      const saved = localStorage.getItem('risk_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData);
        setRiskScore(parsed.riskScore);
        incrementPaid();
        generateFullProposals(parsed.formData);
      }
    }
  }, []);

  const saveStats = updated => {
    setStats(updated);
    localStorage.setItem('stats', JSON.stringify(updated));
  };

  const incrementFree = () => {
    const updated = { ...stats, free: stats.free + 1 };
    saveStats(updated);
  };

  const incrementPaid = () => {
    const updated = { ...stats, paid: stats.paid + 1 };
    saveStats(updated);
  };

  /* ================= ANALYZE ================= */

  const analyzeRisk = async () => {
    setLoading(true);
    incrementFree();

    const prompt = `
Message exact:
"${formData.userMessage}"

Analyse comme un détecteur de risque social.
Retourne uniquement:
- score (0–100)
- conséquences sociales directes
- aperçu d’une version à risque réduit

Format JSON strict.
`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const parsed = JSON.parse((await response.json()).result);

      setRiskScore(parsed.score);
      setRiskWarnings(parsed.warnings);
      setPreviewText(parsed.preview);
      setStep('analysis');
    } catch {
      setRiskScore(78);
      setRiskWarnings([
        'Message perçu comme trop familier',
        'Intention ambiguë à ce stade',
        'Probabilité élevée de réponse tiède ou absente'
      ]);
      setPreviewText('Je pensais que…');
      setStep('analysis');
    }

    setLoading(false);
  };

  const handlePayment = () => {
    localStorage.setItem(
      'risk_data',
      JSON.stringify({ formData, riskScore })
    );
    window.location.href = LEMON_SQUEEZY_LINK;
  };

  const generateFullProposals = async data => {
    setLoading(true);
    setStep('results');

    const prompt = `
Propose 3 formulations alternatives
avec un risque social réduit.
Jamais 0%.

Format JSON strict.
`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const parsed = JSON.parse((await response.json()).result);
      setProposals(parsed.proposals);
    } catch {
      setProposals([
        { text: 'Je voulais simplement te dire bonjour.', risk: 22 },
        { text: 'Je pensais à toi.', risk: 34 },
        { text: 'Salut.', risk: 55 }
      ]);
    }

    setLoading(false);
  };

  const handleCopy = text => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ================= LANDING ================= */

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-6" />

          <h1 className="text-4xl font-light mb-4">
            Un message peut créer un malaise
          </h1>

          <p className="text-slate-300 mb-10">
            Une fois envoyé, il modifie la perception
          </p>

          <div className="flex justify-center gap-8 text-sm text-slate-400 mb-10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avant l’envoi
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {stats.free} messages vérifiés
            </div>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full bg-white text-slate-900 py-4 rounded-lg text-lg"
          >
            Vérifier le risque avant l’envoi
          </button>

          {adminMode && (
            <p className="text-xs text-red-400 mt-4">
              ADMIN MODE
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ================= FORM ================= */

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl text-center mb-2">
            Message non envoyé
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            Dernière étape avant une action irréversible
          </p>

          <div className="bg-slate-800 p-6 rounded space-y-6">
            <textarea
              rows={4}
              value={formData.userMessage}
              onChange={e =>
                setFormData({ ...formData, userMessage: e.target.value })
              }
              placeholder="Collez le message tel qu’il serait envoyé"
              className="w-full p-3 bg-slate-700 rounded"
            />

            <button
              onClick={analyzeRisk}
              disabled={loading || !formData.userMessage}
              className="w-full bg-white text-slate-900 py-4 rounded"
            >
              {loading ? 'Analyse…' : 'Calculer le risque'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= ANALYSIS ================= */

  if (step === 'analysis') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-2">
            {riskScore}/100
          </div>

          <p className="text-slate-400 mb-6">
            Conséquence probable
          </p>

          <div className="bg-slate-800 p-4 text-left mb-6">
            {riskWarnings.map((w, i) => (
              <div key={i}>⚠️ {w}</div>
            ))}
          </div>

          <div className="relative bg-slate-800 p-4 mb-6">
            <p className="blur-sm">{previewText}</p>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
              Version actuellement à risque
            </div>
          </div>

          <p className="text-slate-400 mb-2">
            Après l’envoi, il est trop tard pour corriger.
          </p>

          <p className="text-2xl mb-2">1,90 €</p>

          <button
            onClick={handlePayment}
            className="w-full bg-white text-slate-900 py-4 rounded"
          >
            Accéder aux formulations
          </button>
        </div>
      </div>
    );
  }

  /* ================= RESULTS ================= */

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-4" />

          {loading ? (
            <p className="text-center">Génération…</p>
          ) : (
            proposals.map((p, i) => (
              <div key={i} className="bg-slate-800 p-4 mb-4">
                <p>"{p.text}"</p>
                <p className="text-xs text-slate-400">
                  Risque résiduel : {p.risk}/100
                </p>
              </div>
            ))
          )}

          {adminMode && (
            <div className="mt-10 text-xs text-slate-400">
              ADMIN — Free: {stats.free} | Paid: {stats.paid}
            </div>
          )}
        </div>
      </div>
    );
  }
}
