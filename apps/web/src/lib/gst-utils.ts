/**
 * Indian GST Statutory Utilities & Standards (CGST Act & Rules, 2017)
 */

export interface GstStateInfo {
  code: string;
  name: string;
}

// 1. Complete Official State & Union Territory GST State Codes (2-Digit)
export const GST_STATE_CODES: Record<string, GstStateInfo> = {
  'jammu and kashmir': { code: '01', name: 'Jammu and Kashmir' },
  'himachal pradesh': { code: '02', name: 'Himachal Pradesh' },
  punjab: { code: '03', name: 'Punjab' },
  chandigarh: { code: '04', name: 'Chandigarh' },
  uttarakhand: { code: '05', name: 'Uttarakhand' },
  haryana: { code: '06', name: 'Haryana' },
  delhi: { code: '07', name: 'Delhi' },
  rajasthan: { code: '08', name: 'Rajasthan' },
  'uttar pradesh': { code: '09', name: 'Uttar Pradesh' },
  bihar: { code: '10', name: 'Bihar' },
  sikkim: { code: '11', name: 'Sikkim' },
  'arunachal pradesh': { code: '12', name: 'Arunachal Pradesh' },
  nagaland: { code: '13', name: 'Nagaland' },
  manipur: { code: '14', name: 'Manipur' },
  mizoram: { code: '15', name: 'Mizoram' },
  tripura: { code: '16', name: 'Tripura' },
  meghalaya: { code: '17', name: 'Meghalaya' },
  assam: { code: '18', name: 'Assam' },
  'west bengal': { code: '19', name: 'West Bengal' },
  jharkhand: { code: '20', name: 'Jharkhand' },
  odisha: { code: '21', name: 'Odisha' },
  chhattisgarh: { code: '22', name: 'Chhattisgarh' },
  'madhya pradesh': { code: '23', name: 'Madhya Pradesh' },
  gujarat: { code: '24', name: 'Gujarat' },
  'daman and diu': { code: '25', name: 'Daman and Diu' },
  'dadra and nagar haveli and daman and diu': { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  maharashtra: { code: '27', name: 'Maharashtra' },
  karnataka: { code: '29', name: 'Karnataka' },
  goa: { code: '30', name: 'Goa' },
  lakshadweep: { code: '31', name: 'Lakshadweep' },
  kerala: { code: '32', name: 'Kerala' },
  'tamil nadu': { code: '33', name: 'Tamil Nadu' },
  puducherry: { code: '34', name: 'Puducherry' },
  'andaman and nicobar islands': { code: '35', name: 'Andaman and Nicobar Islands' },
  telangana: { code: '36', name: 'Telangana' },
  'andhra pradesh': { code: '37', name: 'Andhra Pradesh' },
  ladakh: { code: '38', name: 'Ladakh' },
  'other territory': { code: '97', name: 'Other Territory' },
  'centre jurisdiction': { code: '99', name: 'Centre Jurisdiction' },
};

// Sorted list for UI dropdowns & datalists
export const INDIAN_GST_STATES: GstStateInfo[] = Object.values(GST_STATE_CODES).sort((a, b) =>
  a.name.localeCompare(b.name),
);

const CODE_TO_STATE: Record<string, GstStateInfo> = Object.values(GST_STATE_CODES).reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<string, GstStateInfo>,
);

// Common abbreviations, legacy names, alternate spellings & major city hints
const GST_STATE_ALIASES: Record<string, string> = {
  jk: '01', 'j&k': '01', 'jammu & kashmir': '01', 'jammu kashmir': '01', srinagar: '01', jammu: '01',
  hp: '02', shimla: '02',
  pb: '03', ludhiana: '03', amritsar: '03', jalandhar: '03',
  ch: '04',
  uk: '05', ut: '05', uttaranchal: '05', dehradun: '05',
  hr: '06', gurgaon: '06', gurugram: '06', faridabad: '06',
  dl: '07', 'new delhi': '07', 'nct of delhi': '07', 'delhi ncr': '07',
  rj: '08', jaipur: '08', udaipur: '08', jodhpur: '08',
  up: '09', lucknow: '09', noida: '09', kanpur: '09', varanasi: '09', agra: '09',
  br: '10', patna: '10',
  sk: '11', gangtok: '11',
  ar: '12', itanagar: '12',
  nl: '13', kohima: '13', dimapur: '13',
  mn: '14', imphal: '14',
  mz: '15', aizawl: '15',
  tr: '16', agartala: '16',
  ml: '17', shillong: '17',
  as: '18', guwahati: '18',
  wb: '19', kolkata: '19', calcutta: '19', howrah: '19', siliguri: '19',
  jh: '20', ranchi: '20', jamshedpur: '20',
  or: '21', od: '21', orissa: '21', bhubaneswar: '21', cuttack: '21',
  cg: '22', chhatisgarh: '22', raipur: '22',
  mp: '23', bhopal: '23', indore: '23',
  gj: '24', ahmedabad: '24', surat: '24', vadodara: '24', rajkot: '24',
  dd: '25', 'daman & diu': '25', daman: '25', diu: '25',
  dn: '26', dnhdd: '26', 'dadra and nagar haveli': '26', 'dadra & nagar haveli': '26', 'dadra & nagar haveli and daman & diu': '26', silvassa: '26',
  mh: '27', mumbai: '27', pune: '27', nagpur: '27', thane: '27', nashik: '27',
  ka: '29', bengaluru: '29', bangalore: '29', mysuru: '29', mysore: '29', mangaluru: '29',
  ga: '30', panaji: '30', margao: '30',
  ld: '31', kavaratti: '31',
  kl: '32', kochi: '32', cochin: '32', thiruvananthapuram: '32', trivandrum: '32', kozhikode: '32',
  tn: '33', tamilnadu: '33', chennai: '33', madras: '33', coimbatore: '33', madurai: '33', salem: '33', tiruchirappalli: '33', trichy: '33',
  py: '34', pondicherry: '34', puduchery: '34',
  an: '35', 'andaman & nicobar': '35', 'andaman and nicobar': '35', 'andaman & nicobar islands': '35', 'port blair': '35',
  ts: '36', tg: '36', telengana: '36', hyderabad: '36', secunderabad: '36', warangal: '36',
  ap: '37', 'andhra': '37', visakhapatnam: '37', vizag: '37', vijayawada: '37', tirupati: '37',
  la: '38', leh: '38', kargil: '38',
};

