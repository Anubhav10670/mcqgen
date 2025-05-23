import React, { useState } from 'react';
import { BookOpen, Send, CheckCircle, AlertCircle } from 'lucide-react';
import MCQTest from './components/MCQTest';
import InputForm from './components/InputForm';

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = async (text: string, numQuestions: number) => {
    setLoading(true);
    setError(null);
    
const prompt = `You are an educational expert and assessment designer with a deep understanding of pedagogy, concept-based learning, and effective question formulation. Your task is to generate exactly ${numQuestions} multiple-choice quiz questions based on the provided instructional content.

Your output must meet the following criteria:

Purpose and Quality:

Each question should test meaningful understanding of the key concepts in the text—not just rote memorization.

Questions must be mid-level in difficulty and designed to help students grasp and internalize core ideas.

Avoid vague or filler phrasing such as "in the passage", "on the page", or references to activity numbers.

Do not create questions that rely on context outside the provided text.

Ensure questions are clear, well-structured, and pedagogically sound.

Formatting Requirements:

Output must be a valid JSON array of question objects.


JSON must be syntactically perfect—no missing commas, incorrect brackets, or formatting errors.

Do not include any markdown (e.g., backticks, code blocks) or additional explanation—only output the raw JSON in plain text format.

Important Constraints:

Do not include any introductory text, commentary, or meta remarks.

Do not reference activities, figures, or sections by number or label.

Ensure that each question contributes to conceptual clarity and reinforces important learning outcomes.

You are supposed to provide the asnswer of the questions and that too in json format IT IS VERY IMPORTANT
Text: ${text}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
          'HTTP-Referer': 'https://www.sitename.com',
          'X-Title': 'SiteName',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-small-3.1-24b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const generatedQuestions = JSON.parse(data.choices[0].message.content);
      setQuestions(generatedQuestions);
      setShowTest(true);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetTest = () => {
    setShowTest(false);
    setQuestions([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-pink-500" />
          <h1 className="text-xl font-semibold text-gray-900">MCQ Generator</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {!showTest ? (
          <InputForm onSubmit={generateQuestions} loading={loading} />
        ) : (
          <MCQTest questions={questions} onReset={resetTest} />
        )}
      </main>
    </div>
  );
}

export default App;
