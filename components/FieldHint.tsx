
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface FieldHintProps {
  text: string;
}

const FieldHint: React.FC<FieldHintProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-slate-300 dark:text-slate-600 hover:text-pink-500 dark:hover:text-pink-400 transition-colors focus:outline-none"
        aria-label={`Help: ${text}`}
        tabIndex={0}
      >
        <HelpCircle size={13} />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 dark:bg-slate-700 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl z-50 leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
        </span>
      )}
    </span>
  );
};

export default FieldHint;
