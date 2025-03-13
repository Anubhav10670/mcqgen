import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import type { Question } from '../App';

interface MCQTestProps {
  questions: Question[];
  onReset: () => void;
}

function MCQTest({ questions, onReset }: MCQTestProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (questionIndex: number, answer: string) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">MCQ Test</h2>
        <button
          onClick={onReset}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          New Test
        </button>
      </div>

      {questions.map((question, questionIndex) => (
        <div key={questionIndex} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
          <p className="font-medium text-gray-900 mb-3">
            {questionIndex + 1}. {question.question}
          </p>
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`block p-3 rounded-lg border cursor-pointer transition-colors
                  ${submitted 
                    ? question.correctAnswer === option
                      ? 'bg-green-50 border-green-200'
                      : answers[questionIndex] === option
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                    : answers[questionIndex] === option
                      ? 'bg-pink-50 border-pink-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value={option}
                    checked={answers[questionIndex] === option}
                    onChange={() => handleAnswer(questionIndex, option)}
                    className="h-4 w-4 text-pink-500 focus:ring-pink-300"
                    disabled={submitted}
                  />
                  <span className="text-gray-800">{option}</span>
                  {submitted && (
                    question.correctAnswer === option ? (
                      <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                    ) : answers[questionIndex] === option ? (
                      <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                    ) : null
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={answers.some(answer => !answer)}
          className="w-full bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 focus:ring-4 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Test
        </button>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-xl font-semibold text-gray-900">
            Your Score: {score}/{questions.length} ({percentage}%)
          </p>
          <p className="text-gray-600 mt-1">
            {percentage >= 80 ? 'Excellent work! 🎉' : 
             percentage >= 60 ? 'Good job! 👍' : 
             'Keep practicing! 💪'}
          </p>
        </div>
      )}
    </div>
  );
}

export default MCQTest;