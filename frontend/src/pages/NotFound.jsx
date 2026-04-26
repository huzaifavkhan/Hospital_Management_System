import { useNavigate } from 'react-router-dom';
import { Cross } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-6">
        <Cross size={32} className="text-teal" />
      </div>
      <h1 className="font-heading text-white text-6xl font-bold mb-3">404</h1>
      <h2 className="font-heading text-white text-xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-white/40 mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button onClick={() => navigate(-1)} className="btn-primary">
        ← Go Back
      </button>
    </div>
  );
}
