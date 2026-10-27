// Validation globale des champs requis : bordure rouge + message sous le champ.

const REQUIRED_SELECTOR = 'input[required], select[required], textarea[required]';
const ERROR_CLASS = 'field-invalid';
const MESSAGE_CLASS = 'field-error-message';
const messages = new WeakMap();

const isEmpty = (field) => {
  if (field.type === 'checkbox' || field.type === 'radio') {
    return !field.checked;
  }

  return !String(field.value || '').trim();
};

const messageFor = (field) => {
  if (isEmpty(field)) {
    return field.getAttribute('data-required-message') || 'Ce champ est obligatoire.';
  }

  if (field.validity?.typeMismatch || field.validity?.patternMismatch) {
    return 'Veuillez saisir une valeur valide.';
  }

  return null;
};

const clearField = (field) => {
  field.classList.remove(ERROR_CLASS);
  const message = messages.get(field);
  if (message) {
    message.remove();
    messages.delete(field);
  }
};

const markField = (field, text) => {
  if (!text) {
    clearField(field);
    return;
  }

  field.classList.add(ERROR_CLASS);
  let message = messages.get(field);

  if (!message || !message.isConnected) {
    message = document.createElement('p');
    message.className = MESSAGE_CLASS;
    field.insertAdjacentElement('afterend', message);
    messages.set(field, message);
  }

  message.textContent = text;
};

const validateField = (field) => {
  markField(field, messageFor(field));
};

document.addEventListener(
  'invalid',
  (event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement) || !field.matches(REQUIRED_SELECTOR)) return;
    event.preventDefault();
    validateField(field);
  },
  true
);

document.addEventListener(
  'focusout',
  (event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement) || !field.matches(REQUIRED_SELECTOR)) return;
    validateField(field);
  },
  true
);

const handleInput = (event) => {
  const field = event.target;
  if (!(field instanceof HTMLElement) || !field.matches(REQUIRED_SELECTOR)) return;

  if (isEmpty(field)) {
    validateField(field);
  } else {
    clearField(field);
  }
};

document.addEventListener('input', handleInput, true);
document.addEventListener('change', handleInput, true);
