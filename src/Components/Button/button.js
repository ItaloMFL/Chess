// src/components/Button/Button.js

export function createButton({ label, onClick, className = '' }) {
  const button = document.createElement('button');
  button.textContent = label;
  // As classes CSS vêm do arquivo CSS que já linkamos no HTML
  button.className = `btn ${className}`; 
  button.addEventListener('click', onClick);
  return button;
}