import '.button.css';

/**
 * Cria um botão estilizado.
 * @param {string} text - Texto do botão
 * @param {string} variant - 'primary' ou 'secondary'
 * @param {Function} onClick - Função de callback
 * @returns {HTMLButtonElement}
 */
export function createButton({ text, variant = 'primary', onClick = null}) {
  const button = document.createElement('button');
  button.className = `btn btn--${variant}`;
  button.textContent = text;

  if (onclick) {
    button.addEventListener('click', onClick);
  }
  
  return button;
}

export { createButton }