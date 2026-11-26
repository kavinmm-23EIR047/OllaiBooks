/**
 * Indian GST Statutory Utilities & Standards (CGST Act & Rules, 2017)
 */

// 1. Official State & Union Territory GST State Codes (2-Digit)
export const GST_STATE_CODES: Record<string, { code: string; name: string }> = {
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
  maharashtra: { code: '27', name: 'Maharashtra' },
  karnataka: { code: '29', name: 'Karnataka' },
  goa: { code: '30', name: 'Goa' },
  kerala: { code: '32', name: 'Kerala' },
  'tamil nadu': { code: '33', name: 'Tamil Nadu' },
  puducherry: { code: '34', name: 'Puducherry' },
  telangana: { code: '36', name: 'Telangana' },
  'andhra pradesh': { code: '37', name: 'Andhra Pradesh' },
  ladakh: { code: '38', name: 'Ladakh' },
};

export function getGstStateDetails(stateNameOrGstin?: string): { code: string; name: string } {
  if (!stateNameOrGstin) return { code: '29', name: 'Karnataka' };

  // If first 2 characters of a GSTIN are digits (e.g. "29ABCDE1234F1Z5")
  const gstinMatch = stateNameOrGstin.trim().match(/^(\d{2})/);
  if (gstinMatch) {
    const code = gstinMatch[1];
    const found = Object.values(GST_STATE_CODES).find((s) => s.code === code);
    if (found) return found;
  }

  const normalized = stateNameOrGstin.toLowerCase().trim();
  if (GST_STATE_CODES[normalized]) {
    return GST_STATE_CODES[normalized];
  }

  // Substring match
  const match = Object.entries(GST_STATE_CODES).find(([key]) => normalized.includes(key));
  if (match) return match[1];

  return { code: '29', name: stateNameOrGstin };
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

