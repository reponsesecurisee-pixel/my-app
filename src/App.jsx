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
    userMessage: ''
  });
  
  const [riskScore, setRiskScore] = useState(null);
  const [riskWarnings, setRiskWarnings] = useState([]);
  const [previewText, setPreviewText] = useState('');
  
  const [proposals, setProposals] = useState([]);
  const [advice, setAdvice] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

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
    const prompt = `Analyse ce message avant son envoi (C'EST UN DÉTECTEUR DE RISQUE, sois critique).
    
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
    
    const prompt = `Génère 3 corrections parfaites pour ce message + 1 conseil stratégique.
    
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
      
      const proposalsList = Array
