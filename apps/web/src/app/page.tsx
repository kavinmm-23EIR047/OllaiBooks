import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/landing-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { InvoiceTemplatesSlider } from '@/components/landing/invoice-templates-slider';
import { VelocitySection } from '@/components/landing/velocity-section';
import { FeaturesShowcase } from '@/components/landing/features-showcase';
import { InteractiveTour } from '@/components/landing/interactive-tour';
import { PricingSection } from '@/components/landing/pricing-section';
import { FaqSection } from '@/components/landing/faq-section';
import { CtaBanner } from '@/components/landing/cta-banner';
import { LandingFooter } from '@/components/landing/landing-footer';
import { DownloadAppSection } from '@/components/landing/download-app-section';

export const metadata: Metadata = {
  title: 'ollaiBooks AI — Autonomous Billing, Smart Invoicing & Enterprise CRM',
  description:
    'Accelerate your business velocity 10x. Autonomous invoicing, WhatsApp collections, AI voice telephony, GST compliance, and visual sales CRM.',
};

export default function RootLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* 1. Header Navigation with Dynamic Auth Status */}
      <LandingNav />

      {/* 2. Hero Section with Master Pitch & Live Cockpit Illustration */}
      <HeroSection />

      {/* 3. Interactive Realistic Invoice Templates Slider & Fake UPI QR Engine */}
      <InvoiceTemplatesSlider />

      {/* 4. Business Velocity Section (How Fast Your Business Runs) */}
      <VelocitySection />

      {/* 5. What ollaiBooks Does (Deep Feature Breakdown) */}
      <FeaturesShowcase />

      {/* 6. Interactive Tour with 4 Custom Vector Illustrations */}
      <InteractiveTour />

      {/* 7. Transparent High-ROI Pricing */}
      <PricingSection />

      {/* 8. Frequently Asked Questions */}
      <FaqSection />

      {/* Offline-first POS downloads for shop teams */}
      <DownloadAppSection />

      {/* 9. High-Conversion Final CTA Banner */}
      <CtaBanner />

      {/* 10. Enterprise Footer */}
      <LandingFooter />
    </div>
  );
}

