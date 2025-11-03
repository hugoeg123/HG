import React from 'react';

/**
 * InputField
 * 
 * Componente controlado para inputs de formulário com rótulo padronizado.
 * 
 * Integrates with:
 * - components/auth/RegisterPatient.jsx (uso nos formulários de cadastro)
 * - index.css (.input) para estilos e estados de foco
 * 
 * Connector: Recebe `value` e `onChange` do formulário pai; não gerencia foco por conta própria.
 */
const InputField = React.memo(function InputField({
  id,
  label,
  type = 'text',
  required = false,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  className = 'input',
  labelClassName = 'block text-sm font-medium text-gray-300',
  containerClassName = 'space-y-2',
  ...rest
}) {
  const inputName = name || id;

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
      )}
      <input
        id={id}
        name={inputName}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        className={className}
        {...rest}
      />
    </div>
  );
});

export default InputField;