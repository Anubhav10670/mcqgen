import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, RotateCcw, X, Volume2, VolumeX, BookOpen, Sparkles } from 'lucide-react';
import type { Question } from '../App';

interface MCQTestProps {
  questions: Question[];
  onReset: () => void;
}

// OpenRouter API configuration
interface AIConfig {
  apiKey: string;
  endpoint: string;
  model: string;
  referer: string;
  siteTitle: string;
}

// OpenRouter configuration with the provided API key
const aiConfig: AIConfig = {
  apiKey: "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",
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  model: "mistralai/mistral-small-24b-instruct-2501:free",
  referer: window.location.origin, 
  siteTitle: "NCERTquest" 
};

function MCQTest({ questions, onReset }: MCQTestProps) {
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedExplanation, setSelectedExplanation] = useState<string | null>(null);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [speakerIconsVisible, setSpeakerIconsVisible] = useState(true);
  // Change this to track loading state for each question
  const [generatingExplanationIndices, setGeneratingExplanationIndices] = useState<number[]>([]);
  const [generatedExplanations, setGeneratedExplanations] = useState<{[key: number]: string}>({});
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapTime = useRef<number>(0);

  // Initialize speech synthesis
  useEffect(() => {
    speechSynthesisRef.current = window.speechSynthesis;
    return () => {
      // Cancel any ongoing speech when component unmounts
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // Timer for the quiz
  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted]);

  // Set up double-tap listener
  useEffect(() => {
    const handleTap = (e: MouseEvent) => {
      const now = new Date().getTime();
      const timeSince = now - lastTapTime.current;
      
      if (timeSince < 300 && timeSince > 0) {
        // Double tap detected
        readCurrentQuestionAndOptions();
        e.preventDefault();
      }
      
      lastTapTime.current = now;
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleTap);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('click', handleTap);
      }
    };
  }, [currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  const readText = (text: string) => {
    if (!isSpeechEnabled || !speechSynthesisRef.current) return;
    
    // canel speech
    speechSynthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    speechSynthesisRef.current.speak(utterance);
  };

  const readCurrentQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const textToRead = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}`;
    readText(textToRead);
  };
  
  const readCurrentQuestionAndOptions = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    let textToRead = `Question ${currentQuestionIndex + 1}: ${currentQuestion.question}. `;
    textToRead += "Options: ";
    
    currentQuestion.options.forEach((option, index) => {
      textToRead += `Option ${index + 1}: ${option}. `;
    });
    
    readText(textToRead);
  };

  const toggleMasterSpeech = () => {
    if (speechSynthesisRef.current) {
      if (isSpeechEnabled) {
        speechSynthesisRef.current.cancel(); // Stop any ongoing speech
      }
    }
    
    // Toggle  speech functionality and icon 
    setIsSpeechEnabled(!isSpeechEnabled);
    setSpeakerIconsVisible(!speakerIconsVisible);
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

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  const readOption = (option: string) => {
    readText(option);
  };

  // Check if a specific question is currently generating an explanation
  const isGeneratingExplanationForQuestion = (questionIndex: number) => {
    return generatingExplanationIndices.includes(questionIndex);
  };

  // generate explanation using OpenRouter AI API
  const generateExplanation = async (questionIndex: number) => {
    if (generatedExplanations[questionIndex]) {
      setSelectedExplanation(generatedExplanations[questionIndex]);
      return;
    }

    // Add this question index to the generating array
    setGeneratingExplanationIndices(prev => [...prev, questionIndex]);
    
    try {
      const question = questions[questionIndex];
      const userAnswer = answers[questionIndex];
      const isCorrect = question.correctAnswer === userAnswer;
      
      // Create the prompt for the AI
      const prompt = `
You are an educational assistant helping students understand quiz questions.

Question: ${question.question}

Options:
${question.options.map((opt, i) => `${i+1}. ${opt}`).join('\n')}

Correct answer: ${question.correctAnswer}
Student's answer: ${userAnswer}
Was the student correct? ${isCorrect ? 'Yes' : 'No'}

