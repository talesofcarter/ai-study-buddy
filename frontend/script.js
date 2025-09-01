// Backend API configuration
const API_BASE_URL = "http://localhost:5000/api";

// App State
let state = {
  flashcards: [],
  selectedFlashcards: new Set(),
  currentQuiz: {
    cards: [],
    currentIndex: 0,
    results: [],
    startTime: null,
    endTime: null,
  },
  studyProgress: {
    totalReviewed: 0,
    studiedToday: 0,
    masteryLevel: 0,
    currentStreak: 0,
    lastStudyDate: null,
    subjectMastery: {},
  },
  settings: {
    theme: "light",
    textSize: "normal",
  },
};

// DOM Elements
const elements = {
  themeToggle: document.getElementById("themeToggle"),
  notesInput: document.getElementById("notesInput"),
  clearTextareaBtn: document.getElementById(
    "clearTextareaBtn"
  ),
  generateBtn: document.getElementById("generateBtn"),
  generateSpinner: document.getElementById(
    "generateSpinner"
  ),
  validationMessage: document.getElementById(
    "validationMessage"
  ),
  subjectChips: document.getElementById("subjectChips"),
  inputPanel: document.getElementById("inputPanel"),
  workspace: document.getElementById("workspace"),
  cardsGrid: document.getElementById("cardsGrid"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  tagFilter: document.getElementById("tagFilter"),
  sortSelect: document.getElementById("sortSelect"),
  selectAllBtn: document.getElementById("selectAllBtn"),
  deleteSelectedBtn: document.getElementById(
    "deleteSelectedBtn"
  ),
  exportBtn: document.getElementById("exportBtn"),
  startQuizBtn: document.getElementById("startQuizBtn"),
  focusModeBtn: document.getElementById("focusModeBtn"),
  quizContainer: document.getElementById("quizContainer"),
  quizProgress: document.getElementById("quizProgress"),
  exitQuizBtn: document.getElementById("exitQuizBtn"),
  quizProgressBar: document.getElementById(
    "quizProgressBar"
  ),
  quizCard: document.getElementById("quizCard"),
  quizQuestion: document.getElementById("quizQuestion"),
  quizAnswer: document.getElementById("quizAnswer"),
  quizExplanation: document.getElementById(
    "quizExplanation"
  ),
  revealAnswerBtn: document.getElementById(
    "revealAnswerBtn"
  ),
  nextQuestionBtn: document.getElementById(
    "nextQuestionBtn"
  ),
  quizResults: document.getElementById("quizResults"),
  accuracyRate: document.getElementById("accuracyRate"),
  timeSpent: document.getElementById("timeSpent"),
  cardsReviewed: document.getElementById("cardsReviewed"),
  masteryGain: document.getElementById("masteryGain"),
  reviewList: document.getElementById("reviewList"),
  restartQuizBtn: document.getElementById("restartQuizBtn"),
  progressSidebar: document.getElementById(
    "progressSidebar"
  ),
  sidebarToggle: document.getElementById("sidebarToggle"),
  totalCards: document.getElementById("totalCards"),
  studiedToday: document.getElementById("studiedToday"),
  masteryLevel: document.getElementById("masteryLevel"),
  currentStreak: document.getElementById("currentStreak"),
  subjectMastery: document.getElementById("subjectMastery"),
  recentSets: document.getElementById("recentSets"),
  resetTodayBtn: document.getElementById("resetTodayBtn"),
  focusMode: document.getElementById("focusMode"),
  exitFocusBtn: document.getElementById("exitFocusBtn"),
  focusQuestion: document.getElementById("focusQuestion"),
  focusAnswer: document.getElementById("focusAnswer"),
  focusExplanation: document.getElementById(
    "focusExplanation"
  ),
  focusFlipBtn: document.getElementById("focusFlipBtn"),
  focusNextBtn: document.getElementById("focusNextBtn"),
  helpModal: document.getElementById("helpModal"),
  editCardModal: document.getElementById("editCardModal"),
  exportModal: document.getElementById("exportModal"),
  deleteConfirmModal: document.getElementById(
    "deleteConfirmModal"
  ),
  editQuestion: document.getElementById("editQuestion"),
  editAnswer: document.getElementById("editAnswer"),
  editTags: document.getElementById("editTags"),
  saveEditBtn: document.getElementById("saveEditBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  exportPrintBtn: document.getElementById("exportPrintBtn"),
  confirmDeleteBtn: document.getElementById(
    "confirmDeleteBtn"
  ),
  toastContainer: document.getElementById("toastContainer"),
  helpBtn: document.getElementById("helpBtn"),
};

// Initialize the application with backend health check
async function init() {
  // Check if backend is available
  const backendAvailable = await checkBackendHealth();

  if (!backendAvailable) {
    showToast(
      "Running in offline mode. Some features may be limited.",
      "warning"
    );
  }

  await loadState();
  setupEventListeners();
  renderFlashcards();
  updateProgressSidebar();
  applyTheme();
  validateInput();
  checkEmptyState();
}

// Check backend health
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error("Backend not responding");
    }
    return true;
  } catch (error) {
    console.error("Backend health check failed:", error);
    showToast("Backend server is not available", "warning");
    return false;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener(
    "click",
    toggleTheme
  );

  // Input validation
  elements.notesInput.addEventListener(
    "input",
    validateInput
  );

  // Clear textarea
  elements.clearTextareaBtn.addEventListener(
    "click",
    clearTextarea
  );

  // Subject chips
  Array.from(elements.subjectChips.children).forEach(
    (chip) => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("selected");
        validateInput(); // Revalidate when subjects change
      });
    }
  );

  // Generate flashcards
  elements.generateBtn.addEventListener(
    "click",
    generateFlashcards
  );

  // Search and filter
  elements.searchInput.addEventListener(
    "input",
    debounce(renderFlashcards, 300)
  );
  elements.tagFilter.addEventListener(
    "change",
    renderFlashcards
  );
  elements.sortSelect.addEventListener(
    "change",
    renderFlashcards
  );

  // Selection actions
  elements.selectAllBtn.addEventListener(
    "click",
    toggleSelectAll
  );
  elements.deleteSelectedBtn.addEventListener("click", () =>
    openModal("deleteConfirmModal")
  );
  elements.exportBtn.addEventListener("click", () =>
    openModal("exportModal")
  );

  // Quiz actions
  elements.startQuizBtn.addEventListener(
    "click",
    startQuiz
  );
  elements.exitQuizBtn.addEventListener("click", exitQuiz);
  elements.revealAnswerBtn.addEventListener(
    "click",
    revealAnswer
  );
  elements.nextQuestionBtn.addEventListener(
    "click",
    nextQuestion
  );
  elements.restartQuizBtn.addEventListener(
    "click",
    startQuiz
  );

  // Focus mode
  elements.focusModeBtn.addEventListener(
    "click",
    enterFocusMode
  );
  elements.exitFocusBtn.addEventListener(
    "click",
    exitFocusMode
  );
  elements.focusFlipBtn.addEventListener(
    "click",
    flipFocusCard
  );
  elements.focusNextBtn.addEventListener(
    "click",
    nextFocusCard
  );

  // Sidebar
  elements.sidebarToggle.addEventListener(
    "click",
    toggleSidebar
  );
  elements.resetTodayBtn.addEventListener(
    "click",
    resetTodayProgress
  );

  // Modals
  elements.helpBtn.addEventListener("click", () =>
    openModal("helpModal")
  );
  document
    .querySelectorAll(".close-btn, [data-modal]")
    .forEach((btn) => {
      if (
        btn.tagName === "BUTTON" &&
        btn.hasAttribute("data-modal")
      ) {
        btn.addEventListener("click", () =>
          closeModal(btn.getAttribute("data-modal"))
        );
      }
    });

  // Edit card
  elements.saveEditBtn.addEventListener(
    "click",
    saveCardEdit
  );

  // Export options
  elements.exportJsonBtn.addEventListener(
    "click",
    exportJson
  );
  elements.exportCsvBtn.addEventListener(
    "click",
    exportCsv
  );
  elements.exportPrintBtn.addEventListener(
    "click",
    exportPrint
  );

  // Delete confirmation
  elements.confirmDeleteBtn.addEventListener(
    "click",
    deleteSelectedFlashcards
  );

  // Keyboard shortcuts
  document.addEventListener(
    "keydown",
    handleKeyboardShortcuts
  );
}

