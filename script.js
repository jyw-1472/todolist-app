// =============================================
// 가위바위보 게임 - 핵심 로직
// =============================================

// --- 1. 게임에 사용할 데이터 정의 ---

// 컴퓨터가 랜덤으로 고를 선택지 목록
const CHOICES = ['scissors', 'rock', 'paper'];

// 각 선택지에 해당하는 이모지 (화면에 표시용)
const EMOJI = {
  scissors: '✂️',
  rock: '✊',
  paper: '✋',
};

// 어떤 선택이 어떤 선택을 이기는지 정의
// 예: scissors(가위)는 paper(보)를 이긴다
const WINS_AGAINST = {
  scissors: 'paper',
  rock: 'scissors',
  paper: 'rock',
};

// --- 2. 점수 변수 초기화 ---
// 게임이 진행되면서 이 변수들이 증가함
let userScore = 0;
let computerScore = 0;

// --- 3. HTML 요소들을 JavaScript에서 사용할 수 있도록 가져오기 ---
// document.getElementById()는 HTML의 id 속성으로 요소를 찾는 함수
const userScoreEl = document.getElementById('user-score');
const computerScoreEl = document.getElementById('computer-score');
const userChoiceEl = document.getElementById('user-choice');
const computerChoiceEl = document.getElementById('computer-choice');
const resultMessageEl = document.getElementById('result-message');
const resetBtn = document.getElementById('reset-btn');

// querySelectorAll()은 조건에 맞는 요소들을 여러 개 한 번에 가져옴
const choiceButtons = document.querySelectorAll('.choice-btn');

// --- 4. 버튼 클릭 이벤트 연결 ---

// 각 선택 버튼(가위/바위/보)에 클릭 이벤트를 붙임
// forEach: 배열의 각 요소에 같은 작업을 반복
choiceButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    // 버튼의 data-choice 속성 값을 읽어서 사용자의 선택을 알아냄
    // 예: <button data-choice="rock"> → userChoice = 'rock'
    const userChoice = button.dataset.choice;

    // 게임 실행
    playGame(userChoice);
  });
});

// 초기화 버튼 클릭 시 점수 리셋
resetBtn.addEventListener('click', resetGame);

// --- 5. 핵심 게임 함수 ---

/**
 * 게임 한 판을 진행하는 함수
 * @param {string} userChoice - 사용자가 선택한 값 ('scissors' | 'rock' | 'paper')
 */
function playGame(userChoice) {
  // 컴퓨터의 랜덤 선택 (아래 함수 참고)
  const computerChoice = getComputerChoice();

  // 화면에 선택한 이모지 표시
  showChoices(userChoice, computerChoice);

  // 승패 판정 후 결과 표시
  const result = getResult(userChoice, computerChoice);
  showResult(result);

  // 점수 업데이트
  updateScore(result);
}

/**
 * 컴퓨터가 랜덤으로 선택하는 함수
 * Math.random()은 0 이상 1 미만의 소수를 반환
 * Math.floor()는 소수점을 버림 (예: 2.7 → 2)
 */
function getComputerChoice() {
  // 0, 1, 2 중 하나를 랜덤으로 선택
  const randomIndex = Math.floor(Math.random() * CHOICES.length);
  return CHOICES[randomIndex];
}

/**
 * 화면에 사용자와 컴퓨터의 선택 이모지를 표시하는 함수
 */
function showChoices(userChoice, computerChoice) {
  // 기존에 있던 'pop' 애니메이션 클래스를 먼저 제거
  userChoiceEl.classList.remove('pop');
  computerChoiceEl.classList.remove('pop');

  // 이모지 텍스트를 바꿈
  userChoiceEl.textContent = EMOJI[userChoice];
  computerChoiceEl.textContent = EMOJI[computerChoice];

  // 브라우저가 DOM 변경을 인식한 직후 'pop' 클래스를 다시 추가해서 애니메이션 재생
  // requestAnimationFrame: 화면 다음 프레임에 실행하도록 예약 (자연스러운 애니메이션용)
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      userChoiceEl.classList.add('pop');
      computerChoiceEl.classList.add('pop');
    });
  });
}

/**
 * 승패를 계산하는 함수
 * @returns {string} 'win' | 'lose' | 'draw'
 */
function getResult(userChoice, computerChoice) {
  // 같은 선택이면 무승부
  if (userChoice === computerChoice) {
    return 'draw';
  }

  // WINS_AGAINST 표에서 사용자 선택이 상대방 선택을 이기면 승리
  if (WINS_AGAINST[userChoice] === computerChoice) {
    return 'win';
  }

  // 나머지 경우는 패배
  return 'lose';
}

/**
 * 결과 메시지를 화면에 표시하는 함수
 * CSS 클래스를 바꿔서 색상도 함께 변경
 */
function showResult(result) {
  // 이전에 적용된 결과 클래스들을 모두 제거
  resultMessageEl.classList.remove('win', 'lose', 'draw');

  // 결과에 따라 메시지와 색상 클래스 설정
  if (result === 'win') {
    resultMessageEl.textContent = '🎉 이겼습니다!';
    resultMessageEl.classList.add('win');
  } else if (result === 'lose') {
    resultMessageEl.textContent = '😢 졌습니다...';
    resultMessageEl.classList.add('lose');
  } else {
    resultMessageEl.textContent = '🤝 무승부!';
    resultMessageEl.classList.add('draw');
  }
}

/**
 * 점수를 업데이트하고 화면에 반영하는 함수
 */
function updateScore(result) {
  if (result === 'win') {
    userScore += 1; // 이기면 내 점수 +1
  } else if (result === 'lose') {
    computerScore += 1; // 지면 컴퓨터 점수 +1
  }
  // 무승부는 점수 변화 없음

  // 변경된 점수를 HTML에 반영 (textContent로 텍스트를 교체)
  userScoreEl.textContent = userScore;
  computerScoreEl.textContent = computerScore;
}

/**
 * 게임 점수를 초기화하는 함수
 */
function resetGame() {
  // 점수 변수를 0으로 리셋
  userScore = 0;
  computerScore = 0;

  // 화면의 점수 숫자도 0으로 변경
  userScoreEl.textContent = 0;
  computerScoreEl.textContent = 0;

  // 이모지와 메시지도 초기 상태로 되돌림
  userChoiceEl.textContent = '❓';
  computerChoiceEl.textContent = '❓';

  resultMessageEl.textContent = '버튼을 눌러 시작하세요!';
  resultMessageEl.classList.remove('win', 'lose', 'draw');
}
