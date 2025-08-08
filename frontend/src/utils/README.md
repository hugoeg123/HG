# Frontend Utils Directory

## Visão Geral

Este diretório contém utilitários e funções auxiliares para a aplicação Health Guardian. Os utils encapsulam lógica reutilizável, formatação de dados, validações, transformações e outras operações comuns que são utilizadas em múltiplos componentes.

## Estrutura de Utilitários

### Utilitários Existentes

#### `formatters.js`
**Propósito**: Formatação de dados para exibição na interface.

**Funcionalidades**:
- Formatação de datas e horários
- Formatação de números e moedas
- Formatação de texto e strings
- Formatação de dados médicos

**Conectores**:
- **Components**: Usado em todos os componentes para exibição
- **Tables**: Formatação de dados em tabelas
- **Forms**: Formatação de inputs e outputs
- **Reports**: Formatação para relatórios

**Exemplo de Uso**:
```javascript
import { formatDate, formatCurrency, formatPhone } from '../utils/formatters';

const formattedDate = formatDate(new Date(), 'dd/MM/yyyy');
const formattedPrice = formatCurrency(1234.56, 'BRL');
const formattedPhone = formatPhone('11999887766');
```

#### `validators.js`
**Propósito**: Validação de dados e formulários.

**Funcionalidades**:
- Validação de emails e telefones
- Validação de CPF/CNPJ
- Validação de campos obrigatórios
- Validação de formatos específicos

**Conectores**:
- **Forms**: Validação em tempo real
- **API**: Validação antes de envio
- **Components**: Feedback visual de validação
- **Hooks**: Integração com useForm

**Exemplo de Uso**:
```javascript
import { validateEmail, validateCPF, validateRequired } from '../utils/validators';

const emailValid = validateEmail('user@example.com');
const cpfValid = validateCPF('123.456.789-00');
const fieldValid = validateRequired(value);
```

#### `constants.js`
**Propósito**: Constantes e configurações da aplicação.

**Funcionalidades**:
- URLs de API
- Configurações de tema
- Mensagens padrão
- Enums e tipos

**Conectores**:
- **Services**: URLs e configurações de API
- **Components**: Mensagens e textos
- **Store**: Configurações de estado
- **Styles**: Configurações de tema

**Exemplo de Uso**:
```javascript
import { API_ENDPOINTS, THEME_COLORS, ERROR_MESSAGES } from '../utils/constants';

const endpoint = API_ENDPOINTS.PATIENTS;
const primaryColor = THEME_COLORS.PRIMARY;
const errorMsg = ERROR_MESSAGES.NETWORK_ERROR;
```

#### `helpers.js`
**Propósito**: Funções auxiliares gerais.

**Funcionalidades**:
- Manipulação de arrays e objetos
- Debounce e throttle
- Geração de IDs únicos
- Utilitários de string

**Conectores**:
- **Components**: Lógica auxiliar
- **Hooks**: Operações de dados
- **Services**: Transformação de dados
- **Store**: Manipulação de estado

**Exemplo de Uso**:
```javascript
import { debounce, generateId, deepClone, isEmpty } from '../utils/helpers';

const debouncedFn = debounce(callback, 300);
const uniqueId = generateId();
const clonedObj = deepClone(originalObj);
const isEmptyValue = isEmpty(value);
```

#### `storage.js`
**Propósito**: Gerenciamento de localStorage e sessionStorage.

**Funcionalidades**:
- Operações CRUD no storage
- Serialização automática
- Tratamento de erros
- Limpeza de dados expirados

**Conectores**:
- **Auth**: Persistência de tokens
- **Theme**: Salvamento de preferências
- **Settings**: Configurações do usuário
- **Cache**: Armazenamento temporário

**Exemplo de Uso**:
```javascript
import { setItem, getItem, removeItem, clearExpired } from '../utils/storage';

setItem('user_preferences', { theme: 'dark' }, { expires: '7d' });
const preferences = getItem('user_preferences');
removeItem('temp_data');
clearExpired();
```

#### `api.js`
**Propósito**: Utilitários para requisições HTTP.

**Funcionalidades**:
- Interceptors de request/response
- Tratamento de erros HTTP
- Transformação de dados
- Retry automático

