# 🏥 Backend - Health Guardian

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Apps Django](#-apps-django)
- [APIs e Endpoints](#-apis-e-endpoints)
- [Modelos de Dados](#-modelos-de-dados)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Configuração e Ambiente](#-configuração-e-ambiente)
- [Desenvolvimento](#-desenvolvimento)

## 🎯 Visão Geral

O backend do Health Guardian é construído com Django e Django REST Framework, fornecendo uma API robusta para gerenciamento de dados médicos, calculadoras clínicas e integração com IA.

### Tecnologias Principais

- **Framework**: Django 4.2+
- **API**: Django REST Framework
- **Banco de Dados**: PostgreSQL (produção), SQLite (desenvolvimento)
- **Autenticação**: JWT (JSON Web Tokens)
- **Cache**: Redis (opcional)
- **IA**: Integração com Ollama/OpenAI
- **Documentação**: drf-spectacular (OpenAPI/Swagger)

### Características

- ✅ API RESTful completa
- ✅ Autenticação JWT
- ✅ Validação de dados robusta
- ✅ Sistema de permissões granular
- ✅ Integração com IA para análises
- ✅ Exportação FHIR
- ✅ Sistema de tags estruturadas
- ✅ Calculadoras médicas dinâmicas
- ✅ Logs e auditoria
- ✅ Testes automatizados

## 🏗️ Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Database      │
│   (React)       │◄──►│   (Django)      │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │   (Ollama)      │
                       └─────────────────┘
```

### Camadas da Aplicação

1. **Presentation Layer** (Views/ViewSets)
   - Endpoints da API REST
   - Serialização de dados
   - Validação de entrada
   - Tratamento de erros

2. **Business Logic Layer** (Services)
   - Regras de negócio
   - Processamento de dados
   - Integração com IA
   - Validações complexas

3. **Data Access Layer** (Models/Managers)
   - Modelos Django
   - Queries customizadas
   - Relacionamentos
   - Validações de modelo

4. **Infrastructure Layer**
   - Configurações
   - Middleware
   - Cache
   - Logs

## 📁 Estrutura do Projeto

```
backend/
├── config/                 # Configurações do Django
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py        # Configurações base
│   │   ├── development.py # Configurações de desenvolvimento
│   │   ├── production.py  # Configurações de produção
│   │   └── testing.py     # Configurações de teste
│   ├── urls.py            # URLs principais
│   ├── wsgi.py           # WSGI para produção
│   └── asgi.py           # ASGI para WebSockets
├── apps/                  # Apps Django
│   ├── accounts/         # Gerenciamento de usuários
│   ├── patients/         # Gerenciamento de pacientes
│   ├── records/          # Registros médicos
│   ├── calculators/      # Calculadoras médicas
│   ├── ai/              # Integração com IA
│   ├── core/            # Funcionalidades core
│   └── api/             # Configurações da API
├── utils/                # Utilitários compartilhados
│   ├── __init__.py
│   ├── exceptions.py     # Exceções customizadas
│   ├── permissions.py    # Permissões customizadas
│   ├── validators.py     # Validadores
│   ├── mixins.py        # Mixins para views
│   └── helpers.py       # Funções auxiliares
├── tests/               # Testes
│   ├── __init__.py
│   ├── conftest.py      # Configurações do pytest
│   ├── factories.py     # Factory Boy factories
│   └── test_*.py       # Arquivos de teste
├── docs/                # Documentação
├── requirements/        # Dependências
│   ├── base.txt        # Dependências base
│   ├── development.txt # Dependências de desenvolvimento
│   └── production.txt  # Dependências de produção
├── scripts/            # Scripts utilitários
├── static/             # Arquivos estáticos
├── media/              # Uploads de mídia
├── logs/               # Arquivos de log
├── manage.py           # Script de gerenciamento Django
├── pytest.ini         # Configuração do pytest
└── README.md          # Documentação do backend
```

## 📱 Apps Django

### 1. accounts/ - Gerenciamento de Usuários

**Responsabilidade**: Autenticação, autorização e gerenciamento de perfis de usuário.

```python
# models.py
class User(AbstractUser):
    """
    Modelo customizado de usuário.
    
    Connectors:
    - Referenced in all apps via ForeignKey
    - Used in JWT authentication → auth/views.py
    - Profile data used in frontend → components/Profile.jsx
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=50, choices=USER_ROLES)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

class UserProfile(models.Model):
    """
    Perfil estendido do usuário.
    
    Hook: Criado automaticamente via post_save signal
    Connector: Usado em frontend/components/UserProfile.jsx
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    preferences = models.JSONField(default=dict)
    timezone = models.CharField(max_length=50, default='UTC')
```

**Endpoints Principais**:
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Renovar token
- `GET /api/auth/profile/` - Perfil do usuário
- `PUT /api/auth/profile/` - Atualizar perfil

### 2. patients/ - Gerenciamento de Pacientes

**Responsabilidade**: CRUD de pacientes e dados demográficos.

```python
# models.py
class Patient(models.Model):
    """
    Modelo de paciente.
    
    Connectors:
    - Referenced in records/models.py via ForeignKey
    - Used in calculators for patient-specific calculations
    - Data displayed in frontend/components/PatientList.jsx
    """
    # Dados pessoais
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    
    # Contato
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    
    # Dados médicos básicos
    blood_type = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)
    medical_history = models.TextField(blank=True)
    
    # Metadados
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        """Calcula idade atual do paciente."""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < 
            (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
```

**Endpoints Principais**:
- `GET /api/patients/` - Lista de pacientes
- `POST /api/patients/` - Criar paciente
- `GET /api/patients/{id}/` - Detalhes do paciente
- `PUT /api/patients/{id}/` - Atualizar paciente
- `DELETE /api/patients/{id}/` - Excluir paciente
- `GET /api/patients/search/` - Buscar pacientes

### 3. records/ - Registros Médicos

**Responsabilidade**: Gerenciamento de registros médicos e sistema de tags.

```python
# models.py
class Record(models.Model):
    """
    Registro médico.
    
    Connectors:
    - Links to Patient via ForeignKey
    - Parsed by ai/services/analysis.py for insights
    - Tags processed by frontend/utils/tagParser.js
    """
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='records')
    title = models.CharField(max_length=200)
    content = models.TextField()
    record_type = models.CharField(max_length=50, choices=RECORD_TYPES)
    
    # Metadados
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Tags estruturadas
    tags = models.JSONField(default=dict, blank=True)
    
    # Status
    is_draft = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
            models.Index(fields=['record_type']),
        ]

class TagDefinition(models.Model):
    """
    Definição de tags estruturadas.
    
    Connector: Used by frontend TagParser and AI context building
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    data_type = models.CharField(max_length=20, choices=DATA_TYPES)
    validation_rules = models.JSONField(default=dict)
    category = models.CharField(max_length=50)
    is_required = models.BooleanField(default=False)
    
    def validate_value(self, value):
        """Valida valor da tag conforme regras definidas."""
        # Implementação de validação baseada em data_type e validation_rules
        pass
```

**Endpoints Principais**:
- `GET /api/records/` - Lista de registros
- `POST /api/records/` - Criar registro
- `GET /api/records/{id}/` - Detalhes do registro
- `PUT /api/records/{id}/` - Atualizar registro
- `DELETE /api/records/{id}/` - Excluir registro
- `GET /api/patients/{id}/records/` - Registros de um paciente
- `POST /api/records/parse/` - Parsear tags de texto
- `GET /api/records/{id}/fhir/` - Exportar como FHIR

### 4. calculators/ - Calculadoras Médicas

**Responsabilidade**: Calculadoras médicas dinâmicas e histórico de cálculos.

```python
# models.py
class Calculator(models.Model):
    """
    Definição de calculadora médica.
    
    Connectors:
    - Executed by frontend/components/Calculator.jsx
    - Results stored in CalculatorResult
    - Formulas validated by utils/safe_eval.py
    """
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)
    
    # Configuração da calculadora
    fields = models.JSONField()  # Definição dos campos de entrada
    formula = models.TextField()  # Fórmula de cálculo
    result_unit = models.CharField(max_length=50, blank=True)
    result_interpretation = models.JSONField(default=dict)
    
    # Metadados
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    version = models.PositiveIntegerField(default=1)
    
    class Meta:
        ordering = ['category', 'name']
        unique_together = ['name', 'version']

class CalculatorResult(models.Model):
    """
    Resultado de cálculo.
    
    Hook: Created when calculator is executed
    Connector: Displayed in frontend calculation history
    """
    calculator = models.ForeignKey(Calculator, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Dados do cálculo
    input_data = models.JSONField()
    result_value = models.FloatField()
    result_interpretation = models.CharField(max_length=200, blank=True)
    
    # Metadados
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-calculated_at']
```

**Endpoints Principais**:
- `GET /api/calculators/` - Lista de calculadoras
- `GET /api/calculators/{id}/` - Detalhes da calculadora
- `POST /api/calculators/{id}/execute/` - Executar cálculo
- `GET /api/calculators/history/` - Histórico de cálculos
- `GET /api/calculators/categories/` - Categorias disponíveis

### 5. ai/ - Integração com IA

**Responsabilidade**: Integração com serviços de IA para análise de dados médicos.

```python
# models.py
class AIAnalysis(models.Model):
    """
    Resultado de análise por IA.
    
    Connectors:
    - Generated by ai/services/ollama.py
    - Displayed in frontend/components/AIInsights.jsx
    - Links to Record for context
    """
    record = models.ForeignKey('records.Record', on_delete=models.CASCADE)
    analysis_type = models.CharField(max_length=50)
    prompt_used = models.TextField()
    ai_response = models.TextField()
    confidence_score = models.FloatField(null=True, blank=True)
    
    # Metadados
    created_at = models.DateTimeField(auto_now_add=True)
    processing_time = models.FloatField()  # em segundos
    model_used = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['-created_at']

# services/ollama.py
class OllamaService:
    """
    Serviço de integração com Ollama.
    
    Connector: Called from ai/views.py for analysis requests
    """
    
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
    
    async def analyze_record(self, record_id, analysis_type='general'):
        """
        Analisa registro médico usando IA.
        
        Args:
            record_id: ID do registro
            analysis_type: Tipo de análise
        
        Returns:
            dict: Resultado da análise
        
        Hook: Saves result to AIAnalysis model
        """
        record = await Record.objects.aget(id=record_id)
        
        # Construir contexto
        context = self.build_context(record)
        
        # Construir prompt
        prompt = self.build_prompt(context, analysis_type)
        
        # Fazer requisição para Ollama
        start_time = time.time()
        response = await self.make_request(prompt)
        processing_time = time.time() - start_time
        
        # Salvar resultado
        analysis = await AIAnalysis.objects.acreate(
            record=record,
            analysis_type=analysis_type,
            prompt_used=prompt,
            ai_response=response['response'],
            processing_time=processing_time,
            model_used=self.model
        )
        
        return {
            'analysis_id': analysis.id,
            'response': response['response'],
            'processing_time': processing_time
        }
    
    def build_context(self, record):
        """
        Constrói contexto para análise.
        
        Includes:
        - Record content and tags
        - Patient demographics and history
        - Relevant medical definitions
        """
        context = {
            'patient': {
                'age': record.patient.age,
                'gender': record.patient.gender,
                'medical_history': record.patient.medical_history,
                'allergies': record.patient.allergies
            },
            'record': {
                'title': record.title,
                'content': record.content,
                'tags': record.tags,
                'type': record.record_type
            }
        }
        
        return context
    
    def build_prompt(self, context, analysis_type):
        """
        Constrói prompt estruturado para IA.
        
        Safety measures:
        - No executable code in prompts
        - HIPAA compliant instructions
        - Structured output format
        """
        base_prompt = f"""
        You are a medical AI assistant. Analyze the following medical record.
        
        IMPORTANT SAFETY RULES:
        - Provide analysis for educational purposes only
        - Do not provide specific medical advice
        - Recommend consulting healthcare professionals
        - Maintain patient confidentiality
        
        CONTEXT:
        Patient: {context['patient']['age']} year old {context['patient']['gender']}
        Medical History: {context['patient']['medical_history']}
        
        RECORD:
        Title: {context['record']['title']}
        Content: {context['record']['content']}
        Tags: {context['record']['tags']}
        
        ANALYSIS TYPE: {analysis_type}
        
        Please provide a structured analysis in JSON format:
        {{
            "summary": "Brief summary of findings",
            "key_points": ["List of key observations"],
            "recommendations": ["General recommendations"],
            "follow_up": "Suggested follow-up actions",
            "confidence": 0.85
        }}
        """
        
        return base_prompt
```

**Endpoints Principais**:
- `POST /api/ai/analyze/` - Solicitar análise
- `GET /api/ai/analysis/{id}/` - Resultado da análise
- `GET /api/records/{id}/analysis/` - Análises de um registro

## 🔐 Autenticação e Autorização

### JWT Authentication

```python
# settings/base.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Middleware de autenticação
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### Sistema de Permissões

```python
# utils/permissions.py
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permissão customizada para permitir apenas proprietários editarem.
    
    Connector: Used across all ViewSets for object-level permissions
    """
    
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura para qualquer request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Permissões de escrita apenas para o proprietário
        return obj.created_by == request.user

class CanManagePatients(permissions.BasePermission):
    """
    Permissão para gerenciar pacientes.
    """
    
    def has_permission(self, request, view):
        return request.user.has_perm('patients.manage_patients')

class CanAccessAI(permissions.BasePermission):
    """
    Permissão para acessar funcionalidades de IA.
    """
    
    def has_permission(self, request, view):
        return request.user.has_perm('ai.access_ai_features')
```

## ⚙️ Configuração e Ambiente

### Variáveis de Ambiente

```bash
# .env
# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/healthguardian
# ou para desenvolvimento:
# DATABASE_URL=sqlite:///db.sqlite3

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0

# AI Services
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2:7b
OPENAI_API_KEY=your-openai-key  # opcional

# Email (para produção)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Storage (para produção)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket

# Security
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Configurações por Ambiente

```python
# settings/development.py
from .base import *

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Logging detalhado
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}

# settings/production.py
from .base import *
import dj_database_url

DEBUG = False

# Database
DATABASES = {
    'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
}

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
```

## 🚀 Desenvolvimento

### Setup do Ambiente

```bash
# 1. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# 2. Instalar dependências
pip install -r requirements/development.txt

# 3. Configurar banco de dados
python manage.py migrate

# 4. Criar superusuário
python manage.py createsuperuser

# 5. Carregar dados de exemplo
python manage.py loaddata fixtures/sample_data.json

# 6. Executar servidor
python manage.py runserver 8000
```

### Comandos Úteis

```bash
# Migrations
python manage.py makemigrations
python manage.py migrate
python manage.py showmigrations

# Shell interativo
python manage.py shell
python manage.py shell_plus  # com django-extensions

# Testes
python manage.py test
pytest  # com pytest-django
pytest --cov  # com coverage

# Dados
python manage.py dumpdata > backup.json
python manage.py loaddata backup.json

# Linting e formatação
black .
flake8 .
isort .

# Documentação da API
python manage.py spectacular --file schema.yml
```

### Estrutura de Testes

```python
# tests/test_patients.py
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.patients.models import Patient

class PatientAPITestCase(APITestCase):
    """
    Testes para API de pacientes.
    
    Hook: Run with pytest or python manage.py test
    """
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_patient(self):
        """Teste de criação de paciente."""
        data = {
            'first_name': 'João',
            'last_name': 'Silva',
            'date_of_birth': '1990-01-01',
            'gender': 'M'
        }
        
        url = reverse('patient-list')
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Patient.objects.count(), 1)
        self.assertEqual(Patient.objects.first().full_name, 'João Silva')
    
    def test_list_patients(self):
        """Teste de listagem de pacientes."""
        # Criar pacientes de teste
        Patient.objects.create(
            first_name='João',
            last_name='Silva',
            date_of_birth='1990-01-01',
            gender='M',
            created_by=self.user
        )
        
        url = reverse('patient-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_patient_age_calculation(self):
        """Teste de cálculo de idade."""
        from datetime import date
        
        patient = Patient.objects.create(
            first_name='João',
            last_name='Silva',
            date_of_birth=date(1990, 1, 1),
            gender='M',
            created_by=self.user
        )
        
        # Assumindo que estamos em 2024
        expected_age = 2024 - 1990
        self.assertEqual(patient.age, expected_age)
```

### Padrões de Código

```python
# Exemplo de ViewSet bem estruturado
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de pacientes.
    
    Provides:
    - CRUD operations
    - Search and filtering
    - Custom actions
    
    Connector: Used by frontend PatientService.js
    """
    
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, CanManagePatients]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['created_at', 'last_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrar queryset baseado no usuário."""
        return self.queryset.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        """Definir usuário criador ao criar paciente."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def records(self, request, pk=None):
        """Buscar registros de um paciente específico."""
        patient = self.get_object()
        records = patient.records.filter(is_archived=False)
        
        # Paginação
        page = self.paginate_queryset(records)
        if page is not None:
            serializer = RecordSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = RecordSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Criar múltiplos pacientes."""
        patients_data = request.data.get('patients', [])
        
        if not patients_data:
            return Response(
                {'error': 'Lista de pacientes é obrigatória'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_patients = []
        errors = []
        
        for i, patient_data in enumerate(patients_data):
            serializer = self.get_serializer(data=patient_data)
            if serializer.is_valid():
                patient = serializer.save(created_by=request.user)
                created_patients.append(patient)
            else:
                errors.append({
                    'index': i,
                    'errors': serializer.errors
                })
        
        response_data = {
            'created': len(created_patients),
            'errors': errors
        }
        
        if created_patients:
            response_data['patients'] = PatientSerializer(
                created_patients, many=True
            ).data
        
        status_code = (
            status.HTTP_201_CREATED if created_patients 
            else status.HTTP_400_BAD_REQUEST
        )
        
        return Response(response_data, status=status_code)
```

---

> **💡 Dica**: Para informações específicas sobre cada app, consulte os arquivos README.md individuais em cada diretório de app.