import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

function LatexRenderer({ text }) {
  if (!text) return null;

  const parts = [];
  let currentText = text;

  const patterns = [
    {
      regex: /\$\$[\s\S]*?\$\$/g,
      isBlock: true,
      extractContent: (match) => match.slice(2, -2)
    },
    {
      regex: /\\\[[\s\S]*?\\\]/g,
      isBlock: true,
      extractContent: (match) => match.slice(2, -2)
    },
    {
      regex: /\$[^\$\\\n]*(?:\\.[^\$\\\n]*)*\$/g,
      isBlock: false,
      extractContent: (match) => match.slice(1, -1)
    },
    {
      regex: /\\\([\s\S]*?\\\)/g,
      isBlock: false,
      extractContent: (match) => match.slice(2, -2)
    }
  ];

  while (currentText.length > 0) {
    let earliestMatch = null;
    let matchedPattern = null;

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      const match = regex.exec(currentText);
      if (match && (!earliestMatch || match.index < earliestMatch.index)) {
        earliestMatch = match;
        matchedPattern = pattern;
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > 0) {
        parts.push(currentText.slice(0, earliestMatch.index));
      }

      const content = matchedPattern.extractContent(earliestMatch[0]);
      if (matchedPattern.isBlock) {
        parts.push(<BlockMath key={parts.length} math={content} />);
      } else {
        parts.push(<InlineMath key={parts.length} math={content} />);
      }

      currentText = currentText.slice(earliestMatch.index + earliestMatch[0].length);
    } else {
      parts.push(currentText);
      break;
    }
  }

  return (
    <span>
      {parts.map((part, index) => (
        typeof part === 'string' ? <span key={index}>{part}</span> : part
      ))}
    </span>
  );
}

export default LatexRenderer;
