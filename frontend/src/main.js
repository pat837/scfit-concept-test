import './style.css';

const PROTOTYPE_URL = 'https://scfit-fitness.netlify.app/';
const STORAGE_KEY = 'scfit-concept-test-v2';
// Strip a trailing slash so `${API_BASE}${path}` never produces a double slash.
const API_BASE = (import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  : (import.meta.env.VITE_API_BASE_URL || '')
).replace(/\/+$/, '');

const sections = [
  { title: 'About You', intro: 'A little context before you explore the concept.', questions: [
    question('participant_name', 'Full Name', 'text', [], { personal: true, placeholder: 'Enter your full name' }),
    question('major_program', 'Major / Program', 'text', [], { personal: true, placeholder: 'e.g., Computer Science' }),
    question('college_school', 'College / School', 'text', [], { personal: true, placeholder: 'e.g., USC Viterbi School of Engineering' }),
    question('initial_product_testing_interest', 'Would you be interested in testing an early version of SCFit?', 'radio', ['Yes, I’d be interested', 'Maybe', 'Not right now']),
    question('usc_affiliation', 'Are you currently affiliated with USC?', 'radio', ['Yes, undergraduate student', 'Yes, graduate student', 'Yes, other USC affiliation', 'No']),
    question('fitness_interests', 'Which fitness activities are you most interested in?', 'checkbox', ['Gym/strength training', 'Running or jogging', 'Walking', 'Group fitness classes', 'Yoga or Pilates', 'Recreational sports', 'Cycling', 'Swimming', 'Dance', 'Other'], { hint: 'Select up to 3.', other: 'fitness_interests_other', maxSelections: 3 }),
    question('participation_barriers', 'What is the biggest challenge you currently face with fitness?', 'checkbox', ['I do not know what fitness opportunities are available', 'Fitness information is spread across different places', 'I do not have someone to participate with', 'I feel uncomfortable joining alone', 'Available activities do not fit my schedule', 'Locations are inconvenient', 'Cost', 'Lack of motivation', 'I prefer exercising alone', 'Nothing currently prevents me', 'Other'], { hint: 'Select up to 2.', other: 'participation_barriers_other', maxSelections: 2 }),
  ] },
  { title: 'Explore SCFit', intro: 'Explore fitness locations, student profiles, and group activities.', prototype: true },
  { title: 'Prototype Feedback', intro: 'Share your first reaction after exploring SCFit.', questions: [
    question('most_valuable_feature', 'Which SCFit feature stood out to you the most?', 'radio', ['Discovering gyms and workout locations', 'Discovering fitness events and activities', 'Browsing students with similar fitness interests', 'Connecting with another student to work out', 'Finding run clubs or group activities', 'None of these']),
    question('likely_action', 'If you opened SCFit today, what would you most likely do first?', 'radio', ['Explore a fitness location', 'View another student’s profile', 'Reach out to another student', 'Join a run club', 'Join a group fitness activity', 'I would browse but probably not take an action', 'I would not use the platform']),
    question('adoption_barriers', 'What could make you hesitate to use SCFit?', 'checkbox', ['Privacy or safety concerns', 'I would not feel comfortable contacting students I do not know', 'I prefer finding activities through existing USC resources', 'I prefer exercising alone', 'I would be concerned about inactive or inaccurate profiles', 'I would need more information before using it', 'The platform does not offer the activities I want', 'Nothing would prevent me', 'Other'], { other: 'adoption_barriers_other' }),
    question('next_month_likelihood', 'How likely would you be to use SCFit in the next month?', 'radio', ['Very unlikely', 'Unlikely', 'Unsure', 'Likely', 'Very likely']),
    question('overall_reaction', 'If you could change or improve one thing about SCFit, what would it be?', 'textarea', [], { required: false }),
  ] },
];

function question(id, title, type, options, extra = {}) {
  return { id, title, type, options, required: extra.required !== false, hint: extra.hint, other: extra.other, personal: extra.personal, placeholder: extra.placeholder, maxSelections: extra.maxSelections };
}

// Number only the research questions; participant-info fields stay unnumbered.
let questionNumber = 0;
sections.forEach((section) => {
  (section.questions || []).forEach((item) => {
    if (!item.personal) item.number = ++questionNumber;
  });
});

const initialState = () => ({ step: 0, sessionId: null, startedAt: null, openedAt: null, returnedAt: null, answers: {} });
let state = loadState();
let submitting = false;
const app = document.querySelector('#app');

