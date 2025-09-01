// Backend API configuration
const API_BASE_URL =
  "https://ai-study-buddy-6.onrender.com/api";

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
  // Set up focus mode state
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
  state.focusModeIndex++;
  if (state.focusModeIndex >= state.focusModeCards.length) {
    state.focusModeIndex = 0; // Loop back to the start
  }
  showFocusCard();
}

// Handle card bookmarking
async function toggleBookmark(cardId) {
  const card = state.flashcards.find(
    (c) => c.id === cardId
  );
  if (!card) return;

  const newBookmarkState = !card.bookmarked;
  const update = { bookmarked: newBookmarkState };

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards/${cardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      }
    );

    if (response.ok) {
      card.bookmarked = newBookmarkState;
      renderFlashcards();
      showToast(
        `Card ${
          newBookmarkState ? "bookmarked" : "unbookmarked"
        } successfully`,
        "success"
      );
    } else {
      throw new Error(
        "Failed to update bookmark status on server"
      );
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    showToast("Failed to update bookmark.", "error");
  }
}

// Handle difficulty setting
async function setDifficulty(cardId, difficulty) {
  const card = state.flashcards.find(
    (c) => c.id === cardId
  );
  if (!card) return;

  const update = { difficulty: difficulty };

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards/${cardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      }
    );

    if (response.ok) {
      card.difficulty = difficulty;
      renderFlashcards();
      showToast(
        "Difficulty updated successfully",
        "success"
      );
    } else {
      throw new Error(
        "Failed to update difficulty on server"
      );
    }
  } catch (error) {
    console.error("Error setting difficulty:", error);
    showToast("Failed to update difficulty.", "error");
  }
}

// Update study progress
function updateStudyProgress(cardsReviewed) {
  state.studyProgress.totalReviewed += cardsReviewed;
  const today = new Date().toDateString();
  if (state.studyProgress.lastStudyDate !== today) {
    // New day
    state.studyProgress.studiedToday = cardsReviewed;
    state.studyProgress.currentStreak++;
    state.studyProgress.lastStudyDate = today;
  } else {
    // Same day
    state.studyProgress.studiedToday += cardsReviewed;
  }
  // Simplified mastery level calculation
  const newMastery = Math.min(
    100,
    state.studyProgress.masteryLevel +
      Math.round(cardsReviewed * 1.5)
  );
  state.studyProgress.masteryLevel = newMastery;

  // Save updated progress
  saveState();
  updateProgressSidebar();
}

// Reset today's progress
function resetTodayProgress() {
  state.studyProgress.studiedToday = 0;
  state.studyProgress.lastStudyDate = null;
  saveState();
  updateProgressSidebar();
  showToast("Today's progress has been reset.", "info");
}

// Toggle sidebar visibility
function toggleSidebar() {
  elements.progressSidebar.classList.toggle("open");
}

// Update progress sidebar display
function updateProgressSidebar() {
  elements.totalCards.textContent = state.flashcards.length;
  elements.studiedToday.textContent =
    state.studyProgress.studiedToday;
  elements.masteryLevel.textContent =
    state.studyProgress.masteryLevel;
  elements.currentStreak.textContent =
    state.studyProgress.currentStreak;

  const allTags = new Set();
  state.flashcards.forEach((card) => {
    card.tags.forEach((tag) => allTags.add(tag));
  });

  elements.subjectMastery.innerHTML = "";
  allTags.forEach((tag) => {
    const li = document.createElement("li");
    const mastery =
      state.studyProgress.subjectMastery[tag] || 0;
    li.textContent = `${tag}: ${mastery}%`;
    elements.subjectMastery.appendChild(li);
  });
}

// Open and populate the edit modal
function openEditModal(card) {
  state.editingCardId = card.id;
  elements.editQuestion.value = card.question;
  elements.editAnswer.value = card.answer;
  elements.editTags.value = card.tags.join(", ");
  openModal("editCardModal");
}

// Save edited card
async function saveCardEdit() {
  const cardId = state.editingCardId;
  const card = state.flashcards.find(
    (c) => c.id === cardId
  );
  if (!card) return;

  const updatedCard = {
    question: elements.editQuestion.value,
    answer: elements.editAnswer.value,
    tags: elements.editTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag),
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards/${cardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCard),
      }
    );

    if (response.ok) {
      // Update local state
      card.question = updatedCard.question;
      card.answer = updatedCard.answer;
      card.tags = updatedCard.tags;
      renderFlashcards();
      showToast(
        "Flashcard updated successfully",
        "success"
      );
      closeModal("editCardModal");
    } else {
      throw new Error("Failed to save changes on server");
    }
  } catch (error) {
    console.error("Error saving card edit:", error);
    showToast("Failed to save changes.", "error");
  }
}

