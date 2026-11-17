import { useMedicines } from '../services/medicineCatalog';
import { reviewLabels } from '../services/reviewLabels';

export default function ReviewSummary({ request }) {
  // Activity 6: medicine details come from GET /api/medicines.
  const { medicines } = useMedicines();
  const medicine = medicines.find(item => item.id === request.medicineId);
  return <>
    <div className="review-heading"><span className="eyebrow">{request.reference}</span><span className="badge">{reviewLabels[request.status]}</span></div>
    <h3>{medicine?.brand || `Medicine #${request.medicineId}`}</h3>
    {medicine && <p>{medicine.formula} · {medicine.strength} · {medicine.form}</p>}
    <p className="fine-print">Requested {new Date(request.createdAt).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
  </>;
}
