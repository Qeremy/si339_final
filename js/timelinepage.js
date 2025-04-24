// IDs of each year‐section in order
const yearSections = [
  "freshman-content",
  "sophomore-content",
  "junior-content",
  "senior-content"
];
let currentYearIndex = 0;

// Single button
const actionBtn = document.getElementById("action-btn");

// Modals
const previewModal = document.getElementById("modal");
const previewImg   = document.getElementById("modal-img");
const previewDesc  = document.getElementById("modal-desc");

const quizModal  = document.getElementById("quiz-modal");
const quizForm   = document.getElementById("quiz-form");
const quizSubmit = document.getElementById("quiz-submit");

// Utility to hide/show sections
function showSection(idx) {
  yearSections.forEach((id, i) => {
    document.getElementById(id)
      .classList.toggle("hidden", i !== idx);
  });
  // Update button label:
  actionBtn.textContent =
    idx < yearSections.length - 1 ? "Next" : "Finish";
}
showSection(0);

// Image‐preview logic (unchanged)
document.querySelectorAll(".image-grid img")
  .forEach(img => {
    img.addEventListener("click", () => {
      previewImg.src = img.src;
      previewImg.alt = img.alt;
      previewDesc.textContent = img.dataset.desc || "";
      previewModal.classList.remove("hidden");
    });
  });
function closeModal() { previewModal.classList.add("hidden"); }

// Show quiz on button click
actionBtn.addEventListener("click", () => {
  quizModal.classList.remove("hidden");
});

// Handle quiz submission
quizSubmit.addEventListener("click", () => {
  const selected = quizForm.year.value;
  if (selected === "") {
    alert("Please select a year.");
    return;
  }
  if (Number(selected) === currentYearIndex) {
    // Correct!
    quizModal.classList.add("hidden");
    quizForm.reset();

    // If not last year, advance:
    if (currentYearIndex < yearSections.length - 1) {
      currentYearIndex++;
      showSection(currentYearIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Last year → redirect
      window.location.href = "contact.html";
    }
  } else {
    alert("Incorrect—please try again.");
  }
});

function closeQuiz() {
  quizModal.classList.add("hidden");
  quizForm.reset();
}
