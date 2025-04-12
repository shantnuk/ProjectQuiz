
// api async, gets the questions to begin
async function loadQuestion() {
  try {
    const response = await fetch(`${API_BASE}/questions?quizId=${state.quizId}&id=${state.currentQuestionIndex}`);
    const data = await response.json();
    const question = data[0];

    if (!question) {
      clearInterval(state.timerInterval);
      showGrade();
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
    qHandlers(context);
  } catch (error) {
  }
}

const API_BASE = "https://my-json-server.typicode.com/shantnuk/ProjectQuiz";

// End Of API Related Stuff


function qHandlers(context) {
  const optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach(button => {
    button.addEventListener("click", () => {
      handleAnswer(button.getAttribute("data-answer"), context);
    });
  }); // for mc

  const narrativeForm = document.getElementById("narrative-form");
  if (narrativeForm) {
    narrativeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const answer = document.getElementById("narrative-answer").value;
      handleAnswer(answer, context);
    });
  } // for short answers

  const imgOptions = document.querySelectorAll(".img-option");
  imgOptions.forEach(img => {
    img.addEventListener("click", () => {
      handleAnswer(img.getAttribute("data-answer"), context);
    });
  });
} //  img choices

function handleAnswer(answer, context) {
  if (answer.toLowerCase() === context.correctAnswer.toLowerCase()) { // uniforms the answer
    state.score++;
    showAnswer();
  } 
  else {
    displayWrongAns(context);
  }
}

function showAnswer() {
  const feedbackHtml = feedbackCorrectTpl({ message: "✅ CORRECT!" });
  document.getElementById("main-widget").innerHTML = feedbackHtml;

  setTimeout(() => {
    nextQuestion();
  }, 1000); // 1sec per right answer
}

function displayWrongAns(context) {
  const feedbackHtml = feedbackIncorrectTpl({
    correctAnswer: context.correctAnswer,
    explanation: context.explanation
  });
  document.getElementById("main-widget").innerHTML = feedbackHtml;
  document.getElementById("got-it-btn").addEventListener("click", nextQuestion);
}


function nextQuestion() {
  if (state.currentQuestionIndex < state.totalQuestions) {
    state.currentQuestionIndex++;
    loadQuestion();
  } else {
    clearInterval(state.timerInterval);
    showGrade();
  }
}

function showGrade() {
  const percentScore = (state.score / state.totalQuestions) * 100;
  const resultMessage = percentScore >= 80
    ? `Congratulations ${state.student_Name}! You pass the quiz`
    : `${state.student_Name} failed the quiz. Try again?`;

  const finalHtml = finalTpl({
    resultMessage: resultMessage,
    score: state.score,
    totalQuestions: state.totalQuestions
  });

  document.getElementById("main-widget").innerHTML = finalHtml;

  document.getElementById("retest-btn").addEventListener("click", retakeQuiz);
  document.getElementById("home-btn").addEventListener("click", begin);
}

function retakeQuiz() {
  state.currentQuestionIndex = 1;
  state.score = 0;
  state.startTime = Date.now();
  state.timerInterval = setInterval(updateTimer, 1000);
  loadQuestion();
}



let state = {
  student_Name: "",
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

function begin() {
  render(startTpl);
  document.getElementById("start-form").addEventListener("submit", startQuiz);
}

function startQuiz(e) {
  e.preventDefault();
  state.student_Name = document.getElementById("name").value.trim();
  state.quizId = document.getElementById("quiz-select").value;

  if (!state.student_Name) {
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
  const timerEl = document.querySelector(".scoreboard > div:nth-child(3)");
  if (timerEl) timerEl.textContent = `Time: ${elapsedTime}s`;
}





// handlebar
const startTpl = Handlebars.compile(document.getElementById("start").innerHTML);
const questionTpl = Handlebars.compile(document.getElementById("question").innerHTML);
const feedbackCorrectTpl = Handlebars.compile(document.getElementById("correct").innerHTML);
const feedbackIncorrectTpl = Handlebars.compile(document.getElementById("incorrect").innerHTML);
const finalTpl = Handlebars.compile(document.getElementById("final").innerHTML);

document.addEventListener("DOMContentLoaded", begin);