// Delete selected flashcards
async function deleteSelectedFlashcards() {
  const idsToDelete = Array.from(state.selectedFlashcards);
  if (idsToDelete.length === 0) {
    closeModal("deleteConfirmModal");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/flashcards`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: idsToDelete }),
      }
    );

    if (response.ok) {
      state.flashcards = state.flashcards.filter(
        (card) => !idsToDelete.includes(card.id)
      );
      state.selectedFlashcards.clear();
      renderFlashcards();
      checkEmptyState();
      showToast(
        `Deleted ${idsToDelete.length} flashcard(s)`,
        "success"
      );
      closeModal("deleteConfirmModal");
    } else {
      throw new Error(
        "Failed to delete flashcards from server"
      );
    }
  } catch (error) {
    console.error("Error deleting flashcards:", error);
    showToast("Failed to delete flashcards.", "error");
    closeModal("deleteConfirmModal");
  }
}

// Export functions
function exportJson() {
  const selectedCards = state.flashcards.filter((card) =>
    state.selectedFlashcards.has(card.id)
  );
  if (selectedCards.length === 0) {
    showToast(
      "Please select flashcards to export",
      "error"
    );
    return;
  }
  const json = JSON.stringify(selectedCards, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flashcards.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Flashcards exported as JSON", "success");
  closeModal("exportModal");
}

function exportCsv() {
  const selectedCards = state.flashcards.filter((card) =>
    state.selectedFlashcards.has(card.id)
  );
  if (selectedCards.length === 0) {
    showToast(
      "Please select flashcards to export",
      "error"
    );
    return;
  }
  let csv = "id,question,answer,explanation,tags\n";
  selectedCards.forEach((card) => {
    const row = [
      `"${card.id}"`,
      `"${card.question.replace(/"/g, '""')}"`,
      `"${card.answer.replace(/"/g, '""')}"`,
      `"${card.explanation.replace(/"/g, '""')}"`,
      `"${card.tags.join(", ").replace(/"/g, '""')}"`,
    ].join(",");
    csv += `${row}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "flashcards.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Flashcards exported as CSV", "success");
  closeModal("exportModal");
}

function exportPrint() {
  const selectedCards = state.flashcards.filter((card) =>
    state.selectedFlashcards.has(card.id)
  );
  if (selectedCards.length === 0) {
    showToast("Please select flashcards to print", "error");
    return;
  }
  const printContent = selectedCards
    .map(
      (card) => `
    <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; page-break-inside: avoid;">
      <h3>Question:</h3>
      <p>${escapeHtml(card.question)}</p>
      <h3>Answer:</h3>
      <p>${escapeHtml(card.answer)}</p>
      <p style="font-size: 0.8em; color: #666;">Explanation: ${escapeHtml(
        card.explanation
      )}</p>
    </div>
  `
    )
    .join("");

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>Print Flashcards</title>
      <style>
        body { font-family: sans-serif; }
        @media print {
          @page { size: A4; margin: 1cm; }
          body { font-size: 10pt; }
        }
      </style>
    </head>
    <body>
      <h1>My Flashcards</h1>
      ${printContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  closeModal("exportModal");
}

// Show a toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 500); // Wait for transition
  }, 3000);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
  // Check if we are in quiz mode
  if (elements.quizContainer.style.display === "block") {
    switch (e.key) {
      case " ":
        // Spacebar to reveal answer
        if (
          elements.revealAnswerBtn.style.display === "block"
        ) {
          elements.revealAnswerBtn.click();
          e.preventDefault();
        }
        break;

      case "ArrowRight":
      case "Enter":
        // Right Arrow or Enter to go to next question
        if (
          elements.nextQuestionBtn.style.display === "block"
        ) {
          elements.nextQuestionBtn.click();
          e.preventDefault();
        }
        break;

      case "1":
      case "2":
      case "3":
        // 1, 2, 3 for difficulty
        const difficultyMap = {
          1: "easy",
          2: "medium",
          3: "hard",
        };
        const difficulty = difficultyMap[e.key];
        if (difficulty) {
          document
            .querySelector(
              `.difficulty-btn[data-difficulty="${difficulty}"]`
            )
            .click();
        }
        break;
    }
    return;
  }

  // Handle shortcuts in workspace mode
  switch (e.key) {
    case "d":
      // Toggle dark mode
      toggleTheme();
      break;

    case "Escape":
      // Close all modals
      document
        .querySelectorAll(".modal.open")
        .forEach((modal) => modal.classList.remove("open"));
      break;

    case "a":
      // Select all cards
      toggleSelectAll();
      e.preventDefault();
      break;

    case "Delete":
      // Delete selected
      if (!elements.deleteSelectedBtn.disabled) {
        openModal("deleteConfirmModal");
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
    error.name === "TypeError" ||
    error.message === "Failed to fetch"
  ) {
    showToast(
      "Network error or backend is down. Please check your connection.",
      "error"
    );
  } else {
    showToast(fallbackMessage || error.message, "error");
  }
}

// Initializing the app
document.addEventListener("DOMContentLoaded", init);
