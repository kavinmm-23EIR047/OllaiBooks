'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Globe,
  Radio,
  Clock,
  PhoneCall,
  MessageSquare,
  FileText,
  Cpu,
  Bot,
  ExternalLink,
  Minimize2,
  Maximize2,
  Square,
  UserPlus,
  CreditCard,
  Package,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { downloadLocalInvoicePdf } from '@/lib/invoice-downloader';

export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn';

export interface IndianLanguageConfig {
  code: LanguageCode;
  bcp47: string;
  name: string;
  nativeName: string;
  flag: string;
  wakeWords: string[];
  listeningNotice: string;
  speakingNotice: string;
  autoPauseNotice: string;
  placeholder: string;
  executeLabel: string;
  workDoneLabel: string;
  quickCommands: Array<{ label: string; cmd: string }>;
}

export const INDIAN_LANGUAGES: IndianLanguageConfig[] = [
  {
    code: 'en',
    bcp47: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    flag: '🇮🇳',
    wakeWords: ['hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey pilot', 'billpilot', 'bill pilot', 'hey bill', 'hello billpilot', 'hi billpilot', 'hey'],
    listeningNotice: 'ChatGPT Style: Listening to your voice... (Speak freely, click Stop to execute)',
    speakingNotice: 'ollaiBooks AI is answering in HD voice...',
    autoPauseNotice: 'Recording finished · Executing work',
    placeholder: 'Type command in English or regional language...',
    executeLabel: 'Execute',
    workDoneLabel: 'Work Done',
    quickCommands: [
      { label: 'View Indian GST Tax Invoice', cmd: 'Show GST invoice template' },
      { label: 'Create ₹25,000 + 18% GST Invoice', cmd: 'create a invoice in 25000 + 18%gst and give' },
      { label: 'Record ₹25,000 UPI Payment', cmd: 'Record payment of 25000 via UPI for Acme' },
      { label: 'Add Customer Tata Motors', cmd: 'Add customer Tata Motors' },
      { label: 'Add Product Cloud Suite (₹25k)', cmd: 'Add product Dedicated Cloud Server price 25000 GST 18%' },
      { label: 'Generate GSTR-1 Tax Report', cmd: 'Generate GSTR-1 tax report' },
      { label: 'Simulate Inbound Order', cmd: 'Create inbound order for Tata Motors 45000' },
      { label: 'Call Overdue Client Aakash', cmd: 'Call customer Aakash for overdue payment' },
      { label: 'Send WhatsApp Payment Link', cmd: 'Send whatsapp reminder' },
      { label: 'What is My Total Revenue?', cmd: 'What is my total revenue this month?' },
    ],
  },
  {
    code: 'ta',
    bcp47: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    wakeWords: ['ஹே பில்பைலட்', 'பில்பைலட்', 'பில் பைலட்', 'ஹே பைலட்', 'ஹே', 'வணக்கம் பில்பைலட்', 'hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey'],
    listeningNotice: 'ChatGPT வடிவம்: உங்கள் குரலைக் கேட்கிறது... (பேசி முடித்து Stop அழுத்தவும்)',
    speakingNotice: 'பில்பைலட் AI தமிழில் தெளிவான HD குரலில் பதிலளிக்கிறது...',
    autoPauseNotice: 'அமைதி கண்டறியப்பட்டது · பணி நிறைவேற்றப்படுகிறது',
    placeholder: 'தமிழில் அல்லது ஆங்கிலத்தில் கட்டளையை உள்ளிடவும்...',
    executeLabel: 'நிறைவேற்று',
    workDoneLabel: 'நிறைவேற்றப்பட்ட பணி',
    quickCommands: [
      { label: 'ஜிஎஸ்டி இன்வாய்ஸ் பார்க்க', cmd: 'ஜிஎஸ்டி இன்வாய்ஸ் காட்டு' },
      { label: '₹25,000 + 18% ஜிஎஸ்டி பில் உருவாக்கு', cmd: '25000க்கு 18% ஜிஎஸ்டி பில் உருவாக்கு' },
      { label: '₹25,000 UPI கட்டணம் பதிவு செய்', cmd: 'Acme-க்கு ₹25,000 UPI கட்டணம் பதிவு செய்' },
      { label: 'புதிய வாடிக்கையாளர் Tata Motors சேர்', cmd: 'புதிய வாடிக்கையாளர் Tata Motors சேர்' },
      { label: 'புதிய தயாரிப்பு Cloud Suite சேர்', cmd: 'புதிய தயாரிப்பு Cloud Suite விலை 25000 ஜிஎஸ்டி 18% சேர்' },
      { label: 'ஜிஎஸ்டிஆர்-1 அறிக்கை உருவாக்கு', cmd: 'ஜிஎஸ்டிஆர்-1 அறிக்கை உருவாக்கு' },
      { label: 'இன்பவுண்ட் ஆர்டர் சிமுலேட் செய்', cmd: 'Tata Motors-க்கு ஆர்டர் உருவாக்கு' },
      { label: 'வாடிக்கையாளர் ஆகாஷை அழைக்க', cmd: 'கஸ்டமர் ஆகாஷுக்கு போன் செய்' },
      { label: 'வாட்ஸ்அப் நினைவூட்டல் அனுப்பு', cmd: 'வாட்ஸ்அப் நினைவூட்டல் அனுப்பு' },
      { label: 'மொத்த வருமானம் எவ்வளவு?', cmd: 'என் மொத்த வருமானம் எவ்வளவு?' },
    ],
  },
  {
    code: 'hi',
    bcp47: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    wakeWords: ['हे बिलपायलट', 'बिलपायलट', 'बिल पायलट', 'हे पायलट', 'हे', 'नमस्ते बिलपायलट', 'सुनो बिलपायलट', 'hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey'],
    listeningNotice: 'ChatGPT स्टाइल: आपकी आवाज़ सुन रहे हैं... (आराम से बोलें, पूरा होने पर Stop दबाएं)',
    speakingNotice: 'बिलपायलट AI स्पष्ट HD आवाज़ में उत्तर दे रहा है...',
    autoPauseNotice: 'मौन पहचाना गया · कार्य निष्पादित हो रहा है',
    placeholder: 'हिन्दी या अंग्रेज़ी में निर्देश लिखें...',
    executeLabel: 'निष्पादित करें',
    workDoneLabel: 'पूर्ण किया गया कार्य',
    quickCommands: [
      { label: 'जीएसटी टैक्स इनवॉइस देखें', cmd: 'जीएसटी इनवॉइस दिखाओ' },
      { label: 'Acme के लिए ₹25,000 बिल बनाएं', cmd: 'Acme के लिए 25000 का इनवॉइस बनाओ' },
      { label: '₹25,000 UPI भुगतान दर्ज करें', cmd: 'Acme के लिए 25000 का UPI भुगतान दर्ज करो' },
      { label: 'नया ग्राहक Tata Motors जोड़ें', cmd: 'नया ग्राहक Tata Motors जोड़ो' },
      { label: 'नया उत्पाद Cloud Suite जोड़ें', cmd: 'नया उत्पाद Cloud Suite मूल्य 25000 जीएसटी 18% जोड़ो' },
      { label: 'जीएसटीआर-1 टैक्स रिपोर्ट बनाएं', cmd: 'जीएसटीआर-1 टैक्स रिपोर्ट बनाओ' },
      { label: 'ई-कॉमर्स ऑर्डर सिमुलेट करें', cmd: 'Tata Motors के लिए नया ऑर्डर बनाओ' },
      { label: 'ग्राहक आकाश को कॉल करें', cmd: 'ग्राहक आकाश को फोन करो' },
      { label: 'व्हाट्सएप रिमाइंडर भेजें', cmd: 'व्हाट्सएप रिमाइंडर भेजो' },
      { label: 'मेरी कुल कमाई कितनी है?', cmd: 'मेरी कुल कमाई कितनी है?' },
    ],
  },
  {
    code: 'te',
    bcp47: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    wakeWords: ['హే బిల్ పైలట్', 'బిల్ పైలట్', 'బిల్పైలట్', 'హే', 'hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey'],
    listeningNotice: 'ChatGPT శైలి: మీ వాయిస్ వింటోంది... (స్వేచ్ఛగా మాట్లాడి Stop నొక్కండి)',
    speakingNotice: 'బిల్ పైలట్ AI స్పష్టమైన HD వాయిస్‌తో సమాధానం చెబుతోంది...',
    autoPauseNotice: 'నిశ్శబ్దం గుర్తించబడింది · పని అమలు చేయబడుతోంది',
    placeholder: 'తెలుగు లేదా ఆంగ్లంలో ఆదేశాన్ని నమోదు చేయండి...',
    executeLabel: 'అమలు చేయి',
    workDoneLabel: 'పూర్తయిన పని',
    quickCommands: [
      { label: 'మొత్తం ఆదాయం ఎంత?', cmd: 'మొత్తం రాబడి ఎంత?' },
      { label: 'GST ఇన్వాయిస్ చూడండి', cmd: 'GST ఇన్వాయిస్ చూపించు' },
      { label: 'Acme కి ₹25,000 ఇన్వాయిస్ సృష్టించు', cmd: 'Acme కోసం 25000 ఇన్వాయిస్ తయారు చేయి' },
      { label: 'కస్టమర్ ఆకాష్‌కి కాల్ చేయండి', cmd: 'కస్టమర్ ఆకాష్‌కు కాల్ చేయి' },
      { label: 'కొత్త కస్టమర్ Reliance జోడించు', cmd: 'కొత్త కస్టమర్ Reliance Logistics జోడించు' },
      { label: 'వాట్సాప్ రిమైండర్ పంపు', cmd: 'వాట్సాప్ రిమైండర్ పంపు' },
    ],
  },
  {
    code: 'ml',
    bcp47: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    wakeWords: ['ഹേ ബിൽപൈലറ്റ്', 'ബിൽപൈലറ്റ്', 'ബിൽ പൈലറ്റ്', 'ഹേ', 'hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey'],
    listeningNotice: 'ChatGPT ശൈലി: ശബ്ദം ശ്രവിക്കുന്നു... (സംസാരിച്ചു കഴിഞ്ഞാൽ Stop അമർത്തുക)',
    speakingNotice: 'ബിൽപൈലറ്റ് AI വ്യക്തമായ HD ശബ്ദത്തിൽ മറുപടി നൽകുന്നു...',
    autoPauseNotice: 'നിശബ്ദത തിരിച്ചറിഞ്ഞു · ജോലി നിർവഹിക്കുന്നു',
    placeholder: 'മലയാളത്തിലോ ഇംഗ്ലീഷിലോ നിർദ്ദേശം ടൈപ്പ് ചെയ്യുക...',
    executeLabel: 'നിർവഹിക്കുക',
    workDoneLabel: 'പൂർത്തിയാക്കിയ ജോലി',
    quickCommands: [
      { label: 'ആകെ വരുമാനം എത്രയാണ്?', cmd: 'ആകെ വരുമാനം എത്രയാണ്?' },
      { label: 'ജിഎസ്ടി ഇൻവോയ്സ് കാണുക', cmd: 'ജിഎസ്ടി ഇൻവോയ്സ് കാണിക്കുക' },
      { label: 'Acme-ക്കായി ₹25,000 ഇൻവോയ്സ്', cmd: 'Acme-ക്കായി 25000 ഇൻവോയ്സ് ഉണ്ടാക്കുക' },
      { label: 'ആകാശിനെ ഫോൺ വിളിക്കുക', cmd: 'കസ്റ്റമർ ആകാശിനെ വിളിക്കുക' },
      { label: 'പുതിയ ഉപഭോക്താവിനെ ചേർക്കുക', cmd: 'പുതിയ ഉപഭോക്താവ് Reliance Logistics ചേർക്കുക' },
      { label: 'വാട്ട്‌സ്ആപ്പ് സന്ദേശം അയക്കുക', cmd: 'വാട്ട്‌സ്ആപ്പ് റിമൈൻഡർ അയക്കുക' },
    ],
  },
  {
    code: 'kn',
    bcp47: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    wakeWords: ['ಹೇ ಬಿಲ್‌ಪೈಲಟ್', 'ಬಿಲ್‌ಪೈಲಟ್', 'ಬಿಲ್ ಪೈಲಟ್', 'ಹೇ', 'hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey'],
    listeningNotice: 'ChatGPT ಶೈಲಿ: ಧ್ವನಿಯನ್ನು ಆಲಿಸಲಾಗುತ್ತಿದೆ... (ಮಾತನಾಡಿದ ನಂತರ Stop ಒತ್ತಿ)',
    speakingNotice: 'ಬಿಲ್‌ಪೈಲಟ್ AI ಸ್ಪಷ್ಟ HD ಧ್ವನಿಯಲ್ಲಿ ಉತ್ತರಿಸುತ್ತಿದೆ...',
    autoPauseNotice: 'ಮೌನ ಪತ್ತೆಯಾಗಿದೆ · ಕೆಲಸ ಆರಂಭಿಸಲಾಗಿದೆ',
    placeholder: 'ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಆದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    executeLabel: 'ನಿರ್ವಹಿಸಿ',
    workDoneLabel: 'ಪೂರ್ಣಗೊಂಡ ಕೆಲಸ',
    quickCommands: [
      { label: 'ಒಟ್ಟು ಆದಾಯ ಎಷ್ಟು?', cmd: 'ಒಟ್ಟು ಆದಾಯ ಎಷ್ಟು?' },
      { label: 'ಜಿಎಸ್‌ಟಿ ಇನ್‌ವಾಯ್ಸ್ ನೋಡಿ', cmd: 'ಜಿಎಸ್‌ಟಿ ಇನ್‌ವಾಯ್ಸ್ ತೋರಿಸಿ' },
      { label: 'Acme ಗೆ ₹25,000 ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ', cmd: 'Acme ಗಾಗಿ 25000 ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಿ' },
      { label: 'ಆಕಾಶ್‌ಗೆ ಕರೆ ಮಾಡಿ', cmd: 'ಗ್ರಾಹಕ ಆಕಾಶ್‌ಗೆ ಕರೆ ಮಾಡಿ' },
      { label: 'ಹೊಸ ಗ್ರಾಹಕ Reliance ಸೇರಿಸಿ', cmd: 'ಹೊಸ ಗ್ರಾಹಕ Reliance Logistics ಸೇರಿಸಿ' },
      { label: 'ವಾಟ್ಸಾಪ್ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ', cmd: 'ವಾಟ್ಸಾಪ್ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ' },
    ],
  },
];

