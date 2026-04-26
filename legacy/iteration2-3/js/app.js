// app.js - 메인 앱: 온보딩, 라우팅, 대시보드, 퀴즈뷰, 세션 요약
// 불변성 원칙: 상태 변경은 새 변수 할당, DOM은 innerHTML 교체

import {
  extractCategories,
  filterByCategory,
  getIncorrectQuestions,
  getIncorrectCount,
} from './quiz-engine.js';
import {
  markCorrect,
  markIncorrect,
  resetProgress,
  loadPreferences,
  savePreferences,
  hasCompletedOnboarding,
  REGIONS,
  SCHOOL_LEVELS,
} from './storage.js';

// ── 앱 상태 ──
let questionBank = [];
let categoryMap = {};
let sessionQuestions = [];
let currentIndex = 0;
let sessionCorrect = 0;
let sessionWrong = 0;
let sessionWrongList = [];
let answered = false;
let currentMode = '';
let currentCategoryLabel = '';

const app = document.getElementById('app');

// ── 카테고리 메타 ──
const CATEGORY_META = {
  '인사실무': { icon: '👔', color: '#4f46e5', bg: '#eef2ff' },
  '생기부기재요령': { icon: '📝', color: '#0891b2', bg: '#ecfeff' },
  '학적업무': { icon: '🎓', color: '#7c3aed', bg: '#f5f3ff' },
};
const DEFAULT_META = { icon: '📋', color: '#6b7280', bg: '#f3f4f6' };

// ══════════════════════════════════
// 데이터 로드
// ══════════════════════════════════

async function loadQuestionBank() {
  try {
    const res = await fetch('./questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    questionBank = await res.json();
    categoryMap = extractCategories(questionBank);
  } catch (err) {
    app.innerHTML = `<div class="error-screen"><h2>문제 데이터를 불러올 수 없습니다.</h2><p>${err.message}</p></div>`;
    console.error('[app] Load failed:', err);
  }
}

// ══════════════════════════════════
// 온보딩 (최초 실행 시 지역/학교급 선택)
// ══════════════════════════════════

function renderOnboarding() {
  const regionOptions = REGIONS.map((r) =>
    `<button class="onboard-chip" data-region="${escapeAttr(r)}">${escapeHtml(r)}</button>`
  ).join('');

  const levelOptions = SCHOOL_LEVELS.map((l) =>
    `<button class="onboard-chip" data-level="${escapeAttr(l)}">${escapeHtml(l)}</button>`
  ).join('');

  app.innerHTML = `
    <div class="onboarding">
      <div class="onboard-header">
        <div class="onboard-icon">📖</div>
        <h1 class="onboard-title">환영합니다!</h1>
        <p class="onboard-desc">응시 지역과 학교급을 선택해 주세요.<br>맞춤형 문제가 제공됩니다.</p>
      </div>

      <div class="onboard-section">
        <h2 class="onboard-label">응시 지역</h2>
        <div class="onboard-chips" id="region-chips">
          ${regionOptions}
        </div>
      </div>

      <div class="onboard-section">
        <h2 class="onboard-label">학교급</h2>
        <div class="onboard-chips" id="level-chips">
          ${levelOptions}
        </div>
      </div>

      <button class="btn-primary btn-onboard-start disabled" id="btn-onboard-start" disabled>시작하기</button>
    </div>
  `;

  let selectedRegion = null;
  let selectedLevel = null;
  const startBtn = document.getElementById('btn-onboard-start');

  function updateStartBtn() {
    if (selectedRegion && selectedLevel) {
      startBtn.classList.remove('disabled');
      startBtn.disabled = false;
    } else {
      startBtn.classList.add('disabled');
      startBtn.disabled = true;
    }
  }

  // 지역 선택
  document.querySelectorAll('#region-chips .onboard-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#region-chips .onboard-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedRegion = chip.dataset.region;
      updateStartBtn();
    });
  });

  // 학교급 선택
  document.querySelectorAll('#level-chips .onboard-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#level-chips .onboard-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedLevel = chip.dataset.level;
      updateStartBtn();
    });
  });

  startBtn.addEventListener('click', () => {
    if (!selectedRegion || !selectedLevel) return;
    savePreferences(selectedRegion, selectedLevel);
    categoryMap = extractCategories(questionBank);
    renderDashboard();
  });
}

