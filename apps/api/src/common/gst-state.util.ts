export interface GstStateInfo {
  code: string;
  name: string;
}

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

const CODE_TO_STATE: Record<string, GstStateInfo> = Object.values(GST_STATE_CODES).reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<string, GstStateInfo>,
);

const GST_STATE_ALIASES: Record<string, string> = {
  jk: '01', 'j&k': '01', 'jammu & kashmir': '01', 'jammu kashmir': '01',
  hp: '02', pb: '03', ch: '04', uk: '05', ut: '05', uttaranchal: '05', hr: '06',
  dl: '07', 'new delhi': '07', 'nct of delhi': '07', rj: '08', up: '09', br: '10',
  sk: '11', ar: '12', nl: '13', mn: '14', mz: '15', tr: '16', ml: '17', as: '18',
  wb: '19', jh: '20', or: '21', od: '21', orissa: '21', cg: '22', chhatisgarh: '22',
  mp: '23', gj: '24', dd: '25', 'daman & diu': '25',
  dn: '26', dnhdd: '26', 'dadra and nagar haveli': '26', 'dadra & nagar haveli': '26',
  mh: '27', ka: '29', ga: '30', ld: '31', kl: '32', tn: '33', tamilnadu: '33',
  py: '34', pondicherry: '34', an: '35', 'andaman & nicobar': '35', 'andaman and nicobar': '35',
  ts: '36', tg: '36', telengana: '36', ap: '37', la: '38',
};

const SORTED_STATE_KEYS = Object.keys(GST_STATE_CODES).sort((a, b) => b.length - a.length);
const SORTED_ALIAS_KEYS = Object.keys(GST_STATE_ALIASES).sort((a, b) => b.length - a.length);

export function detectGstState(
  stateNameOrGstin?: string | null,
  fallbackGstin?: string | null,
): GstStateInfo | null {
  const tryDetect = (raw?: string | null): GstStateInfo | null => {
    if (!raw || !raw.trim()) return null;
    const trimmed = raw.trim();
    const gstinMatch = trimmed.match(/\b(\d{2})[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b/i)
      // Bare "33" or "33 - Tamil Nadu" only. "12 Anna Salai" is a door number, not state code 12.
      || trimmed.match(/^(\d{2})(?:\s*[-–:]\s*[a-z][a-z .&]*)?$/i)
      || trimmed.match(/\((\d{2})\)/);
    if (gstinMatch && CODE_TO_STATE[gstinMatch[1]]) {
      return CODE_TO_STATE[gstinMatch[1]];
    }

    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    if (GST_STATE_CODES[normalized]) return GST_STATE_CODES[normalized];
    if (GST_STATE_ALIASES[normalized]) return CODE_TO_STATE[GST_STATE_ALIASES[normalized]] || null;

    for (const key of SORTED_STATE_KEYS) {
      if (normalized.includes(key)) return GST_STATE_CODES[key];
    }
    for (const alias of SORTED_ALIAS_KEYS) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalized)) {
        return CODE_TO_STATE[GST_STATE_ALIASES[alias]] || null;
      }
    }
    return null;
  };

  return tryDetect(stateNameOrGstin) || tryDetect(fallbackGstin);
}

export function isInterstateSupply(
  sellerState?: string | null,
  sellerGstin?: string | null,
  buyerState?: string | null,
  buyerGstin?: string | null,
): boolean {
  const seller = detectGstState(sellerState, sellerGstin);
  const buyer = detectGstState(buyerState, buyerGstin);
  if (seller && buyer) {
    return seller.code !== buyer.code;
  }
  if (!sellerState || !buyerState) return false;
  return sellerState.trim().toLocaleLowerCase() !== buyerState.trim().toLocaleLowerCase();
}