const ALL_WAKE_WORDS = [
  'hey ollaibooks', 'ollaibooks', 'hey billpilot', 'hey pilot', 'billpilot', 'bill pilot', 'hey bill', 'hello billpilot', 'hi billpilot', 'hey',
  'ஹே பில்பைலட்', 'பில்பைலட்', 'பில் பைலட்', 'ஹே பைலட்', 'ஹே', 'வணக்கம் பில்பைலட்',
  'हे बिलपायलट', 'बिलपायलट', 'बिल पायलट', 'हे पायलट', 'हे', 'नमस्ते बिलपायलट', 'सुनो बिलपायलट',
  'హే బిల్ పైలట్', 'బిల్ పైలట్', 'బిల్పైలట్', 'హే',
  'ഹേ ബിൽപൈലറ്റ്', 'ബിൽപൈലറ്റ്', 'ബിൽ പൈലറ്റ്', 'ഹേ',
  'ಹೇ ಬಿಲ್‌ಪೈಲಟ್', 'ಬಿಲ್‌ಪೈಲಟ್', 'ಬಿಲ್ ಪೈಲಟ್', 'ಹೇ',
];

function playWakeChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Non-fatal if audio context is blocked
  }
}

interface MultilingualResponsePayload {
  speech: string;
  actionText: string;
  toastText: string;
}

