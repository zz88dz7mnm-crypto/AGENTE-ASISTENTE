"use client";

import { useRef, useState } from "react";
import { FinanceEntry } from "@/lib/types";
import { todayISO } from "@/lib/date-utils";
import { IconMic } from "./icons";

interface SpeechRecognitionResultLike {
  results: { 0: { transcript: string } }[];
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Supermercado: ["supermercado", "verduleria", "verdulería", "almacen", "almacén"],
  Transporte: ["taxi", "remis", "nafta", "combustible", "subte", "colectivo", "uber"],
  "Comida afuera": ["restaurante", "delivery", "comida", "cafe", "café", "bar"],
  Servicios: ["luz", "gas", "internet", "agua", "servicio", "alquiler"],
  Salud: ["farmacia", "medico", "médico", "remedio"],
  Sueldo: ["sueldo", "cobre", "cobré", "salario"],
  Freelance: ["freelance", "changa", "proyecto"],
};

function parseSpeech(text: string): Omit<FinanceEntry, "id"> | null {
  const lower = text.toLowerCase();
  const match = lower.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const amount = parseFloat(match[1].replace(",", "."));
  if (!amount) return null;

  const isIncome = /(ingreso|cobr|sueldo|me pagaron|deposito|depósito)/.test(lower);

  let category = "Otros";
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      category = cat;
      break;
    }
  }

  return {
    type: isIncome ? "ingreso" : "egreso",
    amount,
    category,
    date: todayISO(),
    note: text,
  };
}

export function VoiceExpense({ onCapture }: { onCapture: (entry: Omit<FinanceEntry, "id">) => void }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function start() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const parsed = parseSpeech(text);
      if (parsed) onCapture(parsed);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={start}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: listening ? "var(--color-alert)" : "var(--color-accent)" }}
          aria-label="Cargar gasto por voz"
        >
          <IconMic />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[13px]">Cargar por voz</p>
          <p className="truncate text-[11px]" style={{ color: "var(--color-text-soft)" }}>
            {!supported
              ? "El navegador no soporta reconocimiento de voz."
              : listening
              ? "Escuchando…"
              : transcript || "Ej: “gasté 2000 en supermercado”"}
          </p>
        </div>
      </div>
    </div>
  );
}
