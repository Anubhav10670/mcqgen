import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import type { Question } from '../App';

interface MCQTestProps {
  questions: Question[];
  onReset: () => void;
}

function MCQTest({ questions, onReset }: MCQTestProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  const handleAnswer = (answer: string) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (question.correctAnswer === answers[index] ? 1 : 0);
    }, 0);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);
  const questionsAttempted = answers.filter((answer) => answer !== '').length;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl z-10">
        {!submitted ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Generated Quiz</h2>
              <span className="text-sm text-gray-600">{formatTime(timeSpent)}</span>
            </div>

            <div className="w-full h-2 mb-6">
              <div
                className="h-2 bg-pink-500 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            <div className="mb-6">
              <p className="font-medium text-gray-900 mb-3">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <p className="font-medium text-gray-900 mb-4 text-lg">
                {questions[currentQuestionIndex].question}
              </p>
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`block p-4 rounded-lg border cursor-pointer transition-colors
                      ${answers[currentQuestionIndex] === option
                        ? 'bg-pink-100 border-pink-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value={option}
                        checked={answers[currentQuestionIndex] === option}
                        onChange={() => handleAnswer(option)}
                        className="h-4 w-4 text-pink-500 focus:ring-pink-300"
                        disabled={submitted}
                      />
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQuestionIndex]}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={answers.some((answer) => !answer)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  Submit Test
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <p className="text-3xl font-semibold text-gray-900 mb-2">{percentage}%</p>
              <p className="text-gray-600 mb-4">Your Score</p>

              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-pink-500"
                    strokeWidth="10"
                    strokeDasharray={`${(percentage / 100) * 283} 283`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="50" textAnchor="middle" dy=".3em" className="text-lg font-semibold text-gray-900">
                    {score}/{questions.length}
                  </text>
                </svg>
              </div>

              <div className="flex justify-around mb-6">
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-gray-900 font-medium">{questionsAttempted}</p>
                  <p className="text-gray-600 text-sm">Questions Attempted</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <p className="text-gray-900 font-medium">{formatTime(timeSpent)}</p>
                  <p className="text-gray-600 text-sm">Time Spent</p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full py-2 mb-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                {showDetails ? 'Hide Question Details' : 'Show Question Details'}
              </button>

              {showDetails && (
                <div className="mt-6 text-left">
                  {questions.map((question, index) => (
                    <div key={index} className="mb-6 pb-6 border-b last:border-none">
                      <p className="font-medium text-gray-900 mb-3">
                        {index + 1}. {question.question}
                      </p>

                      <div className="space-y-3 mb-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`block p-4 rounded-lg
                              ${question.correctAnswer === option
                                ? 'bg-green-50'
                                : answers[index] === option
                                  ? 'bg-red-50'
                                  : 'bg-white'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-800">{option}</span>
                              {question.correctAnswer === option ? (
                                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                              ) : answers[index] === option ? (
                                <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      {question.explanation && (
                        <button
                          onClick={() => setSelectedExplanation(question.explanation!)}
                          className="text-sm text-pink-600 hover:underline transition-colors"
                        >
                          Show Explanation
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-2 mt-6">
                <button
                  onClick={onReset}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </button>
                <a
                  href="https://ncertquest.netlify.app/dashboard"
                  className="flex-1 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center justify-center"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* EXPLANATION MODAL */}
      {selectedExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setSelectedExplanation(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Explanation</h3>
            <p className="text-gray-700 whitespace-pre-line">{selectedExplanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MCQTest;
