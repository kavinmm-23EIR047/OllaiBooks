'use client';

import * as React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I access the CRM after signing in?',
      answer:
        'When you click "Sign In to CRM" or "Get Started Free", you enter your business credentials. Once authenticated, ollaiBooks immediately routes you straight into the full CRM workspace (/dashboard). There you can manage deals, dispatch invoices, monitor real-time cash flow, configure AI telephony bots, and track customer payments.',
    },
    {
      question: 'How fast does ollaiBooks generate and send an invoice?',
      answer:
        'In real-world business use, creating and sending an invoice takes just 12 seconds. Simply select a customer, add line items with auto-suggested rates, and click "Dispatch". The platform instantly computes GST/VAT, attaches a dynamic UPI QR code, generates the signed PDF, and delivers it via WhatsApp and email.',
    },
    {
      question: 'How does the AI Voice Telephony bot handle payment follow-ups?',
      answer:
        'ollaiBooks uses friendly, human-sounding courtesy calls that speak politely on behalf of your brand. When an invoice reaches Net terms or passes its due date, the system places a polite courtesy phone call. It confirms receipt of the bill, asks for an expected payment date, and offers to ping a direct UPI link to WhatsApp while on the phone.',
    },
    {
      question: 'Is ollaiBooks fully compliant with GST and Indian tax regulations?',
      answer:
        'Yes, completely. ollaiBooks is built from the ground up for Indian GST as well as international VAT. It validates customer GSTINs, applies exact intra-state (CGST+SGST) or inter-state (IGST) rates, supports HSN/SAC item tags, and exports one-click audit reports formatted for GSTR-1 and GSTR-3B submissions.',
    },
    {
      question: 'Can I connect Shopify, WooCommerce, or my custom payment gateways?',
      answer:
        'Yes. ollaiBooks connects smoothly with your physical store POS and online website. When an order comes in, ollaiBooks immediately creates the GST invoice and updates your inventory automatically. We also integrate out of the box with Razorpay, BillDesk, Stripe, Cashfree, and UPI.',
    },
    {
      question: 'Can I test ollaiBooks before committing?',
      answer:
        'Absolutely. You can sign up for a 14-day free trial with no credit card required. You get complete access to the CRM, smart invoicing engine, visual automations, and AI copilot right out of the box.',
    },
  ];

  return (
    <section id="faq" className="py-20 bg-white border-t border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            <span>GOT QUESTIONS?</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Everything you need to know about ollaiBooks's speed, CRM workflow, and automated collections.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-colors dark:border-slate-800 dark:bg-slate-800/40"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-blue-600 transition-colors dark:text-white"
                >
                  <span className="text-base">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-slate-700/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