**Conectores**:
- **Services**: Base para chamadas de API
- **Auth**: Interceptors de autenticação
- **Error**: Tratamento centralizado
- **Loading**: Estados de carregamento

**Exemplo de Uso**:
```javascript
import { createApiClient, handleApiError, transformResponse } from '../utils/api';

const apiClient = createApiClient({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000
});
```

#### `date.js`
**Propósito**: Utilitários específicos para manipulação de datas.

**Funcionalidades**:
- Parsing e formatação de datas
- Cálculos de idade e diferenças
- Validação de datas
- Fusos horários

**Conectores**:
- **Patient**: Cálculo de idade
- **Records**: Ordenação por data
- **Reports**: Filtros temporais
- **Calendar**: Exibição de eventos

**Exemplo de Uso**:
```javascript
import { calculateAge, isValidDate, formatRelativeTime, addDays } from '../utils/date';

const age = calculateAge('1990-05-15');
const isValid = isValidDate('2023-12-31');
const relativeTime = formatRelativeTime(new Date());
const futureDate = addDays(new Date(), 7);
```

#### `medical.js`
**Propósito**: Utilitários específicos para dados médicos.

**Funcionalidades**:
- Parsing de tags médicas
- Validação de dados clínicos
- Cálculos médicos
- Formatação FHIR

**Conectores**:
- **Records**: Parsing de conteúdo
- **AI**: Contexto para análises
- **Export**: Formatação FHIR
- **Validation**: Regras médicas

**Exemplo de Uso**:
```javascript
import { parseMedicalTags, calculateBMI, validateVitalSigns, formatFHIR } from '../utils/medical';

const tags = parseMedicalTags(recordContent);
const bmi = calculateBMI(weight, height);
const isValid = validateVitalSigns(vitals);
const fhirData = formatFHIR(patientData);
```

## Implementações Detalhadas

### `formatters.js`
```javascript
/**
 * Utilitários de Formatação
 * 
 * Conectores:
 * - Usado em components/ para exibição de dados
 * - Integra com date.js para formatação temporal
 * - Utilizado em tables/ para formatação de colunas
 * 
 * IA prompt: "Estenda os formatters para incluir [novo tipo de dado], 
 * mantendo consistência com padrões existentes e adicionando validação."
 */

import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatação de Datas
export const formatDate = (date, pattern = 'dd/MM/yyyy', options = {}) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Data inválida';
    }
    
    return format(dateObj, pattern, {
      locale: ptBR,
      ...options
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

export const formatDateTime = (date, options = {}) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm', options);
};

export const formatTime = (date, options = {}) => {
  return formatDate(date, 'HH:mm', options);
};

export const formatRelativeDate = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInHours = (now - dateObj) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)} horas`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    return 'Data inválida';
  }
};

// Formatação de Números
export const formatCurrency = (value, currency = 'BRL', options = {}) => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      ...options
    }).format(value);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return 'R$ 0,00';
  }
};

export const formatNumber = (value, options = {}) => {
  try {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(value);
  } catch (error) {
    return '0';
  }
};

export const formatPercentage = (value, decimals = 1) => {
  try {
    return `${(value * 100).toFixed(decimals)}%`;
  } catch (error) {
    return '0%';
  }
};

// Formatação de Texto
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  return cpf;
};

export const formatCNPJ = (cnpj) => {
  if (!cnpj) return '';
  
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj;
};

export const formatCEP = (cep) => {
  if (!cep) return '';
  
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  return cep;
};

// Formatação de Nomes
export const formatName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Formatação de Tamanhos
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Formatação Médica
export const formatHeight = (heightInCm) => {
  if (!heightInCm) return '';
  
  const meters = Math.floor(heightInCm / 100);
  const centimeters = heightInCm % 100;
  
  return `${meters},${centimeters.toString().padStart(2, '0')}m`;
};

export const formatWeight = (weightInKg) => {
  if (!weightInKg) return '';
  
  return `${formatNumber(weightInKg)} kg`;
};

export const formatBMI = (bmi) => {
  if (!bmi) return '';
  
  return formatNumber(bmi, { maximumFractionDigits: 1 });
};

export const formatBloodPressure = (systolic, diastolic) => {
  if (!systolic || !diastolic) return '';
  
  return `${systolic}/${diastolic} mmHg`;
};

