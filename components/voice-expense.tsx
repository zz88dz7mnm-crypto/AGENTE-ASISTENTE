"use client";

import { useRef, useState } from "react";
import { FinanceEntry } from "@/lib/types";
import { money, todayISO } from "@/lib/date-utils";
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
  stop: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Supermercado: ["supermercado", "verduleria", "verdulería", "almacen", "almacén", "super"],
  Transporte: ["taxi", "remis", "nafta", "combustible", "subte", "colectivo", "uber", "sube"],
  "Comida afuera": ["restaurante", "delivery", "comida", "cafe", "café", "bar", "pedido"],
  Servicios: ["luz", "gas", "internet", "agua", "servicio", "alquiler", "expensas", "celular"],
  Salud: ["farmacia", "medico", "médico", "remedio", "gimnasio", "obra social"],
  Sueldo: ["sueldo", "cobre", "cobré", "salario", "aguinaldo"],
  Freelance: ["freelance", "changa", "proyecto", "factura"],
};

export function parseSpeech(text: string): Omit<FinanceEntry, "id"> | null {
  const lower = text.toLowerCase();
  const match = lower.match(/(\d+(?:[.,]\d+)?)\s*(mil|luca|lucas|k)?/);
  if (!match) return null;
  let amount = parseFloat(match[1].replace(",", "."));
  if (match[2]) amount *= 1000;
  if (!amount) return null;

  const isIncome = /(ingreso|cobr|sueldo|me pagaron|deposito|depósito|factur)/.test(lower);

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

export function VoiceExpense({
  onCapture,
}: {
  onCapture: (entry: Omit<FinanceEntry, "id">) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [captured, setCaptured] = useState<Omit<FinanceEntry, "id"> | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function start() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const parsed = parseSpeech(text);
      if (parsed) {
        setCaptured(parsed);
        onCapture(parsed);
        window.setTimeout(() => setCaptured(null), 4200);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div
      className="card card-raised flex items-center gap-4 p-4"
      style={{
        background:
          "linear-gradient(120deg, var(--color-surface) 0%, color-mix(in oklab, var(--color-accent) 4%, var(--color-surface)) 100%)",
      }}
    >
      <button
        onClick={start}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${listening ? "pulse" : ""}`}
        style={{
          background: listening ? "var(--color-alert)" : "var(--color-accent)",
          color: "var(--color-surface)",
          transition: "background 0.25s var(--ease-out)",
        }}
        aria-label={listening ? "Detener captura" : "Cargar gasto por voz"}
      >
        <IconMic size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">
          {listening ? "Escuchando…" : "Cargar movimiento por voz"}
        </p>
        <p className="mt-0.5 truncate text-[12px] muted">
          {!supported
            ? "Este navegador no soporta reconocimiento de voz."
            : captured
            ? `${captured.type === "ingreso" ? "Ingreso" : "Egreso"} · ${captured.category} · ${money(captured.amount)}`
            : transcript || "Decí, por ejemplo: “gasté 2 mil en supermercado”."}
        </p>
      </div>
      {captured && (
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase fade"
          style={{
            letterSpacing: "0.07em",
            background: "rgba(61,122,92,0.12)",
            color: "var(--color-positive)",
          }}
        >
          Cargado
        </span>
      )}
    </div>
  );
}
