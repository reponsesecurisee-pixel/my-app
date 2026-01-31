const isAdmin =
  new URLSearchParams(window.location.search).get('admin') === '1'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, Users, CheckCircle, Lightbulb } from 'lucide-react'

const LEMON_SQUEEZY_LINK =
  'https://reponse-securisee.lemonsqueezy.com/checkout/buy/a5cb0bbf-7abc-4af0-945c-b9dc207a3ab2'

// 🔒 DEV ONLY
const FORCE_PAID_PREVIEW = false

export default function App() {
  const [step, setStep] = useState('landing')
  const [formData, setFormData] = useState({
    situation: '',
    ton: '',
    context: '',
    userMessage: ''
  })

  const [riskScore, setRiskScore] = useState(null)
  const [riskWarnings, setRiskWarnings] = useState([])
  const [previewText, setPreviewText] = useState('')

  const [proposals, setProposals] = useState([])
  const [advice, setAdvice] = useState('')

  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ─────────────────────────────
  // POST-PAY + STATS
  // ─────────────────────────────
  useEffect(() => {
    if (FORCE_PAID_PREVIEW) {
      setStep('results')
      return
    }

    const query = new URLSearchParams(window.location.search)
    if (query.get('success') === 'true') {
      const paid = Number(localStorage.getItem('paid_unlocks') || 0)
      localStorage.setItem('paid_unlocks', paid + 1)

      const saved = localStorage.getItem('valentin_data')
      if (saved) {
        const parsed = JSON.parse(saved)
        setFormData(parsed.formData)
        setRiskScore(parsed.riskScore)
        generateFullProposals(parsed.formData)
      }
    }
  }, [])

  const situations = [
    'Début de relation',
    'Relation ambiguë',
    'Reprise de contact',
    'Excuse ou justification',
    'Message isolé'
  ]

  const tons = [
    'Neutre',
    'Sobre',
    'Chaleureux contenu',
    'Distant'
  ]

  const handlePayment = () => {
    localStorage.setItem(
      'valentin_data',
      JSON.stringify({ formData, riskScore })
    )
    window.location.href = LEMON_SQUEEZY_LINK
  }

  const analyzeRisk = async () => {
    setLoading(true)

    const free = Number(localStorage.getItem('free_tests') || 0)
    localStorage.setItem('free_tests', free + 1)

    const prompt = `
Message à analyser avant envoi.

Situation: ${formData.situation}
Ton: ${formData.ton}
Message: "${formData.userMessage}"
Contexte: ${formData.context}

TÂCHE:
- Estimer un risque social (0–100)
- Lister 2–3 conséquences possibles
- Donner un début de formulation à risque réduit (aperçu)
`

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()
      const parsed =
        typeof data.result === 'string'
          ? JSON.parse(data.result)
          : data.result

      setRiskScore(parsed.score)
      setRiskWarnings(parsed.warnings)
      setPreviewText(parsed.preview)
      setStep('analysis')
    } catch {
      setRiskScore(68)
      setRiskWarnings([
        'Signal interprétable comme excessif',
        'Probabilité de réponse tiède'
      ])
      setPreviewText('Je pensais que…')
      setStep('analysis')
    }

    setLoading(false)
  }

  const generateFullProposals = async (dataToUse = formData) => {
    setLoading(true)
    setStep('results')

    const prompt = `
Message original: "${dataToUse.userMessage}"

Générer 3 formulations alternatives à risque social réduit.
Ajouter une indication de prudence générale.
`

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()
      const parsed =
        typeof data.result === 'string'
          ? JSON.parse(data.result)
          : data.result

      setProposals(parsed.proposals || [])
      setAdvice(parsed.advice || '')
    } catch {
      setProposals([
        { text: 'Une pensée.', risk: 20 },
        { text: 'Salut.', risk: 35 },
        { text: 'J’espère que tout va bien.', risk: 55 }
      ])
      setAdvice('Éviter toute relance immédiate.')
    }

    setLoading(false)
  }

  const getRiskLevel = (score) => {
    if (score < 30) return 'Risque faible'
    if (score < 60) return 'Risque modéré'
    return 'Risque élevé'
  }

  // ─────────────────────────────
  // LANDING
  // ─────────────────────────────
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-400" />

          <h1 className="text-3xl font-light">
            Un message peut créer un malaise
          </h1>

          <p className="text-slate-400 text-sm">
            Une formulation modifie la perception.
          </p>

          <div className="space-y-2 text-red-300 text-sm">
            <div>❌ Intensité excessive</div>
            <div>❌ Signal ambigu</div>
            <div>❌ Réponse tiède ou silence</div>
          </div>

          <button
            onClick={() => setStep('form')}
            className="w-full bg-white text-slate-900 py-3 rounded"
          >
            Vérifier le risque avant l’envoi
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────
  // FORM (НЕ МЕНЯЛА СМЫСЛ)
  // ─────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-xl font-light text-center">
            Message non envoyé
          </h2>

          <select
            className="w-full p-3 bg-slate-800 rounded"
            value={formData.situation}
            onChange={(e) =>
              setFormData({ ...formData, situation: e.target.value })
            }
          >
            <option value="">Situation</option>
            {situations.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            className="w-full p-3 bg-slate-800 rounded"
            value={formData.ton}
            onChange={(e) =>
              setFormData({ ...formData, ton: e.target.value })
            }
          >
            <option value="">Ton</option>
            {tons.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <textarea
            className="w-full p-3 bg-slate-800 rounded"
            rows={4}
            placeholder="Collez le message tel qu’il serait envoyé"
            value={formData.userMessage}
            onChange={(e) =>
              setFormData({ ...formData, userMessage: e.target.value })
            }
          />

          <textarea
            className="w-full p-3 bg-slate-800 rounded"
            rows={2}
            placeholder="Contexte optionnel"
            value={formData.context}
            onChange={(e) =>
              setFormData({ ...formData, context: e.target.value })
            }
          />

          <button
            onClick={analyzeRisk}
            disabled={!formData.userMessage}
            className="w-full bg-white text-slate-900 py-3 rounded"
          >
            Calculer le risque
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────
  // ANALYSIS
  // ─────────────────────────────
  if (step === 'analysis') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="text-5xl font-light">{riskScore}/100</div>
          <div className="text-sm text-slate-400">
            {getRiskLevel(riskScore)}
          </div>

          <div className="text-left space-y-2">
            {riskWarnings.map((w, i) => (
              <div key={i} className="text-sm text-red-300">
                ⚠️ {w}
              </div>
            ))}
          </div>

          <div className="relative bg-slate-800 p-4 rounded">
            <div className="blur-sm text-slate-400">{previewText}</div>
            <div className="absolute inset-0 flex items-center justify-center text-sm">
              Version verrouillée
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full bg-white text-slate-900 py-3 rounded"
          >
            Débloquer les formulations — 1,90 €
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────
  // RESULTS (PAID)
  // ─────────────────────────────
  if (step === 'results') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto space-y-6">
          <CheckCircle className="w-10 h-10 mx-auto text-green-400" />

          {loading ? (
            <div className="text-center text-slate-400">
              Chargement…
            </div>
          ) : (
            <>
              {advice && (
                <div className="bg-slate-800 p-4 rounded flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-400" />
                  <div className="text-sm">{advice}</div>
                </div>
              )}

              {proposals.map((p, i) => (
                <div
                  key={i}
                  className="bg-slate-800 p-4 rounded text-sm"
                >
                  {p.text}
                </div>
              ))}
            </>
        {isAdmin && (
  <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-3 rounded-lg opacity-80 z-50">
    <div><strong>FREE:</strong> {localStorage.getItem('free_tests') || 0}</div>
    <div><strong>PAID:</strong> {localStorage.getItem('paid_unlocks') || 0}</div>
  </div>
)}

          )}