export const formatTemperature = (temp, unit = 'C') => {
  if (!temp) return '';
  
  return `${formatNumber(temp, { maximumFractionDigits: 1 })}°${unit}`;
};

// Formatação de Listas
export const formatList = (items, separator = ', ', lastSeparator = ' e ') => {
  if (!Array.isArray(items) || items.length === 0) return '';
  
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(lastSeparator);
  
  const allButLast = items.slice(0, -1).join(separator);
  const last = items[items.length - 1];
  
  return allButLast + lastSeparator + last;
};

// Formatação de URLs
export const formatUrl = (url) => {
  if (!url) return '';
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

// Formatação de Texto Longo
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const formatParagraphs = (text) => {
  if (!text) return '';
  
  return text
    .split('\n')
    .filter(line => line.trim())
    .join('\n\n');
};

// Formatação de Status
export const formatStatus = (status) => {
  const statusMap = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    draft: 'Rascunho',
    published: 'Publicado'
  };
  
  return statusMap[status] || status;
};

// Formatação de Prioridade
export const formatPriority = (priority) => {
  const priorityMap = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente'
  };
  
  return priorityMap[priority] || priority;
};

// Formatação de Gênero
export const formatGender = (gender) => {
  const genderMap = {
    M: 'Masculino',
    F: 'Feminino',
    O: 'Outro',
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outro'
  };
  
  return genderMap[gender] || gender;
};

