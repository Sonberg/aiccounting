import { ReactNode } from 'react';

type Props = {
  content: ReactNode;
  children: ReactNode;
};

export function Tooltip({ children, content }: Props) {
  <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
    <div className="bg-gray-800 text-white text-xs px-4 py-1 rounded-full shadow">
      {content}
    </div>
    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
  </div>;
}
