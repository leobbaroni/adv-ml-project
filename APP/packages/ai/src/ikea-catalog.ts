// IKEA Portugal product catalog for common rental-property items.
// Prices are approximate IKEA Portugal retail prices (EUR) as of 2025.
// Article numbers are the 8-digit IKEA catalog codes (xxx.xxx.xx format).

export interface IkeaProduct {
  name: string;
  articleNumber: string;
  category: string;
  unitPrice: number;
  unit: string; // e.g. "each", "pack of 6"
}

export const ikeaCatalog: IkeaProduct[] = [
  // Glasses / Cups
  { name: 'GODIS glass', articleNumber: '803.607.04', category: 'glass', unitPrice: 1.99, unit: 'each' },
  { name: 'POKAL glass', articleNumber: '304.125.54', category: 'glass', unitPrice: 1.49, unit: 'each' },
  { name: 'REKO glass', articleNumber: '604.141.83', category: 'glass', unitPrice: 2.99, unit: 'pack of 6' },
  { name: 'STORSINT glass', articleNumber: '803.981.21', category: 'glass', unitPrice: 2.99, unit: 'each' },

  // Mugs
  { name: '365+ mug', articleNumber: '302.783.53', category: 'mug', unitPrice: 3.99, unit: 'each' },
  { name: 'VARDAGEN mug', articleNumber: '603.247.96', category: 'mug', unitPrice: 2.99, unit: 'each' },

  // Plates / Bowls
  { name: 'OFTAST plate', articleNumber: '303.189.40', category: 'plate', unitPrice: 1.49, unit: 'each' },
  { name: 'FLITIGHET bowl', articleNumber: '803.189.35', category: 'bowl', unitPrice: 1.99, unit: 'each' },
  { name: 'OFTAST bowl', articleNumber: '903.189.38', category: 'bowl', unitPrice: 1.49, unit: 'each' },

  // Cutlery
  { name: 'MOPSIG cutlery set', articleNumber: '903.608.63', category: 'cutlery', unitPrice: 14.99, unit: '16-piece set' },
  { name: 'FLATWARE set', articleNumber: '704.525.96', category: 'cutlery', unitPrice: 9.99, unit: '16-piece set' },

  // Towels
  { name: 'VÅGSJÖN bath towel', articleNumber: '404.880.91', category: 'towel', unitPrice: 5.99, unit: 'each' },
  { name: 'VÅGSJÖN hand towel', articleNumber: '304.880.92', category: 'towel', unitPrice: 3.99, unit: 'each' },
  { name: 'VÅGSJÖN guest towel', articleNumber: '104.880.93', category: 'towel', unitPrice: 1.99, unit: 'each' },
  { name: 'HIMLEÅN bath towel', articleNumber: '604.437.84', category: 'towel', unitPrice: 7.99, unit: 'each' },

  // Bed frames
  { name: 'MALM bed frame', articleNumber: '190.274.89', category: 'bed', unitPrice: 149.00, unit: 'each' },
  { name: 'BRIMNES bed frame', articleNumber: '490.274.92', category: 'bed', unitPrice: 179.00, unit: 'each' },
  { name: 'NEIDEN bed frame', articleNumber: '603.952.26', category: 'bed', unitPrice: 79.00, unit: 'each' },
  { name: 'SLATTUM upholstered bed', articleNumber: '704.587.69', category: 'bed', unitPrice: 129.00, unit: 'each' },

  // Mattresses
  { name: 'VADSO spring mattress', articleNumber: '302.723.05', category: 'mattress', unitPrice: 89.00, unit: 'each' },
  { name: 'HASVÅG spring mattress', articleNumber: '204.607.05', category: 'mattress', unitPrice: 129.00, unit: 'each' },
  { name: 'MORGEDAL foam mattress', articleNumber: '102.723.07', category: 'mattress', unitPrice: 149.00, unit: 'each' },
  { name: 'VESTERÖY pocket mattress', articleNumber: '904.700.46', category: 'mattress', unitPrice: 199.00, unit: 'each' },

  // Bedding
  { name: 'DVALA fitted sheet', articleNumber: '803.573.49', category: 'bedding', unitPrice: 14.99, unit: 'each' },
  { name: 'DVALA duvet cover', articleNumber: '903.573.48', category: 'bedding', unitPrice: 19.99, unit: 'each' },
  { name: 'DVALA pillowcase', articleNumber: '003.573.50', category: 'bedding', unitPrice: 4.99, unit: 'each' },
  { name: 'ULLVIDE fitted sheet', articleNumber: '904.425.59', category: 'bedding', unitPrice: 24.99, unit: 'each' },

  // Duvets / Pillows
  { name: 'GRUSBLAD duvet', articleNumber: '704.578.00', category: 'duvet', unitPrice: 29.99, unit: 'each' },
  { name: 'SÄNGLÄRKA duvet', articleNumber: '004.566.08', category: 'duvet', unitPrice: 19.99, unit: 'each' },
  { name: 'GULKAVLE pillow', articleNumber: '304.605.12', category: 'pillow', unitPrice: 9.99, unit: 'each' },
  { name: 'LUNDTRAV pillow', articleNumber: '704.605.13', category: 'pillow', unitPrice: 7.99, unit: 'each' },

  // Storage
  { name: 'KALLAX shelf unit', articleNumber: '702.758.44', category: 'storage', unitPrice: 49.00, unit: 'each' },
  { name: 'KALLAX shelf unit 2x2', articleNumber: '802.758.87', category: 'storage', unitPrice: 39.00, unit: 'each' },
  { name: 'BILLY bookcase', articleNumber: '002.638.50', category: 'storage', unitPrice: 59.00, unit: 'each' },
  { name: 'MALM chest of drawers', articleNumber: '803.546.46', category: 'storage', unitPrice: 99.00, unit: 'each' },
  { name: 'RÅSKOG trolley', articleNumber: '502.165.35', category: 'storage', unitPrice: 39.99, unit: 'each' },

  // Lighting
  { name: 'TERTIAL work lamp', articleNumber: '603.554.23', category: 'lighting', unitPrice: 9.99, unit: 'each' },
  { name: 'NOT floor lamp', articleNumber: '700.963.77', category: 'lighting', unitPrice: 12.99, unit: 'each' },
  { name: 'SOLHETTA LED bulb', articleNumber: '904.352.09', category: 'lighting', unitPrice: 3.99, unit: 'each' },

  // Chairs
  { name: 'MARIUS stool', articleNumber: '001.768.95', category: 'chair', unitPrice: 7.99, unit: 'each' },
  { name: 'ADDE chair', articleNumber: '902.142.85', category: 'chair', unitPrice: 12.99, unit: 'each' },
  { name: 'TEODORES chair', articleNumber: '803.636.23', category: 'chair', unitPrice: 29.99, unit: 'each' },

  // Tables
  { name: 'LACK side table', articleNumber: '200.114.13', category: 'table', unitPrice: 9.99, unit: 'each' },
  { name: 'LACK coffee table', articleNumber: '001.042.91', category: 'table', unitPrice: 24.99, unit: 'each' },
  { name: 'INGATORP table', articleNumber: '602.170.74', category: 'table', unitPrice: 199.00, unit: 'each' },

  // Kitchen
  { name: 'OUMBARLIG frying pan', articleNumber: '302.328.36', category: 'kitchen', unitPrice: 19.99, unit: 'each' },
  { name: 'KAVALKAD saucepan set', articleNumber: '801.854.04', category: 'kitchen', unitPrice: 14.99, unit: 'set of 3' },
  { name: 'STANDARDMÅTT cutting board', articleNumber: '903.098.71', category: 'kitchen', unitPrice: 9.99, unit: 'each' },
  { name: 'IDEALISK colander', articleNumber: '601.519.21', category: 'kitchen', unitPrice: 5.99, unit: 'each' },

  // Bathroom
  { name: 'BROGRUND soap dispenser', articleNumber: '803.285.24', category: 'bathroom', unitPrice: 9.99, unit: 'each' },
  { name: 'TOFTAN soap dispenser', articleNumber: '704.473.40', category: 'bathroom', unitPrice: 7.99, unit: 'each' },
  { name: 'BROGRUND toilet brush', articleNumber: '803.285.25', category: 'bathroom', unitPrice: 7.99, unit: 'each' },
  { name: 'DOPPA shower curtain', articleNumber: '903.490.41', category: 'bathroom', unitPrice: 9.99, unit: 'each' },

  // Cleaning
  { name: 'PEPPRIG dustpan and brush', articleNumber: '704.830.19', category: 'cleaning', unitPrice: 4.99, unit: 'each' },
  { name: 'MEDELVÅG mop', articleNumber: '604.830.15', category: 'cleaning', unitPrice: 9.99, unit: 'each' },
  { name: 'BASTIS lint roller', articleNumber: '304.256.54', category: 'cleaning', unitPrice: 1.99, unit: 'each' },
];

export function getIkeaSearchUrl(productName: string): string {
  return `https://www.ikea.com/pt/en/search/?q=${encodeURIComponent(productName)}`;
}

export function findIkeaProductByName(name: string): IkeaProduct | undefined {
  const lower = name.toLowerCase();
  return ikeaCatalog.find(
    (p) =>
      p.name.toLowerCase() === lower ||
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase().split(' ')[0]!)
  );
}