// Load state from backend and localStorage
async function loadState() {
  const backendAvailable = await checkBackendHealth();

  if (backendAvailable) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flashcards`
      );
      if (response.ok) {
        const flashcards = await response.json();
        state.flashcards = flashcards;
        showToast(
          "Flashcards loaded from server.",
          "success"
        );
      } else {
        throw new Error(
          "Failed to load flashcards from server"
        );
      }
    } catch (error) {
      console.error("Error loading flashcards:", error);
      showToast(
        "Failed to load flashcards from server. Please check the backend.",
        "warning"
      );
    }
  } else {
    // Keep localStorage fallback for other state like theme and progress
    const savedState = localStorage.getItem("asb:state");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      state.flashcards = parsed.flashcards || [];
      showToast("Running in offline mode.", "warning");
    }
  }

  // Load other state from localStorage (theme, progress, etc.)
  const savedTheme = localStorage.getItem("asb:theme");
  if (savedTheme) {
    state.settings.theme = savedTheme;
  }
  const savedTextSize =
    localStorage.getItem("asb:textSize");
  if (savedTextSize) {
    state.settings.textSize = savedTextSize;
  }
  const savedProgress =
    localStorage.getItem("asb:progress");
  if (savedProgress) {
    state.studyProgress = {
      ...state.studyProgress,
      ...JSON.parse(savedProgress),
    };
  }
}

// Save state to localStorage (study progress only, flashcards are server-side)
function saveState() {
  // Save study progress to localStorage
  localStorage.setItem(
    "asb:progress",
    JSON.stringify(state.studyProgress)
  );
}

// Apply theme preferences
function applyTheme() {
  document.documentElement.setAttribute(
    "data-theme",
    state.settings.theme
  );

  // Update theme toggle icon
  const lightIcon =
    elements.themeToggle.querySelector(".light-icon");
  const darkIcon =
    elements.themeToggle.querySelector(".dark-icon");

  if (state.settings.theme === "light") {
    lightIcon.style.display = "inline";
    darkIcon.style.display = "none";
  } else {
    lightIcon.style.display = "none";
    darkIcon.style.display = "inline";
  }
}

// Toggle between light and dark themes
function toggleTheme() {
  state.settings.theme =
    state.settings.theme === "light" ? "dark" : "light";
  localStorage.setItem("asb:theme", state.settings.theme);
  applyTheme();
}

// Validate input and enable/disable generate button
function validateInput() {
  const text = elements.notesInput.value.trim();
  const selectedSubjects =
    elements.subjectChips.querySelectorAll(
      ".selected"
    ).length;

  const isTextValid = text.length >= 200;
  const hasSubjects = selectedSubjects > 0;
  const hasContent = text.length > 0;

  elements.generateBtn.disabled =
    !isTextValid || !hasSubjects;
  elements.clearTextareaBtn.disabled = !hasContent;

  // Update validation message
  if (text.length > 0 && text.length < 200) {
    elements.validationMessage.textContent = `Please enter at least ${
      200 - text.length
    } more characters`;
    elements.validationMessage.style.display = "block";
  } else if (isTextValid && !hasSubjects) {
    elements.validationMessage.textContent =
      "Please select at least one subject";
    elements.validationMessage.style.display = "block";
  } else {
    elements.validationMessage.style.display = "none";
  }
}

// Clear textarea
function clearTextarea() {
  if (!elements.clearTextareaBtn.disabled) {
    // Only clear if button is enabled
    elements.notesInput.value = "";
    validateInput(); // Update validation and button states
    showToast("Notes cleared", "success");
  }
}

// Generate flashcards from notes using backend API
async function generateFlashcards() {
  const notes = elements.notesInput.value.trim();
  const selectedSubjects = Array.from(
    elements.subjectChips.querySelectorAll(".selected")
  ).map((chip) => chip.getAttribute("data-value"));

  if (notes.length < 200) {
    showToast(
      "Please enter at least 200 characters of study notes",
      "error"
    );
    return;
  }

  if (selectedSubjects.length === 0) {
    showToast(
      "Please select at least one subject",
      "error"
    );
    return;
  }

  // Show loading state
  elements.generateSpinner.style.display = "inline-block";
  elements.generateBtn.disabled = true;

  try {
    const response = await fetch(
      `${API_BASE_URL}/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text: notes,
          subjects: selectedSubjects,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Add new flashcards to existing state
      state.flashcards = [
        ...state.flashcards,
        ...data.flashcards,
      ];

      renderFlashcards();
      checkEmptyState();
      updateProgressSidebar();

      showToast(
        `Generated ${data.flashcards.length} flashcards successfully!`,
        "success"
      );

      // Clear the textarea after successful generation
      elements.notesInput.value = "";
      validateInput();

      // Clear selected subjects
      elements.subjectChips
        .querySelectorAll(".selected")
        .forEach((chip) => {
          chip.classList.remove("selected");
        });
    } else {
      throw new Error(
        data.error || "Failed to generate flashcards"
      );
    }
  } catch (error) {
    console.error("Error generating flashcards:", error);
    showToast(
      error.message ||
        "Failed to generate flashcards. Please try again.",
      "error"
    );
  } finally {
    elements.generateSpinner.style.display = "none";
    elements.generateBtn.disabled = false;
  }
}

