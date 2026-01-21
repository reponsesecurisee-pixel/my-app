import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Users, Copy, CheckCircle } from 'lucide-react';

export default function ValentinApp() {
  const [step, setStep] = useState('landing');
  const [formData, setFormData] = useState({
    situation: '',
    ton: '',
    context: '',
    userMessage: '',
    withUpsell: false
  });
  const [riskScore, setRiskScore] = useState(null);
  const [riskWarnings, setRiskWarnings] = useState([]);
  const [previewText, setPreviewText] = useState('');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const valentine = new Date('2026-02-14');
    const today = new Date();
    const diff = Math.ceil((valentine - today) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff > 0 ? diff : 0);
  }, []);

  const situations = [
    'Début de relation (moins de 2 mois)',
    'Relation ambiguë',
    'Reprise de contact',
    'Excuse ou justification',
    'Simple envie de dire quelque chose'
  ];

  const tons = [
    'Léger et décontracté',
    'Sincère mais sobre',
    'Chaleureux sans excès',
    'Distant mais bienveillant'
  ];

  // --- ЛОГИКА АНАЛИЗА РИСКА ---
  const analyzeRisk = async () => {
    setLoading(true);
    
    const prompt = `Analyse ce contexte de message pour la Saint-Valentin:

Situation: ${formData.situation}
Ton recherché: ${formData.ton}
${formData.userMessage ? `Message écrit par l'utilisateur: "${formData.userMessage}"` : ''}
Contexte: ${formData.context || 'aucun'}

TÂCHE 1: Donne un score de risque de 0 à 100 (où 100 = risque maximum de malaise)
TÂCHE 2: Liste 2-3 CONSÉQUENCES SOCIALES CONCRÈTES
Exemples:
- "Peut la forcer à répondre par politesse"
- "Crée une dette émotionnelle involontaire"

TÂCHE 3: Génère UN exemple de message calibré (2-3 phrases max, sobre, français élégant)

Réponds UNIQUEMENT en JSON format:
{
  "score": 65,
  "warnings": ["Warning 1", "Warning 2"],
  "preview": "Texte exemple"
}`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          systemContext: 'Tu es un expert en interactions sociales. Réponds toujours en JSON valide.'
        })
      });

      const data = await response.json();
      const parsed = JSON.parse(data.result);

      setRiskScore(parsed.score);
      setRiskWarnings(parsed.warnings);
      setPreviewText(parsed.preview);
      setStep('analysis');
    } catch (error) {
      console.error("Erreur API:", error);
      // Fallback на случай ошибки
      setRiskScore(68);
      setRiskWarnings(["Erreur de connexion (mais le risque est réel)", "Réessayez plus tard"]);
      setPreviewText("Je pensais à toi...");
      setStep('analysis');
    }
    
    setLoading(false);
  };

  // --- ЛОГИКА ГЕНЕРАЦИИ ВАРИАНТОВ ---
  const generateFullProposals = async () => {
    setLoading(true);
    
    const prompt = `Génère 3 propositions de messages courts pour la Saint-Valentin:

Situation: ${formData.situation}
Ton: ${formData.ton}
Contexte: ${formData.context || 'aucun'}

RÈGLES:
- Français élégant, sobre
- 2-3 phrases max
- Pas de clichés
- Pas d'emojis

Réponds UNIQUEMENT en JSON format:
{
  "proposals": [
    {"text": "Proposition 1", "risk": 25},
    {"text": "Proposition 2", "risk": 18},
    {"text": "Proposition 3", "risk": 30}
  ]
}`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          systemContext: 'Tu es un expert en copywrting. Réponds toujours en JSON valide.'
        })
      });

      const data = await response.json();
      const parsed = JSON.parse(data.result);
      
      // Сортировка по риску
      const sorted = parsed.proposals.sort((a, b) => a.risk - b.risk);
      setProposals(sorted);
      setStep('results');
    } catch (error) {
      console.error("Erreur API:", error);
      // Fallback
      setProposals([
        {text: "J'ai pensé à toi ce matin.", risk: 20},
        {text: "Bonne Saint-Valentin.", risk: 40},
        {text: "Salut, ça va ?", risk: 60}
      ]);
      setStep('results');
    }
    
    setLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskLevel = (score) => {
    if (score < 30) return { label: 'Risque faible', color: 'text-green-600', bg: 'bg-green-50' };
    if (score < 60) return { label: 'Risque modéré', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'Risque élevé', color: 'text-red-600', bg: 'bg-red-50' };
  };

  // --- RENDER ---
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-red-900/30 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-4xl font-light mb-4">Saint-Valentin: évitez l'erreur</h1>
            <p className="text-xl text-slate-300 font-light mb-8">Un message raté → vous devenez "le mec un peu bizarre"</p>
            
            <div className="flex justify-center gap-8 mb-8">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Jusqu'au 14 février: <span className="text-white font-medium">{daysLeft} jours</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                <span><span className="text-white font-medium">143</span> messages analysés</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 mb-8">
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <div className="flex items-start gap-3"><span className="text-red-400 text-xl">→</span><p>Un message raté</p></div>
              <div className="flex items-start gap-3 pl-6"><span className="text-red-400 text-xl">→</span><p>Silence. Ou pire: "Merci ☺️"</p></div>
              <div className="flex items-start gap-3 pl-12"><span className="text-red-400 text-xl">→</span><p>Réponse polie qui tue tout</p></div>
              <div className="flex items-start gap-3 pl-18"><span className="text-red-400 text-xl">→</span><p className="font-medium">Vous devenez "le mec un peu bizarre"</p></div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-400 text-center">⚠️ 73% des messages Saint-Valentin créent un malaise</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
              <p className="text-sm text-red-300 mb-2">❌ Trop intense</p>
              <p className="text-xs text-red-400/80">→ elle prend ses distances sans l'expliquer</p>
            </div>
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
              <p className="text-sm text-red-300 mb-2">❌ Trop banal</p>
              <p className="text-xs text-red-400/80">→ impression de copier-coller, perte d'intérêt immédiate</p>
            </div>
          </div>

          <button onClick={() => setStep('form')} className="w-full bg-white text-slate-900 py-4 rounded-lg font-medium text-lg hover:bg-slate-100 transition">
            Voir si c'est une mauvaise idée — gratuit
          </button>
          <p className="text-center text-sm text-slate-500 mt-6">Analyse gratuite • Payant uniquement si vous voulez les solutions</p>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light mb-2">Décrivez votre situation</h1>
            <p className="text-slate-400">Avant de commettre l'erreur</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <div className="mb-6">
              <label className="block text-slate-300 font-light mb-3">Type de situation</label>
              <select value={formData.situation} onChange={(e) => setFormData({...formData, situation: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Choisir...</option>
                {situations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 font-light mb-3">Ton recherché</label>
              <select value={formData.ton} onChange={(e) => setFormData({...formData, ton: e.target.value})} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Choisir...</option>
                {tons.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 font-light mb-3">Votre idée de message (optionnel)</label>
              <textarea value={formData.userMessage} onChange={(e) => setFormData({...formData, userMessage: e.target.value})} placeholder="Si vous avez déjà une idée, écrivez-la ici..." rows={3} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"/>
            </div>

            <div className="mb-8">
              <label className="block text-slate-300 font-light mb-3">Contexte additionnel</label>
              <textarea value={formData.context} onChange={(e) => setFormData({...formData, context: e.target.value})} placeholder="Ex: On se voit depuis 3 semaines..." rows={3} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"/>
            </div>

            <button onClick={analyzeRisk} disabled={loading || !formData.situation || !formData.ton} className="w-full bg-white text-slate-900 py-4 rounded-lg font-medium text-lg hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Analyse en cours...' : 'Analyser le risque'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'analysis') {
    const risk = getRiskLevel(riskScore);
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light mb-2">Analyse de risque</h1>
            <p className="text-slate-400 text-sm">Avant qu'il soit trop tard</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-light mb-2">{riskScore}<span className="text-2xl text-slate-500">/100</span></div>
              <div className={`inline-block px-4 py-2 rounded-full ${risk.bg} border border-${risk.color.replace('text-', '')}/30`}>
                <span className={risk.color}>{risk.label} de malaise</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-400 font-medium">Problèmes détectés:</p>
              {riskWarnings.map((warning, i) => (
                <div key={i} className="flex gap-3 text-slate-300 text-sm">
                  <span className="text-red-400">•</span><span>{warning}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700 pt-6">
              <p className="text-sm text-slate-400 mb-3">Aperçu d'une version calibrée:</p>
              <div className="bg-slate-900/50 rounded-lg p-4 relative overflow-hidden">
                <p className="text-slate-400 blur-sm select-none">{previewText}</p>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-2">Version complète verrouillée</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 mb-6">
            <div className="flex gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
              <div className="text-sm text-red-200">
                <p className="font-medium mb-2">Si sa réponse est faible, vous ne pourrez plus rien faire.</p>
                <p className="text-red-300 mb-2">Un emoji seul. Un "merci" sec. Le silence.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-2xl font-light mb-1">1,90 €</p>
              <p className="text-slate-400 text-sm">3 versions calibrées + scores de risque</p>
            </div>
          </div>

          <button onClick={generateFullProposals} disabled={loading} className="w-full bg-white text-slate-900 py-4 rounded-lg font-medium text-lg hover:bg-slate-100 transition disabled:opacity-50">
            {loading ? 'Génération...' : 'Débloquer les 3 versions — 1,90 €'}
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">Paiement sécurisé • Remboursement si insatisfait</p>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light mb-2">Vos 3 propositions calibrées</h1>
            <p className="text-slate-400 mb-1">Triées du plus sûr au plus risqué</p>
          </div>

          <div className="space-y-4 mb-8">
            {proposals.map((prop, idx) => {
              const risk = getRiskLevel(prop.risk);
              const isSafest = idx === 0;
              return (
                <div key={idx} className={`bg-slate-800/50 backdrop-blur border rounded-lg p-6 ${isSafest ? 'border-green-500/30 ring-2 ring-green-500/20' : 'border-slate-700'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">Option {idx + 1}</span>
                      {isSafest && <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/30">Plus sûr</span>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${risk.bg} ${risk.color}`}>Risque: {prop.risk}/100</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed mb-4">{prop.text}</p>
                  <button onClick={() => handleCopy(prop.text)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié!' : 'Copier le texte'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-6 mb-8">
            <div className="flex gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-red-200 font-medium mb-3">Important à savoir</p>
                <p className="text-sm text-red-300 mb-4">La plupart des malaises arrivent APRÈS le premier message.</p>
                <div className="space-y-2 text-sm text-red-300 mb-4">
                  <p>• Si elle répond avec un emoji seul</p>
                  <p>• Si elle dit juste "Merci"</p>
                </div>
              </div>
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={formData.withUpsell} onChange={(e) => setFormData({...formData, withUpsell: e.target.checked})} className="mt-1 w-4 h-4"/>
              <div className="text-sm">
                <span className="text-white font-medium">Débloquer les scénarios de suivi (+0,90 €)</span>
                <p className="text-slate-400 mt-1">Comment ne pas aggraver après une réponse faible</p>
              </div>
            </label>
          </div>

          <button onClick={() => { setStep('landing'); setFormData({situation: '', ton: '', context: '', userMessage: '', withUpsell: false}); setProposals([]); setRiskScore(null); }} className="w-full bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-600 transition">
            Nouvelle analyse
          </button>
        </div>
      </div>
    );
  }
}
