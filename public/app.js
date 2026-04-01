/* ============================================
   GlowGuide — App Logic
   ============================================ */

// --- State ---
let currentStep = 0;
const totalSteps = 7;

const answers = {
  age: null,
  gender: null,
  skinType: null,
  concerns: [],
  allergies: [],
  budget: null,
};

// --- Step Navigation ---
function nextStep() {
  const current = document.getElementById(`step-${currentStep}`);
  current.style.animation = 'fadeSlideOut 0.3s ease forwards';

  setTimeout(() => {
    current.classList.remove('active');
    current.style.animation = '';
    currentStep++;

    if (currentStep === totalSteps) {
      renderSummary();
    }

    const next = document.getElementById(`step-${currentStep}`);
    next.classList.add('active');
    next.style.animation = 'fadeSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 280);
}

function prevStep() {
  const current = document.getElementById(`step-${currentStep}`);
  current.classList.remove('active');
  currentStep--;

  const prev = document.getElementById(`step-${currentStep}`);
  prev.classList.add('active');
  prev.style.animation = 'fadeSlideIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Single-Select ---
function selectOption(btn, field) {
  const parent = btn.closest('.options-grid');
  parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  answers[field] = btn.dataset.value;

  // Enable next button
  const nextBtn = btn.closest('.step-card').querySelector('.btn-next');
  if (nextBtn) nextBtn.disabled = false;
}

// --- Multi-Select ---
function toggleMulti(btn, field) {
  // If "None" was selected before, deselect it
  const parent = btn.closest('.options-grid');
  const noneBtn = parent.querySelector('.option-none');
  if (noneBtn && noneBtn.classList.contains('selected') && btn !== noneBtn) {
    noneBtn.classList.remove('selected');
    answers[field] = answers[field].filter(v => v !== 'None');
  }

  btn.classList.toggle('selected');

  if (btn.classList.contains('selected')) {
    answers[field].push(btn.dataset.value);
  } else {
    answers[field] = answers[field].filter(v => v !== btn.dataset.value);
  }

  // Enable next if at least one selected
  const nextBtn = btn.closest('.step-card').querySelector('.btn-next');
  if (nextBtn) nextBtn.disabled = answers[field].length === 0;
}

function toggleNone(btn, field) {
  const parent = btn.closest('.options-grid');

  // Deselect all others
  parent.querySelectorAll('.option-btn').forEach(b => {
    if (b !== btn) b.classList.remove('selected');
  });

  btn.classList.toggle('selected');
  answers[field] = btn.classList.contains('selected') ? ['None'] : [];

  const nextBtn = btn.closest('.step-card').querySelector('.btn-next');
  if (nextBtn) nextBtn.disabled = answers[field].length === 0;
}

// --- Summary ---
function renderSummary() {
  const grid = document.getElementById('profileSummary');
  grid.innerHTML = `
    <div class="summary-item">
      <div class="summary-item-label">Age</div>
      <div class="summary-item-value">${answers.age}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Gender</div>
      <div class="summary-item-value">${answers.gender}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Skin Type</div>
      <div class="summary-item-value">${answers.skinType}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Budget</div>
      <div class="summary-item-value">${answers.budget}</div>
    </div>
    <div class="summary-item full-width">
      <div class="summary-item-label">Concerns</div>
      <div class="summary-item-value">${answers.concerns.join(', ')}</div>
    </div>
    <div class="summary-item full-width">
      <div class="summary-item-label">Allergies</div>
      <div class="summary-item-value">${answers.allergies.join(', ')}</div>
    </div>
  `;
}

// --- Generate Routine ---
async function generateRoutine() {
  const btn = document.getElementById('btnGenerate');
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');

  btnText.style.display = 'none';
  btnLoader.style.display = 'inline-flex';
  btn.disabled = true;

  // Show full-screen loading
  showLoading();

  try {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Something went wrong');
    }

    hideLoading();
    showResults(result.data);
  } catch (err) {
    hideLoading();
    alert('Oops! ' + err.message + '\n\nPlease try again.');
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    btn.disabled = false;
  }
}

// --- Loading Screen ---
const loadingMessages = [
  'Analyzing your skin profile...',
  'Searching for the perfect products...',
  'Crafting your personalized routine...',
  'Almost there, making it glow! ✨',
];

let loadingInterval;

function showLoading() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.id = 'loadingOverlay';
  overlay.innerHTML = `
    <div class="loading-spinner-lg"></div>
    <div class="loading-text">Creating Your Routine</div>
    <div class="loading-subtext" id="loadingSubtext">${loadingMessages[0]}</div>
  `;
  document.body.appendChild(overlay);

  let msgIndex = 0;
  loadingInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % loadingMessages.length;
    const subtext = document.getElementById('loadingSubtext');
    if (subtext) subtext.textContent = loadingMessages[msgIndex];
  }, 2500);
}