// ══════════════════════════════════
// 설정 변경 모달
// ══════════════════════════════════

function openSettingsModal() {
  const prefs = loadPreferences();

  const regionChips = REGIONS.map((r) =>
    `<button class="onboard-chip${prefs && prefs.region === r ? ' selected' : ''}" data-region="${escapeAttr(r)}">${escapeHtml(r)}</button>`
  ).join('');

  const levelChips = SCHOOL_LEVELS.map((l) =>
    `<button class="onboard-chip${prefs && prefs.school_level === l ? ' selected' : ''}" data-level="${escapeAttr(l)}">${escapeHtml(l)}</button>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-settings">
      <div class="modal-header" style="background:#eef2ff">
        <span class="modal-icon">⚙️</span>
        <h2 class="modal-title">설정 변경</h2>
      </div>
      <div class="modal-body">
        <div class="onboard-section">
          <h3 class="onboard-label">응시 지역</h3>
          <div class="onboard-chips" id="settings-region-chips">${regionChips}</div>
        </div>
        <div class="onboard-section">
          <h3 class="onboard-label">학교급</h3>
          <div class="onboard-chips" id="settings-level-chips">${levelChips}</div>
        </div>
        <button class="btn-primary" id="btn-settings-save" style="margin-top:16px">저장</button>
      </div>
      <button class="modal-close" id="settings-close">✕</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  let selRegion = prefs ? prefs.region : null;
  let selLevel = prefs ? prefs.school_level : null;

  overlay.querySelectorAll('#settings-region-chips .onboard-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      overlay.querySelectorAll('#settings-region-chips .onboard-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selRegion = chip.dataset.region;
    });
  });

  overlay.querySelectorAll('#settings-level-chips .onboard-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      overlay.querySelectorAll('#settings-level-chips .onboard-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selLevel = chip.dataset.level;
    });
  });

  overlay.querySelector('#btn-settings-save').addEventListener('click', () => {
    if (selRegion && selLevel) {
      savePreferences(selRegion, selLevel);
      categoryMap = extractCategories(questionBank);
      closeModal(overlay);
      renderDashboard();
    }
  });

  overlay.querySelector('#settings-close').addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
}

// ══════════════════════════════════
// 대시보드
// ══════════════════════════════════

function renderDashboard() {
  sessionQuestions = [];
  currentIndex = 0;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionWrongList = [];
  answered = false;

  const prefs = loadPreferences();
  const incorrectCount = getIncorrectCount();
  const categories = Object.keys(categoryMap);

  const cardsHtml = categories.map((cat) => {
    const meta = CATEGORY_META[cat] || DEFAULT_META;
    const subs = categoryMap[cat];
    return `
      <div class="cat-card" data-category="${escapeAttr(cat)}">
        <div class="cat-card-icon" style="background:${meta.bg};color:${meta.color}">${meta.icon}</div>
        <div class="cat-card-body">
          <h3 class="cat-card-title">${escapeHtml(cat)}</h3>
          <p class="cat-card-sub">${subs.map(escapeHtml).join(' · ')}</p>
        </div>
        <span class="cat-card-arrow">›</span>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="dashboard">
      <header class="dash-header">
        <h1 class="dash-title">교육전문직 문제은행</h1>
        <p class="dash-subtitle">장학사 시험 대비 학습 시스템</p>
      </header>

      <div class="pref-bar">
        <span class="pref-badge">${prefs ? `${escapeHtml(prefs.region)} · ${escapeHtml(prefs.school_level)}` : '설정 없음'}</span>
        <button class="btn-settings" id="btn-settings">⚙️ 설정</button>
      </div>

      ${incorrectCount > 0 ? `
        <button class="incorrect-banner" id="btn-incorrect">
          <span class="incorrect-banner-icon">🔴</span>
          <span class="incorrect-banner-text">내 오답 노트 풀기 <strong>(${incorrectCount}문제)</strong></span>
          <span class="incorrect-banner-arrow">→</span>
        </button>
      ` : `
        <div class="incorrect-banner-empty">
          <span>✅ 오답 노트가 비어 있습니다</span>
        </div>
      `}

      <h2 class="section-label">과목 선택</h2>
      <div class="cat-cards">
        ${cardsHtml}
      </div>

      <button class="btn-reset-small" id="btn-reset">학습 이력 초기화</button>
    </div>
  `;

  // 이벤트
  document.getElementById('btn-settings').addEventListener('click', openSettingsModal);

  document.querySelectorAll('.cat-card').forEach((card) => {
    card.addEventListener('click', () => openSubcategoryModal(card.dataset.category));
  });

  const btnIncorrect = document.getElementById('btn-incorrect');
  if (btnIncorrect) {
    btnIncorrect.addEventListener('click', startIncorrectSession);
  }

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('모든 학습 이력과 오답 기록을 초기화하시겠습니까?')) {
      resetProgress();
      renderDashboard();
    }
  });
}

// ══════════════════════════════════
// 서브카테고리 모달
// ══════════════════════════════════

function openSubcategoryModal(category) {
  const meta = CATEGORY_META[category] || DEFAULT_META;
  const subs = categoryMap[category] || [];

  const subsHtml = subs.map((sub) => `
    <button class="sub-btn" data-sub="${escapeAttr(sub)}">${escapeHtml(sub)}</button>
  `).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header" style="background:${meta.bg}">
        <span class="modal-icon">${meta.icon}</span>
        <h2 class="modal-title">${escapeHtml(category)}</h2>
      </div>
      <div class="modal-body">
        <p class="modal-desc">세부 카테고리를 선택하세요</p>
        <button class="sub-btn sub-btn-all" data-sub="">전체 문제 풀기</button>
        ${subsHtml}
      </div>
      <button class="modal-close" id="modal-close">✕</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  overlay.querySelectorAll('.sub-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sub = btn.dataset.sub || null;
      closeModal(overlay);
      startCategorySession(category, sub);
    });
  });

  overlay.querySelector('#modal-close').addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
}

function closeModal(overlay) {
  overlay.classList.remove('active');
  setTimeout(() => overlay.remove(), 200);
}

// ══════════════════════════════════
// 세션 시작
// ══════════════════════════════════

function startCategorySession(category, subcategory) {
  currentMode = 'category';
  currentCategoryLabel = subcategory ? `${category} > ${subcategory}` : `${category} > 전체`;
  sessionQuestions = filterByCategory(questionBank, category, subcategory);
  currentIndex = 0;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionWrongList = [];

  if (sessionQuestions.length === 0) {
    app.innerHTML = `
      <div class="empty-state">
        <p>해당 카테고리에 문제가 없습니다.</p>
        <button class="btn-primary" id="btn-back">돌아가기</button>
      </div>
    `;
    document.getElementById('btn-back').addEventListener('click', renderDashboard);
    return;
  }
  renderQuiz();
}

function startIncorrectSession() {
  currentMode = 'incorrect';
  currentCategoryLabel = '오답 노트';
  sessionQuestions = getIncorrectQuestions(questionBank);
  currentIndex = 0;
  sessionCorrect = 0;
  sessionWrong = 0;
  sessionWrongList = [];

  if (sessionQuestions.length === 0) {
    app.innerHTML = `
      <div class="empty-state">
        <p>오답 노트에 문제가 없습니다!</p>
        <button class="btn-primary" id="btn-back">돌아가기</button>
      </div>
    `;
    document.getElementById('btn-back').addEventListener('click', renderDashboard);
    return;
  }
  renderQuiz();
}

// ══════════════════════════════════
// 퀴즈 뷰 (100% 터치 버튼 기반)
// ══════════════════════════════════

function renderQuiz() {
  if (currentIndex >= sessionQuestions.length) {
    renderSessionSummary();
    return;
  }

  answered = false;
  const q = sessionQuestions[currentIndex];
  const qNum = currentIndex + 1;

  let optionsHtml = '';
  if (q.type === 'ox_quiz') {
    // OX 퀴즈: 큼직한 터치 버튼 2개
    optionsHtml = `
      <div class="ox-grid">
        <button class="ox-btn ox-o" data-value="O">
          <span class="ox-circle">O</span>
          <span class="ox-label">맞다</span>
        </button>
        <button class="ox-btn ox-x" data-value="X">
          <span class="ox-circle">X</span>
          <span class="ox-label">틀리다</span>
        </button>
      </div>
    `;
  } else {
    // 객관식: 터치 친화적 카드형 버튼
    optionsHtml = `
      <div class="options-grid">
        ${q.options.map((opt, i) => `
          <button class="option-btn" data-value="${escapeAttr(opt)}">
            <span class="option-label">${i + 1}</span>
            <span class="option-text">${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  app.innerHTML = `
    <div class="quiz-view">
      <div class="quiz-top-bar">
        <button class="btn-icon" id="btn-end-session" title="학습 종료">✕</button>
        <span class="quiz-breadcrumb">${escapeHtml(currentCategoryLabel)}</span>
        <span class="quiz-counter">${qNum}번째 문제</span>
      </div>

      <div class="question-card">
        <div class="q-type-badge ${q.type === 'ox_quiz' ? 'badge-ox' : 'badge-mc'}">
          ${q.type === 'ox_quiz' ? 'OX 퀴즈' : '객관식'}
        </div>
        <p class="question-text">${escapeHtml(q.question)}</p>
        ${optionsHtml}
      </div>

      <div id="feedback-area" class="feedback-area hidden"></div>

      <div class="quiz-bottom-bar hidden" id="quiz-bottom">
        <button class="btn-next" id="btn-next">다음 문제로 →</button>
        <button class="btn-end-text" id="btn-end-mid">학습 종료</button>
      </div>
    </div>
  `;

  // 이벤트: 보기 클릭 (터치)
  document.querySelectorAll('.option-btn, .ox-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      submitAnswer(q, btn.dataset.value);
    });
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    currentIndex += 1;
    renderQuiz();
  });

  document.getElementById('btn-end-session').addEventListener('click', renderSessionSummary);
  document.getElementById('btn-end-mid').addEventListener('click', renderSessionSummary);
}

function submitAnswer(question, userAnswer) {
  answered = true;
  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);

  if (isCorrect) {
    markCorrect(question.id);
    sessionCorrect += 1;
  } else {
    markIncorrect(question.id);
    sessionWrong += 1;
    sessionWrongList = [...sessionWrongList, question];
  }

  // 보기 하이라이트
  document.querySelectorAll('.option-btn, .ox-btn').forEach((btn) => {
    btn.classList.add('disabled');
    const val = btn.dataset.value;
    if (normalizeAnswer(val) === normalizeAnswer(question.answer)) {
      btn.classList.add('correct');
    } else if (normalizeAnswer(val) === normalizeAnswer(userAnswer) && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  // 피드백 + 해설
  const feedbackArea = document.getElementById('feedback-area');
  feedbackArea.classList.remove('hidden');
  feedbackArea.innerHTML = `
    <div class="feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
      <div class="feedback-header">
        <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
        <span class="feedback-title">${isCorrect ? '정답입니다!' : '틀렸습니다'}</span>
      </div>
      ${!isCorrect ? `<div class="feedback-answer">정답: <strong>${escapeHtml(question.answer)}</strong></div>` : ''}
    </div>
    <div class="explanation-box">
      <div class="explanation-label">📖 해설 · 근거 지침</div>
      <div class="explanation-content">${formatExplanation(question.explanation)}</div>
    </div>
  `;

  document.getElementById('quiz-bottom').classList.remove('hidden');
}

// ══════════════════════════════════
// 세션 요약
// ══════════════════════════════════

function renderSessionSummary() {
  const total = sessionCorrect + sessionWrong;
  const accuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;

  const wrongListHtml = sessionWrongList.length > 0
    ? sessionWrongList.map((q) => `
        <div class="wrong-item">
          <span class="wrong-item-cat">${escapeHtml(q.subcategory)}</span>
          <p class="wrong-item-q">${escapeHtml(q.question)}</p>
          <p class="wrong-item-a">정답: ${escapeHtml(q.answer)}</p>
        </div>
      `).join('')
    : '<p class="no-wrong">틀린 문제가 없습니다!</p>';

  app.innerHTML = `
    <div class="summary-screen">
      <div class="summary-header">
        <h1 class="summary-title">학습 결과</h1>
        <p class="summary-label">${escapeHtml(currentCategoryLabel)}</p>
      </div>

      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-number">${total}</div>
          <div class="stat-label">풀이 수</div>
        </div>
        <div class="stat-card stat-correct">
          <div class="stat-number">${sessionCorrect}</div>
          <div class="stat-label">정답</div>
        </div>
        <div class="stat-card stat-wrong">
          <div class="stat-number">${sessionWrong}</div>
          <div class="stat-label">오답</div>
        </div>
        <div class="stat-card stat-accuracy">
          <div class="stat-number">${accuracy}%</div>
          <div class="stat-label">정답률</div>
        </div>
      </div>

      ${sessionWrongList.length > 0 ? `
        <div class="wrong-section">
          <h2 class="wrong-section-title">❌ 틀린 문제 목록</h2>
          <p class="wrong-section-hint">아래 문제들이 오답 노트에 저장되었습니다.</p>
          ${wrongListHtml}
        </div>
      ` : `
        <div class="perfect-section">
          <div class="perfect-icon">🏆</div>
          <p>모든 문제를 맞추셨습니다!</p>
        </div>
      `}

      <div class="summary-actions">
        <button class="btn-primary" id="btn-home">홈으로 돌아가기</button>
        ${getIncorrectCount() > 0 ? `
          <button class="btn-outline" id="btn-go-incorrect">오답 노트 풀기 (${getIncorrectCount()})</button>
        ` : ''}
      </div>
    </div>
  `;

  document.getElementById('btn-home').addEventListener('click', renderDashboard);
  const btnGoIncorrect = document.getElementById('btn-go-incorrect');
  if (btnGoIncorrect) {
    btnGoIncorrect.addEventListener('click', startIncorrectSession);
  }
}

// ══════════════════════════════════
// 유틸리티
// ══════════════════════════════════

function normalizeAnswer(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatExplanation(text) {
  return escapeHtml(text)
    .replace(/\n/g, '<br>')
    .replace(/•/g, '<span class="bullet">•</span>')
    .replace(/※/g, '<span class="note-mark">※</span>')
    .replace(/「([^」]+)」/g, '<span class="law-ref">「$1」</span>')
    .replace(/←/g, '<span class="highlight-arrow">←</span>');
}

// ══════════════════════════════════
// 초기화
// ══════════════════════════════════

async function init() {
  await loadQuestionBank();
  if (questionBank.length === 0) return;

  if (hasCompletedOnboarding()) {
    renderDashboard();
  } else {
    renderOnboarding();
  }
}

init();
