# Health-Guardian Project Rules

## Code Architecture & Style

### Modularity Standards
- **File Size Limit**: Keep files under 200 lines for maintainability
- **Component Autonomy**: Each app/component should be self-contained with internal README.md
- **Integration Documentation**: Every module must document its connections:
  ```
  # Integration Hooks:
  # - patients/models.py → records/models.py (via ForeignKey Patient in Record)
  # - alerts/services/rules.py ← triggered by Patient model signals
  ```
### Backend (Django/DRF)
- **API Standards**: Use Django REST Framework for all endpoints
- **Model Documentation**: Include docstrings with connection mapping:
  ```python
  class Patient(models.Model):
      """
      Core patient model.
      
      Connectors:
      - Referenced in records/serializers.py via ForeignKey
      - Triggers alerts via post_save signal → alerts/services/rules.py
      """
  ```
- **Signal Documentation**: Document signal hooks in models.py:
  ```python
  # Hook: post_save signal triggers generate_alerts in alerts/services/rules.py
  ```
### Frontend (React)
- **Component Structure**: Organize components in dedicated folders
- **JSDoc Integration**: Document component connections:
  ```javascript
  /**
   * PatientForm Component
   * 
   * Integrates with:
   * - services/api.js for /patients/ API calls
   * - store/patientStore.js for state management
   * - CenterPane/Editor.jsx for data parsing
   */
  ```
- **Data Flow**: Document data parsing and backend integration:
  ```javascript
  // Connector: Sends parsed data to backend/records via createRecord API
  ```
### AI Integration
- **Contextual Prompts**: Include relevant context in ai/services/ollama.py:
  ```python
  def generate_analysis(record_id):
      """
      Generate medical analysis using AI.
      
      Hook: Called from ai/views.py
      Integrates with: records/models.py via record_id parameter
      Context: Includes record.content, patient.history, relevant_tags
      """
  ```
- **Prompt Standards**: Use structured format with metadata:
  ```python
  ANALYSIS_PROMPT = {
      "description": "Medical record analysis with FHIR compliance",
      "context_fields": ["record.content", "patient.demographics", "relevant_tags"],
      "output_format": "structured_json",
      "safety_rules": ["no_executable_code", "hipaa_compliant"]
  }
  ```
## Core Features
### Tag System
- **Format**: Use `#TAG: value` syntax consistently
- **Model Integration**: TagDefinition in records/models.py with proper documentation:
  ```python
  class TagDefinition(models.Model):
      """
      Defines structured tags for medical records.
      
      Connectors:
      - Used in records/serializers.py for data validation
      - Parsed in frontend CenterPane/TagParser.jsx
      - Referenced in ai/services for context building
      """
  ```
### FHIR Compliance
- **Export Standards**: Implement FHIR-compliant exports in records/views.py
- **AI Integration**: Include FHIR validation in AI suggestions
- **Documentation Hook**: 
  ```python
  # Integration: Uses FHIR schemas as AI context for compliant outputs
  ```

## Testing Strategy
### Automated Testing
- **Module Coverage**: Generate tests for each module (e.g., `test_patient_crud.py`)
- **Integration Testing**: Document test hooks:
  ```python
  # Test Hook: Verifies ai/chat integration via mocked Ollama responses
  ```
- **AI Testing**: Mock AI services and validate outputs against standards:
  ```python
  def test_fhir_compliance():
      """Test AI-generated exports meet FHIR standards"""
      # Mock Ollama response and validate structure
  ```

## Security & Compliance
### Healthcare Standards
- **FHIR Compliance**: Enforce in all data exports and AI suggestions
- **Safe Code Practices**: 
  - Never use `eval()` in ai/models.py
  - Use `ast.literal_eval()` for safe parsing
  - Document safety measures:
    ```python
    # Connector: Calculator formula integrates with ai/views.py via safe_exec wrapper
    ```
### Error Handling
- **Centralized Logging**: Implement error handlers in views/services
- **User Feedback**: Document error propagation:
  ```python
  # Hook: Errors propagate to frontend via API response → RightPane display
  ```
## Development Workflow
### Planning Phase
1. **Plan Creation**: Write detailed plan to `.plans/TASK_NAME.md` before implementation
2. **Research Requirements**: Gather external dependencies and knowledge
3. **MVP Focus**: Prioritize essential features for incremental progress
4. **Approval Gate**: Present plan for review before proceeding

### Implementation Phase
1. **Stage-by-Stage**: Break work into clear, reviewable stages
2. **Documentation**: Explain every change with integration context
3. **Milestone Review**: Re-evaluate plan at key checkpoints
4. **Integration Mapping**: Document all new connections and dependencies

### Quality Assurance
1. **Coherence Check**: Assess overall system integration
2. **Redundancy Elimination**: Remove duplicate code/functionality
3. **Documentation Update**: Maintain current integration maps
4. **Pattern Compliance**: Ensure adherence to established standards

## Integration Documentation Template

### For New Features
Every new feature must include:
```markdown
## Integration Map
- **New File**: `path/to/new_file.py`
- **Connects To**: 
  - `existing/module.py` via import/ForeignKey/API call
  - `frontend/component.jsx` via API endpoint
- **Data Flow**: 
  1. User input → Frontend component
  2. API call → Backend service
  3. Database update → Signal trigger
  4. AI processing → Result display

## Hooks & Dependencies
- **Triggers**: What events cause this to run
- **Dependencies**: What this feature requires
- **Side Effects**: What else this affects
```

---

## Development Standards Summary
- Keep files < 200 lines
- Document all integrations with "Connector/Hook" comments
- Use structured AI prompts with safety measures
- Implement comprehensive testing with mocks
- Follow FHIR compliance for healthcare data
- Maintain clear integration documentation