// Render flashcards based on filters and search
function renderFlashcards() {
  const searchTerm =
    elements.searchInput.value.toLowerCase();
  const tagFilter = elements.tagFilter.value;
  const sortBy = elements.sortSelect.value;

  // Filter flashcards
  let filteredFlashcards = state.flashcards.filter(
    (card) => {
      const matchesSearch =
        card.question.toLowerCase().includes(searchTerm) ||
        card.answer.toLowerCase().includes(searchTerm);
      const matchesTag = tagFilter
        ? card.tags.includes(tagFilter)
        : true;
      return matchesSearch && matchesTag;
    }
  );

  // Sort flashcards
  filteredFlashcards.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return (
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "hardest":
        const difficultyOrder = {
          hard: 0,
          medium: 1,
          easy: 2,
          neutral: 3,
        };
        return (
          difficultyOrder[a.difficulty] -
          difficultyOrder[b.difficulty]
        );
      case "easiest":
        const difficultyOrderReverse = {
          hard: 3,
          medium: 2,
          easy: 1,
          neutral: 0,
        };
        return (
          difficultyOrderReverse[a.difficulty] -
          difficultyOrderReverse[b.difficulty]
        );
      default:
        return 0;
    }
  });

  // Clear current cards
  elements.cardsGrid.innerHTML = "";

  // Render cards
  filteredFlashcards.forEach((card) => {
    const cardElement = createFlashcardElement(card);
    elements.cardsGrid.appendChild(cardElement);
  });

  updateSelectionUI();
}