// Formatação de Idade
export const formatAge = (birthDate) => {
  if (!birthDate) return '';
  
  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${age - 1} anos`;
    }
    
    return `${age} anos`;
  } catch (error) {
    return '';
  }
};

// Exportar todas as funções
export default {
  // Datas
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeDate,
  
  // Números
  formatCurrency,
  formatNumber,
  formatPercentage,
  
  // Texto
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatName,
  formatInitials,
  
  // Tamanhos
  formatFileSize,
  
  // Médico
  formatHeight,
  formatWeight,
  formatBMI,
  formatBloodPressure,
  formatTemperature,
  formatAge,
  
  // Listas e Texto
  formatList,
  formatUrl,
  truncateText,
  formatParagraphs,
  
  // Status
  formatStatus,
  formatPriority,
  formatGender
};
```

### `validators.js`
```javascript
/**
 * Utilitários de Validação
 * 
 * Conectores:
 * - Usado em forms/ para validação em tempo real
 * - Integra com hooks/useForm para feedback
 * - Utilizado em services/api para validação pré-envio
 * 
 * IA prompt: "Adicione validadores para [tipo específico de dado médico], 
 * incluindo regras de negócio e mensagens de erro personalizadas."
 */

// Validações Básicas
export const validateRequired = (value, message = 'Campo obrigatório') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { isValid: false, message };
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

export const validateMinLength = (value, minLength, message) => {
  if (!value) return { isValid: true, message: '' };
  
  const actualMessage = message || `Mínimo de ${minLength} caracteres`;
  
  if (value.length < minLength) {
    return { isValid: false, message: actualMessage };
  }
  
  return { isValid: true, message: '' };
};

export const validateMaxLength = (value, maxLength, message) => {
  if (!value) return { isValid: true, message: '' };
  
  const actualMessage = message || `Máximo de ${maxLength} caracteres`;
  
  if (value.length > maxLength) {
    return { isValid: false, message: actualMessage };
  }
  
  return { isValid: true, message: '' };
};

// Validações de Email
export const validateEmail = (email, message = 'Email inválido') => {
  if (!email) return { isValid: true, message: '' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

// Validações de Telefone
export const validatePhone = (phone, message = 'Telefone inválido') => {
  if (!phone) return { isValid: true, message: '' };
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 11) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

// Validações de CPF
export const validateCPF = (cpf, message = 'CPF inválido') => {
  if (!cpf) return { isValid: true, message: '' };
  
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) {
    return { isValid: false, message };
  }
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, message };
  }
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  if (remainder !== parseInt(cleaned.charAt(9))) {
    return { isValid: false, message };
  }
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  if (remainder !== parseInt(cleaned.charAt(10))) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

// Validações de CNPJ
export const validateCNPJ = (cnpj, message = 'CNPJ inválido') => {
  if (!cnpj) return { isValid: true, message: '' };
  
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) {
    return { isValid: false, message };
  }
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { isValid: false, message };
  }
  
  // Validar primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (firstDigit !== parseInt(cleaned.charAt(12))) {
    return { isValid: false, message };
  }
  
  // Validar segundo dígito verificador
  sum = 0;
  weight = 2;
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (secondDigit !== parseInt(cleaned.charAt(13))) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

// Validações de Data
export const validateDate = (date, message = 'Data inválida') => {
  if (!date) return { isValid: true, message: '' };
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

export const validateDateRange = (startDate, endDate, message = 'Data final deve ser posterior à data inicial') => {
  if (!startDate || !endDate) return { isValid: true, message: '' };
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

export const validateAge = (birthDate, minAge = 0, maxAge = 150, message) => {
  if (!birthDate) return { isValid: true, message: '' };
  
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  
  const actualMessage = message || `Idade deve estar entre ${minAge} e ${maxAge} anos`;
  
  if (age < minAge || age > maxAge) {
    return { isValid: false, message: actualMessage };
  }
  
  return { isValid: true, message: '' };
};

// Validações Numéricas
export const validateNumber = (value, message = 'Deve ser um número válido') => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: true, message: '' };
  }
  
  if (isNaN(Number(value))) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

export const validateRange = (value, min, max, message) => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: true, message: '' };
  }
  
  const num = Number(value);
  const actualMessage = message || `Valor deve estar entre ${min} e ${max}`;
  
  if (num < min || num > max) {
    return { isValid: false, message: actualMessage };
  }
  
  return { isValid: true, message: '' };
};

// Validações de Senha
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
    message = 'Senha não atende aos critérios'
  } = options;
  
  if (!password) return { isValid: true, message: '' };
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`mínimo ${minLength} caracteres`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('pelo menos uma letra maiúscula');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('pelo menos uma letra minúscula');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('pelo menos um número');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('pelo menos um caractere especial');
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      message: `Senha deve ter: ${errors.join(', ')}`
    };
  }
  
  return { isValid: true, message: '' };
};

export const validatePasswordConfirmation = (password, confirmation, message = 'Senhas não coincidem') => {
  if (!password || !confirmation) return { isValid: true, message: '' };
  
  if (password !== confirmation) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

// Validações Médicas
export const validateHeight = (height, message = 'Altura inválida (50-250 cm)') => {
  return validateRange(height, 50, 250, message);
};

export const validateWeight = (weight, message = 'Peso inválido (1-500 kg)') => {
  return validateRange(weight, 1, 500, message);
};

export const validateBloodPressure = (systolic, diastolic, message = 'Pressão arterial inválida') => {
  const systolicValid = validateRange(systolic, 70, 250);
  const diastolicValid = validateRange(diastolic, 40, 150);
  
  if (!systolicValid.isValid || !diastolicValid.isValid) {
    return { isValid: false, message };
  }
  
  if (systolic <= diastolic) {
    return { isValid: false, message: 'Pressão sistólica deve ser maior que diastólica' };
  }
  
  return { isValid: true, message: '' };
};

export const validateTemperature = (temp, message = 'Temperatura inválida (30-45°C)') => {
  return validateRange(temp, 30, 45, message);
};

export const validateHeartRate = (rate, message = 'Frequência cardíaca inválida (30-220 bpm)') => {
  return validateRange(rate, 30, 220, message);
};

// Validação de Formulário Completo
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    const value = data[field];
    
    for (const rule of fieldRules) {
      const result = rule(value);
      
      if (!result.isValid) {
        errors[field] = result.message;
        isValid = false;
        break; // Para na primeira validação que falhar
      }
    }
  });
  
  return { isValid, errors };
};

// Validação de URL
export const validateUrl = (url, message = 'URL inválida') => {
  if (!url) return { isValid: true, message: '' };
  
  try {
    new URL(url);
    return { isValid: true, message: '' };
  } catch {
    return { isValid: false, message };
  }
};

// Validação de CEP
export const validateCEP = (cep, message = 'CEP inválido') => {
  if (!cep) return { isValid: true, message: '' };
  
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length !== 8) {
    return { isValid: false, message };
  }
  
  return { isValid: true, message: '' };
};

// Exportar todas as validações
export default {
  // Básicas
  validateRequired,
  validateMinLength,
  validateMaxLength,
  
  // Contato
  validateEmail,
  validatePhone,
  
  // Documentos
  validateCPF,
  validateCNPJ,
  validateCEP,
  
  // Datas
  validateDate,
  validateDateRange,
  validateAge,
  
  // Números
  validateNumber,
  validateRange,
  
  // Senhas
  validatePassword,
  validatePasswordConfirmation,
  
  // Médicas
  validateHeight,
  validateWeight,
  validateBloodPressure,
  validateTemperature,
  validateHeartRate,
  
  // Outros
  validateUrl,
  validateForm
};
```

### `constants.js`
```javascript
/**
 * Constantes da Aplicação
 * 
 * Conectores:
 * - Usado em services/ para configurações de API
 * - Integra com components/ para textos e mensagens
 * - Utilizado em store/ para configurações de estado
 * 
 * IA prompt: "Adicione constantes para [nova funcionalidade], 
 * organizando por categoria e mantendo consistência com padrões existentes."
 */

// URLs e Endpoints da API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  
  // Usuários
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password'
  },
  
  // Pacientes
  PATIENTS: {
    BASE: '/patients',
    SEARCH: '/patients/search',
    BY_ID: (id) => `/patients/${id}`,
    RECORDS: (id) => `/patients/${id}/records`,
    ALERTS: (id) => `/patients/${id}/alerts`
  },
  
  // Registros
  RECORDS: {
    BASE: '/records',
    BY_ID: (id) => `/records/${id}`,
    BY_PATIENT: (patientId) => `/records/patient/${patientId}`,
    SEARCH: '/records/search',
    EXPORT: '/records/export',
    FHIR: (id) => `/records/${id}/fhir`
  },
  
  // Tags
  TAGS: {
    BASE: '/tags',
    DEFINITIONS: '/tags/definitions',
    BY_TYPE: (type) => `/tags/type/${type}`,
    SEARCH: '/tags/search'
  },
  
  // Templates
  TEMPLATES: {
    BASE: '/templates',
    BY_ID: (id) => `/templates/${id}`,
    BY_CATEGORY: (category) => `/templates/category/${category}`,
    SEARCH: '/templates/search'
  },
  
  // Alertas
  ALERTS: {
    BASE: '/alerts',
    BY_ID: (id) => `/alerts/${id}`,
    BY_PATIENT: (patientId) => `/alerts/patient/${patientId}`,
    MARK_READ: (id) => `/alerts/${id}/read`,
    DISMISS: (id) => `/alerts/${id}/dismiss`
  },
  
  // Calculadoras
  CALCULATORS: {
    BASE: '/calculators',
    BY_ID: (id) => `/calculators/${id}`,
    EXECUTE: (id) => `/calculators/${id}/execute`,
    CATEGORIES: '/calculators/categories'
  },
  
  // IA
  AI: {
    ANALYZE: '/ai/analyze',
    CHAT: '/ai/chat',
    SUGGESTIONS: '/ai/suggestions',
    EXPORT_FHIR: '/ai/export-fhir'
  },
  
  // Uploads
  UPLOADS: {
    BASE: '/uploads',
    IMAGES: '/uploads/images',
    DOCUMENTS: '/uploads/documents'
  }
};

// Configurações de Tema
export const THEME_COLORS = {
  PRIMARY: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
  },
  
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },
  
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },
  
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  }
};

// Mensagens de Erro
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  UNAUTHORIZED: 'Acesso não autorizado. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  TIMEOUT_ERROR: 'Tempo limite excedido. Tente novamente.',
  UNKNOWN_ERROR: 'Erro desconhecido. Contate o suporte.',
  
  // Específicos
  LOGIN_FAILED: 'Email ou senha incorretos.',
  PATIENT_NOT_FOUND: 'Paciente não encontrado.',
  RECORD_NOT_FOUND: 'Registro não encontrado.',
  TEMPLATE_NOT_FOUND: 'Template não encontrado.',
  CALCULATOR_ERROR: 'Erro ao executar calculadora.',
  AI_ERROR: 'Erro no serviço de IA. Tente novamente.',
  UPLOAD_ERROR: 'Erro ao fazer upload do arquivo.',
  EXPORT_ERROR: 'Erro ao exportar dados.'
};

// Mensagens de Sucesso
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso!',
  PATIENT_CREATED: 'Paciente criado com sucesso!',
  PATIENT_UPDATED: 'Paciente atualizado com sucesso!',
  PATIENT_DELETED: 'Paciente removido com sucesso!',
  RECORD_CREATED: 'Registro criado com sucesso!',
  RECORD_UPDATED: 'Registro atualizado com sucesso!',
  RECORD_DELETED: 'Registro removido com sucesso!',
  TEMPLATE_SAVED: 'Template salvo com sucesso!',
  SETTINGS_SAVED: 'Configurações salvas com sucesso!',
  EXPORT_SUCCESS: 'Dados exportados com sucesso!',
  UPLOAD_SUCCESS: 'Arquivo enviado com sucesso!'
};

// Status e Estados
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DRAFT: 'draft',
  PUBLISHED: 'published'
};

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const GENDER = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'O'
};

// Tipos de Dados Médicos
export const MEDICAL_TYPES = {
  VITAL_SIGNS: 'vital_signs',
  SYMPTOMS: 'symptoms',
  DIAGNOSIS: 'diagnosis',
  TREATMENT: 'treatment',
  MEDICATION: 'medication',
  ALLERGY: 'allergy',
  PROCEDURE: 'procedure',
  LAB_RESULT: 'lab_result',
  IMAGING: 'imaging',
  NOTE: 'note'
};

// Configurações de Paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
};

// Configurações de Upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
};

// Configurações de Cache
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  LONG_TTL: 60 * 60 * 1000, // 1 hora
  SHORT_TTL: 30 * 1000, // 30 segundos
  MAX_CACHE_SIZE: 100
};

// Configurações de WebSocket
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  
  // Pacientes
  PATIENT_CREATED: 'patient:created',
  PATIENT_UPDATED: 'patient:updated',
  PATIENT_DELETED: 'patient:deleted',
  
  // Registros
  RECORD_CREATED: 'record:created',
  RECORD_UPDATED: 'record:updated',
  RECORD_DELETED: 'record:deleted',
  
  // Alertas
  ALERT_CREATED: 'alert:created',
  ALERT_UPDATED: 'alert:updated',
  ALERT_DISMISSED: 'alert:dismissed',
  
  // IA
  AI_ANALYSIS_COMPLETE: 'ai:analysis:complete',
  AI_CHAT_MESSAGE: 'ai:chat:message'
};

// Configurações de Formulário
export const FORM_CONFIG = {
  DEBOUNCE_DELAY: 300,
  AUTO_SAVE_DELAY: 2000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// Rotas da Aplicação
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PATIENTS: '/patients',
  PATIENT_DETAIL: '/patients/:id',
  RECORDS: '/records',
  RECORD_DETAIL: '/records/:id',
  TEMPLATES: '/templates',
  CALCULATORS: '/calculators',
  ALERTS: '/alerts',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  AI_ASSISTANT: '/ai',
  KNOWLEDGE_BASE: '/knowledge',
  NOT_FOUND: '/404'
};

// Configurações de Localização
export const LOCALE_CONFIG = {
  DEFAULT_LOCALE: 'pt-BR',
  SUPPORTED_LOCALES: ['pt-BR', 'en-US'],
  DATE_FORMAT: 'dd/MM/yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  CURRENCY: 'BRL'
};

// Configurações de Acessibilidade
export const A11Y_CONFIG = {
  FOCUS_VISIBLE_OUTLINE: '2px solid #0ea5e9',
  HIGH_CONTRAST_RATIO: 4.5,
  LARGE_TEXT_SIZE: '18px',
  ANIMATION_DURATION: 200
};

// Configurações de Performance
export const PERFORMANCE_CONFIG = {
  VIRTUAL_LIST_THRESHOLD: 100,
  IMAGE_LAZY_LOAD_THRESHOLD: '100px',
  DEBOUNCE_SEARCH: 300,
  THROTTLE_SCROLL: 16
};

// Configurações de Desenvolvimento
export const DEV_CONFIG = {
  ENABLE_REDUX_DEVTOOLS: import.meta.env.DEV,
  ENABLE_CONSOLE_LOGS: import.meta.env.DEV,
  MOCK_API_DELAY: 500,
  ENABLE_ERROR_OVERLAY: import.meta.env.DEV
};

// Exportar todas as constantes
export default {
  API_BASE_URL,
  SOCKET_URL,
  API_ENDPOINTS,
  THEME_COLORS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS,
  PRIORITY,
  GENDER,
  MEDICAL_TYPES,
  PAGINATION,
  UPLOAD_CONFIG,
  CACHE_CONFIG,
  SOCKET_EVENTS,
  FORM_CONFIG,
  ROUTES,
  LOCALE_CONFIG,
  A11Y_CONFIG,
  PERFORMANCE_CONFIG,
  DEV_CONFIG
};
```

## Mapa de Integrações

```
utils/
├── formatters.js
│   ├── → components/ (exibição de dados)
│   ├── → tables/ (formatação de colunas)
│   ├── → forms/ (formatação de inputs)
│   └── → reports/ (formatação para relatórios)
│
├── validators.js
│   ├── → forms/ (validação em tempo real)
│   ├── → hooks/useForm (feedback de validação)
│   ├── → services/api (validação pré-envio)
│   └── → components/ (feedback visual)
│
├── constants.js
│   ├── → services/ (configurações de API)
│   ├── → components/ (mensagens e textos)
│   ├── → store/ (configurações de estado)
│   └── → styles/ (configurações de tema)
│
├── helpers.js
│   ├── → components/ (lógica auxiliar)
│   ├── → hooks/ (operações de dados)
│   ├── → services/ (transformação de dados)
│   └── → store/ (manipulação de estado)
│
├── storage.js
│   ├── → auth/ (persistência de tokens)
│   ├── → theme/ (salvamento de preferências)
│   ├── → settings/ (configurações do usuário)
│   └── → cache/ (armazenamento temporário)
│
├── api.js
│   ├── → services/ (base para chamadas de API)
│   ├── → auth/ (interceptors de autenticação)
│   ├── → error/ (tratamento centralizado)
│   └── → loading/ (estados de carregamento)
│
├── date.js
│   ├── → patient/ (cálculo de idade)
│   ├── → records/ (ordenação por data)
│   ├── → reports/ (filtros temporais)
│   └── → calendar/ (exibição de eventos)
│
└── medical.js
    ├── → records/ (parsing de conteúdo)
    ├── → ai/ (contexto para análises)
    ├── → export/ (formatação FHIR)
    └── → validation/ (regras médicas)
```

## Dependências

- **date-fns**: Manipulação de datas
- **axios**: Cliente HTTP
- **lodash**: Utilitários de manipulação de dados
- **validator**: Validações adicionais
- **crypto-js**: Criptografia (se necessário)

## Hook de Teste

### Cobertura de Testes
```javascript
// Hook: Testa funcionalidade completa dos utilitários
const testUtilsIntegration = async () => {
  // Testar formatação de dados
  // Testar validações
  // Testar helpers
  // Testar storage
  // Testar integração com componentes
};
```

## IA Prompt Sugerido

```
IA prompt: "Crie novos utilitários para [funcionalidade específica], incluindo formatação, validação, helpers e constantes necessárias. Siga os padrões estabelecidos e documente todas as integrações com componentes existentes."
```

## Boas Práticas

### 1. Organização
- Agrupar funções relacionadas no mesmo arquivo
- Usar nomes descritivos e consistentes
- Documentar todas as funções

### 2. Performance
- Implementar memoização quando necessário
- Evitar operações custosas em loops
- Usar lazy loading para dados grandes

### 3. Reutilização
- Criar funções genéricas e configuráveis
- Evitar duplicação de código
- Manter compatibilidade com versões anteriores

### 4. Testes
- Testar todos os casos de uso
- Incluir testes de edge cases
- Mockar dependências externas

## Troubleshooting

### Problemas Comuns
1. **Formatação Incorreta**: Verificar locale e configurações
2. **Validação Falhando**: Verificar regras e tipos de dados
3. **Performance Lenta**: Implementar memoização e otimizações
4. **Erros de Tipo**: Verificar validação de entrada

### Debug
- **Console Logs**: Adicionar logs para debugging
- **Unit Tests**: Testar funções isoladamente
- **Integration Tests**: Testar com componentes reais
- **Performance Profiler**: Identificar gargalos