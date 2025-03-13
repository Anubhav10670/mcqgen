import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';

interface InputFormProps {
  onSubmit: (text: string, numQuestions: number) => void;
  loading: boolean;
}

function InputForm({ onSubmit, loading }: InputFormProps) {
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && numQuestions > 0) {
      onSubmit(text.trim(), numQuestions);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate MCQ Test</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your text
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-gray-50"
            placeholder="Paste your text here..."
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
            Number of questions
          </label>
          <input
            type="number"
            id="numQuestions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-gray-50"
            min="1"
            max="20"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 focus:ring-4 focus:ring-pink-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              Generating questions...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Generate MCQ Test
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default InputForm;