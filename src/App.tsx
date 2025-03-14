import React, { useState } from 'react';
import { BookOpen, Send, CheckCircle, AlertCircle } from 'lucide-react';
import MCQTest from './components/MCQTest';
import InputForm from './components/InputForm';

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = async (text: string, numQuestions: number) => {
    setLoading(true);
    setError(null);
    
    const prompt = `Generate ${numQuestions} multiple choice questions from the following text and dont stop while doing so also dont make qquestions from activities if there is. Format the response as a JSON array where each question object has the format: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}\n\nText: ${text}`;

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
          model: 'qwen/qwq-32b:free',
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
