// app.js - 앱 진입점, 화면 라우팅 및 UI 렌더링
// 불변성 원칙: DOM 업데이트는 innerHTML 교체 방식으로 기존 상태를 변경하지 않음

import { selectDailyQuestions, handleCorrectAnswer, handleWrongAnswer } from './quiz-engine.js';
import { resetProgress } from './storage.js';

let questionBank = [];
let dailyQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let answered = false;

const app = document.getElementById('app');

/**
 * 문제 은행 JSON을 로드한다.
 */
async function loadQuestionBank() {
  try {
    const res = await fetch('./question_bank.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    questionBank = await res.json();
  } catch (err) {
    app.innerHTML = `<div class="error-screen"><h2>문제 데이터를 불러올 수 없습니다.</h2><p>${err.message}</p></div>`;
    console.error('Failed to load question bank:', err);
  }
}

/**
 * 대시보드 화면 렌더링
 */
function renderDashboard() {
  dailyQuestions = selectDailyQuestions(questionBank);
  currentIndex = 0;
  correctCount = 0;
  answered = false;

  const total = dailyQuestions.length;

  app.innerHTML = `
    <div class="dashboard">
      <div class="logo-area">
        <div class="logo-icon">📚</div>
        <h1>간격 반복 학습</h1>
        <p class="subtitle">Spaced Repetition Quiz</p>
      </div>
      <div class="progress-card">
        <div class="progress-label">오늘의 학습</div>
        <div class="progress-numbers">0 / ${total}</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <p class="progress-hint">${total > 0 ? `오늘 풀어야 할 문제가 ${total}개 있습니다.` : '모든 문제를 완료했습니다! 내일 다시 확인하세요.'}</p>
      </div>
      ${total > 0
        ? `<button class="btn-primary" id="btn-start">오늘의 학습 시작하기</button>`
        : `<div class="all-done-msg">🎉 오늘 복습할 문제가 없습니다!</div>`
      }
      <button class="btn-secondary" id="btn-reset">학습 이력 초기화</button>
    </div>
  `;

  if (total > 0) {
    document.getElementById('btn-start').addEventListener('click', () => renderQuiz());
  }
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('모든 학습 이력을 초기화하시겠습니까?')) {
      resetProgress();
      renderDashboard();
    }
  });
}

/**
 * 퀴즈 화면 렌더링
 */
function renderQuiz() {
  if (currentIndex >= dailyQuestions.length) {
    renderCompletion();
    return;
  }

  answered = false;
  const q = dailyQuestions[currentIndex];
  const progressPercent = Math.round((currentIndex / dailyQuestions.length) * 100);

  let optionsHtml = '';

  if (q.type === 'multiple_choice') {
    optionsHtml = `
      <div class="options-grid">
        ${q.options.map((opt, i) => `
          <button class="option-btn" data-value="${escapeHtml(opt)}">
            <span class="option-label">${String.fromCharCode(65 + i)}</span>
            <span class="option-text">${escapeHtml(opt)}</span>
          </button>
        `).join('')}
      </div>
    `;
  } else {
    optionsHtml = `
      <div class="short-answer-area">
        <input type="text" id="short-answer-input" class="short-answer-input" placeholder="답을 입력하세요..." autocomplete="off" />
        <button class="btn-submit" id="btn-submit-short">제출</button>
      </div>
    `;
  }

  app.innerHTML = `
    <div class="quiz-view">
      <div class="quiz-header">
        <div class="quiz-progress-text">문제 ${currentIndex + 1} / ${dailyQuestions.length}</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>
      <div class="question-card">
        <div class="question-type-badge">${q.type === 'multiple_choice' ? '객관식' : '주관식'}</div>
        <p class="question-text">${escapeHtml(q.question)}</p>
        ${optionsHtml}
      </div>
      <div id="feedback-area" class="feedback-area hidden"></div>
      <button class="btn-next hidden" id="btn-next">다음 문제로 →</button>
    </div>
  `;

  // 이벤트 바인딩
  if (q.type === 'multiple_choice') {
    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (answered) return;
        submitAnswer(q, btn.dataset.value);
      });
    });
  } else {
    const input = document.getElementById('short-answer-input');
    const submitBtn = document.getElementById('btn-submit-short');
    submitBtn.addEventListener('click', () => {
      if (answered) return;
      const val = input.value.trim();
      if (!val) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
      }
      submitAnswer(q, val);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !answered) {
        submitBtn.click();
      }
    });
    input.focus();
  }

  document.getElementById('btn-next').addEventListener('click', () => {
    currentIndex += 1;
    renderQuiz();
  });
}

