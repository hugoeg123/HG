// TagHistoryTimeline — Connector: frontend/services/api.js → tagHistoryService
// Displays aggregated timeline for a given tagKey (e.g., PESO, ALTURA)
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { tagHistoryService } from '../../services/api';

/**
 * Props:
 * - patientId: number|string
 * - tagKey: string (e.g., 'PESO')
 * - title: optional title
 */
const TagHistoryTimeline = ({ patientId, tagKey, title }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await tagHistoryService.get(tagKey, { patientId });
        if (!mounted) return;
        setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || 'Falha ao carregar histórico');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (patientId && tagKey) load();
    return () => { mounted = false; };
  }, [patientId, tagKey]);

  const formatValue = (item) => {
    if (item.value == null) return item.raw || '-';
    const v = typeof item.value === 'number' ? item.value : String(item.value);
    return `${v}${item.unit ? ' ' + item.unit : ''}`;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title || `Histórico de ${tagKey}`}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm">Carregando histórico...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-muted-foreground">Sem entradas para {tagKey}.</div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-medium">{formatValue(it)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(it.timestamp).toLocaleString()} · {it.actorName} ({it.actorRole}) · {it.source}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TagHistoryTimeline;