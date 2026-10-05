import { medicines } from '../data/medicines';
import { reviewLabels } from '../services/demoService';

export default function ReviewSummary({ request }) {
  const medicine = medicines.find(item => item.id === request.medicineId);
  return <>
    <div className="review-heading"><span className="eyebrow">{request.id}</span><span className="badge">{reviewLabels[request.status]}</span></div>
    <h3>{medicine?.brand || 'Sample medicine'}</h3>
    <p>{medicine?.formula} · {medicine?.strength} · {medicine?.form}</p>
    <p className="fine-print">Requested {new Date(request.createdAt).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' })}</p>
  </>;
}
