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
  onerror: ((event: { error?: string }) => void) | null;
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
  // El multiplicador tiene que terminar en límite de palabra: sin eso, la "k"
  // matchea el arranque de "kilos" o "km" y "3 kilos de asado" se carga
  // como un gasto de 3000.
  const match = lower.match(/(\d+(?:[.,]\d+)?)\s*(mil|lucas?|k)?\b/);
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

function errorMessage(code?: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "El navegador bloqueó el micrófono. Habilitalo para este sitio y probá de nuevo.";
    case "no-speech":
      return "No se escuchó nada. Acercá el micrófono y volvé a intentar.";
    case "audio-capture":
      return "No se encontró micrófono disponible.";
    case "network":
      return "El dictado necesita internet y no pudo conectarse.";
    case "aborted":
      return "Se cortó la captura.";
    default:
      return "No se pudo capturar el audio. Cargalo a mano acá abajo.";
  }
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
  const [problem, setProblem] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function start() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setProblem(null);

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

    // Sin esto el botón simplemente dejaba de pulsar y el usuario no tenía
    // forma de saber si le faltaba dar permiso, si no lo escuchó o si el
    // navegador no soporta el dictado. En el celular es lo más común.
    recognition.onerror = (event) => {
      setListening(false);
      setProblem(errorMessage(event?.error));
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() tira si ya había una captura activa.
      setListening(false);
      setProblem("Ya había una captura en curso. Probá de nuevo.");
    }
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
        <p
          className={`mt-0.5 text-[12px] ${problem || !supported ? "leading-snug" : "truncate muted"}`}
          style={problem || !supported ? { color: "var(--color-alert)" } : undefined}
        >
          {!supported
            ? "Este navegador no soporta dictado. Cargalo a mano acá abajo."
            : problem
            ? problem
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