// Create a flashcard DOM element
function createFlashcardElement(card) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.dataset.id = card.id;
  cardEl.setAttribute("aria-expanded", "false");
  if (state.selectedFlashcards.has(card.id)) {
    cardEl.classList.add("selected");
  }

  const difficultyClass = `difficulty-${card.difficulty}`;

  cardEl.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="card-content">
          <span class="question-label">Question:</span>
          <p>${escapeHtml(card.question)}</p>
        </div>
        <button class="read-more-btn" data-target="question">Read More</button>
        <div class="card-actions">
          <button class="card-action-btn edit-btn" title="Edit flashcard" aria-label="Edit flashcard">✍️</button>
          <button class="card-action-btn bookmark-btn" title="${
            card.bookmarked ? "Remove bookmark" : "Bookmark"
          }" aria-label="${
    card.bookmarked ? "Remove bookmark" : "Bookmark"
  }">${card.bookmarked ? "★" : "☆"}</button>
        </div>
      </div>
      <div class="card-back">
        <div class="card-content">
          <span class="answer-label">Answer:</span>
          <p>${escapeHtml(card.answer)}</p>
          <span class="explanation-label">Explanation:</span>
          <p>${escapeHtml(
            card.explanation || "No explanation provided"
          )}</p>
        </div>
        <button class="read-more-btn" data-target="answer">Read More</button>
        <div class="card-actions">
          <button class="card-action-btn edit-btn" title="Edit flashcard" aria-label="Edit flashcard">✍️</button>
          <button class="card-action-btn bookmark-btn" title="${
            card.bookmarked ? "Remove bookmark" : "Bookmark"
          }" aria-label="${
    card.bookmarked ? "Remove bookmark" : "Bookmark"
  }">${card.bookmarked ? "★" : "☆"}</button>
        </div>
        <div class="difficulty-buttons">
          <button class="difficulty-btn difficulty-easy" data-difficulty="easy">Easy</button>
          <button class="difficulty-btn difficulty-medium" data-difficulty="medium">Medium</button>
          <button class="difficulty-btn difficulty-hard" data-difficulty="hard">Hard</button>
        </div>
      </div>
    </div>
  `;

  cardEl.addEventListener("click", (e) => {
    if (
      !e.target.classList.contains("card-action-btn") &&
      !e.target.classList.contains("read-more-btn") &&
      !e.target.classList.contains("difficulty-btn")
    ) {
      cardEl.classList.toggle("flipped");
      cardEl.setAttribute(
        "aria-expanded",
        cardEl.classList.contains("flipped").toString()
      );
    }
  });

  cardEl
    .querySelector(".edit-btn")
    .addEventListener("click", () => openEditModal(card));
  cardEl
    .querySelector(".bookmark-btn")
    .addEventListener("click", () =>
      toggleBookmark(card.id)
    );
  cardEl
    .querySelectorAll(".difficulty-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        setDifficulty(card.id, btn.dataset.difficulty);
      });
    });

  cardEl
    .querySelectorAll(".read-more-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cardContent =
          e.target.parentElement.querySelector(
            ".card-content"
          );
        cardContent.classList.toggle("expanded");
        btn.textContent = cardContent.classList.contains(
          "expanded"
        )
          ? "Read Less"
          : "Read More";
      });
    });

  return cardEl;
}

// Check if we should show the empty state
function checkEmptyState() {
  if (state.flashcards.length === 0) {
    elements.emptyState.style.display = "block";
    elements.workspace.style.display = "none";
  } else {
    elements.emptyState.style.display = "none";
    elements.workspace.style.display = "block";
  }
}

// Toggle selection of all flashcards
function toggleSelectAll() {
  if (
    state.selectedFlashcards.size ===
    state.flashcards.length
  ) {
    state.selectedFlashcards.clear();
  } else {
    state.flashcards.forEach((card) =>
      state.selectedFlashcards.add(card.id)
    );
  }
  renderFlashcards();
}

// Toggle selection of a single flashcard
function toggleFlashcardSelection(id) {
  if (state.selectedFlashcards.has(id)) {
    state.selectedFlashcards.delete(id);
  } else {
    state.selectedFlashcards.add(id);
  }
  renderFlashcards();
}

// Update selection UI (buttons state)
function updateSelectionUI() {
  const hasSelection = state.selectedFlashcards.size > 0;
  elements.deleteSelectedBtn.disabled = !hasSelection;
  elements.exportBtn.disabled = !hasSelection;

  elements.selectAllBtn.textContent =
    state.selectedFlashcards.size ===
    state.flashcards.length
      ? "Deselect All"
      : "Select All";
}

// Open a modal
function openModal(modalId) {
  document.getElementById(modalId).classList.add("open");
}

// Close a modal
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("open");
}

// Start quiz with selected or all flashcards
function startQuiz() {
  let quizFlashcards = [];

  if (state.selectedFlashcards.size > 0) {
    quizFlashcards = state.flashcards.filter((card) =>
      state.selectedFlashcards.has(card.id)
    );
  } else {
    quizFlashcards = [...state.flashcards];
  }

  if (quizFlashcards.length === 0) {
    showToast(
      "Please select flashcards to quiz or generate some first",
      "error"
    );
    return;
  }

  // Initialize quiz state
  state.currentQuiz = {
    cards: shuffleArray(quizFlashcards),
    currentIndex: 0,
    results: [],
    startTime: new Date(),
    endTime: null,
  };

  // Hide workspace, show quiz
  elements.workspace.style.display = "none";
  elements.quizContainer.style.display = "block";
  elements.quizResults.style.display = "none";

  // Show first question
  showQuizQuestion();
}

// Exit quiz and return to workspace
function exitQuiz() {
  elements.quizContainer.style.display = "none";
  elements.workspace.style.display = "block";
}

// Show current quiz question
function showQuizQuestion() {
  const { cards, currentIndex } = state.currentQuiz;
  const card = cards[currentIndex];

  elements.quizProgress.textContent = `Question ${
    currentIndex + 1
  } of ${cards.length}`;
  elements.quizProgressBar.style.width = `${
    (currentIndex / cards.length) * 100
  }%`;
  elements.quizQuestion.textContent = card.question;
  elements.quizAnswer.textContent = card.answer;
  elements.quizExplanation.textContent =
    card.explanation || "";

  elements.quizCard.classList.remove("flipped");
  elements.revealAnswerBtn.style.display = "block";
  elements.nextQuestionBtn.style.display = "none";
}

// Reveal answer in quiz mode
function revealAnswer() {
  elements.quizCard.classList.add("flipped");
  elements.revealAnswerBtn.style.display = "none";
  elements.nextQuestionBtn.style.display = "block";
}

// Move to next question in quiz
function nextQuestion() {
  const difficulty =
    document.querySelector(".difficulty-buttons .selected")
      ?.dataset.difficulty || "neutral";

  // Record result
  state.currentQuiz.results.push({
    cardId:
      state.currentQuiz.cards[
        state.currentQuiz.currentIndex
      ].id,
    difficulty: difficulty,
  });

  // Update card difficulty
  const cardId =
    state.currentQuiz.cards[state.currentQuiz.currentIndex]
      .id;
  setDifficulty(cardId, difficulty);

  // Move to next question or finish quiz
  state.currentQuiz.currentIndex++;

  if (
    state.currentQuiz.currentIndex <
    state.currentQuiz.cards.length
  ) {
    showQuizQuestion();
  } else {
    finishQuiz();
  }
}

// Finish quiz and show results
function finishQuiz() {
  state.currentQuiz.endTime = new Date();

  // Calculate stats
  const timeSpent = Math.round(
    (state.currentQuiz.endTime -
      state.currentQuiz.startTime) /
      1000
  );
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  const difficultyCount = {
    easy: state.currentQuiz.results.filter(
      (r) => r.difficulty === "easy"
    ).length,
    medium: state.currentQuiz.results.filter(
      (r) => r.difficulty === "medium"
    ).length,
    hard: state.currentQuiz.results.filter(
      (r) => r.difficulty === "hard"
    ).length,
  };

  const accuracy = Math.round(
    ((difficultyCount.easy + difficultyCount.medium * 0.5) /
      state.currentQuiz.results.length) *
      100
  );

  // Update elements
  elements.accuracyRate.textContent = `${accuracy}%`;
  elements.timeSpent.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
  elements.cardsReviewed.textContent =
    state.currentQuiz.results.length;
  elements.masteryGain.textContent = `+${Math.round(
    accuracy / 10
  )}%`;

  // Show cards to review again (hard ones)
  const hardCards = state.currentQuiz.results
    .filter((r) => r.difficulty === "hard")
    .map((r) =>
      state.flashcards.find((c) => c.id === r.cardId)
    )
    .filter((c) => c);

  elements.reviewList.innerHTML = "";
  hardCards.forEach((card) => {
    const li = document.createElement("li");
    li.textContent = card.question;
    elements.reviewList.appendChild(li);
  });

  // Update study progress
  updateStudyProgress(state.currentQuiz.results.length);

  // Show results
  elements.quizResults.style.display = "block";
}

// Enter focus mode
function enterFocusMode() {
  let focusFlashcards = [];

  if (state.selectedFlashcards.size > 0) {
    focusFlashcards = state.flashcards.filter((card) =>
      state.selectedFlashcards.has(card.id)
    );
  } else {
    focusFlashcards = [...state.flashcards];
  }

  if (focusFlashcards.length === 0) {
    showToast(
      "Please select flashcards for focus mode or generate some first",
      "error"
    );
    return;
  }

  // Set up focus mode
  state.focusModeCards = shuffleArray(focusFlashcards);
  state.focusModeIndex = 0;

  showFocusCard();
  elements.focusMode.style.display = "flex";
}

// Exit focus mode
function exitFocusMode() {
  elements.focusMode.style.display = "none";
}

// Show current card in focus mode
function showFocusCard() {
  const card = state.focusModeCards[state.focusModeIndex];
  elements.focusQuestion.textContent = `Question: ${card.question}`;
  elements.focusAnswer.textContent = `Answer: ${card.answer}`;
  elements.focusExplanation.textContent = `Explanation: ${
    card.explanation || "No explanation provided"
  }`;

  elements.focusMode
    .querySelector(".card")
    .classList.remove("flipped");
}

// Flip card in focus mode
function flipFocusCard() {
  elements.focusMode
    .querySelector(".card")
    .classList.toggle("flipped");
}

// Move to next card in focus mode
function nextFocusCard() {
  state.focusModeIndex =
    (state.focusModeIndex + 1) %
    state.focusModeCards.length;
  showFocusCard();
}

// Toggle sidebar visibility
function toggleSidebar() {
  elements.progressSidebar.classList.toggle("open");
}

// Update study progress stats
function updateStudyProgress(cardsStudied = 0) {
  // Update today's study count
  const today = new Date().toDateString();
  if (state.studyProgress.lastStudyDate !== today) {
    // Check if we're maintaining a streak (studied yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (
      state.studyProgress.lastStudyDate === yesterdayStr
    ) {
      state.studyProgress.currentStreak++;
    } else if (
      state.studyProgress.lastStudyDate !== today
    ) {
      state.studyProgress.currentStreak = 1;
    }

    state.studyProgress.lastStudyDate = today;
    state.studyProgress.studiedToday = 0;
  }

  state.studyProgress.studiedToday += cardsStudied;
  state.studyProgress.totalReviewed += cardsStudied;

  // Calculate mastery level (simplified)
  const difficultyScores = {
    easy: 1,
    medium: 0.7,
    hard: 0.3,
    neutral: 0.5,
  };

  const totalScore = state.flashcards.reduce(
    (sum, card) => {
      return (
        sum + (difficultyScores[card.difficulty] || 0.5)
      );
    },
    0
  );

  const maxScore = state.flashcards.length;
  state.studyProgress.masteryLevel = Math.round(
    (totalScore / maxScore) * 100
  );

  // Calculate subject mastery
  state.studyProgress.subjectMastery = {};
  state.flashcards.forEach((card) => {
    card.tags.forEach((tag) => {
      if (!state.studyProgress.subjectMastery[tag]) {
        state.studyProgress.subjectMastery[tag] = {
          total: 0,
          score: 0,
        };
      }

      state.studyProgress.subjectMastery[tag].total++;
      state.studyProgress.subjectMastery[tag].score +=
        difficultyScores[card.difficulty] || 0.5;
    });
  });

  // Convert to percentages
  Object.keys(state.studyProgress.subjectMastery).forEach(
    (tag) => {
      const subject =
        state.studyProgress.subjectMastery[tag];
      subject.percentage = Math.round(
        (subject.score / subject.total) * 100
      );
    }
  );

  saveState();
  updateProgressSidebar();
}

// Update progress sidebar with current stats
function updateProgressSidebar() {
  elements.totalCards.textContent = state.flashcards.length;
  elements.studiedToday.textContent =
    state.studyProgress.studiedToday;
  elements.masteryLevel.textContent = `${state.studyProgress.masteryLevel}%`;
  elements.currentStreak.textContent =
    state.studyProgress.currentStreak;

  // Update subject mastery
  elements.subjectMastery.innerHTML = "";
  Object.entries(
    state.studyProgress.subjectMastery
  ).forEach(([tag, data]) => {
    const masteryEl = document.createElement("div");
    masteryEl.className = "subject-mastery";
    masteryEl.innerHTML = `
                    <div style="display: flex; justify-content: space-between;">
                        <span>${tag}</span>
                        <span>${data.percentage}%</span>
                    </div>
                    <div class="mastery-bar">
                        <div class="mastery-fill" style="width: ${data.percentage}%"></div>
                    </div>
                `;
    elements.subjectMastery.appendChild(masteryEl);
  });

  // Update recent sets (simplified)
  elements.recentSets.innerHTML = "";
  const recentSubjects = {};

  state.flashcards.forEach((card) => {
    card.tags.forEach((tag) => {
      if (!recentSubjects[tag]) {
        recentSubjects[tag] = {
          count: 0,
          lastDate: card.createdAt,
        };
      }
      recentSubjects[tag].count++;
      if (card.createdAt > recentSubjects[tag].lastDate) {
        recentSubjects[tag].lastDate = card.createdAt;
      }
    });
  });

  Object.entries(recentSubjects).forEach(([tag, data]) => {
    const setEl = document.createElement("div");
    setEl.className = "recent-set";
    setEl.innerHTML = `
                    <div><strong>${tag}</strong></div>
                    <div>${data.count} cards</div>
                    <div>${new Date(
                      data.lastDate
                    ).toLocaleDateString()}</div>
                `;
    elements.recentSets.appendChild(setEl);
  });
}

// Reset today's progress
function resetTodayProgress() {
  state.studyProgress.studiedToday = 0;
  saveState();
  updateProgressSidebar();
  showToast("Today's progress has been reset", "success");
}

// Open edit modal for a card
function openEditModal(card) {
  elements.editQuestion.value = card.question;
  elements.editAnswer.value = card.answer;
  elements.editTags.value = card.tags.join(", ");
  elements.saveEditBtn.dataset.id = card.id;

  openModal("editCardModal");
}

// Save edited card to backend
async function saveCardEdit() {
  const id = parseInt(elements.saveEditBtn.dataset.id);
  const question = elements.editQuestion.value.trim();
  const answer = elements.editAnswer.value.trim();
  const tags = elements.editTags.value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t);

  if (!question || !answer) {
    showToast(
      "Question and answer cannot be empty",
      "error"
    );
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer,
          tags,
        }),
      }
    );

    if (response.ok) {
      // Update local state by reloading from server
      await loadState();
      renderFlashcards();
      closeModal("editCardModal");
      showToast(
        "Flashcard updated successfully",
        "success"
      );
    } else {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to update flashcard"
      );
    }
  } catch (error) {
    console.error("Error updating flashcard:", error);
    showToast(
      "Failed to update flashcard. Please try again.",
      "error"
    );
  }
}

// Toggle bookmark for a card with backend sync
async function toggleBookmark(id) {
  const card = state.flashcards.find((c) => c.id == id);
  if (!card) return;

  const newBookmarkState = !card.bookmarked;

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookmarked: newBookmarkState,
        }),
      }
    );

    if (response.ok) {
      // Update local state by reloading from server
      await loadState();
      renderFlashcards();

      const action = newBookmarkState
        ? "bookmarked"
        : "removed from bookmarks";
      showToast(`Flashcard ${action}`, "success");
    } else {
      throw new Error("Failed to update bookmark status");
    }
  } catch (error) {
    console.error("Error updating bookmark:", error);
    showToast(
      "Failed to update bookmark. Please try again.",
      "error"
    );
  }
}

// Set difficulty for a card with backend sync
async function setDifficulty(id, difficulty) {
  const card = state.flashcards.find((c) => c.id == id);
  if (!card) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          lastReviewed: new Date().toISOString(),
          reviewCount: (card.reviewCount || 0) + 1,
        }),
      }
    );

    if (response.ok) {
      // Update local state by reloading from server
      await loadState();
      renderFlashcards();

      // If in quiz mode, mark the difficulty button as selected
      if (event && event.target) {
        document
          .querySelectorAll(".difficulty-btn")
          .forEach((btn) => {
            btn.classList.remove("selected");
          });
        event.target.classList.add("selected");
      }
    } else {
      throw new Error("Failed to update difficulty");
    }
  } catch (error) {
    console.error("Error updating difficulty:", error);
    showToast("Failed to update difficulty", "error");
  }
}

// Export flashcards as JSON
function exportJson() {
  const selectedCards = state.flashcards.filter((card) =>
    state.selectedFlashcards.has(card.id)
  );

  if (selectedCards.length === 0) {
    showToast("No flashcards selected for export", "error");
    return;
  }

  const dataStr = JSON.stringify(selectedCards, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," +
    encodeURIComponent(dataStr);

  const exportFileDefaultName = "flashcards.json";

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute(
    "download",
    exportFileDefaultName
  );
  linkElement.click();

  closeModal("exportModal");
  showToast("Exported as JSON successfully", "success");
}

// Export flashcards as CSV
function exportCsv() {
  const selectedCards = state.flashcards.filter((card) =>
    state.selectedFlashcards.has(card.id)
  );

  if (selectedCards.length === 0) {
    showToast("No flashcards selected for export", "error");
    return;
  }

  const headers = [
    "Question",
    "Answer",
    "Tags",
    "Difficulty",
    "CreatedAt",
  ];
  const csvData = selectedCards.map((card) => [
    card.question,
    card.answer,
    card.tags.join(";"),
    card.difficulty,
    card.createdAt,
  ]);

  const csvContent = [headers, ...csvData]
    .map((row) =>
      row
        .map((field) => `"${field.replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const dataUri =
    "data:text/csv;charset=utf-8," +
    encodeURIComponent(csvContent);

  const exportFileDefaultName = "flashcards.csv";

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute(
    "download",
    exportFileDefaultName
  );
  linkElement.click();

  closeModal("exportModal");
  showToast("Exported as CSV successfully", "success");
}

