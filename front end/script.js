// Mock API implementation
const mockApi = {
  generate: async (text, subjects) => {
    // Simulate API delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    // Extract key terms from text to generate questions
    const sentences = text
      .split(/[.!?]/)
      .filter((s) => s.length > 10);
    const questions = [];

    // Generate 6-10 sample cards based on text
    const count = Math.min(
      8,
      Math.max(6, Math.floor(sentences.length / 2))
    );

    for (let i = 0; i < count; i++) {
      if (i >= sentences.length) break;

      const sentence = sentences[i].trim();
      const words = sentence.split(" ");

      if (words.length < 4) continue;

      // Create a question by removing a key term
      const removeIndex = Math.floor(words.length / 2);
      const answer = words[removeIndex];
      words[removeIndex] = "______";
      const question = words.join(" ");

      questions.push({
        id: Date.now() + i,
        question: question,
        answer: answer,
        explanation: `This term refers to ${answer} in the context of ${subjects.join(
          ", "
        )}.`,
        tags: subjects,
        difficulty: "neutral",
        createdAt: new Date().toISOString(),
        lastReviewed: null,
        reviewCount: 0,
        bookmarked: false,
      });
    }

    return questions;
  },
};

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

// Initialize the application
function init() {
  loadState();
  setupEventListeners();
  renderFlashcards();
  updateProgressSidebar();
  applyTheme();
  validateInput();
  checkEmptyState();
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

// Load state from localStorage
function loadState() {
  const savedState = localStorage.getItem("asb:state");
  if (savedState) {
    state = { ...state, ...JSON.parse(savedState) };
  }

  const savedTheme = localStorage.getItem("asb:theme");
  if (savedTheme) {
    state.settings.theme = savedTheme;
  }

  const savedTextSize =
    localStorage.getItem("asb:textSize");
  if (savedTextSize) {
    state.settings.textSize = savedTextSize;
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem(
    "asb:state",
    JSON.stringify({
      flashcards: state.flashcards,
      studyProgress: state.studyProgress,
    })
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
  const isValid = text.length >= 200;
  const hasContent = text.length > 0;

  elements.generateBtn.disabled = !isValid;
  elements.clearTextareaBtn.disabled = !hasContent; // Enable clear button only if textarea has content
  elements.validationMessage.style.display = isValid
    ? "none"
    : "block";
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

// Generate flashcards from notes
async function generateFlashcards() {
  const notes = elements.notesInput.value.trim();
  const selectedSubjects = Array.from(
    elements.subjectChips.querySelectorAll(".selected")
  ).map((chip) => chip.getAttribute("data-value"));

  if (notes.length < 200 || selectedSubjects.length === 0) {
    showToast(
      "Please enter at least 200 characters and select at least one subject",
      "error"
    );
    return;
  }

  // Show loading state
  elements.generateSpinner.style.display = "inline-block";
  elements.generateBtn.disabled = true;

  try {
    const newFlashcards = await mockApi.generate(
      notes,
      selectedSubjects
    );
    state.flashcards = [
      ...state.flashcards,
      ...newFlashcards,
    ];

    saveState();
    renderFlashcards();
    checkEmptyState();

    // Show input panel if it was hidden
    elements.inputPanel.style.display = "block";

    showToast(
      `Generated ${newFlashcards.length} flashcards successfully!`,
      "success"
    );
  } catch (error) {
    showToast(
      "Failed to generate flashcards. Please try again.",
      "error"
    );
    console.error("Flashcard generation error:", error);
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
  if (state.selectedFlashcards.has(card.id)) {
    cardEl.classList.add("selected");
  }

  const difficultyClass = `difficulty-${card.difficulty}`;

  cardEl.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <div class="card-content">${escapeHtml(
          card.question
        )}</div>
        <button class="read-more-btn" data-target="question">Read More</button>
        <div class="card-actions">
          <button class="card-action-btn edit-btn" title="Edit">✏️</button>
          <button class="card-action-btn bookmark-btn" title="Bookmark">${
            card.bookmarked ? "🔖" : "📑"
          }</button>
        </div>
      </div>
      <div class="card-back">
        <div class="card-content">${escapeHtml(
          card.answer
        )}</div>
        <button class="read-more-btn" data-target="answer">Read More</button>
        <div class="card-content explanation">${escapeHtml(
          card.explanation || ""
        )}</div>
        <button class="read-more-btn" data-target="explanation">Read More</button>
        <div class="difficulty-buttons">
          <button class="difficulty-btn difficulty-easy" data-difficulty="easy">Easy</button>
          <button class="difficulty-btn difficulty-medium" data-difficulty="medium">Medium</button>
          <button class="difficulty-btn difficulty-hard" data-difficulty="hard">Hard</button>
        </div>
        <div class="tags">
          ${card.tags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  cardEl.addEventListener("click", (e) => {
    if (
      !e.target.closest(".card-action-btn") &&
      !e.target.classList.contains("read-more-btn")
    ) {
      cardEl.classList.toggle("flipped");
    }
  });

  cardEl
    .querySelector(".edit-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      openEditModal(card);
    });

  cardEl
    .querySelector(".bookmark-btn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBookmark(card.id);
    });

  cardEl
    .querySelectorAll(".difficulty-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setDifficulty(card.id, btn.dataset.difficulty);
      });
    });

  // Add event listeners for "Read More" buttons
  cardEl
    .querySelectorAll(".read-more-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const contentEl = btn.previousElementSibling;
        contentEl.classList.toggle("expanded");
        btn.textContent = contentEl.classList.contains(
          "expanded"
        )
          ? "Read Less"
          : "Read More";
      });
    });

  // Initially hide "Read More" buttons if content fits
  cardEl
    .querySelectorAll(".card-content")
    .forEach((contentEl) => {
      const btn = contentEl.nextElementSibling;
      if (
        contentEl.scrollHeight <= contentEl.clientHeight
      ) {
        btn.style.display = "none";
      }
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
  elements.focusQuestion.textContent = card.question;
  elements.focusAnswer.textContent = card.answer;
  elements.focusExplanation.textContent =
    card.explanation || "";

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

// Save edited card
function saveCardEdit() {
  const id = elements.saveEditBtn.dataset.id;
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

  const cardIndex = state.flashcards.findIndex(
    (c) => c.id == id
  );
  if (cardIndex !== -1) {
    state.flashcards[cardIndex].question = question;
    state.flashcards[cardIndex].answer = answer;
    state.flashcards[cardIndex].tags = tags;

    saveState();
    renderFlashcards();
    closeModal("editCardModal");
    showToast("Flashcard updated successfully", "success");
  }
}

// Toggle bookmark for a card
function toggleBookmark(id) {
  const cardIndex = state.flashcards.findIndex(
    (c) => c.id == id
  );
  if (cardIndex !== -1) {
    state.flashcards[cardIndex].bookmarked =
      !state.flashcards[cardIndex].bookmarked;
    saveState();
    renderFlashcards();

    const action = state.flashcards[cardIndex].bookmarked
      ? "bookmarked"
      : "removed from bookmarks";
    showToast(`Flashcard ${action}`, "success");
  }
}

// Set difficulty for a card
function setDifficulty(id, difficulty) {
  const cardIndex = state.flashcards.findIndex(
    (c) => c.id == id
  );
  if (cardIndex !== -1) {
    state.flashcards[cardIndex].difficulty = difficulty;
    state.flashcards[cardIndex].lastReviewed =
      new Date().toISOString();
    state.flashcards[cardIndex].reviewCount =
      (state.flashcards[cardIndex].reviewCount || 0) + 1;

    saveState();
    renderFlashcards();

    // If in quiz mode, mark the difficulty button as selected
    document
      .querySelectorAll(".difficulty-btn")
      .forEach((btn) => {
        btn.classList.remove("selected");
      });
    event.target.classList.add("selected");
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

// Delete selected flashcards
function deleteSelectedFlashcards() {
  state.flashcards = state.flashcards.filter(
    (card) => !state.selectedFlashcards.has(card.id)
  );

  state.selectedFlashcards.clear();

  saveState();
  renderFlashcards();
  checkEmptyState();

  closeModal("deleteConfirmModal");
  showToast("Flashcards deleted successfully", "success");
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

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
