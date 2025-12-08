import React from 'react';

/**
 * DoctorBio Component
 * 
 * Integrates with:
 * - Used by Patient/DoctorPublicProfile.jsx to render bio sections
 * - Consumes doctor fields: biografia, formacao, experiencias, curriculo_url
 * - Connects to backend via marketplaceService in parent for doctor data
 * 
 * Connector: Sends parsed data to UI only (no backend calls here)
 * Hook: Renderiza formação/experiências com parsing defensivo de string/objeto/array
 * Side Effects: Nenhum — apenas formatação e exibição
 */
const DoctorBio = ({ doctor }) => {
  if (!doctor) return null;

  const hasBio = Boolean(doctor.biografia);

  // Parsing defensivo para formação e experiências
  const parseArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return [parsed];
      } catch {}
      // como fallback, retorna string encapsulada em objeto de descrição
      return [{ descricao: value }];
    }
    if (typeof value === 'object') return [value];
    return [];
  };

  const normalizeEducation = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return { descricao: item };
    return {
      curso: item.curso || item.titulo || '',
      instituicao: item.instituicao || item.escola || '',
      ano_inicio: item.ano_inicio || item.inicio || '',
      ano_fim: item.ano_fim || item.fim || '',
      descricao: item.descricao || ''
    };
  };

  const normalizeExperience = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return { descricao: item };
    return {
      cargo: item.cargo || item.funcao || '',
      empresa: item.empresa || item.org || '',
      ano_inicio: item.ano_inicio || item.inicio || '',
      ano_fim: item.ano_fim || item.fim || '',
      atual: Boolean(item.atual),
      descricao: item.descricao || ''
    };
  };

  const formacao = parseArray(doctor.formacao).map(normalizeEducation).filter(Boolean);
  const experiencias = parseArray(doctor.experiencias).map(normalizeExperience).filter(Boolean);

  const hasFormacao = formacao.length > 0;
  const hasExperiencias = experiencias.length > 0;

  const Periodo = ({ inicio, fim, atual }) => {
    const hasPeriodo = inicio || fim || atual;
    if (!hasPeriodo) return null;
    const fimText = atual ? 'Atual' : (fim || '...');
    return (
      <p className="text-xs text-muted-foreground">{inicio || '...'} – {fimText}</p>
    );
  };

  return (
    <div className="space-y-6">
      {hasBio && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Biografia</h3>
          <p className="text-sm text-theme-muted whitespace-pre-line">{doctor.biografia}</p>
        </section>
      )}

      {hasFormacao && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Formação</h3>
          <div className="space-y-2">
            {formacao.map((f, idx) => (
              <div key={idx} className="p-3 border border-theme-border rounded-md">
                <p className="text-sm font-medium">
                  {[f.curso, f.instituicao].filter(Boolean).join(' • ') || f.descricao}
                </p>
                <Periodo inicio={f.ano_inicio} fim={f.ano_fim} />
                {f.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{f.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {hasExperiencias && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Experiências</h3>
          <div className="space-y-2">
            {experiencias.map((e, idx) => (
              <div key={idx} className="p-3 border border-theme-border rounded-md">
                <p className="text-sm font-medium">
                  {[e.cargo, e.empresa].filter(Boolean).join(' • ') || e.descricao}
                </p>
                <Periodo inicio={e.ano_inicio} fim={e.ano_fim} atual={e.atual} />
                {e.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{e.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {doctor.curriculo_url && (
        <section>
          <h3 className="text-lg font-semibold mb-2">Currículo</h3>
          <a
            href={doctor.curriculo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Abrir currículo
          </a>
        </section>
      )}
    </div>
  );
};

export default DoctorBio;