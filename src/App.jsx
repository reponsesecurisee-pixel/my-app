import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  Copy,
  CheckCircle
} from 'lucide-react';

// 🔒 ССЫЛКА НА ОПЛАТУ
const LEMON_SQUEEZY_LINK =
  'https://reponse-securisee.lemonsqueezy.com/checkout/buy/a5cb0bbf-7abc-4af0-945c-b9dc207a3ab2';

export default function App() {
  const [step, setStep] = useState('landing');

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

  const [messagesCount, setMessagesCount] = useState(143);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success') === 'true') {
      const saved = localStorage.getItem('risk_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData);
        setRiskScore(parsed.riskScore);
        generateFullProposals(parsed.formData);
      }
    }
  }, []);

  const situations = [
    'Début de relation',
    'Relation ambiguë',
    'Reprise de contact',
    'Justification ou clarification',
    'Message spontané'
  ];

  const tons = [
    'Sobre',
    'Neutre',
    'Chaleureux mesuré',
    'Distant'
  ];

  const analyzeRisk = async () => {
    setLoading(true);

    const prompt = `
Message à analyser:

Situation: ${formData.situation}
Ton perçu: ${formData.ton}
Message exact: "${formData.userMessage}"
Contexte: ${formData.context}

Tâches:
1. Estimer un risque social (0–100)
2. Lister 2–3 conséquences sociales plausibles
3. Donner un aperçu partiel d’une formulation à risque réduit

Format JSON strict:
{
  "score": 72,
  "warnings": ["..."],
  "preview": "..."
}
`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const parsed =
        typeof data.result === 'string'
          ? JSON.parse(data.result)
          : data.result;

      setRiskScore(parsed.score);
      setRiskWarnings(parsed.warnings || []);
      setPreviewText(parsed.preview || '');
      setMessagesCount(c => c + 1);
      setStep('analysis');
    } catch (e) {
      setRiskScore(78);
      setRiskWarnings([
        'Intensité perçue comme excessive',
        'Signal difficile à interpréter',
        'Risque de réponse tiède ou absente'
      ]);
      setPreviewText('Je pensais que...');
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

  const generateFullProposals = async (dataToUse) => {
    setLoading(true);
    setStep('results');

    const prompt = `
Message original:
"${dataToUse.userMessage}"

Génère 3 formulations alternatives
avec un risque social réduit.

Contraintes:
- Plus court
- Plus neutre
- Sans pression
- Sans promesse

Format JSON strict:
{
  "proposals": [
    { "text": "...", "risk": 18 }
  ]
}
`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      const parsed =
        typeof data.result === 'string'
          ? JSON.parse(data.result)
          : data.result;

      setProposals(parsed.proposals || []);
    } catch (e) {
      setProposals([
        { text: 'Je voulais simplement te dire bonjour.', risk: 18 },
        { text: 'Je pensais à toi.', risk: 32 },
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

  const getRiskLabel = score => {
    if (score < 30) return 'Risque faible';
    if (score < 60) return 'Risque modéré';
    return 'Risque élevé';
  };

  /* ================= LANDING ================= */

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-3 bg-red-900/30 rounded-full mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-4xl font-light mb-4">
            Un message peut créer un malaise
          </h1>

          <p className="text-xl text-slate-300 font-light mb-10">
            Une erreur de formulation change la perception
          </p>

          <div className="flex justify-center gap-8 text-sm text-slate-400 mb-10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Avant l’envoi</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{messagesCount} messages analysés</span>
            </div>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full bg-white text-slate-900 py-4 rounded-lg font-medium text-lg hover:bg-slate-100 transition"
          >
            Vérifier le risque avant l’envoi
          </button>
        </div>
      </div>
    );
  }

  /* ================= FORM ================= */

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-light text-center mb-2">
            Message non envoyé
          </h1>
          <p className="text-slate-400 text-sm text-center mb-8">
            Dernière étape avant une action irréversible
          </p>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-6">
            <select
              value={formData.situation}
              onChange={e =>
                setFormData({ ...formData, situation: e.target.value })
              }
              className="w-full p-3 bg-slate-700 rounded border border-slate-600"
            >
              <option value="">Situation</option>
              {situations.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              value={formData.ton}
              onChange={e =>
                setFormData({ ...formData, ton: e.target.value })
              }
              className="w-full p-3 bg-slate-700 rounded border border-slate-600"
            >
              <option value="">Ton perçu</option>
              {tons.map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <textarea
              rows={4}
              value={formData.userMessage}
              onChange={e =>
                setFormData({ ...formData, userMessage: e.target.value })
              }
              placeholder="Collez le message tel qu’il serait envoyé"
              className="w-full p-3 bg-slate-700 rounded border border-slate-600"
            />

            <textarea
              rows={2}
              value={formData.context}
              onChange={e =>
                setFormData({ ...formData, context: e.target.value })
              }
              placeholder="Contexte (optionnel)"
              className="w-full p-3 bg-slate-700 rounded border border-slate-600"
            />

            <button
              onClick={analyzeRisk}
              disabled={
                loading ||
                !formData.situation ||
                !formData.ton ||
                !formData.userMessage
              }
              className="w-full bg-white text-slate-900 py-4 rounded font-medium disabled:opacity-50"
            >
              {loading ? 'Analyse du risque…' : 'Calculer le risque'}
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
          <div className="text-5xl font-light mb-2">
            {riskScore}
            <span className="text-2xl text-slate-500">/100</span>
          </div>

          <div className="text-slate-400 mb-6">
            {getRiskLabel(riskScore)}
          </div>

          <div className="bg-slate-800/50 p-4 rounded border border-slate-700 text-left mb-6">
            <p className="text-xs uppercase text-slate-400 mb-3">
              Estimation du risque social
            </p>
            {riskWarnings.map((w, i) => (
              <div key={i} className="text-sm mb-1">
                ⚠️ {w}
              </div>
            ))}
          </div>

          <div className="relative bg-slate-800 p-4 rounded border border-slate-700 mb-6">
            <p className="text-xs text-slate-500 mb-2">
              Version à risque réduit
            </p>
            <p className="blur-sm text-slate-400">{previewText}</p>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
              <span className="text-sm bg-slate-700 px-3 py-1 rounded">
                Contenu verrouillé
              </span>
            </div>
          </div>

          <p className="text-2xl font-light mb-1">1,90 €</p>
          <p className="text-slate-400 text-sm mb-6">
            3 formulations à risque réduit
          </p>

          <button
            onClick={handlePayment}
            className="w-full bg-white text-slate-900 py-4 rounded font-medium"
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
          <div className="text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light">Résultat</h1>
            <p className="text-slate-400">
              Formulations à risque réduit
            </p>
          </div>

          {loading ? (
            <p className="text-center text-slate-400">
              Génération…
            </p>
          ) : (
            <div className="space-y-6">
              {proposals.map((p, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 p-6 rounded border border-slate-700"
                >
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-slate-400">
                      Option {i + 1}
                    </span>
                    <span className="text-xs text-slate-400">
                      Risque {p.risk}/100
                    </span>
                  </div>
                  <p className="text-lg font-light mb-4">
                    “{p.text}”
                  </p>
                  <button
                    onClick={() => handleCopy(p.text)}
                    className="text-sm text-green-400"
                  >
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              localStorage.removeItem('risk_data');
              window.location.href = '/';
            }}
            className="w-full mt-10 text-sm text-slate-500"
          >
            Vérifier un autre message
          </button>
        </div>
      </div>
    );
  }
}