function hideLoading() {
  clearInterval(loadingInterval);
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.remove();
}

// --- Render Results ---
function showResults(data) {
  // Hide quiz
  document.getElementById('quizContainer').style.display = 'none';
  const resultsContainer = document.getElementById('resultsContainer');
  resultsContainer.style.display = 'block';

  // Summary
  document.getElementById('resultsSummary').textContent = data.summary || '';

  // Morning Routine
  const morningSteps = document.getElementById('morningSteps');
  morningSteps.innerHTML = (data.morningRoutine || []).map(item => renderStep(item)).join('');

  // Evening Routine
  const eveningSteps = document.getElementById('eveningSteps');
  eveningSteps.innerHTML = (data.eveningRoutine || []).map(item => renderStep(item)).join('');

  // Weekly Treatments
  const weeklySteps = document.getElementById('weeklySteps');
  weeklySteps.innerHTML = (data.weeklyTreatments || []).map(item => `
    <div class="weekly-step">
      <div class="weekly-freq">${item.frequency || 'Weekly'}</div>
      <div class="step-name">${item.name || ''}</div>
      <div class="step-product">${item.product || ''}</div>
      <div class="step-brand">${item.brand || ''}</div>
      <div class="step-reason">${item.reason || ''}</div>
      <a class="step-link" href="${amazonLink(item.product)}" target="_blank" rel="noopener noreferrer">
        🛒 Find on Amazon
      </a>
    </div>
  `).join('');

  // Tips
  const tipsList = document.getElementById('tipsList');
  tipsList.innerHTML = (data.tips || []).map(tip => `<li>${tip}</li>`).join('');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderStep(item) {
  return `
    <div class="routine-step">
      <div class="step-number">${item.step || ''}</div>
      <div class="step-name">${item.name || ''}</div>
      <div class="step-product">${item.product || ''}</div>
      <div class="step-brand">by ${item.brand || ''}</div>
      <div class="step-reason">${item.reason || ''}</div>
      <span class="step-price">${item.priceRange || ''}</span>
      <a class="step-link" href="${amazonLink(item.product)}" target="_blank" rel="noopener noreferrer">
        🛒 Find on Amazon
      </a>
    </div>
  `;
}

function amazonLink(productName) {
  if (!productName) return '#';
  const query = encodeURIComponent(productName);
  return `https://www.amazon.in/s?k=${query}`;
}

// --- Retake ---
function retakeQuiz() {
  // Reset state
  currentStep = 0;
  answers.age = null;
  answers.gender = null;
  answers.skinType = null;
  answers.concerns = [];
  answers.allergies = [];
  answers.budget = null;

  // Reset UI
  document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
  document.querySelectorAll('.btn-next').forEach(btn => btn.disabled = true);

  const btnGenerate = document.getElementById('btnGenerate');
  btnGenerate.disabled = false;
  btnGenerate.querySelector('.btn-text').style.display = 'inline';
  btnGenerate.querySelector('.btn-loader').style.display = 'none';

  // Show quiz, hide results
  document.getElementById('resultsContainer').style.display = 'none';
  const quizContainer = document.getElementById('quizContainer');
  quizContainer.style.display = 'flex';

  // Reset all steps
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-0').classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
