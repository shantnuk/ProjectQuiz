const API_BASE = "https://my-json-server.typicode.com/shantnuk/newJSON";

// Compile each template separately
const startTpl = Handlebars.compile(document.getElementById("start").innerHTML);
const questionTpl = Handlebars.compile(document.getElementById("question").innerHTML);
const feedbackCorrectTpl = Handlebars.compile(document.getElementById("feedback-correct").innerHTML);
const feedbackIncorrectTpl = Handlebars.compile(document.getElementById("feedback-incorrect").innerHTML);
const finalTpl = Handlebars.compile(document.getElementById("final").innerHTML);

// All quiz variables are now stored in one state object
let state = {
  studentName: "",
  quizId: "",
  currentQuestionIndex: 1,
  totalQuestions: 5,
  score: 0,
  startTime: 0,
  timerInterval: null
};

function render(template, context = {}) {
  document.getElementById("main-widget").innerHTML = template(context);
}

function init() {
  render(startTpl);
  document.getElementById("start-form").addEventListener("submit", startQuiz);
}

function startQuiz(e) {
  e.preventDefault();
  state.studentName = document.getElementById("name").value.trim();
  state.quizId = document.getElementById("quiz-select").value;

  if (!state.studentName) {
    alert("Please enter your name.");
    return;
  }

  state.currentQuestionIndex = 1;
  state.score = 0;
  state.startTime = Date.now();

  state.timerInterval = setInterval(updateTimer, 1000);

  loadQuestion();
}

function updateTimer() {
  const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
  const timerSpan = document.querySelector(".scoreboard span:nth-child(3)");
  if (timerSpan) timerSpan.textContent = `Time: ${elapsedTime}s`;
}

async function loadQuestion() {
  try {
    const response = await fetch(`${API_BASE}/questions?quizId=${state.quizId}&id=${state.currentQuestionIndex}`);
    const data = await response.json();
    const question = data[0];

    if (!question) {
      clearInterval(state.timerInterval);
      showFinalResults();
      return;
    }

    let context = {
      currentQuestion: state.currentQuestionIndex,
      totalQuestions: state.totalQuestions,
      score: state.score,
      elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    };

    if (question.type === "multiple") {
      context.isMultipleChoice = true;
      context.options = question.options;
    } else if (question.type === "narrative") {
      context.isNarrative = true;
    } else if (question.type === "image") {
      context.isImageSelection = true;
      context.imageOptions = question.imageOptions;
    }

    render(questionTpl, context);
    addQuestionHandlers(context);
  } catch (error) {
    console.error("Error loading question:", error);
  }
}

function addQuestionHandlers(context) {
  const optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach(button => {
    button.addEventListener("click", () => {
      handleAnswer(button.getAttribute("data-answer"), context);
    });
  });

  const narrativeForm = document.getElementById("narrative-form");
  if (narrativeForm) {
    narrativeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const answer = document.getElementById("narrative-answer").value.trim();
      handleAnswer(answer, context);
    });
  }

  const imgOptions = document.querySelectorAll(".img-option");
  imgOptions.forEach(img => {
    img.addEventListener("click", () => {
      handleAnswer(img.getAttribute("data-answer"), context);
    });
  });
}

function handleAnswer(answer, context) {
  if (answer.toLowerCase() === context.correctAnswer.toLowerCase()) {
    state.score++;
    showCorrectFeedback();
  } else {
    showIncorrectFeedback(context);
  }
}

function showCorrectFeedback() {
  const feedbackHtml = feedbackCorrectTpl({ message: getEncouragingMessage() });
  document.getElementById("main-widget").innerHTML = feedbackHtml;

  setTimeout(() => {
    nextQuestion();
  }, 1000);
}

function showIncorrectFeedback(context) {
  const feedbackHtml = feedbackIncorrectTpl({
    correctAnswer: context.correctAnswer,
    explanation: context.explanation
  });
  document.getElementById("main-widget").innerHTML = feedbackHtml;
  document.getElementById("got-it-btn").addEventListener("click", nextQuestion);
}

function getEncouragingMessage() {
  const messages = ["Brilliant!", "Awesome!", "Good work!"];
  return messages[Math.floor(Math.random() * messages.length)];
}

function nextQuestion() {
  if (state.currentQuestionIndex < state.totalQuestions) {
    state.currentQuestionIndex++;
    loadQuestion();
  } else {
    clearInterval(state.timerInterval);
    showFinalResults();
  }
}

function showFinalResults() {
  const percentScore = (state.score / state.totalQuestions) * 100;
  const resultMessage = percentScore >= 80
    ? `Congratulations ${state.studentName}! You pass the quiz`
    : `Sorry ${state.studentName}, you fail the quiz`;

  const finalHtml = finalTpl({
    resultMessage: resultMessage,
    score: state.score,
    totalQuestions: state.totalQuestions
  });

  document.getElementById("main-widget").innerHTML = finalHtml;

  document.getElementById("retest-btn").addEventListener("click", retakeQuiz);
  document.getElementById("home-btn").addEventListener("click", init);
}

function retakeQuiz() {
  state.currentQuestionIndex = 1;
  state.score = 0;
  state.startTime = Date.now();
  state.timerInterval = setInterval(updateTimer, 1000);
  loadQuestion();
}

document.addEventListener("DOMContentLoaded", init);
