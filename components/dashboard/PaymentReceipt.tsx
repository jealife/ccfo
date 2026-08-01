"use client";

import Image from "next/image";
import { Printer, FileText, BadgeCheck } from "lucide-react";
import { formatFrenchDate, formatReceiptNumber } from "@/lib/helpers";
import { REGISTRATION_FEE } from "@/lib/constants";

export type ReceiptData = {
  paymentId: string;
  createdAt: string | null;
  amount: number | null;
  status: string | null;
  proofUrl: string | null;
  teamName: string;
  teamVillage: string | null;
  presidentName: string | null;
  managerName: string;
};

export function PaymentReceipt({ data }: { data: ReceiptData }) {
  const receiptNumber = formatReceiptNumber(data.paymentId, data.createdAt);
  const amount = data.amount ?? REGISTRATION_FEE;
  const issuedOn = data.createdAt ? formatFrenchDate(data.createdAt) : "—";

  return (
    <div className="space-y-6">
      {/* Actions — masquées à l'impression */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Printer className="w-4 h-4" /> Imprimer le reçu
        </button>
        {data.proofUrl && (
          <a
            href={data.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-muted hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] transition-all"
          >
            <FileText className="w-4 h-4" /> Voir ma preuve de paiement
          </a>
        )}
      </div>

      {/* Le reçu */}
      <div className="receipt-sheet bg-white text-black rounded-3xl overflow-hidden shadow-2xl max-w-3xl">
        <div className="bg-black text-white px-8 py-6 flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 relative shrink-0">
              <Image src="/Logo-CCFO-Blanc.png" alt="Logo CCFO" fill className="object-contain" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 leading-tight">
                Bureau Directeur
              </div>
              <div className="text-base font-black uppercase tracking-tight leading-tight">
                Coupe Cantonale Fieng Okano
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Reçu N°</div>
            <div className="text-lg font-black font-mono tracking-tight text-yellow-400">{receiptNumber}</div>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Reçu de paiement</h2>
              <p className="text-sm text-black/50 mt-0.5">Frais d&apos;affiliation — Édition 2026</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 border border-green-200">
              <BadgeCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {data.status === "paid" ? "Payé" : "En attente"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Équipe" value={data.teamName} />
            <Field label="Village / Canton" value={data.teamVillage || "—"} />
            <Field label="Président" value={data.presidentName || "—"} />
            <Field label="Manager" value={data.managerName} />
            <Field label="Date de validation" value={issuedOn} />
            <Field label="Mode de règlement" value="Mobile Money" />
          </div>

          <div className="rounded-2xl border-2 border-black/10 bg-black/[0.03] px-6 py-5 flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
                Montant réglé
              </div>
              <div className="text-3xl font-black tracking-tighter mt-1">
                {amount.toLocaleString("fr-FR")} FCFA
              </div>
            </div>
            <div className="text-right text-[10px] font-bold text-black/40 uppercase tracking-widest leading-relaxed">
              Quatre cent mille
              <br />
              francs CFA
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-black/50 border-t border-black/10 pt-5">
            Ce reçu atteste du règlement intégral des frais d&apos;affiliation de l&apos;équipe
            <span className="font-bold text-black/70"> {data.teamName} </span>
            à la Coupe Cantonale Fieng Okano. Il vaut confirmation officielle de
            l&apos;inscription de l&apos;équipe au tournoi. Document généré automatiquement —
            aucune signature manuscrite requise.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          .receipt-sheet,
          .receipt-sheet * {
            visibility: visible;
          }
          .receipt-sheet {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            max-width: none;
            border-radius: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-black/40">{label}</div>
      <div className="text-sm font-bold mt-1 break-words">{value}</div>
    </div>
  );
}