function resolveMultilingualResponse(
  intent:
    | 'REVENUE'
    | 'GST_INVOICE'
    | 'CREATE_INVOICE'
    | 'CREATE_INVOICE_WITH_TAX'
    | 'ADD_CUSTOMER'
    | 'CREATE_CUSTOMER'
    | 'PHONE_CALL'
    | 'WHATSAPP'
    | 'PAYMENTS'
    | 'RECORD_PAYMENT'
    | 'GENERAL'
    | (string & {}),
  lang: LanguageCode,
  params: { customerName?: string; name?: string; amount?: string; taxRate?: string; grandTotal?: string; cmd?: string; hsnCode?: string; gstin?: string } = {}
): MultilingualResponsePayload {
  const cust = params.customerName || 'Acme Traders Ltd';
  const amtFormatted = params.amount ? Number(params.amount).toLocaleString('en-IN') : '25,000';
  const tax = params.taxRate || '18';
  const total = params.grandTotal ? Number(params.grandTotal).toLocaleString('en-IN') : '29,500';
  const commandText = params.cmd || '';

  switch (intent) {
    case 'CREATE_INVOICE_WITH_TAX': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `நான் ₹${amtFormatted} மற்றும் ${tax}% ஜிஎஸ்டி சேர்த்து மொத்தம் ₹${total} விவரங்களை உள்ளிட்டுள்ளேன். இதனை உறுதிப்படுத்தலாமா: ஆம் அல்லது இல்லை?`,
          actionText: `₹${amtFormatted} + ${tax}% ஜிஎஸ்டி விவரங்கள் தானாக உள்ளிடப்பட்டன`,
          toastText: `✓ விவரங்கள் உள்ளிடப்பட்டன · மொத்தம் ₹${total}`,
        },
        hi: {
          speech: `मैंने ₹${amtFormatted} और ${tax}% जीएसटी के साथ कुल ₹${total} का विवरण भर दिया है। क्या मैं आगे बढ़ूँ: हाँ या ना?`,
          actionText: `₹${amtFormatted} + ${tax}% जीएसटी विवरण स्वतः भरे गए`,
          toastText: `✓ इनवॉइस विवरण भरा गया · कुल ₹${total}`,
        },
        te: {
          speech: `నేను ₹${amtFormatted} మరియు ${tax}% GST తో మొత్తం ₹${total} వివరాలను నమోదు చేసాను. నేను కొనసాగించవచ్చా: అవును లేదా కాదు?`,
          actionText: `₹${amtFormatted} + ${tax}% GST వివరాలు నమోదు చేయబడ్డాయి`,
          toastText: `✓ వివరాలు నమోదు చేయబడ్డాయి · మొత్తం ₹${total}`,
        },
        ml: {
          speech: `ഞാൻ ₹${amtFormatted} ഒപ്പം ${tax}% ജിഎസ്ടിയും ചേർത്ത് ആകെ ₹${total} നൽകിയിട്ടുണ്ട്. ഞാൻ തുടരണോ: അതെ അല്ലെങ്കിൽ അല്ല?`,
          actionText: `₹${amtFormatted} + ${tax}% ജിഎസ്ടി വിവരങ്ങൾ നൽകി`,
          toastText: `✓ വിവരങ്ങൾ നൽകി · ആകെ ₹${total}`,
        },
        kn: {
          speech: `ನಾನು ₹${amtFormatted} ಮತ್ತು ${tax}% ಜಿಎಸ್‌ಟಿ ಸೇರಿಸಿ ಒಟ್ಟು ₹${total} ವಿವರಗಳನ್ನು ನಮೂದಿಸಿದ್ದೇನೆ. ನಾನು ಮುಂದುವರಿಯಲೇ: ಹೌದು ಅಥವಾ ಇಲ್ಲವೇ?`,
          actionText: `₹${amtFormatted} + ${tax}% ಜಿಎಸ್‌ಟಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಲಾಗಿದೆ`,
          toastText: `✓ ವಿವರಗಳನ್ನು ನಮೂದಿಸಲಾಗಿದೆ · ಒಟ್ಟು ₹${total}`,
        },
        en: {
          speech: `I have entered the invoice details: ₹${amtFormatted} plus ${tax}% GST, total ₹${total}. Should I proceed: yes or no?`,
          actionText: `Auto-filled details: ₹${amtFormatted} + ${tax}% GST (Total: ₹${total})`,
          toastText: `✓ Details auto-entered · Total ₹${total}`,
        },
      };
      return responses[lang] || responses.en;
    }
    case 'REVENUE': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'உங்கள் மொத்த பில் வருமானம் ₹4,85,000. 142 விலைப்பட்டியல்களில் 98% குறித்த நேரத்தில் வசூலாகியுள்ளது, ₹472 மட்டுமே தற்போது நிலுவையில் உள்ளது.',
          actionText: 'சிஆர்எம் தரவுத்தளத்திலிருந்து நேரடி நிதி அளவீடுகள் பெறப்பட்டன',
          toastText: '✓ நேரடி நிதித் தரவு வெற்றிகரமாக பெறப்பட்டது',
        },
        hi: {
          speech: 'आपका कुल बिल राजस्व ₹4,85,000 है। 142 इनवॉइस में से 98% समय पर भुगतान प्राप्त हुआ है और केवल ₹472 बकाया है।',
          actionText: 'सीआरएम डेटाबेस से वित्तीय आंकड़े प्राप्त किए गए',
          toastText: '✓ लाइव वित्तीय आंकड़े लोड हुए',
        },
        te: {
          speech: 'మీ మొత్తం బిల్లింగ్ రాబడి ₹4,85,000. 142 ఇన్వాయిస్‌లలో 98% సకాలంలో వసూలైంది మరియు కేవలం ₹472 మాత్రమే బకాయి ఉంది.',
          actionText: 'CRM డేటాబేస్ నుండి ఆర్థిక కొలమానాలు పొందబడ్డాయి',
          toastText: '✓ ఆర్థిక సమాచారం లోడ్ అయింది',
        },
        ml: {
          speech: 'നിങ്ങളുടെ ആകെ ബിൽ വരുമാനം ₹4,85,000 ആണ്. 142 ഇൻവോയ്സുകളിൽ 98% തുക ലഭിച്ചു, ₹472 മാത്രമാണ് ബാക്കിയുള്ളത്.',
          actionText: 'സിആർഎം ഡാറ്റാബേസിൽ നിന്ന് സാമ്പത്തിക വിവരങ്ങൾ എടുത്തു',
          toastText: '✓ സാമ്പത്തിക ഡാറ്റ ലഭ്യമാക്കി',
        },
        kn: {
          speech: 'ನಿಮ್ಮ ಒಟ್ಟು ಬಿಲ್ಲಿಂಗ್ ಆದಾಯ ₹4,85,000. 142 ಇನ್‌ವಾಯ್ಸ್‌ಗಳಲ್ಲಿ 98% ಸಮಯಕ್ಕೆ ಸಂಗ್ರಹವಾಗಿದೆ ಮತ್ತು ಕೇವಲ ₹472 ಬಾಕಿ ಇದೆ.',
          actionText: 'ಸಿಆರ್‌ಎಂ ಡೇಟಾಬೇಸ್‌ನಿಂದ ಹಣಕಾಸು ಅಂಕಿಅಂಶಗಳನ್ನು ಪಡೆಯಲಾಗಿದೆ',
          toastText: '✓ ಹಣಕಾಸು ಡೇಟಾ ಪಡೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: 'Your total billed revenue is ₹4,85,000 across 142 invoices with a 98% on-time collection rate and only ₹472 currently overdue.',
          actionText: 'Pulled live financial summary metrics from CRM database',
          toastText: '✓ Live financial telemetry calculated',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'GST_INVOICE': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'இந்திய அரசு விதி 46-க்கு இணங்க அதிகாரப்பூர்வ ஜிஎஸ்டி வரி விலைப்பட்டியலை முன்னோட்டம் மற்றும் அச்சிட திறக்கிறேன்.',
          actionText: 'அதிகாரப்பூர்வ ஜிஎஸ்டி வரி இன்வாய்ஸ் திறக்கப்பட்டது (விதி 46)',
          toastText: '✓ இந்திய அரசு ஜிஎஸ்டி இன்வாய்ஸ் திறக்கப்பட்டது',
        },
        hi: {
          speech: 'भारत सरकार नियम 46 के अनुसार आधिकारिक जीएसटी टैक्स इनवॉइस खोला जा रहा है।',
          actionText: 'सरकारी जीएसटी टैक्स इनवॉइस व्यूअर खोला गया (नियम 46)',
          toastText: '✓ आधिकारिक जीएसटी टैक्स इनवॉइस खुला',
        },
        te: {
          speech: 'భారత ప్రభుత్వ రూల్ 46 ప్రకారం అధికారిక GST ట్యాక్స్ ఇన్వాయిస్ తెరుస్తున్నాను.',
          actionText: 'అధికారిక GST ట్యాక్స్ ఇన్వాయిస్ వ్యూయర్ తెరవబడింది',
          toastText: '✓ GST ట్యాక్స్ ఇన్వాయిస్ తెరవబడింది',
        },
        ml: {
          speech: 'ഇന്ത്യൻ സർക്കാർ റൂൾ 46 പ്രകാരമുള്ള ഔദ്യോഗിക ജിഎസ്ടി ടാക്സ് ഇൻവോയ്സ് തുറക്കുന്നു.',
          actionText: 'ഔദ്യോഗിക ജിഎസ്ടി ടാക്സ് ഇൻവോയ്സ് തുറന്നു',
          toastText: '✓ ജിഎസ്ടി ടാക്സ് ഇൻവോയ്സ് തുറന്നു',
        },
        kn: {
          speech: 'ಭಾರತ ಸರ್ಕಾರದ ನಿಯಮ 46 ರ ಪ್ರಕಾರ ಅಧಿಕೃತ ಜಿಎಸ್‌ಟಿ ಟ್ಯಾಕ್ಸ್ ಇನ್‌ವಾಯ್ಸ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
          actionText: 'ಅಧಿಕೃತ ಜಿಎಸ್‌ಟಿ ತೆರಿಗೆ ಇನ್‌ವಾಯ್ಸ್ ವೀಕ್ಷಕವನ್ನು ತೆರೆಯಲಾಗಿದೆ',
          toastText: '✓ ಜಿಎಸ್‌ಟಿ ಇನ್‌ವಾಯ್ಸ್ ತೆರೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: 'Opening official Indian Government GST Tax Invoice for preview and printing under Rule 46.',
          actionText: 'Opened statutory GST Tax Invoice Viewer (Rule 46 Compliant)',
          toastText: '✓ Indian GST Tax Invoice opened',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'CREATE_INVOICE': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `${cust} நிறுவனத்திற்கு ₹${amtFormatted} மதிப்பிலான ஜிஎஸ்டி பில் தயாரித்து இன்வாய்ஸ் பக்கத்தைத் திறக்கிறேன்.`,
          actionText: `${cust} நிறுவனத்திற்கு ₹${amtFormatted} இன்வாய்ஸ் வரைவு உருவாக்கப்பட்டது`,
          toastText: '✓ இன்வாய்ஸ் வரைவு வெற்றிகரமாக உருவாக்கப்பட்டது',
        },
        hi: {
          speech: `${cust} के लिए ₹${amtFormatted} का जीएसटी बिल बनाकर इनवॉइस पेज खोला जा रहा है।`,
          actionText: `${cust} के लिए ₹${amtFormatted} का ड्राफ्ट इनवॉइस तैयार हुआ`,
          toastText: '✓ इनवॉइस ड्राफ्ट बनाया गया',
        },
        te: {
          speech: `${cust} కోసం ₹${amtFormatted} GST బిల్లు తయారు చేసి ఇన్వాయిస్ పేజీని తెరుస్తున్నాను.`,
          actionText: `${cust} కొరకు ₹${amtFormatted} ఇన్వాయిస్ డ్రాఫ్ట్ సృష్టించబడింది`,
          toastText: '✓ ఇన్వాయిస్ డ్రాఫ్ట్ సృష్టించబడింది',
        },
        ml: {
          speech: `${cust}-നായി ₹${amtFormatted} തുകയുടെ ജിഎസ്ടി ബിൽ തയ്യാറാക്കി ഇൻവോയ്സ് പേജ് തുറക്കുന്നു.`,
          actionText: `${cust}-നായി ₹${amtFormatted} ഇൻവോയ്സ് ഉണ്ടാക്കി`,
          toastText: '✓ ഇൻവോയ്സ് സൃഷ്ടിച്ചു',
        },
        kn: {
          speech: `${cust} ಗಾಗಿ ₹${amtFormatted} ಮೊತ್ತದ ಜಿಎಸ್‌ಟಿ ಬಿಲ್ ಸಿದ್ಧಪಡಿಸಿ ಇನ್‌ವಾಯ್ಸ್ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.`,
          actionText: `${cust} ಗಾಗಿ ₹${amtFormatted} ಕರಡು ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಲಾಗಿದೆ`,
          toastText: '✓ ಇನ್‌ವಾಯ್ಸ್ ರಚಿಸಲಾಗಿದೆ',
        },
        en: {
          speech: `Creating a GST invoice draft of ₹${amtFormatted} for ${cust} right now.`,
          actionText: `Navigated to Invoices and opened draft for ₹${amtFormatted}`,
          toastText: `✓ Invoices opened with ₹${amtFormatted} draft`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'ADD_CUSTOMER': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `புதிய வாடிக்கையாளர் ${cust}-ஐ சிஆர்எம்-மில் சேர்க்க பதிவுப் படிவத்தைத் திறக்கிறேன்.`,
          actionText: `${cust} புதிய வாடிக்கையாளர் படிவம் திறக்கப்பட்டது`,
          toastText: '✓ புதிய வாடிக்கையாளர் பக்கம் திறக்கப்பட்டது',
        },
        hi: {
          speech: `नया ग्राहक ${cust} जोड़ने के लिए सीआरएम फॉर्म खोला जा रहा है।`,
          actionText: `${cust} के लिए नया ग्राहक फॉर्म खुला`,
          toastText: '✓ नया ग्राहक फॉर्म खुला',
        },
        te: {
          speech: `కొత్త కస్టమర్ ${cust} ను CRM లో చేర్చడానికి ఫారమ్ తెరుస్తున్నాను.`,
          actionText: `${cust} కొరకు కొత్త కస్టమర్ ఫారం తెరవబడింది`,
          toastText: '✓ కొత్త కస్టమర్ ఫారం తెరవబడింది',
        },
        ml: {
          speech: `പുതിയ ഉപഭോക്താവ് ${cust}-നെ സിആർഎമ്മിലേക്ക് ചേർക്കാൻ ഫോം തുറക്കുന്നു.`,
          actionText: `${cust}-നെ ചേർക്കാനുള്ള ഫോം തുറന്നു`,
          toastText: '✓ புதிய ഉപഭോക്താവിനെ ചേർക്കുന്നു',
        },
        kn: {
          speech: `ಹೊಸ ಗ್ರಾಹಕ ${cust} ಅವರನ್ನು ಸಿಆರ್‌ಎಂಗೆ ಸೇರಿಸಲು ಫಾರಂ ತೆರೆಯಲಾಗುತ್ತಿದೆ.`,
          actionText: `${cust} ಹೊಸ ಗ್ರಾಹಕ ಫಾರ್ಮ್ ತೆರೆಯಲಾಗಿದೆ`,
          toastText: '✓ ಹೊಸ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಲಾಗುತ್ತಿದೆ',
        },
        en: {
          speech: `Opening CRM customer registration form to add ${cust}.`,
          actionText: `Navigated to Customers and opened new profile for ${cust}`,
          toastText: `✓ Customer CRM opened for ${cust}`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'PHONE_CALL': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'நிலுவையில் உள்ள கட்டணத்தை நினைவூட்ட வாடிக்கையாளருக்கு தானியங்கி AI தொலைபேசி அழைப்பைத் தொடங்குகிறேன்.',
          actionText: 'AI குரல் வழி நினைவூட்டல் அழைப்பு தொடங்கப்பட்டது',
          toastText: '✓ தானியங்கி குரல் அழைப்பு துவக்கப்பட்டது',
        },
        hi: {
          speech: 'बकाया भुगतान के लिए ग्राहक को स्वचालित एआई वॉयस टेलीफोनी कॉल किया जा रहा है।',
          actionText: 'एआई वॉयस रिमाइंडर कॉल शुरू किया गया',
          toastText: '✓ स्वचालित एआई कॉल शुरू हुआ',
        },
        te: {
          speech: 'బకాయి చెల్లింపు కోసం కస్టమర్‌కు ఆటోమేటిక్ AI వాయిస్ కాల్ ప్రారంభిస్తున్నాను.',
          actionText: 'AI వాయిస్ రిమైండర్ కాల్ ప్రారంభించబడింది',
          toastText: '✓ AI వాయిస్ కాల్ ప్రారంభమైంది',
        },
        ml: {
          speech: 'ബാക്കി തുക ഓർമ്മിപ്പിക്കാൻ ഉപഭോക്താവിന് ഓട്ടോമേറ്റഡ് എഐ വോയ്സ് കോൾ ചെയ്യുന്നു.',
          actionText: 'എഐ വോയ്സ് റിമൈൻഡർ കോൾ തുടങ്ങി',
          toastText: '✓ വോയ്സ് കോൾ ആരംഭിച്ചു',
        },
        kn: {
          speech: 'ಬಾಕಿ ಪಾವತಿಗಾಗಿ ಗ್ರಾಹಕರಿಗೆ ಸ್ವಯಂಚಾಲಿತ AI ಧ್ವನಿ ಕರೆಯನ್ನು ಆರಂಭಿಸಲಾಗುತ್ತಿದೆ.',
          actionText: 'AI ಧ್ವನಿ ಜ್ಞಾಪನೆ ಕರೆ ಆರಂಭಿಸಲಾಗಿದೆ',
          toastText: '✓ ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಕರೆ ಆರಂಭವಾಗಿದೆ',
        },
        en: {
          speech: 'Initiating autonomous AI voice telephony call to follow up on overdue payment.',
          actionText: 'Navigated to AI Voice Agent and triggered automated reminder call',
          toastText: '✓ AI Voice call triggered',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'WHATSAPP': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'வாடிக்கையாளருக்கு உடனடி UPI கட்டண இணைப்புடன் கூடிய வாட்ஸ்அப் நினைவூட்டலை அனுப்புகிறேன்.',
          actionText: 'வாட்ஸ்அப் ஆட்டோமேஷன் தொகுதி திறக்கப்பட்டது',
          toastText: '✓ வாட்ஸ்அப் நினைவூட்டல் அனுப்பப்பட்டது',
        },
        hi: {
          speech: 'ग्राहक को तत्काल यूपीआई भुगतान लिंक के साथ व्हाट्सएप अनुस्मारक भेजा जा रहा है।',
          actionText: 'व्हाट्सएप ऑटोमेशन मॉड्यूल खोला गया',
          toastText: '✓ व्हाट्सएप रिमाइंडर भेजा गया',
        },
        te: {
          speech: 'తక్షణ UPI చెల్లింపు లింక్‌తో కస్టమర్‌కు వాట్సాప్ రిమైండర్ పంపుతున్నాను.',
          actionText: 'వాట్సాప్ ఆటోమేషన్ మాడ్యూల్ తెరవబడింది',
          toastText: '✓ వాట్సాప్ రిమైండర్ పంపబడింది',
        },
        ml: {
          speech: 'ഉപഭോക്താവിന് തത്സമയ യുപിഐ ലിങ്ക് സഹിതം വാട്ട്‌സ്ആപ്പ് സന്ദേശം അയക്കുന്നു.',
          actionText: 'വാട്ട്‌സ്ആപ്പ് ഓട്ടോമേഷൻ തുറന്നു',
          toastText: '✓ വാട്ട്‌സ്ആപ്പ് സന്ദേശം അയച്ചു',
        },
        kn: {
          speech: 'ತಕ್ಷಣದ ಯುಪಿಐ ಪಾವತಿ ಲಿಂಕ್‌ನೊಂದಿಗೆ ಗ್ರಾಹಕರಿಗೆ ವಾಟ್ಸಾಪ್ ಜ್ಞಾಪನೆಯನ್ನು ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.',
          actionText: 'ವಾಟ್ಸಾಪ್ ಆಟೊಮೇಷನ್ ಮಾಡ್ಯೂಲ್ ತೆರೆಯಲಾಗಿದೆ',
          toastText: '✓ ವಾಟ್ಸಾಪ್ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಲಾಗಿದೆ',
        },
        en: {
          speech: 'Opening WhatsApp Assistant to dispatch automated payment reminder with instant UPI link.',
          actionText: 'Navigated to WhatsApp automation module',
          toastText: '✓ WhatsApp Assistant opened',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'PAYMENTS': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'கட்டணங்கள் மற்றும் வசூல் லெட்ஜர் கணக்குப் பக்கத்தைத் திறக்கிறேன்.',
          actionText: 'கட்டணப் பக்கத்திற்கு நகர்த்தப்பட்டது (/payments)',
          toastText: '✓ கட்டணப் பக்கம் திறக்கப்பட்டது',
        },
        hi: {
          speech: 'भुगतान और लेजर निपटान पृष्ठ खोला जा रहा है।',
          actionText: 'भुगतान पृष्ठ पर स्थानांतरित (/payments)',
          toastText: '✓ भुगतान पृष्ठ खुला',
        },
        te: {
          speech: 'చెల్లింపులు మరియు లెడ్జర్ పరిష్కారాల పేజీని తెరుస్తున్నాను.',
          actionText: 'చెల్లింపుల పేజీకి నావిగేట్ చేయబడింది (/payments)',
          toastText: '✓ చెల్లింపుల పేజీ తెరవబడింది',
        },
        ml: {
          speech: 'പേയ്‌മെന്റുകളും ലെഡ്ജർ സെറ്റിൽമെന്റുകളും ഉള്ള പേജ് തുറക്കുന്നു.',
          actionText: 'പേയ്‌മെന്റ് പേജിലേക്ക് മാറ്റി (/payments)',
          toastText: '✓ പേയ്‌മെന്റ് പേജ് തുറന്നു',
        },
        kn: {
          speech: 'ಪಾವತಿಗಳು ಮತ್ತು ಲೆಡ್ಜರ್ ಇತ್ಯರ್ಥಗಳ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
          actionText: 'ಪಾವತಿಗಳ ಪುಟಕ್ಕೆ ತೆರಳಲಾಗಿದೆ (/payments)',
          toastText: '✓ ಪಾವತಿಗಳ ಪುಟ ತೆರೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: 'Opening payments and ledger settlement history.',
          actionText: 'Navigated to Payments (/payments)',
          toastText: '✓ Navigated to Payments',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'CREATE_CUSTOMER': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `வாடிக்கையாளர் ${cust} விவரங்களை உள்ளிட்டேன். இதனை சிஆர்எம் பட்டியலில் சேர்க்கலாமா: ஆம் அல்லது இல்லை?`,
          actionText: `வாடிக்கையாளர் ${cust} சேர்க்க தயார் செய்யப்பட்டது`,
          toastText: `✓ புதிய வாடிக்கையாளர் விவரங்கள் தயார் · ${cust}`,
        },
        hi: {
          speech: `मैंने ग्राहक ${cust} का विवरण तैयार कर लिया है। क्या मैं इसे सीआरएम में जोड़ूँ: हाँ या ना?`,
          actionText: `ग्राहक ${cust} जोड़ने के लिए तैयार`,
          toastText: `✓ नया ग्राहक विवरण तैयार · ${cust}`,
        },
        te: {
          speech: `నేను కస్టమర్ ${cust} వివరాలను సిద్ధం చేసాను. కొనసాగించవచ్చా: అవును లేదా కాదు?`,
          actionText: `కస్టమర్ ${cust} జోడించడానికి సిద్ధం`,
          toastText: `✓ కస్టమర్ వివరాలు సిద్ధమయ్యాయి · ${cust}`,
        },
        ml: {
          speech: `ഞാൻ ഉപഭോക്താവ് ${cust}-ന്റെ വിവരങ്ങൾ തയ്യാറാക്കിയിട്ടുണ്ട്. തുടരണോ: അതെ അല്ലെങ്കിൽ അല്ല?`,
          actionText: `ഉപഭോക്താവ് ${cust}-നെ ചേർക്കാൻ തയ്യാറാക്കി`,
          toastText: `✓ വിവരങ്ങൾ തയ്യാറായി · ${cust}`,
        },
        kn: {
          speech: `ನಾನು ಗ್ರಾಹಕ ${cust} ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಮುಂದುವರಿಯಲೇ: ಹೌದು ಅಥವಾ ಇಲ್ಲವೇ?`,
          actionText: `ಗ್ರಾಹಕ ${cust} ಸೇರಿಸಲು ಸಿದ್ಧ`,
          toastText: `✓ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ · ${cust}`,
        },
        en: {
          speech: `I have prepared customer details for "${cust}". Should I proceed to add to CRM: yes or no?`,
          actionText: `Auto-filled customer: ${cust}`,
          toastText: `✓ Customer details ready · ${cust}`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'RECORD_PAYMENT': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `வாடிக்கையாளர் ${cust}-ன் இன்வாய்ஸ் #INV-437862-க்கு ₹${amtFormatted} கட்டண விவரங்களை உள்ளிட்டேன். இதனை உறுதிப்படுத்தலாமா: ஆம் அல்லது இல்லை?`,
          actionText: `₹${amtFormatted} கட்டணப் பதிவு விவரங்கள் உள்ளிட்டன`,
          toastText: `✓ ₹${amtFormatted} கட்டணப் பதிவு தயார்`,
        },
        hi: {
          speech: `मैंने ग्राहक ${cust} के Invoice #INV-437862 के लिए ₹${amtFormatted} का भुगतान विवरण भर दिया है। क्या मैं इसे दर्ज करूँ: हाँ या ना?`,
          actionText: `₹${amtFormatted} भुगतान प्रविष्टि तैयार`,
          toastText: `✓ ₹${amtFormatted} भुगतान दर्ज करने हेतु तैयार`,
        },
        te: {
          speech: `నేను కస్టమర్ ${cust} కొరకు ₹${amtFormatted} చెల్లింపు వివరాలను లెడ్జర్‌లో నమోదు చేయడానికి సిద్ధం చేసాను. కొనసాగించవచ్చా: అవును లేదా కాదు?`,
          actionText: `₹${amtFormatted} చెల్లింపు నమోదు సిద్ధం`,
          toastText: `✓ చెల్లింపు వివరాలు సిద్ధమయ్యాయి`,
        },
        ml: {
          speech: `ഞാൻ ${cust}-ന്റെ Invoice #INV-437862-ലേക്ക് ₹${amtFormatted} പേയ്‌മെന്റ് വിവരങ്ങൾ തയ്യാറാക്കിയിട്ടുണ്ട്. തുടരണോ: അതെ അല്ലെങ്കിൽ അല്ല?`,
          actionText: `₹${amtFormatted} പേയ്‌മെന്റ് വിവരങ്ങൾ തയ്യാറാക്കി`,
          toastText: `✓ പേയ്‌മെന്റ് തയ്യാറായി`,
        },
        kn: {
          speech: `ನಾನು ${cust} ಅವರ Invoice #INV-437862 ಗಾಗಿ ₹${amtFormatted} ಪಾವತಿ ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಮುಂದುವರಿಯಲೇ: ಹೌದು ಅಥವಾ ಇಲ್ಲವೇ?`,
          actionText: `₹${amtFormatted} ಪಾವತಿ ನಮೂದು ಸಿದ್ಧ`,
          toastText: `✓ ಪಾವತಿ ವಿವರಗಳು ಸಿದ್ಧವಾಗಿವೆ`,
        },
        en: {
          speech: `Target Invoice and Customer were not mentioned. I have prepared payment of ₹${amtFormatted} for ${cust} against Invoice #INV-437862. Should I proceed to record this: yes or no?`,
          actionText: `Auto-filled payment: ₹${amtFormatted}`,
          toastText: `✓ Payment ready · ₹${amtFormatted}`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'CREATE_PRODUCT': {
      const prodName = params.name || 'Enterprise Cloud Consulting Suite';
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `புதிய தயாரிப்பு '${prodName}' (விலை: ₹${amtFormatted}, ஜிஎஸ்டி: ${tax}%) விவரங்களை தயாரித்துள்ளேன். இதனை சேர்க்கலாமா: ஆம் அல்லது இல்லை?`,
          actionText: `தயாரிப்பு ${prodName} (₹${amtFormatted}) சேர்க்க தயார்`,
          toastText: `✓ புதிய தயாரிப்பு தயார் · ${prodName}`,
        },
        hi: {
          speech: `मैंने नया उत्पाद '${prodName}' (मूल्य: ₹${amtFormatted}, जीएसटी: ${tax}%) तैयार कर लिया है। क्या मैं इसे जोड़ूँ: हाँ या ना?`,
          actionText: `उत्पाद ${prodName} जोड़ने हेतु तैयार`,
          toastText: `✓ नया उत्पाद तैयार · ${prodName}`,
        },
        te: {
          speech: `నేను కొత్త ఉత్పత్తి '${prodName}' వివరాలను సిద్ధం చేసాను. దీన్ని జోడించాలా: అవును లేదా కాదు?`,
          actionText: `ఉత్పత్తి ${prodName} జోడించడానికి సిద్ధం`,
          toastText: `✓ ఉత్పత్తి సిద్ధమైంది · ${prodName}`,
        },
        ml: {
          speech: `ഞാൻ പുതിയ ഉൽപ്പന്നം '${prodName}' വിവരങ്ങൾ തയ്യാറാക്കിയിട്ടുണ്ട്. ചേർക്കണോ: അതെ അല്ലെങ്കിൽ അല്ല?`,
          actionText: `ഉൽപ്പന്നം ${prodName} ചേർക്കാൻ തയ്യാറാക്കി`,
          toastText: `✓ ഉൽപ്പന്നം തയ്യാറായി`,
        },
        kn: {
          speech: `ನಾನು ಹೊಸ ಉತ್ಪನ್ನ '${prodName}' ವಿವರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಸೇರಿಸಲೇ: ಹೌದು ಅಥವಾ ಇಲ್ಲವೇ?`,
          actionText: `ಉತ್ಪನ್ನ ${prodName} ಸೇರಿಸಲು ಸಿದ್ಧ`,
          toastText: `✓ ಉತ್ಪನ್ನ ಸಿದ್ಧವಾಗಿದೆ`,
        },
        en: {
          speech: `I have prepared catalog item '${prodName}' priced at ₹${amtFormatted} with ${tax}% GST. Should I add it: yes or no?`,
          actionText: `Auto-filled product: ${prodName} (₹${amtFormatted})`,
          toastText: `✓ Product ready · ${prodName}`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'CREATE_ORDER': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `வாடிக்கையாளர் ${cust}-க்கு ₹${amtFormatted} புதிய ஆர்டரை சிமுலேட் செய்து பெறுகிறேன்.`,
          actionText: `${cust} நிறுவனத்திற்கு ₹${amtFormatted} ஆர்டர் பெறப்பட்டது`,
          toastText: '✓ புதிய ஆர்டர் சிமுலேட் செய்யப்பட்டது',
        },
        hi: {
          speech: `ग्राहक ${cust} के लिए ₹${amtFormatted} का नया ई-कॉमर्स ऑर्डर प्रोसेस किया जा रहा है।`,
          actionText: `${cust} के लिए ₹${amtFormatted} ऑर्डर प्राप्त हुआ`,
          toastText: '✓ नया ऑर्डर प्रोसेस हुआ',
        },
        te: {
          speech: `కస్టమర్ ${cust} కొరకు ₹${amtFormatted} కొత్త ఆర్డర్ ప్రాసెస్ చేయబడుతోంది.`,
          actionText: `${cust} కొరకు కొత్త ఆర్డర్ ప్రాసెస్ చేయబడింది`,
          toastText: '✓ కొత్త ఆర్డర్ లోడ్ అయింది',
        },
        ml: {
          speech: `ഉപഭോക്താവ് ${cust}-നായി ₹${amtFormatted} തുകയുടെ പുതിയ ഓർഡർ സ്വീകരിക്കുന്നു.`,
          actionText: `${cust}-നായി ഓർഡർ എടുത്തു`,
          toastText: '✓ പുതിയ ഓർഡർ ലഭിച്ചു',
        },
        kn: {
          speech: `ಗ್ರಾಹಕ ${cust} ಅವರಿಗಾಗಿ ₹${amtFormatted} ಹೊಸ ಆದೇಶವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ.`,
          actionText: `${cust} ಹೊಸ ಆದೇಶ ಸ್ವೀಕರಿಸಲಾಗಿದೆ`,
          toastText: '✓ ಹೊಸ ಆದೇಶ ಪಡೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: `Simulating and ingesting inbound order of ₹${amtFormatted} for ${cust}.`,
          actionText: `Ingested order for ${cust} (₹${amtFormatted})`,
          toastText: `✓ Inbound order simulated · ${cust}`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'GENERATE_REPORT': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'அதிகாரப்பூர்வ ஜிஎஸ்டிஆர்-1 வரி அறிக்கை மற்றும் தணிக்கைக் கோப்புகளை தானாக தயாரிக்கிறேன்.',
          actionText: 'ஜிஎஸ்டிஆர்-1 வரி அறிக்கை உருவாக்கப்பட்டது (/reports)',
          toastText: '✓ ஜிஎஸ்டிஆர்-1 அறிக்கை தயாராக உள்ளது',
        },
        hi: {
          speech: 'आधिकारिक जीएसटीआर-1 टैक्स रिटर्न और वित्तीय ऑडिट रिपोर्ट तैयार की जा रही है।',
          actionText: 'जीएसटीआर-1 रिपोर्ट तैयार की गई (/reports)',
          toastText: '✓ जीएसटीआर-1 रिपोर्ट तैयार',
        },
        te: {
          speech: 'అధికారిక GSTR-1 ట్యాక్స్ రిటర్న్స్ మరియు ఆడిట్ నివేదికను రూపొందిస్తున్నాను.',
          actionText: 'GSTR-1 నివేదిక రూపొందించబడింది (/reports)',
          toastText: '✓ GSTR-1 రిపోర్ట్ సిద్ధమైంది',
        },
        ml: {
          speech: 'ഔദ്യോഗിക ജിഎസ്ടിആർ-1 റിട്ടേൺസും ഓഡിറ്റ് റിപ്പോർട്ടും തയ്യാറാക്കുന്നു.',
          actionText: 'ജിഎസ്ടിആർ-1 റിപ്പോർട്ട് തയ്യാറാക്കി (/reports)',
          toastText: '✓ ജിഎസ്ടിആർ-1 റിപ്പോർട്ട് റെഡിയായി',
        },
        kn: {
          speech: 'ಅಧಿಕೃತ ಜಿಎಸ್‌ಟಿಆರ್-1 ರಿಟರ್ನ್ಸ್ ಮತ್ತು ಆಡಿಟ್ ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ.',
          actionText: 'ಜಿಎಸ್‌ಟಿಆರ್-1 ವರದಿ ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ (/reports)',
          toastText: '✓ ಜಿಎಸ್‌ಟಿಆರ್-1 ವರದಿ ಸಿದ್ಧವಾಗಿದೆ',
        },
        en: {
          speech: 'Generating official GSTR-1 sales tax return and multi-tenant cryptographic audit report.',
          actionText: 'Generated GSTR-1 tax compliance export (/reports)',
          toastText: '✓ GSTR-1 report generated',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'UPDATE_SETTINGS': {
      const gstinCode = params.gstin || '33AAAAA0000A1Z5';
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `உங்கள் நிறுவனத்தின் ஜிஎஸ்டிஐஎன் (${gstinCode}) மற்றும் வணிக அமைப்புகள் பக்கத்தைத் திறக்கிறேன்.`,
          actionText: `ஜிஎஸ்டி அமைப்புகள் பக்கம் திறக்கப்பட்டது (${gstinCode})`,
          toastText: '✓ ஜிஎஸ்டி அமைப்புகள் திறக்கப்பட்டன',
        },
        hi: {
          speech: `आपके व्यापार का जीएसटी नंबर (${gstinCode}) और सेटिंग्स पृष्ठ खोला जा रहा है।`,
          actionText: `जीएसटी सेटिंग्स खोली गईं (${gstinCode})`,
          toastText: '✓ सेटिंग्स पृष्ठ खुला',
        },
        te: {
          speech: `మీ వ్యాపార GST నంబర్ (${gstinCode}) మరియు సెట్టింగ్‌ల పేజీ తెరవబడింది.`,
          actionText: `GST సెట్టింగ్‌ల పేజీ తెరవబడింది`,
          toastText: '✓ సెట్టింగ్‌లు తెరవబడ్డాయి',
        },
        ml: {
          speech: `നിങ്ങളുടെ ബിസിനസ്സ് ജിഎസ്ടിஐഎൻ (${gstinCode}) ക്രമീകരണങ്ങൾ തുറക്കുന്നു.`,
          actionText: `ജിഎസ്ടി സെറ്റിംഗ്സ് തുറന്നു`,
          toastText: '✓ ക്രമീകരണങ്ങൾ തുറന്നു',
        },
        kn: {
          speech: `ನಿಮ್ಮ ಜಿಎಸ್‌ಟಿ ಸಂಖ್ಯೆ (${gstinCode}) ಮತ್ತು ವ್ಯಾಪಾರ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.`,
          actionText: `ಜಿಎಸ್‌ಟಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ತೆರೆಯಲಾಗಿದೆ`,
          toastText: '✓ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ತೆರೆಯಲ್ಪಟ್ಟಿವೆ',
        },
        en: {
          speech: `Opening settings and configuring workspace GSTIN profile to ${gstinCode}.`,
          actionText: `Navigated to Settings & GST (${gstinCode})`,
          toastText: `✓ Settings opened for ${gstinCode}`,
        },
      };
      return responses[lang] || responses.en;
    }

    case 'RUN_AUTOMATION': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'தானியங்கி பணிப்பாய்வு விதிகள் மற்றும் கட்டண நினைவூட்டல் ஆட்டோமேஷன் பக்கத்தைத் திறக்கிறேன்.',
          actionText: 'ஆட்டோமேஷன் பணிப்பாய்வு தொகுதி திறக்கப்பட்டது',
          toastText: '✓ ஆட்டோமேஷன் தொகுதி திறக்கப்பட்டது',
        },
        hi: {
          speech: 'स्वचालित वर्कफ़्लो नियम और भुगतान फॉलो-अप नियम पृष्ठ खोला जा रहा है।',
          actionText: 'वर्कफ़्लो ऑटोमेशन मॉड्यूल खोला गया',
          toastText: '✓ वर्कफ़्लो ऑटोमेशन खुला',
        },
        te: {
          speech: 'ఆటోమేటిక్ వర్క్‌ఫ్లో నిబంధనలు మరియు ఆటోమేషన్ పేజీని తెరుస్తున్నాను.',
          actionText: 'ఆటోమేషన్ మాడ్యూల్ తెరవబడింది',
          toastText: '✓ ఆటోమేషన్ తెరవబడింది',
        },
        ml: {
          speech: 'ഓട്ടോമേറ്റഡ് വർക്ക്ഫ്ലോ നിയമങ്ങളുടെ പേജ് തുറക്കുന്നു.',
          actionText: 'ഓട്ടോമേഷൻ പേജ് തുറന്നു',
          toastText: '✓ ഓട്ടോമേഷൻ തുറന്നു',
        },
        kn: {
          speech: 'ಸ್ವಯಂಚಾಲಿತ ವರ್ಕ್‌ಫ್ಲೋ ನಿಯಮಗಳ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
          actionText: 'ಆಟೊಮೇಷನ್ ಪುಟ ತೆರೆಯಲಾಗಿದೆ',
          toastText: '✓ ಆಟೊಮೇಷನ್ ತೆರೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: 'Opening Visual Automation engine to synthesize automated payment collection workflow.',
          actionText: 'Navigated to Visual Automations (/automations)',
          toastText: '✓ Visual Automations opened',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'VIEW_CUSTOMERS': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'வாடிக்கையாளர் பட்டியலைத் திறந்துள்ளேன். உங்கள் கணக்கில் உள்ள வாடிக்கையாளர்கள் இதோ.',
          actionText: 'வாடிக்கையாளர் பட்டியல் காண்பிக்கப்படுகிறது (/customers)',
          toastText: '✓ வாடிக்கையாளர் பட்டியல் திறக்கப்பட்டது',
        },
        hi: {
          speech: 'ग्राहक सूची खोल दी गई है। आपके खाते के सक्रिय ग्राहक यहाँ प्रदर्शित हैं।',
          actionText: 'ग्राहक सूची प्रदर्शित की जा रही है (/customers)',
          toastText: '✓ ग्राहक सूची खुली',
        },
        te: {
          speech: 'కస్టమర్ల జాబితాను తెరిచాను. మీ ఖాతాలోని కస్టమర్లు ఇక్కడ ఉన్నారు.',
          actionText: 'కస్టమర్ల జాబితా చూపించబడుతోంది (/customers)',
          toastText: '✓ కస్టమర్ల జాబితా తెరవబడింది',
        },
        ml: {
          speech: 'ഉപഭോക്താക്കളുടെ ലിസ്റ്റ് തുറന്നിട്ടുണ്ട്.',
          actionText: 'ഉപഭോക്താക്കളുടെ പേജ് കാണിക്കുന്നു (/customers)',
          toastText: '✓ ഉപഭോക്തൃ ലിസ്റ്റ് തുറന്നു',
        },
        kn: {
          speech: 'ಗ್ರಾಹಕರ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯಲಾಗಿದೆ. ನಿಮ್ಮ ಖಾತೆಯ ಗ್ರಾಹಕರು ಇಲ್ಲಿದ್ದಾರೆ.',
          actionText: 'ಗ್ರಾಹಕರ ಪಟ್ಟಿ ತೋರಿಸಲಾಗುತ್ತಿದೆ (/customers)',
          toastText: '✓ ಗ್ರಾಹಕರ ಪಟ್ಟಿ ತೆರೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: 'Navigating to Customers directory. Active clients: Acme Traders Ltd, TechNova Solutions, Tata Motors Ltd, and Aakash Enterprises.',
          actionText: 'Retrieved active clients in CRM (/customers)',
          toastText: '✓ Customers directory displayed',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'VIEW_INVOICES': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'இன்வாய்ஸ் பக்கத்தைத் திறக்கிறேன். மொத்தம் 142 இன்வாய்ஸ்கள் பதிவாகியுள்ளன.',
          actionText: 'இன்வாய்ஸ் பட்டியல் காட்டப்படுகிறது (/invoices)',
          toastText: '✓ இன்வாய்ஸ்கள் திறக்கப்பட்டன',
        },
        hi: {
          speech: 'इनवॉइस सूची खोली जा रही है। कुल 142 बिलिंग रिकॉर्ड उपलब्ध हैं।',
          actionText: 'इनवॉइस सूची प्रदर्शित की जा रही है (/invoices)',
          toastText: '✓ इनवॉइस सूची खुली',
        },
        te: {
          speech: 'ఇన్వాయిస్‌ల జాబితా తెరవబడుతోంది.',
          actionText: 'ఇన్వాయిస్‌ల పేజీ చూపించబడుతోంది (/invoices)',
          toastText: '✓ ఇన్వాయిస్‌లు తెరవబడ్డాయి',
        },
        ml: {
          speech: 'ഇൻവോയ്സ് ലിസ്റ്റ് തുറക്കുന്നു.',
          actionText: 'ഇൻവോയ്സ് പേജ് കാണിക്കുന്നു (/invoices)',
          toastText: '✓ ഇൻവോയ്സുകൾ തുറന്നു',
        },
        kn: {
          speech: 'ಇನ್‌ವಾಯ್ಸ್ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
          actionText: 'ಇನ್‌ವಾಯ್ಸ್ ಪುಟ ತೋರಿಸಲಾಗುತ್ತಿದೆ (/invoices)',
          toastText: '✓ ಇನ್‌ವಾಯ್ಸ್‌ಗಳು ತೆರೆಯಲ್ಪಟ್ಟಿವೆ',
        },
        en: {
          speech: 'Opening billing invoices directory with full GST Rule 46 records.',
          actionText: 'Navigated to Billing & Invoices (/invoices)',
          toastText: '✓ Invoices directory displayed',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'VIEW_PAYMENTS': {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: 'கட்டணங்கள் மற்றும் வசூல் லெட்ஜர் கணக்குப் பக்கத்தைக் காட்டுகிறேன்.',
          actionText: 'கட்டண லெட்ஜர் காட்டப்படுகிறது (/payments)',
          toastText: '✓ கட்டண லெட்ஜர் திறக்கப்பட்டது',
        },
        hi: {
          speech: 'भुगतान और लेजर निपटान पृष्ठ खोला जा रहा है।',
          actionText: 'भुगतान लेजर प्रदर्शित हो रहा है (/payments)',
          toastText: '✓ भुगतान पृष्ठ खुला',
        },
        te: {
          speech: 'చెల్లింపుల లెడ్జర్ పేజీ తెరవబడింది.',
          actionText: 'చెల్లింపులు చూపించబడుతున్నాయి (/payments)',
          toastText: '✓ చెల్లింపుల పేజీ తెరవబడింది',
        },
        ml: {
          speech: 'പേയ്‌മെന്റുകളുടെ ലെഡ്ജർ പേജ് തുറക്കുന്നു.',
          actionText: 'പേയ്‌മെന്റ് പേജ് കാണിക്കുന്നു (/payments)',
          toastText: '✓ പേയ്‌മെന്റ് പേജ് തുറന്നു',
        },
        kn: {
          speech: 'ಪಾವತಿಗಳ ಲೆಡ್ಜರ್ ಪುಟವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
          actionText: 'ಪಾವತಿಗಳ ಪುಟ ತೋರಿಸಲಾಗುತ್ತಿದೆ (/payments)',
          toastText: '✓ ಪಾವತಿಗಳ ಪುಟ ತೆರೆಯಲಾಗಿದೆ',
        },
        en: {
          speech: 'Opening payments and ledger settlement transaction history.',
          actionText: 'Navigated to Payments & Collections (/payments)',
          toastText: '✓ Payments ledger displayed',
        },
      };
      return responses[lang] || responses.en;
    }

    case 'GENERAL':
    default: {
      const responses: Record<LanguageCode, MultilingualResponsePayload> = {
        ta: {
          speech: `உங்கள் கட்டளை பெறப்பட்டது: "${commandText}". பில்பைலட் அனைத்து கணக்குகளையும் வெற்றிகரமாக புதுப்பித்துள்ளது.`,
          actionText: `செயல்முறை முடிக்கப்பட்டது: ${commandText}`,
          toastText: '✓ கோரிக்கை வெற்றிகரமாக நிறைவேற்றப்பட்டது',
        },
        hi: {
          speech: `आपका निर्देश प्राप्त हुआ: "${commandText}"। बिलपायलट ने सभी खातों को सफलतापूर्वक अपडेट कर दिया है।`,
          actionText: `कार्य निष्पादित हुआ: ${commandText}`,
          toastText: '✓ निर्देश सफलतापूर्वक पूरा हुआ',
        },
        te: {
          speech: `మీ సూచన స్వీకరించబడింది: "${commandText}". బిల్ పైలట్ అన్ని ఖాతాలను విజయవంతంగా అప్‌డేట్ చేసింది.`,
          actionText: `కార్యం అమలు చేయబడింది: ${commandText}`,
          toastText: '✓ సూచన విజయవంతంగా అమలు చేయబడింది',
        },
        ml: {
          speech: `നിങ്ങളുടെ നിർദ്ദേശം സ്വീകരിച്ചു: "${commandText}". ബിൽപൈലറ്റ് എല്ലാ അക്കൗണ്ടുകളും അപ്ഡേറ്റ് ചെയ്തു.`,
          actionText: `പ്രവർത്തനം പൂർത്തിയാക്കി: ${commandText}`,
          toastText: '✓ നിർദ്ദേശം വിജയകരമായി നിർവഹിച്ചു',
        },
        kn: {
          speech: `ನಿಮ್ಮ ಸೂಚನೆಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ: "${commandText}". ಬಿಲ್‌ಪೈಲಟ್ ಎಲ್ಲಾ ಖಾತೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಡೇಟ್ ಮಾಡಿದೆ.`,
          actionText: `ಕಾರ್ಯವನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ: ${commandText}`,
          toastText: '✓ ಸೂಚನೆ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ',
        },
        en: {
          speech: `Understood: "${commandText}". ollaiBooks AI has executed your workspace request.`,
          actionText: `Executed command: ${commandText}`,
          toastText: '✓ Action executed successfully',
        },
      };
      return responses[lang] || responses.en;
    }
  }
}

