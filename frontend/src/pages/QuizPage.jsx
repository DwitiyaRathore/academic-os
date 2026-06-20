import { useState } from "react";
import axios from "axios";

function QuizPage() {
  const [notesText, setNotesText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!notesText.trim()) {
      setError("Please paste some notes first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:8000/ai/generate-quiz",
        { text: notesText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuestions(response.data);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setQuizFinished(false);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = (optionKey) => {
    if (selectedAnswer) return;

    setSelectedAnswer(optionKey);

    if (optionKey === questions[currentIndex].correct_answer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const handleTryAgain = () => {
    setNotesText("");
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setError("");
  };

  const getOptionStyle = (optionKey) => {
    if (!selectedAnswer) {
      return "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50";
    }

    const correctAnswer = questions[currentIndex].correct_answer;

    if (optionKey === correctAnswer) {
      return "bg-green-100 border-green-500 text-green-800";
    }

    if (optionKey === selectedAnswer && optionKey !== correctAnswer) {
      return "bg-red-100 border-red-500 text-red-800";
    }

    return "bg-white border-gray-300 opacity-60";
  };

  // SCREEN 1: Input screen (no quiz generated yet)
  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🧠 AI Quiz Generator
        </h1>
        <p className="text-gray-600 mb-6">
          Paste your notes below and test yourself!
        </p>

        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Paste your notes here..."
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
        />

        {error && (
          <p className="text-red-600 mt-2 font-medium">{error}</p>
        )}

        <button
          onClick={handleGenerateQuiz}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg shadow transition"
        >
          {loading ? "🤖 AI is creating your quiz..." : "Generate Quiz"}
        </button>
      </div>
    );
  }

  // SCREEN 3: Results screen
  if (quizFinished) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Quiz Complete! 🎉
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          You scored <span className="font-bold text-blue-600">{score}</span>{" "}
          out of <span className="font-bold">{questions.length}</span>
        </p>
        <button
          onClick={handleTryAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // SCREEN 2: Quiz screen (showing one question at a time)
  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <p className="text-gray-500 mb-2">
        Question {currentIndex + 1} of {questions.length}
      </p>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {currentQuestion.question}
      </h2>

      <div className="flex flex-col gap-3">
        {Object.entries(currentQuestion.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleAnswerClick(key)}
            disabled={selectedAnswer !== null}
            className={`text-left p-4 border-2 rounded-lg shadow-sm transition ${getOptionStyle(
              key
            )}`}
          >
            <span className="font-semibold mr-2">{key}.</span>
            {value}
          </button>
        ))}
      </div>

      {selectedAnswer && (
        <button
          onClick={handleNextQuestion}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow transition"
        >
          {currentIndex + 1 < questions.length
            ? "Next Question"
            : "See Results"}
        </button>
      )}
    </div>
  );
}

export default QuizPage;