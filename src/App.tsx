import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
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
  const abortRef = useRef<AbortController | null>(null);

  
  const OPENROUTER_API_KEY = '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';

  const generateQuestions = async (text: string, numQuestions: number) => {
    setLoading(true);
    setError(null);

    const prompt = `I want you to generate Extremely tough ${numQuestions} multiple-choice quiz questions based on the following text. The output should be strictly in valid JSON format, containing only the questions, options, and correct answers. The JSON should be correct with no syntax errors and should avoid using backticks or any other formatting characters. Do not include any additional remarks, reasoning, or explanations—only the JSON output. Format the response as a JSON array where each question object follows this structure: {"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}. Ensure the JSON is valid and contains meaningful questions which clear main topics for students and avoid activities for generation. Text: ${text}`;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error(
          'No API key provided.',
        );
      }

      const providerPayload = {
        model: 'google/gemma-3-27b-it:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
       
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify(providerPayload),
      });

      
      const textBody = await response.text();

      if (!response.ok) {
       
        let msg = textBody;
        try {
          const parsedErr = JSON.parse(textBody);
          msg = parsedErr?.error?.message ?? parsedErr?.message ?? JSON.stringify(parsedErr);
        } catch {
        
        }
        throw new Error(`Provider error (${response.status}): ${msg}`);
      }

      
      let providerJson: any;
      try {
        providerJson = JSON.parse(textBody);
      } catch {
       
        providerJson = textBody;
      }

      
      const modelText =
        (providerJson && providerJson.choices?.[0]?.message?.content) ||
        (providerJson && providerJson.choices?.[0]?.text) ||
        providerJson?.output ||
        (typeof providerJson === 'string' ? providerJson : JSON.stringify(providerJson));

      // Attempt to parse the model's returned text as JSON (because we requested JSON)
      let generatedQuestions: any;
      try {
        generatedQuestions = typeof modelText === 'string' ? JSON.parse(modelText) : modelText;
      } catch (err) {
        // If parsing fails, provide a helpful error showing the raw content
        throw new Error('AI returned invalid JSON. Response content: ' + String(modelText).slice(0, 2000));
      }

      // Validate structure: it should be an array of question objects
      if (!Array.isArray(generatedQuestions)) {
        throw new Error('AI output is not a JSON array. Output: ' + JSON.stringify(generatedQuestions));
      }

      for (const [idx, q] of generatedQuestions.entries()) {
        if (
          typeof q.question !== 'string' ||
          !Array.isArray(q.options) ||
          typeof q.correctAnswer !== 'string'
        ) {
          throw new Error(
            `AI output has unexpected structure at index ${idx}. Each item must have question:string, options:string[], correctAnswer:string. Item: ${JSON.stringify(
              q,
            )}`,
          );
        }
      }

      setQuestions(generatedQuestions as Question[]);
      setShowTest(true);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // Request was cancelled: don't set a user-facing error
        console.log('Request aborted');
      } else {
        console.error('generateQuestions error:', err);
        setError(err?.message ?? 'Failed to generate questions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount: abort any in-flight request
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

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
