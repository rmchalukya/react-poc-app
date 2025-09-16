import React from 'react';

export default function InfoEmpty({ message }) {
  return (
    <div className="text-sm text-gray-500 italic">
      {message}
    </div>
  );
}