/**
 * 답안 제출 처리
 */
function submitAnswer(question, userAnswer) {
  answered = true;
  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);

  if (isCorrect) {
    handleCorrectAnswer(question.id);
    correctCount += 1;
  } else {
    handleWrongAnswer(question.id);
  }

  // 보기 버튼 스타일 업데이트
  if (question.type === 'multiple_choice') {
    document.querySelectorAll('.option-btn').forEach((btn) => {
      btn.classList.add('disabled');
      if (normalizeAnswer(btn.dataset.value) === normalizeAnswer(question.answer)) {
        btn.classList.add('correct');
      } else if (normalizeAnswer(btn.dataset.value) === normalizeAnswer(userAnswer) && !isCorrect) {
        btn.classList.add('wrong');
      }
    });
  }

  // 피드백 영역
  const feedbackArea = document.getElementById('feedback-area');
  feedbackArea.classList.remove('hidden');
  feedbackArea.innerHTML = `
    <div class="feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}">
      <div class="feedback-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="feedback-title">${isCorrect ? '정답입니다!' : '틀렸습니다'}</div>
      ${!isCorrect ? `<div class="feedback-answer">정답: <strong>${escapeHtml(question.answer)}</strong></div>` : ''}
      <div class="feedback-explanation">${escapeHtml(question.explanation)}</div>
    </div>
  `;

  document.getElementById('btn-next').classList.remove('hidden');
}

/**
 * 완료 화면 렌더링
 */
function renderCompletion() {
  const total = dailyQuestions.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  app.innerHTML = `
    <div class="completion-screen">
      <div class="celebration">
        <div class="confetti-emoji">🎉</div>
        <h1 class="completion-title">오늘의 학습을 완료했습니다!</h1>
        <div class="score-card">
          <div class="score-circle">
            <span class="score-number">${accuracy}%</span>
          </div>
          <p class="score-detail">${total}문제 중 <strong>${correctCount}개</strong> 정답</p>
        </div>
        <p class="completion-message">
          ${accuracy === 100 ? '완벽합니다! 🏆' : accuracy >= 70 ? '잘하셨습니다! 💪' : '틀린 문제는 내일 다시 복습됩니다. 화이팅! 📖'}
        </p>
        <p class="comeback-text">내일 다시 방문하여 복습하세요!</p>
        <button class="btn-primary" id="btn-home">홈으로 돌아가기</button>
      </div>
    </div>
  `;

  document.getElementById('btn-home').addEventListener('click', renderDashboard);

  // 축하 애니메이션 트리거
  triggerConfetti();
}

/**
 * 간단한 축하 애니메이션
 */
function triggerConfetti() {
  const container = document.querySelector('.celebration');
  if (!container) return;

  const emojis = ['🎊', '⭐', '🌟', '✨', '🎉', '💫'];
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.textContent = emojis[i % emojis.length];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    particle.style.animationDuration = `${2 + Math.random() * 2}s`;
    container.appendChild(particle);
  }
}

/**
 * 답안 정규화 (대소문자, 공백 무시)
 */
function normalizeAnswer(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * XSS 방지용 HTML 이스케이프
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 앱 초기화
async function init() {
  await loadQuestionBank();
  if (questionBank.length > 0) {
    renderDashboard();
  }
}

init();
