document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/auth/user', { credentials: 'include' })
    .then(response => {
      if (!response.ok) {
        window.location.href = '/login';
        return Promise.reject();
      }
      return response.json();
    })
    .then(user => {
      main();
    });
});

function main() {
  const questionId = window.location.pathname.split('/').pop();
  if (!questionId) {
    window.location.href = '/my-questions';
    return;
  }

  const questionText = document.getElementById('question-text');
  const questionUser = document.getElementById('question-user');
  const questionDate = document.getElementById('question-date');
  const questionCategory = document.getElementById('question-category');
  const questionStatus = document.getElementById('question-status');
  const answersList = document.getElementById('answers-list');
  const newAnswerForm = document.getElementById('new-answer-form');
  const logoutBtn = document.getElementById('logout-btn');
  const answerImage = document.getElementById('answer-image');
  const imagePreview = document.getElementById('image-preview');

  const editModal = document.getElementById('edit-answer-modal');
  const closeEditModal = document.getElementById('close-edit-modal');
  const editAnswerForm = document.getElementById('edit-answer-form');
  const editAnswerText = document.getElementById('edit-answer-text');
  const editAnswerImage = document.getElementById('edit-answer-image');
  const editImagePreview = document.getElementById('edit-image-preview');
  let editingAnswerId = null;

  newAnswerForm.addEventListener('submit', submitAnswer);
  logoutBtn.addEventListener('click', logout);
  if (answerImage) {
    answerImage.addEventListener('change', handleImagePreview);
  }

  fetchQuestionDetails();

  async function fetchQuestionDetails() {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch question details');
      }
      const question = await response.json();
      displayQuestionDetails(question);
    } catch (error) {
      console.error('Error fetching question details:', error);
      showErrorMessage('Failed to load question details. Please try again later.');
    }
  }

  function displayQuestionDetails(question) {
    questionText.textContent = question.text;
    questionUser.textContent = question.user.username;
    questionDate.textContent = new Date(question.createdAt).toLocaleDateString();
    questionCategory.textContent = question.category;
    
    const status = question.isAnswered ? 'Answered' : 'Pending';
    questionStatus.textContent = status;
    questionStatus.className = `question-status ${question.isAnswered ? 'answered' : 'pending'}`;
  }

  function displayAnswers(answers, userId) {
    answersList.innerHTML = '';
    if (answers.length === 0) {
      const p = document.createElement('p');
      p.className = 'no-answers';
      p.textContent = 'No answers yet.';
      answersList.appendChild(p);
      return;
    }
    answers.forEach(answer => {
      const date = new Date(answer.createdAt).toLocaleDateString();
      const canEdit = answer.guide && answer.guide._id === userId;
      const item = document.createElement('div');
      item.className = 'answer-item';
      const content = document.createElement('div');
      content.className = 'answer-content';
      const p = document.createElement('p');
      p.textContent = answer.text;
      content.appendChild(p);
      if (answer.image) {
        const img = document.createElement('img');
        img.src = answer.image;
        img.alt = 'Answer Image';
        img.style = 'max-width:200px; max-height:200px; border-radius:8px; margin-top:10px;';
        content.appendChild(img);
      }
      item.appendChild(content);
      const meta = document.createElement('div');
      meta.className = 'answer-meta';
      const span = document.createElement('span');
      span.textContent = `Answered by ${answer.guide.username} on ${date}`;
      meta.appendChild(span);
      if (canEdit) {
        const btn = document.createElement('button');
        btn.className = 'btn-edit';
        btn.textContent = 'Edit';
        btn.onclick = () => window.openEditAnswerModal(answer);
        meta.appendChild(btn);
      }
      item.appendChild(meta);
      answersList.appendChild(item);
    });
  }

  async function submitAnswer(e) {
    e.preventDefault();
    const answerText = document.getElementById('answer-text').value;
    if (!answerText.trim()) {
      showErrorMessage('Please enter your answer');
      return;
    }
    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          text: answerText,
          questionId: questionId
        })
      });
      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }
      document.getElementById('answer-text').value = '';
      fetchQuestionDetails();
      showSuccessMessage('Your answer has been submitted!');
    } catch (error) {
      console.error('Error submitting answer:', error);
      showErrorMessage('Failed to submit your answer. Please try again.');
    }
  }

  function handleImagePreview(e) {
    const file = e.target.files[0];
    imagePreview.innerHTML = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.alt = 'Preview';
      img.style = 'max-width:200px; max-height:200px; border-radius:8px;';
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  function logout() {
    fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
      .then(() => {
        window.location.href = '/login';
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }

  function showSuccessMessage(message) {
    alert(message);
  }

  function showErrorMessage(message) {
    alert(message);
  }

  let cachedUserId = null;
  async function getCurrentUserId() {
    if (cachedUserId) return cachedUserId;
    try {
      const response = await fetch('/api/auth/user', { credentials: 'include' });
      if (!response.ok) return null;
      const user = await response.json();
      cachedUserId = user.id || user._id;
      return cachedUserId;
    } catch {
      return null;
    }
  }
}