import { type JSX, useState } from 'react';
import './main.css';

interface Example {
  title: string;
  url: string;
}

const examples: Example[] = [
  { title: 'Todo List', url: '/?example=todo-list' },
  { title: 'Sierpinski Triangle', url: '/?example=sierpinski' },
];

export default function Home(): JSX.Element {
  const [example, setExample] = useState(0);

  return (
    <div className="shell">
      <div className="header">
        <h1>evolu-scan</h1>
      </div>
      <div className="content">
        <div className="sidebar">
          {examples.map((item, index) => (
            <button
              key={item.url}
              className="sidebar-btn"
              type="button"
              onClick={() => setExample(index)}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="main">
          <iframe title="example" src={examples[example].url} />
        </div>
      </div>
    </div>
  );
}