function loadState() {
  try { return { ...initialState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return initialState(); }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function api(path, options = {}) {
  if (!API_BASE) throw new Error('The survey service is not configured yet. Please try again later.');
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('We could not reach the survey service. Check your connection and try again.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(body.detail)
      ? 'One of your answers could not be validated. Please review your choices and try again.'
      : body.detail || 'Something went wrong. Please try again.';
    throw new Error(detail);
  }
  return body;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function render() {
  if (state.complete) return renderSuccess();
  if (state.step === 0) return renderLanding();
  const stepIndex = state.step - 1;
  const section = sections[stepIndex];
  const progress = Math.round((state.step / sections.length) * 100);
  app.innerHTML = `
    <header class="topbar topbar--survey"><a class="wordmark" href="#" aria-label="SCFit Concept Test"><span class="mark">✦</span> scfit</a><span class="topbar-note">USC fitness community concept test</span></header>
    <main class="survey-shell">
      <div class="progress-meta"><span>Step ${state.step} of ${sections.length}</span><span>${progress}%</span></div>
      <div class="progress-track" role="progressbar" aria-label="Survey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div>
      <section class="form-panel" aria-labelledby="section-title">
        <div class="section-kicker">SCFIT CONCEPT TEST <span>·</span> ${String(state.step).padStart(2, '0')}</div>
        <h1 id="section-title">${esc(section.title)}</h1><p class="section-intro">${esc(section.intro)}</p>
        <div id="global-error" class="notice error-notice" role="alert" hidden></div>
        ${section.prototype ? renderPrototype() : `<form id="survey-form" novalidate>${section.questions.map(renderQuestion).join('')}</form>`}
        <div class="form-actions">
          <button class="button button-quiet" id="back-button" type="button">← <span>Back</span></button>
          ${section.prototype
            ? `<button class="button button-primary" id="ready-button" type="button" ${state.openedAt ? '' : 'disabled'}>I explored SCFit — continue <span>→</span></button>`
            : state.step === sections.length
              ? `<button class="button button-primary" id="continue-button" type="button" ${submitting ? 'disabled' : ''}>${submitting ? 'Submitting…' : 'Submit response'} <span>→</span></button>`
              : `<button class="button button-primary" id="continue-button" type="button">Continue <span>→</span></button>`}
        </div>
      </section>
      <footer class="survey-footer"><span>✦ SCFit</span><span>A student-created concept prototype, not an official USC platform.</span></footer>
    </main>`;
  bindStepEvents();
}

function renderLanding() {
  app.innerHTML = `
    <header class="topbar"><a class="wordmark" href="#" aria-label="SCFit Concept Test"><span class="mark">✦</span> scfit</a><span class="topbar-note">USC fitness community concept test</span></header>
    <main class="landing-shell">
      <div class="landing-copy">
        <div class="section-kicker">BUILT FOR THE USC FITNESS COMMUNITY</div>
        <h1>SCFit</h1><h2>USC Fitness Community<br>Concept Test</h2>
        <p>Thank you for participating in this short concept test.</p>
        <p>SCFit is an early-stage concept designed to help USC students discover fitness opportunities and connect with other students who share similar fitness interests.</p>
        <p>You will first answer a few questions, explore a short website prototype, and then return here to provide feedback.</p>
        <p>The prototype is for testing purposes only, and some buttons or features may not be functional.</p>
        <div class="time-note"><span class="time-icon">◷</span> Estimated completion time: 5–7 minutes</div>
        <div id="landing-error" class="notice error-notice" role="alert" hidden></div>
        <button class="button button-primary start-button" id="start-button" type="button">Start Concept Test <span>→</span></button>
      </div>
      <div class="landing-aside" aria-hidden="true">
        <div class="aside-top"><span class="status-dot"></span> YOUR USC FITNESS COMMUNITY</div>
        <div class="aside-quote">Find your<br>workout.<br><em>Find your people.</em></div>
        <div class="aside-bottom"><span class="mini-avatars"><i>M</i><i>A</i><i>J</i></span><span>Browse. Choose. Connect.</span></div>
      </div>
    </main>
    <footer class="landing-footer"><span>✦ SCFit</span><span>Course concept test · 2026</span></footer>`;
  document.querySelector('#start-button').addEventListener('click', startSurvey);
}

function renderQuestion(item) {
  const value = state.answers[item.id];
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  const required = item.required ? '<span class="required-mark" aria-label="required">*</span>' : '';
  const description = item.hint ? `<p class="question-hint">${esc(item.hint)}</p>` : '';
  let control;
  if (item.type === 'textarea') {
    control = `<textarea id="field-${item.id}" name="${item.id}" rows="4" placeholder="Your response (optional)">${esc(value || '')}</textarea>`;
  } else if (item.type === 'email') {
    control = `<input id="field-${item.id}" name="${item.id}" type="email" autocomplete="email" value="${esc(value || '')}" placeholder="name@example.com"><p class="privacy-note">Your email will only be used for this class project's potential follow-up testing and will not be publicly displayed.</p>`;
  } else if (item.type === 'text') {
    control = `<input id="field-${item.id}" name="${item.id}" type="text" value="${esc(value || '')}" placeholder="${esc(item.placeholder || '')}">`;
  } else {
    control = `<div class="options-grid ${item.options.length > 7 ? 'options-compact' : ''}" role="${item.type === 'radio' ? 'radiogroup' : 'group'}" aria-label="${esc(item.title)}">${item.options.map((option) => `
      <label class="option-card ${values.includes(option) ? 'selected' : ''}">
        <input type="${item.type}" name="${item.id}" value="${esc(option)}" ${values.includes(option) ? 'checked' : ''} aria-describedby="error-${item.id}">
        <span class="choice-indicator" aria-hidden="true"></span><span class="option-label">${esc(option)}</span>
      </label>`).join('')}</div>`;
  }
  const other = item.other ? `<div class="other-field" ${values.includes('Other') ? '' : 'hidden'}><label for="field-${item.other}">Tell us a little more <span>(optional)</span></label><input id="field-${item.other}" name="${item.other}" type="text" maxlength="1000" value="${esc(state.answers[item.other] || '')}" placeholder="Add a short note"></div>` : '';
  const visibility = '';
  const numberPrefix = item.number ? `${item.number}. ` : '';
  return `<fieldset class="question" data-question="${item.id}" data-type="${item.type}" data-required="${item.required}" data-max-selections="${item.maxSelections || ''}" ${visibility}>
    <legend>${numberPrefix}${esc(item.title)} ${required}</legend>${description}${control}${other}<p class="field-error" id="error-${item.id}" role="alert" hidden></p>
  </fieldset>`;
}

function renderPrototype() {
  if (state.openedAt) {
    return `<div class="prototype-card">
      <div class="prototype-symbol" aria-hidden="true">✦</div>
      <h2>Welcome back</h2>
      <p>When you’ve finished exploring SCFit, continue below.</p>
      <a class="button button-quiet explore-button" id="prototype-link" href="${PROTOTYPE_URL}" target="_blank" rel="noopener noreferrer">Reopen SCFit Prototype <span>↗</span></a>
      <div class="prototype-status ${state.returnedAt ? 'status-done' : ''}" id="prototype-status" aria-live="polite">${state.returnedAt ? 'Thanks for exploring. You’re ready to continue.' : 'Prototype opened. Return here when you’re ready.'}</div>
    </div>`;
  }
  return `<div class="prototype-card">
    <div class="prototype-symbol" aria-hidden="true">✦</div>
    <h2>Explore the SCFit Prototype</h2>
    <p>Please open the SCFit prototype below. Explore the available fitness locations, student profiles, and group activities as if you were deciding whether to use the platform.</p>
    <p>The prototype contains example profiles and activities and does not provide functional messaging or automatic matching.</p>
    <p>After exploring the prototype, return to this tab and continue the concept test.</p>
    <a class="button button-primary explore-button" id="prototype-link" href="${PROTOTYPE_URL}" target="_blank" rel="noopener noreferrer">Explore SCFit Prototype <span>↗</span></a>
    <div class="prototype-status" id="prototype-status" aria-live="polite">Open the prototype to continue.</div>
  </div>`;
}

function renderSuccess() {
  app.innerHTML = `<main class="success-shell"><div class="success-mark">✓</div><div class="section-kicker">SCFIT CONCEPT TEST</div><h1>Thank you for testing SCFit.</h1><p>Your response has been recorded and will help our team evaluate the SCFit concept.</p><div class="success-rule"></div><span>✦ scfit · USC fitness community</span></main>`;
}

function bindStepEvents() {
  document.querySelector('#back-button').addEventListener('click', () => {
    state.step = Math.max(1, state.step - 1);
    persist();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.querySelectorAll('.question input, .question textarea').forEach((input) => {
    input.addEventListener('input', () => {
      state.answers[input.name] = input.value;
      persist();
    });
    input.addEventListener('change', () => {
      const fieldset = input.closest('.question');
      const id = fieldset.dataset.question;
      if (fieldset.dataset.type === 'checkbox') {
        const selected = [...fieldset.querySelectorAll('input:checked')].map((control) => control.value);
        const limit = Number(fieldset.dataset.maxSelections);
        const error = fieldset.querySelector('.field-error');
        if (limit && selected.length > limit) {
          input.checked = false;
          error.textContent = `Select up to ${limit}.`;
          error.hidden = false;
        }
        state.answers[id] = [...fieldset.querySelectorAll('input:checked')].map((control) => control.value);
      } else if (input.type === 'radio') {
        state.answers[id] = input.value;
      }
      fieldset.querySelectorAll('.option-card').forEach((card) => card.classList.toggle('selected', card.querySelector('input').checked));
      const other = fieldset.querySelector('.other-field');
      if (other) other.hidden = !state.answers[id]?.includes('Other');
      persist();
    });
  });
  document.querySelector('#continue-button')?.addEventListener('click', continueStep);
  document.querySelector('#prototype-link')?.addEventListener('click', openPrototype);
  document.querySelector('#ready-button')?.addEventListener('click', confirmReturn);
}

async function startSurvey() {
  const button = document.querySelector('#start-button');
  const error = document.querySelector('#landing-error');
  button.disabled = true;
  button.innerHTML = 'Starting…';
  error.hidden = true;
  try {
    const result = await api('/api/sessions', { method: 'POST', body: JSON.stringify({ session_id: state.sessionId }) });
    state.sessionId = result.session_id;
    state.startedAt = Date.now();
    state.step = 1;
    persist();
    render();
  } catch (failure) {
    error.textContent = failure.message;
    error.hidden = false;
    button.disabled = false;
    button.innerHTML = 'Start Concept Test <span>→</span>';
  }
}

// Native anchor click: navigation to the prototype happens natively via href/target=_blank.
// This listener only records state — it must never block or intercept navigation.
function openPrototype() {
  state.openedAt = state.openedAt || Date.now();
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (state.sessionId) {
    fetch(`${API_BASE}/api/events/prototype-opened`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: state.sessionId }),
      keepalive: true,
    }).catch(() => {});
  }
}

async function confirmReturn() {
  const button = document.querySelector('#ready-button');
  const error = document.querySelector('#global-error');
  button.disabled = true;
  button.innerHTML = 'Recording…';
  try {
    await api('/api/events/prototype-returned', { method: 'POST', body: JSON.stringify({ session_id: state.sessionId }) });
    state.returnedAt = Date.now();
    state.step = 3;
    persist();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (failure) {
    error.textContent = failure.message;
    error.hidden = false;
    button.disabled = false;
    button.innerHTML = 'I explored SCFit — continue <span>→</span>';
  }
}

function validateCurrentStep() {
  let firstInvalid = null;
  document.querySelectorAll('.question').forEach((fieldset) => {
    const id = fieldset.dataset.question;
    const type = fieldset.dataset.type;
    const error = fieldset.querySelector('.field-error');
    let message = '';
    const answer = state.answers[id];
    if (fieldset.dataset.required === 'true' && (type === 'checkbox' ? !answer?.length : !answer)) {
      message = 'Please select an answer to continue.';
    }
    if (type === 'email' && answer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
      message = 'Enter a valid email address, or leave this field blank.';
    }
    error.textContent = message;
    error.hidden = !message;
    fieldset.classList.toggle('has-error', Boolean(message));
    if (message && !firstInvalid) firstInvalid = fieldset;
  });
  firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return !firstInvalid;
}

async function continueStep() {
  if (!validateCurrentStep()) return;
  if (state.step === sections.length) return submitResponse();
  state.step += 1;
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitResponse() {
  const button = document.querySelector('#continue-button');
  const error = document.querySelector('#global-error');
  submitting = true;
  button.disabled = true;
  button.innerHTML = 'Submitting…';
  error.hidden = true;
  try {
    const answers = { ...state.answers, session_id: state.sessionId };
    await api('/api/responses', { method: 'POST', body: JSON.stringify(answers) });
    state.complete = true;
    localStorage.removeItem(STORAGE_KEY);
    render();
  } catch (failure) {
    error.textContent = failure.message;
    error.hidden = false;
    submitting = false;
    button.disabled = false;
    button.innerHTML = 'Submit response <span>→</span>';
    error.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

render();