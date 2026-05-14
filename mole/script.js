// =============================================
// 두더지 잡기 게임 - 핵심 로직
// =============================================

// --- 1. 게임 설정값 ---
const TOTAL_TIME   = 30;   // 게임 제한 시간 (초)
const MOLE_DELAY   = 800;  // 두더지가 나타나 있는 시간 (밀리초)
const MOLE_INTERVAL = 600; // 두더지가 다음에 나타날 때까지 간격 (밀리초)
const HOLE_COUNT   = 9;    // 구멍 개수 (3x3)

// --- 2. 게임 상태 변수 ---
let score        = 0;       // 현재 점수
let timeLeft     = TOTAL_TIME; // 남은 시간
let isPlaying    = false;   // 게임 진행 중 여부
let moleTimer    = null;    // 두더지를 움직이는 타이머 ID
let countdownTimer = null;  // 카운트다운 타이머 ID
let lastHoleIndex = -1;     // 직전에 두더지가 나왔던 구멍 인덱스 (같은 곳 연속 방지)

// --- 3. HTML 요소 가져오기 ---
const boardEl      = document.getElementById('board');
const scoreEl      = document.getElementById('score');
const timeLeftEl   = document.getElementById('time-left');
const overlayEl    = document.getElementById('overlay');
const startBtnEl   = document.getElementById('start-btn');
const finalScoreEl = document.getElementById('final-score');

// --- 4. 구멍 판 생성 ---

/**
 * 게임 보드에 구멍(hole) 9개를 동적으로 생성하는 함수
 * HTML에 직접 쓰지 않고 JavaScript로 만들면 개수를 쉽게 바꿀 수 있음
 */
function buildBoard() {
  boardEl.innerHTML = ''; // 기존 내용 초기화

  for (let i = 0; i < HOLE_COUNT; i++) {
    // <div class="hole"> 생성
    const hole = document.createElement('div');
    hole.classList.add('hole');

    // 구멍 안에 두더지 이모지 <div class="mole"> 생성
    const mole = document.createElement('div');
    mole.classList.add('mole');
    mole.textContent = '🐹'; // 두더지 이모지

    // 구멍 안에 두더지를 넣음
    hole.appendChild(mole);

    // 구멍을 클릭하면 whack() 함수 실행
    hole.addEventListener('click', function () {
      whack(hole);
    });

    // 완성된 구멍을 보드에 추가
    boardEl.appendChild(hole);
  }
}

// 페이지가 열리자마자 구멍판을 만들어 놓음
buildBoard();

// --- 5. 게임 시작 / 종료 ---

// 시작 버튼 클릭 이벤트
startBtnEl.addEventListener('click', startGame);

/**
 * 게임을 시작하는 함수
 */
function startGame() {
  // 상태 초기화
  score     = 0;
  timeLeft  = TOTAL_TIME;
  isPlaying = true;

  // 화면 초기화
  scoreEl.textContent    = 0;
  timeLeftEl.textContent = TOTAL_TIME;
  timeLeftEl.classList.remove('urgent'); // 빨간 강조 제거
  finalScoreEl.textContent = '';

  // 오버레이 숨기기 (게임 화면 노출)
  overlayEl.classList.add('hidden');

  // 혹시 남아있는 타이머가 있으면 정리
  clearInterval(countdownTimer);
  clearTimeout(moleTimer);

  // 모든 구멍에서 두더지 제거
  resetAllHoles();

  // 카운트다운 시작 (1초마다 실행)
  countdownTimer = setInterval(tick, 1000);

  // 두더지 등장 시작
  scheduleMole();
}

/**
 * 게임을 종료하는 함수
 */
function endGame() {
  isPlaying = false;

  // 모든 타이머 정지
  clearInterval(countdownTimer);
  clearTimeout(moleTimer);

  // 두더지 모두 숨김
  resetAllHoles();

  // 최종 점수 메시지 표시
  finalScoreEl.innerHTML = `게임 종료!<br>🏆 최종 점수: <strong>${score}점</strong>`;

  // 버튼 텍스트를 "다시하기"로 변경
  startBtnEl.textContent = '다시하기';

  // 오버레이 다시 표시
  overlayEl.classList.remove('hidden');
}

// --- 6. 카운트다운 타이머 ---

/**
 * 1초마다 호출되는 함수
 * 남은 시간을 1 줄이고, 0이 되면 게임 종료
 */
function tick() {
  timeLeft -= 1;
  timeLeftEl.textContent = timeLeft;

  // 남은 시간이 10초 이하면 빨간색 강조 효과 추가
  if (timeLeft <= 10) {
    timeLeftEl.classList.add('urgent');
  }

  // 시간이 다 되면 게임 종료
  if (timeLeft <= 0) {
    endGame();
  }
}

// --- 7. 두더지 등장 로직 ---

/**
 * 일정 시간 후 두더지를 랜덤한 구멍에 띄우는 함수
 * (재귀 방식: 두더지가 사라진 뒤 다시 자신을 예약 호출)
 */
function scheduleMole() {
  if (!isPlaying) return; // 게임이 끝나면 중단

  // 랜덤 구멍 선택 (직전과 같은 구멍은 피함)
  const holeIndex = getRandomHoleIndex();
  const holes = boardEl.querySelectorAll('.hole');
  const targetHole = holes[holeIndex];

  // 두더지 올려보내기
  showMole(targetHole);

  // MOLE_DELAY ms 후에 두더지를 다시 내림
  moleTimer = setTimeout(function () {
    hideMole(targetHole);

    // 두더지가 내려간 뒤 MOLE_INTERVAL ms 후에 다시 등장 예약
    moleTimer = setTimeout(scheduleMole, MOLE_INTERVAL);
  }, MOLE_DELAY);
}

/**
 * 구멍에서 두더지를 올라오게 하는 함수
 * CSS에서 .hole.active .mole { bottom: 5% } 규칙이 적용됨
 */
function showMole(hole) {
  hole.classList.add('active');
}

/**
 * 구멍으로 두더지를 내려가게 하는 함수
 */
function hideMole(hole) {
  hole.classList.remove('active');
  hole.classList.remove('hit'); // 맞은 표시도 초기화
}

/**
 * 이전과 다른 랜덤 구멍 인덱스를 반환하는 함수
 * 같은 자리에 연속으로 나오면 재미가 없으므로 피함
 */
function getRandomHoleIndex() {
  let index;
  do {
    index = Math.floor(Math.random() * HOLE_COUNT);
  } while (index === lastHoleIndex); // 같은 곳이 나오면 다시 뽑음

  lastHoleIndex = index; // 이번 인덱스를 기억
  return index;
}

/**
 * 모든 구멍의 active / hit 클래스를 제거하는 함수
 */
function resetAllHoles() {
  const holes = boardEl.querySelectorAll('.hole');
  holes.forEach(function (hole) {
    hole.classList.remove('active', 'hit');
  });
}

// --- 8. 두더지 클릭(타격) 처리 ---

/**
 * 구멍을 클릭했을 때 호출되는 함수
 * @param {HTMLElement} hole - 클릭된 구멍 요소
 */
function whack(hole) {
  // 게임 중이 아니거나, 두더지가 올라와 있지 않으면 무시
  if (!isPlaying) return;
  if (!hole.classList.contains('active')) return;

  // 점수 +1
  score += 1;
  scoreEl.textContent = score;

  // 맞은 표시 (.hit 클래스 → 두더지가 어두워짐)
  hole.classList.add('hit');
  hole.classList.remove('active');

  // 짧은 시간 후 맞은 표시 제거
  setTimeout(function () {
    hole.classList.remove('hit');
  }, 300);
}