Please provide a detailed explanation of why the correct answer is right, and why the other options are wrong. 
Include relevant concepts, examples, and connections to NCERT material where possible.
Keep your explanation clear, educational, and around 150-200 words.
`;
      
      // Make the API call to OpenRouter
      const response = await fetch(aiConfig.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiConfig.apiKey}`,
          "HTTP-Referer": aiConfig.referer,
          "X-Title": aiConfig.siteTitle,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": aiConfig.model,
          "messages": [
            {
              "role": "system",
              "content": "You are an educational assistant that creates clear, helpful explanations for quiz questions."
            },
            {
              "role": "user",
              "content": prompt
            }
          ],
          "temperature": 0.7,
          "max_tokens": 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const generatedExplanation = data.choices[0].message.content;
      
      const newExplanations = { ...generatedExplanations };
      newExplanations[questionIndex] = generatedExplanation;
      
      setGeneratedExplanations(newExplanations);
      setSelectedExplanation(generatedExplanation);
    } catch (error) {
      console.error("Error generating explanation:", error);
      setSelectedExplanation("Sorry, there was an error generating the explanation. Please try again later.");
    } finally {
      // Remove this question index from the generating array
      setGeneratingExplanationIndices(prev => prev.filter(idx => idx !== questionIndex));
    }
  };

  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);
  const questionsAttempted = answers.filter((answer) => answer !== '').length;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative" ref={containerRef}>
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl z-10">
        {!submitted ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Generated Quiz</h2>
              <div className="flex items-center gap-3">
                  <button 
                  onClick={toggleMasterSpeech}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title={isSpeechEnabled ? "Mute all speech" : "Unmute speech"}
                >
                  {isSpeechEnabled ? (
                    <Volume2 className="h-5 w-5 text-pink-500" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                <span className="text-sm text-gray-600">{formatTime(timeSpent)}</span>
              </div>
            </div>

            <div className="w-full h-2 mb-6">
              <div
                className="h-2 bg-pink-500 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-gray-900">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                
              </div>
              <div className="flex gap-2 items-center mb-4">
                <p className="font-medium text-gray-900 text-lg">
                  {questions[currentQuestionIndex].question}
                </p>
                {speakerIconsVisible && isSpeechEnabled && (
                  <button
                    onClick={() => readText(questions[currentQuestionIndex].question)}
                    className="ml-2 text-pink-500 hover:text-pink-600 transition-opacity"
                    title="Read question"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`block p-4 rounded-lg border cursor-pointer transition-colors
                      ${answers[currentQuestionIndex] === option
                        ? 'bg-pink-100 border-pink-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    onMouseEnter={() => isSpeechEnabled && readOption(option)}
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
                      {speakerIconsVisible && isSpeechEnabled && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            readOption(option);
                          }}
                          className="ml-auto text-pink-500 hover:text-pink-600 transition-opacity"
                          title="Read option"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      )}
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
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <p className="font-medium text-gray-900">
                          {index + 1}. {question.question}
                        </p>
                        <div className="flex gap-2">
                          {isSpeechEnabled && (
                            <button 
                              onClick={() => {
                                let textToRead = question.question + ". ";
                                textToRead += "Options: ";
                                question.options.forEach((opt, i) => {
                                  textToRead += `Option ${i + 1}: ${opt}. `;
                                });
                                textToRead += `The correct answer is: ${question.correctAnswer}`;
                                readText(textToRead);
                              }}
                              className="flex-shrink-0 p-1 rounded-full bg-pink-100 hover:bg-pink-200 transition-colors"
                              title="Read question and options"
                            >
                              <Volume2 className="h-5 w-5 text-pink-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
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

                      <button
                        onClick={() => generateExplanation(index)}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-2 text-sm"
                        disabled={isGeneratingExplanationForQuestion(index)}
                      >
                        <BookOpen className="h-4 w-4" />
                        {isGeneratingExplanationForQuestion(index) ? "Generating..." : 
                         generatedExplanations[index] ? "View Explanation" : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Generate AI Explanation
                          </>
                         )}
                      </button>
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
                  href="https://ncertquest.netlify.app"
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              AI-Generated Explanation
              <span className="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded">Powered by AI</span>
            </h3>
            
            <div className="flex gap-2 items-start">
              <p className="text-gray-700 whitespace-pre-line">{selectedExplanation}</p>
              {isSpeechEnabled && (
                <button
                  onClick={() => readText(selectedExplanation || "")}
                  className="text-pink-500 hover:text-pink-600 flex-shrink-0 mt-1"
                  title="Read explanation"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MCQTest;
