import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { getPublicDoctors, getAvailableSlots } from '../../services/marketplaceService';
import { Stethoscope, MapPin, Video, Search, Filter, Calendar, Clock, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const modalityIcon = (modality) => {
  if (modality === 'telemedicina') return <Video className="w-3 h-3" />;
  if (modality === 'presencial') return <MapPin className="w-3 h-3" />;
  return <Stethoscope className="w-3 h-3" />;
};

const DoctorsList = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [professionalType, setProfessionalType] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [slotsByDoctor, setSlotsByDoctor] = useState({});
  const navigate = useNavigate();

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicDoctors({
        q: query || undefined,
        specialty: specialty || undefined,
        professional_type: professionalType || undefined,
        page,
        limit
      });
      setDoctors(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError('Não foi possível carregar médicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, specialty, professionalType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const toggleSlots = async (medicoId) => {
    setExpanded((prev) => ({ ...prev, [medicoId]: !prev[medicoId] }));
    if (!slotsByDoctor[medicoId]) {
      try {
        const slots = await getAvailableSlots({ medico_id: medicoId });
        setSlotsByDoctor((prev) => ({ ...prev, [medicoId]: slots }));
      } catch (e) {
        // silently ignore for MVP
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-background to-theme-card/30 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 mb-2">
            {t('marketplace.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            {t('marketplace.subtitle')}
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-8 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-medium text-gray-500 ml-1">{t('marketplace.searchProfessional')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('marketplace.searchPlaceholder')}
                  className="pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-medium text-gray-500 ml-1">{t('marketplace.specialty')}</label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Cardiologia"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-teal-500"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-500 ml-1">{t('marketplace.type')}</label>
              <select
                value={professionalType}
                onChange={(e) => setProfessionalType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t('marketplace.all')}</option>
                <option value="medico">{t('marketplace.doctor')}</option>
                <option value="enfermeiro">{t('marketplace.nurse')}</option>
                <option value="fisioterapeuta">{t('marketplace.physiotherapist')}</option>
                <option value="nutricionista">{t('marketplace.nutritionist')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 transition-all">
                <Filter className="w-4 h-4 mr-2" />
                {t('marketplace.filter')}
              </Button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
            <p className="text-red-500">{error}</p>
            <Button variant="link" onClick={fetchDoctors} className="mt-2 text-red-600">Tentar novamente</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.map((doc) => (
                <Card
                  key={doc.id}
                  className="group relative overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/patient/doctor/${doc.id}`)}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

                  <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm group-hover:border-teal-500 transition-colors">
                        {doc.avatar_url ? (
                          <img src={doc.avatar_url} alt={doc.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                            {doc.nome?.[0] || 'M'}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold truncate text-gray-900 dark:text-gray-100 group-hover:text-teal-500 transition-colors">
                        {doc.nome}
                      </CardTitle>
                      <CardDescription className="text-xs truncate text-gray-500 mt-0.5">
                        {doc.specialty || t('marketplace.specialty')}
                      </CardDescription>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">4.9</span>
                        <span className="text-[10px] text-gray-400">(120+)</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200">
                        {doc.professional_type || 'Profissional'}
                      </Badge>
                      {doc.titulo_profissional && (
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 border-gray-200 dark:border-gray-700 text-gray-500">
                          {doc.titulo_profissional}
                        </Badge>
                      )}
                    </div>

                    {doc.biografia && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 min-h-[2.5em]">
                        {doc.biografia}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                        onClick={(e) => { e.stopPropagation(); toggleSlots(doc.id); }}
                      >
                        <Calendar className="w-3 h-3 mr-1.5" />
                        {expanded[doc.id] ? t('marketplace.closeAgenda') : t('marketplace.viewAgenda')}
                      </Button>

                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        R$ 250
                      </div>
                    </div>

                    {/* Agenda Expandida */}
                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${expanded[doc.id] ? 'max-h-60 opacity-100 mt-3' : 'max-h-0 opacity-0'}
                    `}>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 space-y-1.5">
                        {(slotsByDoctor[doc.id] || []).length === 0 ? (
                          <div className="text-xs text-center py-2 text-gray-400">{t('marketplace.noSlots')}</div>
                        ) : (
                          (slotsByDoctor[doc.id] || []).slice(0, 3).map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="bg-teal-100 dark:bg-teal-900/30 p-1 rounded text-teal-600 dark:text-teal-400">
                                  {modalityIcon(slot.modality)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                    {new Date(slot.start_time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(slot.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <Button size="sm" className="h-6 text-[10px] px-2 bg-teal-600 hover:bg-teal-700 text-white">
                                {t('marketplace.schedule')}
                              </Button>
                            </div>
                          ))
                        )}
                        {(slotsByDoctor[doc.id] || []).length > 3 && (
                          <div className="text-center pt-1">
                            <span className="text-[10px] text-teal-600 font-medium cursor-pointer hover:underline">
                              {t('marketplace.seeMore')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border-gray-200 dark:border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t('marketplace.previous')}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`
                        w-8 h-8 rounded-md text-sm font-medium transition-colors
                        ${page === p
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="border-gray-200 dark:border-gray-700"
                >
                  {t('marketplace.next')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper components for pagination icons since they weren't imported
const ChevronLeft = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6" /></svg>
);

const ChevronRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg>
);

export default DoctorsList;