// Export flashcards for printing
function exportPrint() {
  const selectedCards = state.flashcards.filter((card) =>
    state.selectedFlashcards.has(card.id)
  );

  if (selectedCards.length === 0) {
    showToast("No flashcards selected for export", "error");
    return;
  }

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
                <html>
                    <head>
                        <title>AI Study Buddy - Flashcards</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .flashcard { border: 1px solid #ccc; padding: 15px; margin-bottom: 15px; break-inside: avoid; }
                            .question { font-weight: bold; margin-bottom: 10px; }
                            .answer { margin-bottom: 10px; }
                            .tags { font-style: italic; color: #666; }
                            @media print {
                                body { padding: 0; }
                                .flashcard { page-break-inside: avoid; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>AI Study Buddy Flashcards</h1>
                        <p>Generated on ${new Date().toLocaleDateString()}</p>
                        <hr>
                        ${selectedCards
                          .map(
                            (card) => `
                            <div class="flashcard">
                                <div class="question">${escapeHtml(
                                  card.question
                                )}</div>
                                <div class="answer">${escapeHtml(
                                  card.answer
                                )}</div>
                                <div class="tags">Tags: ${card.tags.join(
                                  ", "
                                )} | Difficulty: ${
                              card.difficulty
                            }</div>
                            </div>
                        `
                          )
                          .join("")}
                    </body>
                </html>
            `);

  printWindow.document.close();
  printWindow.focus();

  closeModal("exportModal");
  showToast("Print view opened in new window", "success");
}

// Delete selected flashcards from backend and local state
async function deleteSelectedFlashcards() {
  const selectedIds = Array.from(state.selectedFlashcards);

  if (selectedIds.length === 0) {
    showToast(
      "No flashcards selected for deletion",
      "error"
    );
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      }
    );

    if (response.ok) {
      // Update local state by reloading from server
      await loadState();
      renderFlashcards();
      checkEmptyState();
      updateProgressSidebar();

      closeModal("deleteConfirmModal");
      showToast(
        `Deleted ${selectedIds.length} flashcards successfully`,
        "success"
      );
    } else {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to delete flashcards"
      );
    }
  } catch (error) {
    console.error("Error deleting flashcards:", error);
    showToast(
      "Failed to delete flashcards. Please try again.",
      "error"
    );
  }
}

// Show a toast notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
                <span>${message}</span>
            `;

  elements.toastContainer.appendChild(toast);

  // Remove toast after animation
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
  // Don't trigger if typing in an input
  if (
    e.target.tagName === "TEXTAREA" ||
    e.target.tagName === "INPUT"
  ) {
    return;
  }

  switch (e.key) {
    case "Escape":
      // Close any open modals
      document
        .querySelectorAll(".modal-overlay.open")
        .forEach((modal) => {
          closeModal(modal.id);
        });
      // Exit focus mode if active
      if (elements.focusMode.style.display === "flex") {
        exitFocusMode();
      }
      break;

    case " ":
    case "Enter":
      // Flip card if in quiz mode
      if (
        elements.quizContainer.style.display === "block" &&
        !elements.quizCard.classList.contains("flipped")
      ) {
        revealAnswer();
        e.preventDefault();
      }
      // Flip card if in focus mode
      else if (
        elements.focusMode.style.display === "flex"
      ) {
        flipFocusCard();
        e.preventDefault();
      }
      break;

    case "1":
    case "2":
    case "3":
      // Set difficulty in quiz mode
      if (
        elements.quizContainer.style.display === "block" &&
        elements.quizCard.classList.contains("flipped")
      ) {
        const difficulty =
          e.key === "1"
            ? "easy"
            : e.key === "2"
            ? "medium"
            : "hard";
        document
          .querySelector(
            `.difficulty-btn[data-difficulty="${difficulty}"]`
          )
          .click();
      }
      break;

    case "f":
      // Toggle focus mode
      if (elements.workspace.style.display === "block") {
        enterFocusMode();
        e.preventDefault();
      }
      break;
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Utility function to debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Utility function to shuffle array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Add error handling for network requests
function handleNetworkError(error, fallbackMessage) {
  if (
    error.name === "TypeError" &&
    error.message.includes("fetch")
  ) {
    return "Network error. Please check your connection and try again.";
  }
  return (
    fallbackMessage ||
    "An unexpected error occurred. Please try again."
  );
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