export function AiVoiceActionWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const isOpenRef = React.useRef(isOpen);
  React.useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Hands-free Wake Radar: Default to false (OFF) to completely prevent background Chromium mic flickering
  const [wakeRadarEnabled, setWakeRadarEnabled] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('billpilot_wake_radar');
      return saved === 'true';
    }
    return false;
  });
  const wakeRadarEnabledRef = React.useRef(wakeRadarEnabled);
  React.useEffect(() => {
    wakeRadarEnabledRef.current = wakeRadarEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('billpilot_wake_radar', String(wakeRadarEnabled));
    }
  }, [wakeRadarEnabled]);

  // Persistent language selection stored in localStorage
  const [selectedLang, setSelectedLang] = React.useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('billpilot_selected_lang') as LanguageCode;
      if (saved && ['en', 'hi', 'ta', 'te', 'ml', 'kn'].includes(saved)) {
        return saved;
      }
    }
    return 'en';
  });

  const selectedLangRef = React.useRef<LanguageCode>(selectedLang);
  React.useEffect(() => {
    selectedLangRef.current = selectedLang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('billpilot_selected_lang', selectedLang);
    }
  }, [selectedLang]);

  // Recognition state machines to completely prevent rapid restart/shutter loops
  const [isListening, setIsListening] = React.useState(false);
  const isListeningRef = React.useRef(false);
  const isStartingRef = React.useRef(false);

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const isSpeakingRef = React.useRef(false);
  const manualStopRef = React.useRef(false);

  const [voiceMuted, setVoiceMuted] = React.useState(false);
  const [autoPauseActive, setAutoPauseActive] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('billpilot_auto_pause');
      return saved === 'true';
    }
    return false; // Default to manual control so user uses Pause and Execute buttons
  });
  const [transcript, setTranscript] = React.useState('');
  const [aiSpeechText, setAiSpeechText] = React.useState('');
  const [actionStatus, setActionStatus] = React.useState<{ text: string; executed: boolean } | null>(null);
  const [inputText, setInputText] = React.useState('');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Autonomous Agent Pipeline Execution State
  const [agentPipeline, setAgentPipeline] = React.useState<
    Array<{ title: string; detail: string; status: 'PENDING' | 'IN_PROGRESS' | 'DONE' }>
  >([]);
  const [agentProvider, setAgentProvider] = React.useState<string>('NVIDIA_NIM');

  // Interactive Confirmation State for Actions (Invoice, Customer, Payment, Product)
  const [pendingConfirmation, setPendingConfirmation] = React.useState<{
    type?: 'INVOICE' | 'CUSTOMER' | 'PAYMENT' | 'PRODUCT' | 'ORDER' | 'REPORT' | 'SETTINGS';
    baseAmount?: number;
    unitPrice?: number;
    taxRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    taxAmount?: number;
    grandTotal?: number;
    customerName?: string;
    itemName?: string;
    name?: string;
    hsnCode?: string;
    phone?: string;
    email?: string;
    billingCity?: string;
    billingState?: string;
    amount?: number;
    paymentMethod?: string;
    invoiceNumber?: string;
    notes?: string;
    missingFields?: string[];
    prompt?: string;
  } | null>(null);
  const pendingConfirmationRef = React.useRef(pendingConfirmation);
  React.useEffect(() => {
    pendingConfirmationRef.current = pendingConfirmation;
  }, [pendingConfirmation]);

  // Conversational Silence Debounce Visual State (Prevents answering mid-speech)
  const [isDebouncingAutoExec, setIsDebouncingAutoExec] = React.useState(false);
  const [countdownSeconds, setCountdownSeconds] = React.useState<number | null>(null);
  const countdownIntervalRef = React.useRef<any>(null);

  // Docked view mode allows user to see the webpage and invoice form auto-filling in real time
  const [isDocked, setIsDocked] = React.useState(false);
  const isProcessingRef = React.useRef(false);

  // W3C SpeechRecognition Protocol: Native Voice Activity State (Zero Flickering)
  const [isUserSpeaking, setIsUserSpeaking] = React.useState(false);
  const isUserSpeakingRef = React.useRef(false);
  const transcriptRef = React.useRef('');
  const accumulatedFinalRef = React.useRef('');

  // Real-Time Web Audio API True Decibel & Frequency Waveform Analyser
  const [audioBands, setAudioBands] = React.useState<number[]>([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
  const audioContextRef = React.useRef<any>(null);
  const analyserRef = React.useRef<any>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const currentLangConfig = React.useMemo(
    () => INDIAN_LANGUAGES.find((l) => l.code === selectedLang) || INDIAN_LANGUAGES[0],
    [selectedLang]
  );

  const recognitionRef = React.useRef<any>(null);
  const silenceTimerRef = React.useRef<any>(null);
  const reconnectTimerRef = React.useRef<any>(null);
  const handleProcessCommandRef = React.useRef<(cmd: string) => void>(() => {});

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const stopAllAudio = React.useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      } catch { }
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch { }
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, []);

  // Real-Time Web Audio API Stream Analyser (Live decibels & 12 frequency bands)
  const startAudioAnalyser = React.useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      if (!mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const source = ctx.createMediaStreamSource(mediaStreamRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const voicePresent = avg > 10; // Real hardware audio activity threshold

        setIsUserSpeaking(voicePresent);
        isUserSpeakingRef.current = voicePresent;

        // Sample 12 distinct frequency bands for waveform visualizer
        const bands: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 12));
        for (let i = 0; i < 12; i++) {
          const val = dataArray[i * step] || 0;
          const h = Math.max(4, Math.min(38, Math.round((val / 255) * 34) + 4));
          bands.push(h);
        }
        setAudioBands(bands);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch {
      // Graceful fallback if getUserMedia not permitted
    }
  }, []);

  const stopAudioAnalyser = React.useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch { }
      audioContextRef.current = null;
    }
    setAudioBands([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]);
    setIsUserSpeaking(false);
    isUserSpeakingRef.current = false;
  }, []);

  // Safe Start: Guaranteed clean microphone access without stream hijacking
  const startListening = React.useCallback(() => {
    manualStopRef.current = false;
    if (isSpeakingRef.current) return;
    setIsListening(true);
    isListeningRef.current = true;
    setIsUserSpeaking(false);
    isUserSpeakingRef.current = false;
    startAudioAnalyser();

    if (recognitionRef.current) {
      try {
        isStartingRef.current = true;
        recognitionRef.current.start();
      } catch {
        isStartingRef.current = false;
      }
    }
  }, [startAudioAnalyser]);

  // Safe Stop
  const stopListening = React.useCallback((isManual = true) => {
    if (isManual) manualStopRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsDebouncingAutoExec(false);
    setCountdownSeconds(null);

    stopAudioAnalyser();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { }
    }
    isStartingRef.current = false;
    isListeningRef.current = false;
    setIsListening(false);
  }, [stopAudioAnalyser]);

  // -------------------------------------------------------------
  // HIGH-DEFINITION VOICE RETURN ENGINE (MP3 STREAM VIA /api/tts)
  // Provides crystal-clear native pronunciation for all 6 languages
  // -------------------------------------------------------------
  const speakVoice = React.useCallback(
    (textToSpeak: string, langCode: LanguageCode) => {
      if (voiceMuted || typeof window === 'undefined') {
        return;
      }

      // 1. Immediately silence any active audio
      stopAllAudio();

      // 2. STOP speech recognition so the microphone NEVER hears computer audio (prevents echo loop)
      stopListening(false);

      setIsSpeaking(true);
      isSpeakingRef.current = true;

      try {
        const audioUrl = `/api/tts?lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(textToSpeak)}`;
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        currentAudioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
        };

        audio.onended = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          isProcessingRef.current = false;
          currentAudioRef.current = null;
          // Clear accumulated speech transcript buffer so the subsequent user reply is completely clean
          accumulatedFinalRef.current = '';
          setTranscript('');
          transcriptRef.current = '';
          // Two-Way Continuous Conversational Loop:
          // Immediately resume listening so user can speak "Yes", "Proceed", "No", or give new instructions!
          manualStopRef.current = false;
          setTimeout(() => {
            if (isOpenRef.current || wakeRadarEnabledRef.current) {
              startListening();
            }
          }, 450);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          isProcessingRef.current = false;
          currentAudioRef.current = null;
          // Fallback to Web Speech Synthesis if audio stream error
          if ('speechSynthesis' in window) {
            const utt = new SpeechSynthesisUtterance(textToSpeak);
            utt.lang = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;
            utt.onend = () => {
              accumulatedFinalRef.current = '';
              setTranscript('');
              transcriptRef.current = '';
              manualStopRef.current = false;
              setTimeout(() => {
                if (isOpenRef.current || wakeRadarEnabledRef.current) {
                  startListening();
                }
              }, 450);
            };
            window.speechSynthesis.speak(utt);
          } else {
            manualStopRef.current = false;
            setTimeout(() => {
              if (isOpenRef.current || wakeRadarEnabledRef.current) {
                startListening();
              }
            }, 450);
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            isProcessingRef.current = false;
          });
        }
      } catch {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        isProcessingRef.current = false;
      }
    },
    [voiceMuted, stopAllAudio, stopListening, startListening]
  );

  const handleConfirmProceed = React.useCallback(() => {
    const data = pendingConfirmationRef.current;
    if (!data) return;

    setPendingConfirmation(null);
    pendingConfirmationRef.current = null;

    if (data.type === 'CUSTOMER') {
      const custName = data.customerName || 'Tata Motors';
      window.dispatchEvent(
        new CustomEvent('billpilot:customer-created', {
          detail: {
            name: custName,
            phone: data.phone || '+91 98765 43210',
            email: data.email || 'billing@tatamotors.com',
            billingCity: data.billingCity || 'Mumbai',
            billingState: data.billingState || 'Maharashtra',
          },
        })
      );

      const custReplies: Record<LanguageCode, string> = {
        en: `Customer "${custName}" has been added to your CRM directory successfully!`,
        ta: `வாடிக்கையாளர் "${custName}" உங்கள் சிஆர்எம் கோப்பகத்தில் வெற்றிகரமாக சேர்க்கப்பட்டார்!`,
        hi: `ग्राहक "${custName}" को आपकी सीआरएम सूची में सफलतापूर्वक जोड़ दिया गया है!`,
        te: `కస్టమర్ "${custName}" మీ CRM డైరెక్టరీకి విజయవంతంగా జోడించబడింది!`,
        ml: `ഉപഭോക്താവ് "${custName}" നിങ്ങളുടെ സിആർഎമ്മിൽ വിജയകരമായി ചേർത്തു!`,
        kn: `ಗ್ರಾಹಕ "${custName}" ಅವರನ್ನು ನಿಮ್ಮ ಸಿಆರ್‌ಎಂ ಡೈರೆಕ್ಟರಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!`,
      };
      const reply = custReplies[selectedLangRef.current] || custReplies.en;
      setAiSpeechText(reply);
      setActionStatus({ text: reply, executed: true });
      speakVoice(reply, selectedLangRef.current);
      triggerToast(`✓ Customer "${custName}" created successfully`);
      return;
    }

    if (data.type === 'PAYMENT') {
      const amt = data.amount || data.baseAmount || 25000;
      const method = data.paymentMethod || 'UPI';
      const custName = data.customerName || 'Acme Traders Ltd';

      window.dispatchEvent(
        new CustomEvent('billpilot:payment-recorded', {
          detail: {
            amount: amt,
            customerName: custName,
            paymentMethod: method,
            notes: data.notes || 'Recorded via AI Voice Agent',
          },
        })
      );

      const payReplies: Record<LanguageCode, string> = {
        en: `Payment of ₹${amt.toLocaleString('en-IN')} via ${method} has been recorded in your ledger successfully!`,
        ta: `₹${amt.toLocaleString('en-IN')} கட்டணம் (${method}) உங்கள் லெட்ஜரில் வெற்றிகரமாக பதிவு செய்யப்பட்டது!`,
        hi: `₹${amt.toLocaleString('en-IN')} का भुगतान (${method}) लेजर में सफलतापूर्वक दर्ज कर लिया गया है!`,
        te: `₹${amt.toLocaleString('en-IN')} చెల్లింపు (${method}) లెడ్జర్‌లో విజయవంతంగా నమోదు చేయబడింది!`,
        ml: `₹${amt.toLocaleString('en-IN')} പേയ്‌മെന്റ് (${method}) ലെഡ്ജറിൽ വിജയകരമായി രേഖപ്പെടുത്തി!`,
        kn: `₹${amt.toLocaleString('en-IN')} ಪಾವತಿಯನ್ನು (${method}) ನಿಮ್ಮ ಲೆಡ್ಜರ್‌ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ!`,
      };
      const reply = payReplies[selectedLangRef.current] || payReplies.en;
      setAiSpeechText(reply);
      setActionStatus({ text: reply, executed: true });
      speakVoice(reply, selectedLangRef.current);
      triggerToast(`✓ Payment ₹${amt.toLocaleString('en-IN')} recorded in ledger`);
      return;
    }

    if (data.type === 'PRODUCT') {
      const prodName = data.name || data.itemName || 'Enterprise Cloud Consulting Suite';
      const prodPrice = data.unitPrice || data.baseAmount || 25000;
      const prodTax = data.taxRate || 18;

      window.dispatchEvent(
        new CustomEvent('billpilot:product-created', {
          detail: {
            name: prodName,
            unitPrice: prodPrice,
            taxRate: prodTax,
            hsnCode: data.hsnCode || '998314',
          },
        })
      );

      const prodReplies: Record<LanguageCode, string> = {
        en: `Product "${prodName}" has been added to your catalog successfully!`,
        ta: `தயாரிப்பு "${prodName}" உங்கள் பட்டியலில் வெற்றிகரமாக சேர்க்கப்பட்டது!`,
        hi: `उत्पाद "${prodName}" कैटलॉग में सफलतापूर्वक जोड़ दिया गया है!`,
        te: `ఉత్పత్తి "${prodName}" మీ కేటలాగ్‌కు విజయవంతంగా జోడించబడింది!`,
        ml: `ഉൽപ്പന്നം "${prodName}" കാറ്റലോഗിൽ വിജയകരമായി ചേർത്തു!`,
        kn: `ಉತ್ಪನ್ನ "${prodName}" ನಿಮ್ಮ ಕ್ಯಾಟಲಾಗ್‌ಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!`,
      };
      const reply = prodReplies[selectedLangRef.current] || prodReplies.en;
      setAiSpeechText(reply);
      setActionStatus({ text: reply, executed: true });
      speakVoice(reply, selectedLangRef.current);
      triggerToast(`✓ Product "${prodName}" created`);
      return;
    }

    // Default: Statutory GST Invoice creation & local PDF download
    const grandTotal = data.grandTotal || 29500;
    downloadLocalInvoicePdf({
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      unitPrice: data.baseAmount || 25000,
      taxRate: data.taxRate || 18,
      cgstAmount: data.cgstAmount || 2250,
      sgstAmount: data.sgstAmount || 2250,
      grandTotal: grandTotal,
      customerName: data.customerName || 'TechNova Solutions',
      itemName: data.itemName || 'Enterprise Cloud & Billing Implementation',
    });

    // Dispatch page confirmation event
    window.dispatchEvent(
      new CustomEvent('billpilot:confirm-invoice-download', {
        detail: data,
      })
    );

    // Multilingual voice announcement
    const successReplies: Record<LanguageCode, string> = {
      en: `Invoice created successfully! ₹${grandTotal.toLocaleString('en-IN')} official GST Tax Invoice PDF has been downloaded to your local device.`,
      ta: `இன்வாய்ஸ் வெற்றிகரமாக உருவாக்கப்பட்டது! ₹${grandTotal.toLocaleString('en-IN')} அதிகாரப்பூர்வ ஜிஎஸ்டி பில் பிடிஎஃப் உங்கள் சாதனத்தில் பதிவிறக்கம் செய்யப்பட்டுள்ளது.`,
      hi: `इनवॉइस सफलतापूर्वक बनाया गया! ₹${grandTotal.toLocaleString('en-IN')} का आधिकारिक जीएसटी टैक्स इनवॉइस पीडीएफ डाउनलोड हो गया है।`,
      te: `ఇన్వాయిస్ విజయవంతంగా సృష్టించబడింది! ₹${grandTotal.toLocaleString('en-IN')} అధికారిక GST ట్యాక్స్ ఇన్వాయిస్ PDF మీ పరికరంలో డౌన్‌లోడ్ చేయబడింది.`,
      ml: `ഇൻവോയ്സ് വിജയകരമായി സൃഷ്ടിച്ചു! ₹${grandTotal.toLocaleString('en-IN')} തുകയുടെ ജിഎസ്ടി ഇൻവോയ്സ് പിഡിഎഫ് ഡൗൺലോഡ് ചെയ്തിട്ടുണ്ട്.`,
      kn: `ಇನ್‌ವಾಯ್ಸ್ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ! ₹${grandTotal.toLocaleString('en-IN')} ಮೊತ್ತದ ಅಧಿಕೃತ ಜಿಎಸ್‌ಟಿ ಇನ್‌ವಾಯ್ಸ್ ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಆಗಿದೆ.`,
    };

    const reply = successReplies[selectedLangRef.current] || successReplies.en;
    setAiSpeechText(reply);
    setActionStatus({
      text: reply,
      executed: true,
    });
    speakVoice(reply, selectedLangRef.current);
    triggerToast('✓ Tax Invoice PDF downloaded to local machine');
  }, [speakVoice]);

  const handleCancelProceed = React.useCallback(() => {
    const data = pendingConfirmationRef.current;
    setPendingConfirmation(null);
    pendingConfirmationRef.current = null;

    let typeStr = 'Invoice';
    if (data?.type === 'CUSTOMER') {
      typeStr = 'Customer';
      window.dispatchEvent(new CustomEvent('billpilot:cancel-customer'));
    } else if (data?.type === 'PAYMENT') {
      typeStr = 'Payment';
      window.dispatchEvent(new CustomEvent('billpilot:cancel-payment'));
    } else if (data?.type === 'PRODUCT') {
      typeStr = 'Product';
      window.dispatchEvent(new CustomEvent('billpilot:cancel-product'));
    } else {
      window.dispatchEvent(new CustomEvent('billpilot:cancel-invoice'));
    }

    const cancelReplies: Record<LanguageCode, string> = {
      en: `${typeStr} creation cancelled. No changes were saved.`,
      ta: `${typeStr} உருவாக்கம் ரத்து செய்யப்பட்டது.`,
      hi: `${typeStr} निरस्त किया गया। कोई बदलाव नहीं हुआ।`,
      te: `${typeStr} రద్దు చేయబడింది.`,
      ml: `${typeStr} റദ്ദാക്കി.`,
      kn: `${typeStr} ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.`,
    };

    const reply = cancelReplies[selectedLangRef.current] || cancelReplies.en;
    setAiSpeechText(reply);
    setActionStatus({
      text: reply,
      executed: false,
    });
    speakVoice(reply, selectedLangRef.current);
    triggerToast(`${typeStr} cancelled`);
  }, [speakVoice]);

  // -------------------------------------------------------------
  // AUTONOMOUS AGENT COMMAND PROCESSOR & AI REASONING
  // Automates website pages in real-time agent style
  // -------------------------------------------------------------
  const handleProcessCommand = React.useCallback(
    async (rawCommand: string) => {
      if (!rawCommand.trim()) return;

      // Smoothly dock widget into floating bottom-right assistant so user has 100% full view of webpage and live typing!
      setIsDocked(true);

      setIsDebouncingAutoExec(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setCountdownSeconds(null);

      // Stop listening IMMEDIATELY to prevent speech recognition from capturing
      // mid-command background noise or extra speech while AI calculates/speaks
      stopListening(false);
      isProcessingRef.current = true;

      const activeLang = selectedLangRef.current;
      const langConfig = INDIAN_LANGUAGES.find((l) => l.code === activeLang) || INDIAN_LANGUAGES[0];

      let cleanCmd = rawCommand.toLowerCase().trim();

      // Strip "Hey ollaiBooks" / "ollaiBooks" wake-words
      for (const w of langConfig.wakeWords) {
        if (cleanCmd.startsWith(w.toLowerCase())) {
          cleanCmd = cleanCmd.replace(w.toLowerCase(), '').trim();
        }
      }

      try {
        const data = await ApiClient.post<any>('/ai/assistant', { question: cleanCmd || rawCommand });
        const responseText = data.answer || 'I could not produce an answer for that request.';
        setAgentProvider(data.provider || 'ollaiBooks Assistant');
        setAgentPipeline([
          { title: 'Tenant-authenticated request', detail: 'Request sent through the workspace API.', status: 'DONE' },
          { title: 'Workspace data and knowledge lookup', detail: 'The assistant returned its response with available citations.', status: 'DONE' },
          { title: 'Action execution', detail: 'No write action was executed by this voice request.', status: 'DONE' },
        ]);
        setAiSpeechText(responseText);
        setActionStatus({ text: 'Answer generated. No write action was executed.', executed: false });
        speakVoice(responseText, activeLang);
        return;
      } catch (error: any) {
        const message = error?.message || 'The assistant request failed. Check your connection and sign-in, then retry.';
        setAiSpeechText(message);
        setActionStatus({ text: 'Request failed. No action was executed.', executed: false });
        speakVoice(message, activeLang);
        triggerToast(message);
        return;
      }
    },
    [speakVoice]
  );

  React.useEffect(() => {
    handleProcessCommandRef.current = handleProcessCommand;
  }, [handleProcessCommand]);

  // ChatGPT-Style Stop and Execute Action:
  // Immediately stops listening, collects accumulated speech transcript, and executes workflow
  const handleStopAndExecute = React.useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsDebouncingAutoExec(false);
    setCountdownSeconds(null);

    stopListening(false);
    const toExec = transcriptRef.current.trim() || transcript.trim();
    accumulatedFinalRef.current = '';
    if (toExec) {
      handleProcessCommand(toExec);
    }
  }, [handleProcessCommand, stopListening, transcript]);

  const handleStopAndExecuteRef = React.useRef(handleStopAndExecute);
  React.useEffect(() => {
    handleStopAndExecuteRef.current = handleStopAndExecute;
  }, [handleStopAndExecute]);

  // 1-Click Voice Recording Toggle:
  // - Click to start recording & real-time voice visualizer
  // - Mic turns into Stop button (ChatGPT Style)
  // - Click to stop -> executes automation immediately with zero lag!
  const toggleRecording = React.useCallback(() => {
    if (isListeningRef.current) {
      handleStopAndExecute();
    } else {
      stopAllAudio();
      accumulatedFinalRef.current = '';
      setTranscript('');
      transcriptRef.current = '';
      setAiSpeechText('');
      setActionStatus(null);
      setIsDebouncingAutoExec(false);
      setCountdownSeconds(null);
      startListening();
    }
  }, [handleStopAndExecute, startListening, stopAllAudio]);

  // -------------------------------------------------------------
  // HIGH-PRECISION CONTINUOUS SPEECH RECOGNITION & MULTI-LINE BUFFER
  // Preserves multi-sentence speech across natural pauses without dropping words
  // -------------------------------------------------------------
  const initSpeechRecognition = React.useCallback(
    (bcp47: string) => {
      if (typeof window === 'undefined') return;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch { }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = bcp47;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isStartingRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        // Guard: Never process speech while AI is calculating, syncing, or speaking
        if (isProcessingRef.current || isSpeakingRef.current) return;

        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            sessionFinal += res[0].transcript + ' ';
          } else {
            sessionInterim += res[0].transcript;
          }
        }

        // Seamlessly combine previously accumulated lines with current session text
        const totalText = (accumulatedFinalRef.current + sessionFinal + sessionInterim)
          .replace(/\s+/g, ' ')
          .trim();

        if (!totalText) return;
        transcriptRef.current = totalText;
        setTranscript(totalText);

        // CHECK INTERACTIVE ACTION CONFIRMATION ("Should I proceed: yes or no?")
        if (pendingConfirmationRef.current) {
          const lower = totalText.toLowerCase();
          const isAffirmative =
            lower.includes('yes') ||
            lower.includes('proceed') ||
            lower.includes('download') ||
            lower.includes('confirm') ||
            lower.includes('sure') ||
            lower.includes('ok') ||
            lower.includes('ஆம்') ||
            lower.includes('சரி') ||
            lower.includes('பதிவிறக்கு') ||
            lower.includes('உறுதி') ||
            lower.includes('हाँ') ||
            lower.includes('हा') ||
            lower.includes('डाउनलोड') ||
            lower.includes('అవును') ||
            lower.includes('సరే') ||
            lower.includes('അതെ') ||
            lower.includes('ശരി') ||
            lower.includes('ഡൗൺലോഡ്') ||
            lower.includes('ಹೌದು') ||
            lower.includes('ಸರಿ') ||
            lower.includes('ಡೌನ್‌ಲೋಡ್');

          const isNegative =
            lower.includes('no') ||
            lower.includes('cancel') ||
            lower.includes('stop') ||
            lower.includes('வேண்டாம்') ||
            lower.includes('இல்லை') ||
            lower.includes('नहीं') ||
            lower.includes('मत करो') ||
            lower.includes('వద్దు') ||
            lower.includes('కాదు') ||
            lower.includes('വേണ്ട') ||
            lower.includes('അല്ല') ||
            lower.includes('ಬೇಡ') ||
            lower.includes('ಇಲ್ಲ');

          if (isAffirmative) {
            handleConfirmProceed();
            return;
          } else if (isNegative) {
            handleCancelProceed();
            return;
          }
        }

        // Conversational Silence Auto-Execution:
        // Automatically schedules execution 1.8 seconds after user finishes speaking
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        if (totalText.length >= 3) {
          setIsDebouncingAutoExec(true);
          setCountdownSeconds(2);
          let remaining = 2;
          countdownIntervalRef.current = setInterval(() => {
            remaining -= 1;
            if (remaining > 0) {
              setCountdownSeconds(remaining);
            } else {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              setCountdownSeconds(null);
              setIsDebouncingAutoExec(false);
              if (isListeningRef.current && transcriptRef.current.trim()) {
                handleStopAndExecuteRef.current();
              }
            }
          }, 900);
        }
      };

      recognition.onerror = (event: any) => {
        isStartingRef.current = false;
        console.warn('SpeechRecognition event:', event.error);
        if (event.error === 'not-allowed') {
          manualStopRef.current = true;
          isListeningRef.current = false;
          setIsListening(false);
          stopAudioAnalyser();
          triggerToast('⚠️ Microphone access blocked. Please allow microphone in browser.');
        } else if (event.error === 'network') {
          setTimeout(() => {
            if (isListeningRef.current && !manualStopRef.current) {
              try { recognition.start(); } catch { }
            }
          }, 400);
        }
      };

      recognition.onend = () => {
        isStartingRef.current = false;

        // If user manually stopped or AI is currently speaking, cleanly stop
        if (manualStopRef.current || isSpeakingRef.current) {
          isListeningRef.current = false;
          setIsListening(false);
          stopAudioAnalyser();
          return;
        }

        // Persist finalized sentences into buffer so multi-line speech is NEVER lost across pauses!
        if (transcriptRef.current.trim()) {
          accumulatedFinalRef.current = transcriptRef.current.trim() + ' ';
        }

        // Calm restart so recognition continues seamlessly
        if (isOpenRef.current && isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            isListeningRef.current = false;
            setIsListening(false);
            stopAudioAnalyser();
          }
        } else {
          isListeningRef.current = false;
          setIsListening(false);
          stopAudioAnalyser();
        }
      };

      recognitionRef.current = recognition;
    },
    [handleConfirmProceed, handleCancelProceed, stopAudioAnalyser]
  );

  React.useEffect(() => {
    initSpeechRecognition(currentLangConfig.bcp47);
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch { }
      }
    };
  }, [currentLangConfig.bcp47, initSpeechRecognition]);

  const handleOpenVoiceWidget = React.useCallback(() => {
    manualStopRef.current = false;
    setIsOpen(true);
    isOpenRef.current = true;
    setTranscript('');
    transcriptRef.current = '';
    setAiSpeechText('');
    setActionStatus(null);
    setIsDebouncingAutoExec(false);
    setCountdownSeconds(null);
    setTimeout(() => {
      startListening();
    }, 120);
  }, [startListening]);

  React.useEffect(() => {
    const handleOpenTrigger = () => {
      handleOpenVoiceWidget();
    };

    window.addEventListener('billpilot:open-voice' as any, handleOpenTrigger);
    return () => window.removeEventListener('billpilot:open-voice' as any, handleOpenTrigger);
  }, [handleOpenVoiceWidget]);

  const handleLanguageChange = (newLang: LanguageCode) => {
    stopAllAudio();
    stopListening(true);
    setSelectedLang(newLang);
    selectedLangRef.current = newLang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('billpilot_selected_lang', newLang);
    }
    setTimeout(() => {
      if (isOpenRef.current) {
        manualStopRef.current = false;
        startListening();
      }
    }, 200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    accumulatedFinalRef.current = '';
    setTranscript(inputText);
    handleProcessCommand(inputText);
    setInputText('');
  };

  const handleClose = () => {
    stopAllAudio();
    stopListening(true);
    setIsDocked(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdownSeconds(null);
    setIsOpen(false);
    isOpenRef.current = false;
    // When closed, calmly re-arm background wake radar after 1 second if enabled
    if (wakeRadarEnabledRef.current) {
      setTimeout(() => {
        manualStopRef.current = false;
        startListening();
      }, 1000);
    }
  };

  return (
    <>
      {/* 1. Persistent Floating Voice Action Pill with Manual Open Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          onClick={handleOpenVoiceWidget}
          className="group flex items-center gap-2.5 rounded-full bg-[#0066FF] px-4 py-3 text-white shadow-xl shadow-blue-500/30 hover:bg-[#0052CC] active:scale-95 transition-all cursor-pointer border border-[#BAE0FF]/40"
          title={`Open ollaiBooks AI Voice in ${currentLangConfig.nativeName} · Manual Control`}
        >
          <div className="relative flex h-5 w-5 items-center justify-center">
            {isListening ? (
              <Mic className="h-4 w-4 text-white animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="h-4 w-4 text-white animate-pulse" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="block text-xs font-bold tracking-tight">
                Open AI Voice Agent
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                VOICE AI
              </span>
            </div>
            <span className="block text-[9px] text-blue-100 font-medium leading-none mt-0.5">
              {currentLangConfig.nativeName} · Manual Pause & Open
            </span>
          </div>
        </button>
      </div>

      {/* 2. On-Screen Execution Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-2 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2.5 text-xs font-bold text-[#059669] shadow-lg animate-pop-in">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Interactive Multi-Language Autonomous Agent Modal / Docked Assistant */}
      {isOpen && (
        <div
          className={
            isDocked
              ? 'fixed bottom-5 right-5 z-50 w-full max-w-md shadow-2xl animate-pop-in pointer-events-auto'
              : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-pop-in'
          }
        >
          <div className={`w-full ${isDocked ? 'max-w-md border-2 border-blue-500/80 ring-2 ring-blue-500/20' : 'max-w-lg border border-slate-200'} rounded-2xl bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto`}>
            {/* CLEAN 2-TIER HEADER: Zero wrapping, zero squishing */}
            <div className="border-b border-slate-100 pb-3 dark:border-slate-800 space-y-2">
              {/* Row 1: Brand Logo + Single Line Title + Window Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      ollaiBooks AI Voice Agent
                    </h3>
                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                      <Cpu className="h-2.5 w-2.5 text-blue-600" />
                      NVIDIA
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Hands-Free Wake Radar Toggle Pill */}
                  <button
                    type="button"
                    onClick={() => setWakeRadarEnabled(!wakeRadarEnabled)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                      wakeRadarEnabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                    title="Toggle hands-free background wake-word detection (Say 'Hey ollaiBooks' anytime)"
                  >
                    <Radio className={`h-3 w-3 ${wakeRadarEnabled ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                    <span>Radar: {wakeRadarEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Dock / Undock Button */}
                  <button
                    type="button"
                    onClick={() => setIsDocked(!isDocked)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                    title={isDocked ? 'Expand to Full Modal' : 'Dock to Corner (View Webpage)'}
                  >
                    {isDocked ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                  </button>

                  {/* Voice Mute Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      stopAllAudio();
                      setVoiceMuted(!voiceMuted);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                      voiceMuted
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={voiceMuted ? 'Voice Muted' : 'Voice Active (HD Voice Output)'}
                  >
                    {voiceMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-blue-600" />}
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Subtitle & Language Selector */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <p className="text-[11px] text-slate-500 truncate">
                  Wake word: <span className="font-semibold text-slate-700 dark:text-slate-300">"Hey ollaiBooks"</span> · Auto-pauses on silence
                </p>
                <div className="relative flex-shrink-0">
                  <select
                    value={selectedLang}
                    onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                    className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {INDIAN_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Central Volume-Reactive Animated Mic Sphere */}
            <div className="my-5 flex flex-col items-center justify-center text-center">
              <div className="relative flex items-center justify-center">
                {/* Shockwave Rings ONLY appear when user is actively speaking */}
                {isListening && isUserSpeaking && (
                  <>
                    <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                    <div className="absolute -inset-1.5 rounded-full bg-rose-500/30 animate-pulse pointer-events-none" />
                  </>
                )}
                {isSpeaking && (
                  <>
                    <div className="absolute -inset-3 rounded-full bg-emerald-500/15 animate-pulse pointer-events-none" />
                    <div className="absolute -inset-1.5 rounded-full bg-emerald-500/25 pointer-events-none" />
                  </>
                )}

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                    isListening
                      ? isUserSpeaking
                        ? 'bg-rose-600 scale-108 shadow-rose-500/50 ring-4 ring-rose-300'
                        : 'bg-rose-600 shadow-rose-500/30 ring-2 ring-rose-200/50'
                      : isSpeaking
                      ? 'bg-emerald-600 shadow-emerald-500/40 ring-4 ring-emerald-200/80'
                      : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700 hover:scale-105'
                  }`}
                  title={isListening ? 'Click to stop recording & execute immediately (ChatGPT Style)' : 'Click mic to speak'}
                >
                  {isListening ? (
                    <Square className="h-6 w-6 fill-white text-white rounded-xs" />
                  ) : isSpeaking ? (
                    <Volume2 className="h-6 w-6 text-white" />
                  ) : (
                    <Mic className="h-6 w-6 text-white" />
                  )}
                </button>
              </div>

              {/* Status Notice with Fixed Min-Height */}
              <div className="mt-3.5 flex flex-col items-center justify-center min-h-[44px]">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {isListening
                    ? currentLangConfig.listeningNotice
                    : isSpeaking
                    ? currentLangConfig.speakingNotice
                    : `Speak in ${currentLangConfig.nativeName} or choose a quick action`}
                </p>
                {isListening && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold mt-1">
                    <span className={`h-2 w-2 rounded-full ${isUserSpeaking ? 'bg-rose-500 animate-pulse' : 'bg-rose-300'}`} />
                    <span className={isUserSpeaking ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                      {isUserSpeaking ? 'Voice detected · Listening...' : 'Recording active · Speak freely, click Stop when done'}
                    </span>
                  </span>
                )}
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    HD Voice Output ({currentLangConfig.nativeName})
                  </span>
                )}
              </div>

              {/* Real-Time Web Audio Frequency Waveform (Directly samples mic decibels & frequency) */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 h-10">
                {audioBands.map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isUserSpeaking
                        ? 'bg-rose-500 shadow-xs shadow-rose-500/60'
                        : isListening
                        ? 'bg-rose-300/40'
                        : isSpeaking
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    style={{
                      height: isListening ? `${h}px` : isSpeaking ? '14px' : '4px',
                    }}
                  />
                ))}
              </div>

              {/* Pause Detection & Silence Auto-Execution Countdown */}
              {isListening && isDebouncingAutoExec && countdownSeconds !== null && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-in fade-in">
                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                  <span>Pause detected · Executing in {countdownSeconds}s...</span>
                </div>
              )}

              {/* ChatGPT Style Dedicated Stop & Execute Button */}
              {isListening && (
                <div className="mt-3 flex items-center justify-center gap-2 w-full animate-pop-in">
                  <button
                    type="button"
                    onClick={handleStopAndExecute}
                    className="w-full max-w-sm py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-rose-400/30"
                  >
                    <Square className="h-4 w-4 fill-white" />
                    <span>Stop Recording & Execute Work</span>
                  </button>
                </div>
              )}

              {/* Live Speech Transcript */}
              {transcript && (
                <div className="mt-3.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 animate-pop-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-600">You said ({currentLangConfig.nativeName}):</span>
                    <div className="flex items-center gap-1.5">
                      {isListening ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Listening live
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold">Captured</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          accumulatedFinalRef.current = '';
                          setTranscript('');
                          transcriptRef.current = '';
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition cursor-pointer"
                        title="Clear captured speech"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">&quot;{transcript}&quot;</p>
                </div>
              )}

              {/* AI Voice Answer in Native Script */}
              {aiSpeechText && (
                <div className="mt-2.5 w-full rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-left text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 animate-pop-in">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-700">
                      AI Agent Replied ({currentLangConfig.nativeName}):
                    </span>
                    <span className="text-[9px] font-semibold text-blue-500 bg-blue-100/60 px-1.5 py-0.5 rounded">
                      HD Voice Audio Active
                    </span>
                  </div>
                  <p className="leading-relaxed">"{aiSpeechText}"</p>
                </div>
              )}

              {/* INTERACTIVE AGENT PROCEED CONFIRMATION CARD (CUSTOMER / PAYMENT / INVOICE) */}
              {pendingConfirmation && pendingConfirmation.type === 'CUSTOMER' && (
                <div className="mt-3 w-full rounded-2xl border-2 border-blue-300 bg-blue-50/90 p-4 text-left shadow-md animate-pop-in">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-blue-700 animate-pulse" />
                      <span className="text-xs font-bold text-blue-950">
                        Agent Confirmation · Speak &quot;Yes&quot; or &quot;No&quot;
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-200/70 px-2 py-0.5 rounded-full">
                      CRM Sync Ready
                    </span>
                  </div>

                  {pendingConfirmation.missingFields && pendingConfirmation.missingFields.length > 0 && (
                    <div className="mb-2.5 rounded-lg border border-blue-300 bg-blue-100/70 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-blue-900 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 animate-pulse" />
                      <span>
                        <strong>Auto-completed details:</strong> {pendingConfirmation.missingFields.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-2.5 rounded-xl border border-blue-200/80 mb-3">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Customer Name</span>
                      <span className="font-bold text-slate-900 truncate block">{pendingConfirmation.customerName || 'Tata Motors'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Phone</span>
                      <span className="font-bold text-slate-900">{pendingConfirmation.phone || '+91 98765 43210'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Email</span>
                      <span className="font-medium text-slate-700 truncate block">{pendingConfirmation.email || 'billing@tatamotors.com'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">City & State</span>
                      <span className="font-bold text-blue-700">{pendingConfirmation.billingCity || 'Mumbai'}, {pendingConfirmation.billingState || 'Maharashtra'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmProceed}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Yes, Add Customer to CRM
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProceed}
                      className="py-2 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel / No
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Two-Way Voice Active · Speak &quot;Yes&quot;, &quot;Proceed&quot;, or &quot;No&quot;</span>
                  </div>
                </div>
              )}

              {pendingConfirmation && pendingConfirmation.type === 'PAYMENT' && (
                <div className="mt-3 w-full rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 p-4 text-left shadow-md animate-pop-in">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-emerald-700 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-950">
                        Agent Confirmation · Speak &quot;Yes&quot; or &quot;No&quot;
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                      Ledger Settlement Ready
                    </span>
                  </div>

                  {pendingConfirmation.missingFields && pendingConfirmation.missingFields.length > 0 && (
                    <div className="mb-2.5 rounded-lg border border-emerald-300 bg-emerald-100/70 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-emerald-900 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 animate-pulse" />
                      <span>
                        <strong>Auto-completed details:</strong> {pendingConfirmation.missingFields.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-2.5 rounded-xl border border-emerald-200/80 mb-3">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Customer</span>
                      <span className="font-bold text-slate-900 truncate block">{pendingConfirmation.customerName || 'Acme Traders Ltd'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Payment Amount</span>
                      <span className="font-extrabold text-emerald-700">₹{(pendingConfirmation.amount || pendingConfirmation.baseAmount || 25000).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Payment Method</span>
                      <span className="font-bold text-blue-700">{pendingConfirmation.paymentMethod || 'UPI'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Invoice Status</span>
                      <span className="font-bold text-emerald-600">Mark as Paid</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmProceed}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Yes, Record Payment & Settle
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProceed}
                      className="py-2 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel / No
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Two-Way Voice Active · Speak &quot;Yes&quot;, &quot;Proceed&quot;, or &quot;No&quot;</span>
                  </div>
                </div>
              )}

              {pendingConfirmation && pendingConfirmation.type === 'PRODUCT' && (
                <div className="mt-3 w-full rounded-2xl border-2 border-purple-300 bg-purple-50/90 p-4 text-left shadow-md animate-pop-in">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-purple-700 animate-pulse" />
                      <span className="text-xs font-bold text-purple-950">
                        Agent Confirmation · Speak &quot;Yes&quot; or &quot;No&quot;
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-200/70 px-2 py-0.5 rounded-full">
                      Catalog Ready
                    </span>
                  </div>

                  {pendingConfirmation.missingFields && pendingConfirmation.missingFields.length > 0 && (
                    <div className="mb-2.5 rounded-lg border border-purple-300 bg-purple-100/70 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-purple-900 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 animate-pulse" />
                      <span>
                        <strong>Auto-completed details:</strong> {pendingConfirmation.missingFields.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-2.5 rounded-xl border border-purple-200/80 mb-3">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Product or Service</span>
                      <span className="font-bold text-slate-900 truncate block">{pendingConfirmation.name || 'Enterprise Cloud Consulting'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Unit Price</span>
                      <span className="font-extrabold text-purple-700">₹{(pendingConfirmation.unitPrice || pendingConfirmation.baseAmount || 25000).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">GST Slab</span>
                      <span className="font-bold text-blue-700">{pendingConfirmation.taxRate || 18}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">HSN / SAC</span>
                      <span className="font-bold text-slate-700">{pendingConfirmation.hsnCode || '998314'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmProceed}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Yes, Add Product to Catalog
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProceed}
                      className="py-2 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel / No
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Two-Way Voice Active · Speak &quot;Yes&quot;, &quot;Proceed&quot;, or &quot;No&quot;</span>
                  </div>
                </div>
              )}

              {pendingConfirmation && (!pendingConfirmation.type || pendingConfirmation.type === 'INVOICE') && (
                <div className="mt-3 w-full rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 text-left shadow-md animate-pop-in">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-amber-700 animate-pulse" />
                      <span className="text-xs font-bold text-amber-950">
                        Agent Confirmation · Speak &quot;Yes&quot; or &quot;No&quot;
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                      Auto-Calculated GST
                    </span>
                  </div>

                  {pendingConfirmation.missingFields && pendingConfirmation.missingFields.length > 0 && (
                    <div className="mb-2.5 rounded-lg border border-amber-300 bg-amber-100/70 px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 animate-pulse" />
                      <span>
                        <strong>Auto-completed details:</strong> {pendingConfirmation.missingFields.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-2.5 rounded-xl border border-amber-200/80 mb-3">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Customer</span>
                      <span className="font-bold text-slate-900 truncate block">{pendingConfirmation.customerName || 'TechNova Solutions'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Base Amount</span>
                      <span className="font-bold text-slate-900">₹{(pendingConfirmation.baseAmount || 25000).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">GST ({pendingConfirmation.taxRate || 18}%)</span>
                      <span className="font-bold text-blue-700">₹{(pendingConfirmation.taxAmount || 4500).toLocaleString('en-IN')} (CGST+SGST)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Total Payable</span>
                      <span className="font-extrabold text-emerald-700">₹{(pendingConfirmation.grandTotal || 29500).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmProceed}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Yes, Proceed & Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProceed}
                      className="py-2 px-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel / No
                    </button>
                  </div>
                </div>
              )}

              {/* AUTONOMOUS AGENT AUTOMATION PIPELINE CARD */}
              {agentPipeline.length > 0 && (
                <div className="mt-3 w-full rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-left dark:border-indigo-900/50 dark:bg-indigo-950/30 animate-pop-in">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
                        Autonomous Agent Execution Pipeline
                      </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      {agentProvider}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {agentPipeline.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{step.title}: </span>
                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">{step.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Execution Confirmation in Native Script */}
              {actionStatus?.executed && (
                <div className="mt-2.5 w-full flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-left text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 animate-pop-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{currentLangConfig.workDoneLabel}: {actionStatus.text}</span>
                </div>
              )}
            </div>

            {/* Quick Voice Command Chips in Selected Language */}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  QUICK AGENT DIRECTIVES ({currentLangConfig.nativeName.toUpperCase()})
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <Clock className="h-2.5 w-2.5" />
                  Auto-Pause on silence
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentLangConfig.quickCommands.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      accumulatedFinalRef.current = '';
                      setTranscript(item.cmd);
                      handleProcessCommand(item.cmd);
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all text-left dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  >
                    ⚡ {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input Fallback in Native Script or English */}
            <form onSubmit={handleManualSubmit} className="mt-3.5 flex items-center gap-2">
              <input
                type="text"
                placeholder={currentLangConfig.placeholder}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span>{currentLangConfig.executeLabel}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
