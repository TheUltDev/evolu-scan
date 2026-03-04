import { type JSX, useState } from 'react';
import './main.css';

interface Example {
  title: string;
  url: string;
}

const examples: Example[] = [
  { title: 'Sierpinski Triangle', url: '/?example=sierpinski' },
  { title: 'Todo List', url: '/?example=todo-list' },
];

export default function Home(): JSX.Element {
  const [example, setExample] = useState(0);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#111111] text-neutral-200">
      <div className="flex flex-none border-b border-neutral-800">
        <h1 className="m-8 font-bold text-3xl">react-scan</h1>
      </div>
      <div className="flex flex-1">
        {/* content */}
        <div className="flex flex-none flex-col border-r border-neutral-800">
          {/* sidebar */}
          {examples.map((item, index) => (
            <button
              key={item.url}
              className="px-8 py-4 border-b border-neutral-800 hover:bg-neutral-900 transition-colors"
              type="button"
              onClick={() => setExample(index)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          {/* iframe */}
          <iframe className="flex-1 h-full" src={examples[example].url} />
        </div>
      </div>
    </div>
  );
}