const SORTED_STATE_KEYS = Object.keys(GST_STATE_CODES).sort((a, b) => b.length - a.length);
const SORTED_ALIAS_KEYS = Object.keys(GST_STATE_ALIASES).sort((a, b) => b.length - a.length);

export function detectGstState(
  stateNameOrGstin?: string | null,
  fallbackGstin?: string | null,
): (GstStateInfo & { matched: boolean }) | null {
  const tryDetect = (raw?: string | null): (GstStateInfo & { matched: boolean }) | null => {
    if (!raw || !raw.trim()) return null;
    const trimmed = raw.trim();

    // 1. Exact 2-digit state code or GSTIN prefix (e.g. "33", "33ABCDE1234F1Z5", "Tamil Nadu (33)")
    const gstinMatch = trimmed.match(/\b(\d{2})[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b/i)
      // Bare "33" or "33 - Tamil Nadu" only. "12 Anna Salai" is a door number, not state code 12.
      || trimmed.match(/^(\d{2})(?:\s*[-–:]\s*[a-z][a-z .&]*)?$/i)
      || trimmed.match(/\((\d{2})\)/);
    if (gstinMatch) {
      const state = CODE_TO_STATE[gstinMatch[1]];
      if (state) return { ...state, matched: true };
    }

    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

    // 2. Exact state name match
    if (GST_STATE_CODES[normalized]) {
      return { ...GST_STATE_CODES[normalized], matched: true };
    }

    // 3. Exact alias / abbreviation / city match
    if (GST_STATE_ALIASES[normalized]) {
      const state = CODE_TO_STATE[GST_STATE_ALIASES[normalized]];
      if (state) return { ...state, matched: true };
    }

    // 4. Full state name substring match (longest first)
    for (const key of SORTED_STATE_KEYS) {
      if (normalized.includes(key)) {
        return { ...GST_STATE_CODES[key], matched: true };
      }
    }

    // 5. Word-boundary alias / city match in addresses (e.g. "12 Anna Salai, Chennai, TN")
    for (const alias of SORTED_ALIAS_KEYS) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalized)) {
        const state = CODE_TO_STATE[GST_STATE_ALIASES[alias]];
        if (state) return { ...state, matched: true };
      }
    }

    return null;
  };

  return tryDetect(stateNameOrGstin) || tryDetect(fallbackGstin);
}

export function getGstStateDetails(
  stateNameOrGstin?: string | null,
  fallbackGstin?: string | null,
): GstStateInfo {
  const detected = detectGstState(stateNameOrGstin, fallbackGstin);
  if (detected) return { code: detected.code, name: detected.name };
  if (!stateNameOrGstin || !stateNameOrGstin.trim()) return { code: '29', name: 'Karnataka' };
  return { code: '', name: stateNameOrGstin.trim() };
}

export function isInterstateGst(
  sellerStateOrGstin?: string | null,
  buyerStateOrGstin?: string | null,
  sellerGstin?: string | null,
  buyerGstin?: string | null,
): boolean {
  const seller = detectGstState(sellerStateOrGstin, sellerGstin);
  const buyer = detectGstState(buyerStateOrGstin, buyerGstin);
  if (!seller || !buyer) return false;
  return seller.code !== buyer.code;
}

// 2. Indian Currency Number-to-Words Converter (Crores, Lakhs, Thousands, Hundreds)
const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + ' ';
  }
  return str.trim();
}

export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';

  const absNum = Math.abs(num);
  const rupees = Math.floor(absNum);
  const paise = Math.round((absNum - rupees) * 100);

  let remaining = rupees;
  let words = '';

  // Crores (1,00,00,000)
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    words += convertBelowThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (1,00,000)
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    words += convertBelowThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (1,000)
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    words += convertBelowThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // Hundreds & Below
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  let result = words.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertBelowThousand(paise) + ' Paise';
  }

  return result.trim() + ' Only';
}

// 3. Indian Currency Formatter (₹)
export function formatIndianCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// 4. Generate Standard NPCI UPI URI
export function generateUpiUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
}): string {
  const { upiId, payeeName, amount, invoiceNumber } = params;
  const cleanUpi = upiId?.trim() || 'acme@hdfcbank';
  const cleanName = encodeURIComponent(payeeName?.trim() || 'Acme Corporation');
  const cleanNote = encodeURIComponent(`Invoice ${invoiceNumber || 'Tax-Invoice'}`);
  const formattedAmt = Number(amount || 0).toFixed(2);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmt}&cu=INR&tn=${cleanNote}`;
}
