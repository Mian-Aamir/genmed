// Sample data for prototype, real data will come from the DRAP database.
// Illustrative fixtures, not verified brand/manufacturer/price records.
// Local/Sample brands and manufacturers are fictional; no clinical equivalence is asserted.
// SECURITY: Future medicine records must be validated and authorized by the backend.
export const medicines = [
  { id: 1, brand: 'Panadol', formula: 'Paracetamol', strength: '500 mg', form: 'Tablet', manufacturer: 'Haleon (sample)', pack: '10 tablets', price: 40 },
  { id: 2, brand: 'Calpol', formula: 'Paracetamol', strength: '500 mg', form: 'Tablet', manufacturer: 'GSK (sample)', pack: '10 tablets', price: 30 },
  { id: 3, brand: 'Paracetamol Local', formula: 'Paracetamol', strength: '500 mg', form: 'Tablet', manufacturer: 'Sample Pharma A', pack: '10 tablets', price: 20 },
  { id: 4, brand: 'Brufen', formula: 'Ibuprofen', strength: '200 mg', form: 'Tablet', manufacturer: 'Abbott (sample)', pack: '10 tablets', price: 80 },
  { id: 5, brand: 'Ibuprofen Local', formula: 'Ibuprofen', strength: '200 mg', form: 'Tablet', manufacturer: 'Sample Pharma B', pack: '10 tablets', price: 50 },
  { id: 6, brand: 'Ibu Sample', formula: 'Ibuprofen', strength: '200 mg', form: 'Tablet', manufacturer: 'Sample Pharma C', pack: '10 tablets', price: 60 },
  { id: 7, brand: 'Losec', formula: 'Omeprazole', strength: '20 mg', form: 'Capsule', manufacturer: 'AstraZeneca (sample)', pack: '14 capsules', price: 420 },
  { id: 8, brand: 'Risek', formula: 'Omeprazole', strength: '20 mg', form: 'Capsule', manufacturer: 'Getz Pharma (sample)', pack: '14 capsules', price: 280 },
  { id: 9, brand: 'Omeprazole Local', formula: 'Omeprazole', strength: '20 mg', form: 'Capsule', manufacturer: 'Sample Pharma A', pack: '14 capsules', price: 180 },
  { id: 10, brand: 'Zyrtec', formula: 'Cetirizine', strength: '5 mg / 5 mL', form: 'Syrup', manufacturer: 'UCB (sample)', pack: '60 mL bottle', price: 180 },
  { id: 11, brand: 'Cetirizine Local', formula: 'Cetirizine', strength: '5 mg / 5 mL', form: 'Syrup', manufacturer: 'Sample Pharma B', pack: '60 mL bottle', price: 100 },
  { id: 12, brand: 'Ceti Sample', formula: 'Cetirizine', strength: '5 mg / 5 mL', form: 'Syrup', manufacturer: 'Sample Pharma C', pack: '60 mL bottle', price: 130 },
  { id: 13, brand: 'Amoxil', formula: 'Amoxicillin', strength: '500 mg', form: 'Capsule', manufacturer: 'GSK (sample)', pack: '12 capsules', price: 360 },
  { id: 14, brand: 'Amoxicillin Local', formula: 'Amoxicillin', strength: '500 mg', form: 'Capsule', manufacturer: 'Sample Pharma A', pack: '12 capsules', price: 240 },
  { id: 15, brand: 'Amoxi Sample', formula: 'Amoxicillin', strength: '500 mg', form: 'Capsule', manufacturer: 'Sample Pharma B', pack: '12 capsules', price: 300 },
];
// Compare like-for-like packs; a shared formula alone is insufficient.
export function comparisonKey(item) {
  return [item.formula, item.strength, item.form, item.pack].join('|');
}
