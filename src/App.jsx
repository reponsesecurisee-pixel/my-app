import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Users, Copy, CheckCircle, Lightbulb } from 'lucide-react';

// ✅ ВАША ССЫЛКА НА ОПЛАТУ:
const LEMON_SQUEEZY_LINK = "https://reponse-securisee.lemonsqueezy.com/checkout/buy/a5cb0bbf-7abc-4af0-945c-b9dc207a3ab2"; 

export default function ValentinApp() {
  const [step, setStep] = useState('landing');
  const [formData, setFormData] = useState({
    situation: '',
    ton: '',
    context: '',
    userMessage: '' // Теперь это обязательное поле
  });
  
  // Состояния для результатов
  const [riskScore, setRiskScore] = useState(null);
  const [riskWarnings, setRiskWarnings] = useState([]);
  const [previewText, setPreviewText] = useState('');
  
  // Состояния для платной части
  const [proposals, setProposals] = useState([]);
  const [advice, setAdvice] = useState(''); // Новое поле для совета
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  // 1. ЛОГИКА ВОЗВРАТА ПОСЛЕ ОПЛАТЫ
  useEffect(() => {
    const valentine = new Date('2026-02-14');
    const today = new Date();
    const diff = Math.ceil((valentine - today) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff > 0 ? diff : 0);

    const query = new URLSearchParams(window.location.search);
    if (query.get('success') === 'true') {
      const savedData = localStorage.getItem('valentin_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed.formData);
        setRiskScore(parsed.riskScore);
        // Запускаем генерацию
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

  const handlePayment = () => {
    localStorage.setItem('valentin_data', JSON.stringify({
      formData,
      riskScore
    }));
    window.location.href = LEMON_SQUEEZY_LINK;
  };

  const analyzeRisk = async () => {
    setLoading(true);
    // Промпт теперь жестче привязан к тексту пользователя
    const prompt = `Analyse ce message pour la Saint-Valentin (C'EST UN DÉTECTEUR DE RISQUE, sois critique).
    
    Situation: ${formData.situation}
    Ton voulu: ${formData.ton}
    Message de l'utilisateur (OBLIGATOIRE): "${formData.userMessage}"
    Contexte: ${formData.context}

    TÂCHE 1: Score risque (0-100). Soyez sévère si c'est "beauf" ou lourd.
    TÂCHE 2: 2-3 conséquences sociales concrètes (ex: "Elle va screen pour montrer à ses copines").
    TÂCHE 3: Preview d'une correction (juste le début flouté).

    Réponds JSON: { "score": 65, "warnings": ["..."], "preview": "..." }`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemContext: 'Tu es un expert en dynamique sociale parisienne. Tu juges les SMS.' })
      });
      const data = await response.json();
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;

      setRiskScore(parsed.score);
      setRiskWarnings(parsed.warnings);
      setPreviewText(parsed.preview);
      setStep('analysis');
    } catch (error) {
      console.error(error);
      setRiskScore(72);
      setRiskWarnings(["Risque d'être vu comme 'lourd'", "Le message manque de subtilité"]);
      setPreviewText("Je pensais que...");
      setStep('analysis');
    }
    setLoading(false);
  };

  const generateFullProposals = async (dataToUse = formData) => {
    setLoading(true);
    setStep('results'); 
    
    // Добавил запрос СОВЕТА (Advice)
    const prompt = `Génère 3 corrections parfaites pour ce message de Saint-Valentin + 1 conseil stratégique.
    
    Situation: ${dataToUse.situation}
    Ton: ${dataToUse.ton}
    Message original (à corriger): "${dataToUse.userMessage}"
    Contexte: ${dataToUse.context}

    RÈGLES: Français élégant, pas de clichés, pas de "mon amour" si c'est le début.

    Réponds JSON: { 
      "proposals": [{"text": "...", "risk": 15}, ...],
      "advice": "Un conseil court sur le timing ou l'attitude (ex: attends 20h pour envoyer...)"
    }`;

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemContext: 'Tu es un coach en communication. Réponds en JSON.' })
      });
      const data = await response.json();
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      
      const proposalsList = Array.isArray(parsed) ? parsed : (parsed.proposals || []);
      setProposals(proposalsList.sort((a, b) => a.risk - b.risk));
      setAdvice(parsed.advice || "N'envoyez pas de deuxième message si elle ne répond pas.");
      
    } catch (error) {
      setProposals([
        {text: "Une pensée pour toi aujourd'hui.", risk: 15},
        {text: "Bonne Saint-Valentin.", risk: 35},
        {text: "Salut, ça va ?", risk: 60}
      ]);
      setAdvice("Restez léger, ne mettez pas de pression.");
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

  // --- ЭКРАН 1: LANDING ---
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-red-900/30 rounded-full mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            {/* СМЕНА ПОЗИЦИОНИРОВАНИЯ */}
            <h1 className="text-4xl font-light mb-4">Détecteur de Risque SMS</h1>
            <p className="text-xl text-slate-300 font-light mb-8">Ne devenez pas "le mec bizarre" à la Saint-Valentin.</p>
            
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
            Tester mon message — gratuit
          </button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН 2: ФОРМА (ОБЯЗАТЕЛЬНЫЕ ПОЛЯ) ---
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light">Analysez votre brouillon</h1>
            <p className="text-slate-400 text-sm mt-2">Tous les champs sont obligatoires pour un calcul précis.</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-6">
            <div>
              <label className="block text-slate-300 mb-2 font-medium">Situation <span className="text-red-400">*</span></label>
              <select value={formData.situation} onChange={(e) => setFormData({...formData, situation: e.target.value})} className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600 focus:border-white outline-none">
                <option value="">Choisir...</option>
                {situations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-slate-300 mb-2 font-medium">Ton souhaité <span className="text-red-400">*</span></label>
              <select value={formData.ton} onChange={(e) => setFormData({...formData, ton: e.target.value})} className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600 focus:border-white outline-none">
                <option value="">Choisir...</option>
                {tons.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Votre brouillon de message <span className="text-red-400">*</span>
              </label>
              <textarea 
                value={formData.userMessage} 
                onChange={(e) => setFormData({...formData, userMessage: e.target.value})} 
                className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600 focus:border-white outline-none" 
                rows={4} 
                placeholder="Écrivez ce que vous comptiez envoyer (même si c'est nul, l'IA va le corriger)..."
              />
            </div>

             <div>
              <label className="block text-slate-300 mb-2 font-medium">Contexte additionnel <span className="text-slate-500 text-sm">(Optionnel)</span></label>
              <textarea value={formData.context} onChange={(e) => setFormData({...formData, context: e.target.value})} className="w-full p-3 bg-slate-700 rounded text-white border border-slate-600 focus:border-white outline-none" rows={2} placeholder="Ex: On s'est vus 3 fois, elle met du temps à répondre..."/>
            </div>

            {/* ВАЛИДАЦИЯ: КНОПКА НЕАКТИВНА БЕЗ СООБЩЕНИЯ */}
            <button 
              onClick={analyzeRisk} 
              disabled={loading || !formData.situation || !formData.ton || !formData.userMessage} 
              className="w-full bg-white text-slate-900 py-4 rounded font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition"
            >
              {loading ? 'Analyse du risque...' : 'Calculer le % de risque'}
            </button>
            
            {(!formData.userMessage && formData.situation) && (
              <p className="text-center text-xs text-red-400">⚠️ Vous devez écrire un message pour l'analyser.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН 3: АНАЛИЗ (PREVIEW) ---
  if (step === 'analysis') {
    const risk = getRiskLevel(riskScore);
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-6 text-center">
            <div className="text-5xl font-light mb-2">{riskScore}<span className="text-2xl text-slate-500">/100</span></div>
            <div className={`inline-block px-4 py-2 rounded-full ${risk.bg} ${risk.color} mb-4`}>{risk.label}</div>
            
            <div className="text-left space-y-3 bg-slate-900/50 p-4 rounded mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Diagnostic:</p>
              {riskWarnings.map((w, i) => <div key={i} className="text-sm text-slate-200 flex gap-2"><span className="text-red-400">⚠️</span>{w}</div>)}
            </div>

            <div className="mt-6 p-4 bg-slate-900/80 rounded relative border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2 text-left">Aperçu de la correction:</p>
              <p className="blur-sm text-slate-400 select-none text-left">{previewText}</p>
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[1px]">
                <span className="text-sm font-medium bg-slate-800 px-3 py-1 rounded border border-slate-600">Version sécurisée verrouillée</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
            <p className="text-2xl font-light mb-1">1,90 €</p>
            <p className="text-slate-400 text-sm mb-6">3 corrections + Conseil stratégique</p>
            
            <button onClick={handlePayment} className="w-full bg-white text-slate-900 py-4 rounded font-medium hover:bg-slate-100 transition shadow-lg shadow-white/5">
              Obtenir les solutions — 1,90 €
            </button>
            <p className="text-xs text-slate-500 mt-4">Paiement sécurisé • Résultats immédiats</p>
          </div>
        </div>
      </div>
    );
  }

  // --- ЭКРАН 4: РЕЗУЛЬТАТЫ (PAID) ---
  if (step === 'results') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light">C'est prêt.</h1>
            <p className="text-slate-400">Voici vos options sécurisées.</p>
          </div>

          {loading ? (
             <div className="text-center py-12 text-slate-400 animate-pulse">L'IA rédige vos messages et prépare le conseil...</div>
          ) : (
            <div className="space-y-6">
              
              {/* НОВЫЙ БЛОК: СОВЕТ */}
              {advice && (
                <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-lg flex gap-4 items-start">
                  <Lightbulb className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-blue-200 font-medium text-sm mb-1">Conseil Stratégique</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">{advice}</p>
                  </div>
                </div>
              )}

              {proposals.map((prop, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg hover:border-slate-500 transition">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-slate-400 font-medium">Option {idx + 1}</span>
                    <span className={`text-xs px-2 py-1 rounded ${prop.risk < 30 ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-400'}`}>
                      Risque: {prop.risk}/100
                    </span>
                  </div>
                  <p className="text-lg mb-4 text-slate-100 leading-relaxed font-light">"{prop.text}"</p>
                  <button onClick={() => handleCopy(prop.text)} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 font-medium">
                    {copied ? 'Copié !' : 'Copier le texte'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => { localStorage.removeItem('valentin_data'); window.location.href = '/'; }} className="w-full mt-12 py-4 text-slate-500 hover:text-white transition text-sm">
            Analyser un autre message
          </button>
        </div>
      </div>
    );
  }
}
