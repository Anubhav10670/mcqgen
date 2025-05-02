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
    
const prompt = `I want you to generate ${numQuestions} multiple-choice quiz questions based on the following text. The output should be strictly in valid JSON format, containing only the questions, options, and correct answers. The JSON should be correct with no syntax errors and should avoid using backticks or any other formatting characters. Do not include any additional remarks, reasoning, or explanations—only the JSON output (the questions should be valuable and good with meaning not like , in the passage , in the page , explain the question well you are supposed to clear the concepts of student via mcqs make the questions mid difficult). Format the response as a JSON array where each question object follows this structure: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}. Ensure the JSON is valid and contains meaningful questions which clears main topics of students and avoid activities for generation . Do not make any errors in the JSON file, and format it carefully , the output should be in text format dont box it. Text: ${text}`;

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
