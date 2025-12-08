import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getDoctorReviews, createDoctorReview } from '../../../services/marketplaceService';

/**
 * DoctorReviews Component
 * 
 * Integrates with:
 * - services/marketplaceService.js → getDoctorReviews, createDoctorReview
 * - Patient/DoctorPublicProfile.jsx → passes doctorId
 * 
 * Data Flow:
 * - Mount → fetch public reviews
 * - Submit → create review (requires patient token)
 */
const DoctorReviews = ({ doctorId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDoctorReviews(doctorId);
        if (mounted) setReviews(data.reviews || []);
      } catch (e) {
        if (mounted) setError('Falha ao carregar avaliações públicas.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [doctorId]);

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length)
    : null;

  const Stars = ({ value = 0 }) => {
    const full = Math.round(value);
    // Renderiza 5 estrelas em SVG com preenchimento sólido para as "cheias"
    return (
      <span aria-label={`Média ${value.toFixed ? value.toFixed(1) : value}/5`} className="inline-flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              style={{
                fill: i < full ? 'hsl(var(--accent) / 1)' : 'hsl(var(--accent) / 0.40)',
                stroke: 'hsl(var(--accent) / 1)'
              }}
            />
          </svg>
        ))}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');
    try {
      const created = await createDoctorReview(doctorId, { rating: Number(rating), comment });
      setReviews((prev) => [{ ...created }, ...prev]);
      setComment('');
      setRating(5);
      setSuccessMessage('Avaliação enviada com sucesso!');
    } catch (err) {
      setError('Não foi possível enviar a avaliação. Verifique se está autenticado como paciente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Componente de input por estrelas (acessível) usando SVG para eliminar fundo quadrado do botão
  const RatingInput = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);
    const current = hover || value;
    return (
      <div className="flex items-center gap-1 p-0 m-0 border-0" role="radiogroup" aria-label="Sua nota">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className={`button-exception inline-flex items-center justify-center w-6 h-6 p-0 m-0 bg-transparent border-0 ${current >= n ? '' : ''}`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                style={{
                  // Pré-seleção: tom claro do acento; Pós-seleção: acento sólido
                  fill: current >= n ? 'hsl(var(--accent) / 1)' : 'hsl(var(--accent) / 0.40)',
                  stroke: 'hsl(var(--accent) / 1)'
                }}
              />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{value}/5</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Avaliações</h3>
      {average !== null && (
        <div className="flex items-center gap-3 p-3 border border-theme-border theme-border rounded bg-accent/10">
          {/* Brasão temático */}
          <svg width="28" height="28" viewBox="0 0 24 24" className="text-accent" fill="currentColor" aria-hidden="true">
            <path d="M12 2l7 3v6c0 5.25-3.75 9.86-7 11-3.25-1.14-7-5.75-7-11V5l7-3z"></path>
          </svg>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">Média</span>
            <span className="text-base font-semibold">{average.toFixed(1)}/5</span>
            <Stars value={average} />
            <span className="text-xs text-muted-foreground">({reviews.length} avaliações públicas)</span>
          </div>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-theme-muted">Carregando avaliações...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.length === 0 && (
            <li className="text-sm text-theme-muted">Nenhuma avaliação pública ainda.</li>
          )}
          {reviews.map((r) => (
            <li key={r.id} className="border border-theme-border theme-border rounded p-3">
              <div className="text-sm font-medium flex items-center gap-2">
                Nota: {r.rating}/5 <span className="text-accent">{'★'.repeat(Math.round(r.rating || 0))}</span>
              </div>
              {r.comment && <p className="text-sm text-theme-muted mt-1 whitespace-pre-line">{r.comment}</p>}
              <div className="text-xs text-theme-muted mt-1">{new Date(r.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="text-sm">Sua nota</label>
          <RatingInput value={rating} onChange={setRating} />
        </div>
        <div>
          <label className="text-sm mb-1 block">Comentário (opcional)</label>
          {/* Using input for consistency; switches to textarea for multiline */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-theme-border theme-border rounded px-2 py-1 text-sm"
            rows={3}
            maxLength={1000}
            placeholder="Compartilhe sua experiência..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
          {successMessage && <span className="text-sm text-green-600">{successMessage}</span>}
        </div>
      </form>
    </div>
  );
};

export default DoctorReviews;