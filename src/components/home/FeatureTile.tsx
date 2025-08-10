import React from 'react';
import { IconType } from 'react-icons';

interface Props {
  icon: IconType;
  title: string;
  text: string;
}

export default function FeatureTile({ icon: Icon, title, text }: Props) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 mb-4">
        <Icon className="text-blue-600 w-6 h-6" />
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
} 