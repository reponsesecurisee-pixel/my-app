import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Users, Copy, CheckCircle } from 'lucide-react';

// ✅ ВАША ССЫЛКА НА ОПЛАТУ ВСТАВЛЕНА СЮДА:
const LEMON_SQUEEZY_LINK = "https://reponse-securisee.lemonsqueezy.com/checkout/buy/a5cb0bbf-7abc-4af0-945c-b9dc207a3ab2"; 

export default function ValentinApp() {
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
  const [daysLeft, setDaysLeft] = useState(0);

  // 1. ЛОГИКА ВОЗВРАТА ПОСЛЕ ОПЛАТЫ
  useEffect(() => {
    // Таймер до 14 февраля
    const valentine = new Date('2026-02-14');
    const today = new Date();
    const diff = Math.ceil((valentine - today) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff > 0 ? diff : 0);

    // Проверяем, вернулся ли клиент после оплаты
    const query = new URLSearchParams(window.location.search);
    if (query.get('success') === 'true') {
      // Восстанавливаем данные
      const savedData = localStorage.getItem('valentin_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed.formData);
        setRiskScore(parsed.riskScore);
        
        // Запускаем генерацию результатов
        generateFullProposals(parsed.formData);
      }
    }
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

  // 2. ФУНКЦИЯ ОПЛАТЫ
  const handlePayment = () => {
    // Сохраняем данные перед уходом на оплату
    localStorage.setItem('valentin_data', JSON.stringify({
      formData,
      riskScore
    }));
    
    // Перенаправляем на Lemon Squeezy
    window.location.href = LEMON_SQUEEZY_LINK;
  };

  const analyzeRisk = async () => {
    setLoading(true);
    const prompt = `Analyse ce contexte de message pour la Saint-Valentin:
    Situation: ${formData.situation}, Ton: ${formData.ton}, Message: "${formData.userMessage}", Contexte: ${formData.context}.
    TÂCHE 1: Score risque (0-100). TÂCHE 2: 2-3 conséquences sociales. TÂCHE 3: Preview calibrée.
    Réponds JSON: { "score": 65, "warnings": ["..."], "preview": "..." }`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemContext: 'Tu es un expert en interactions sociales. Réponds en JSON.' })
      });
      const data = await response.json();
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;

      setRiskScore(parsed.score);
      setRiskWarnings(parsed.warnings);
      setPreviewText(parsed.preview);
      setStep('analysis');
    } catch (error) {
      console.error(error);
      setRiskScore(68);
      setRiskWarnings(["Risque de malaise élevé", "Réponse polie mais froide probable"]);
      setPreviewText("Je pensais à toi...");
      setStep('analysis');
    }
    setLoading(false);
  };

  const generateFullProposals = async (dataToUse = formData) => {
    setLoading(true);
    setStep('results'); // Показываем экран загрузки/результатов
    
    const prompt = `Génère 3 propositions de messages courts pour la Saint-Valentin:
    Situation: ${dataToUse.situation}, Ton: ${dataToUse.ton}, Contexte: ${dataToUse.context}.
    RÈGLES: Français élégant, pas de clichés.
    Réponds JSON: { "proposals": [{"text": "...", "risk": 20}, ...] }`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemContext: 'Tu es un expert en copywriting. Réponds en JSON.' })
      });
      const data = await response.json();
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      const proposalsList = Array.isArray(parsed) ? parsed : (parsed.proposals || []);
      
      setProposals(proposalsList.sort((a, b) => a.risk - b.risk));
    } catch (error) {
      setProposals([
        {text: "J'ai pensé à toi ce matin.", risk: 20},
        {text: "Petit message pour te souhaiter une belle journée.", risk: 15},
        {text: "Je voulais juste te dire bonjour.", risk: 30}
      ]);
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

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full">
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
            
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-left space-y-4 mb-8">
               <div className="flex items-center gap-2 text-red-300"><span className="text-red-500">❌</span> Trop intense: elle prend ses distances</div>
               <div className="flex items-center gap-2 text-red-300"><span className="text-red-500">❌</span> Trop banal: perte d'intérêt immédiate</div>
               <div className="flex items-center gap-2 text-red-300"><span className="text-red-500">❌</span> Mauvais timing: silence radio</div>
            </div>
          </div>

          <button onClick={() => setStep('form')} className="w-full bg-white text-slate-900 py-4 rounded-lg font-medium text-lg hover:bg-slate-100 transition">
            Voir si c'est une mauvaise idée — gratuit
          </button>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light">Décrivez votre situation</h1>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-6">
            <div>
              <label className="block text-slate-300 mb-2">Situation</label>
              <select value={formData.situation} onChange={(e) => setFormData({...formData, situation: e.target.value})} className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600">
                <option value="">Choisir...</option>
                {situations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Ton</label>
              <select value={formData.ton} onChange={(e) => setFormData({...formData, ton: e.target.value})} className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600">
                <option value="">Choisir...</option>
                {tons.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-slate-300 mb-2">Contexte (optionnel)</label>
              <textarea value={formData.context} onChange={(e) => setFormData({...formData, context: e.target.value})} className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600" rows={3} placeholder="Ex: On s'est vus 3 fois..."/>
            </div>
            <button onClick={analyzeRisk} disabled={loading || !formData.situation} className="w-full bg-white text-slate-900 py-4 rounded font-medium mt-4 disabled:opacity-50">
              {loading ? 'Analyse...' : 'Analyser le risque'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'analysis') {
    const risk = getRiskLevel(riskScore);
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-6 text-center">
            <div className="text-5xl font-light mb-2">{riskScore}<span className="text-2xl text-slate-500">/100</span></div>
            <div className={`inline-block px-4 py-2 rounded-full ${risk.bg} ${risk.color} mb-4`}>{risk.label}</div>
            <div className="text-left space-y-2">
              {riskWarnings.map((w, i) => <div key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-red-400">•</span>{w}</div>)}
            </div>
            <div className="mt-6 p-4 bg-slate-900/80 rounded relative">
              <p className="blur-sm text-slate-500 select-none">{previewText}</p>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-medium">Version complète verrouillée</span></div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
            <p className="text-2xl font-light mb-1">1,90 €</p>
            <p className="text-slate-400 text-sm mb-6">3 versions calibrées + scores de risque</p>
            
            {/* КНОПКА ОПЛАТЫ */}
            <button onClick={handlePayment} className="w-full bg-white text-slate-900 py-4 rounded font-medium hover:bg-slate-100 transition">
              Débloquer les 3 versions — 1,90 €
            </button>
            <p className="text-xs text-slate-500 mt-4">Via Lemon Squeezy • Paiement sécurisé</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light">C'est prêt !</h1>
          </div>

          {loading ? (
             <div className="text-center py-12 text-slate-400">L'IA rédige vos messages...</div>
          ) : (
            <div className="space-y-4">
              {proposals.map((prop, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Option {idx + 1}</span>
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded">Risque: {prop.risk}/100</span>
                  </div>
                  <p className="text-lg mb-4">{prop.text}</p>
                  <button onClick={() => handleCopy(prop.text)} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300">
                    {copied ? 'Copié !' : 'Copier le texte'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => { localStorage.removeItem('valentin_data'); window.location.href = '/'; }} className="w-full mt-8 py-4 text-slate-500 hover:text-white transition">
            Recommencer
          </button>
        </div>
      </div>
    );
  }
}
