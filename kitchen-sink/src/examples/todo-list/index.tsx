import { useState, Suspense } from 'react';
import { scan, Store } from '@evolu/scan';
import './styles.css';

import {
  Evolu,
  EvoluProvider,
  useQuery,
  evolu,
  formatTypeError,
  todosQuery,
  useEvolu,
  type TodosRow,
} from './evolu';

Store.isInIframe.value = false;
scan({
  evolu,
  enabled: true,
  dangerouslyForceRunInProduction: true,
});

function TodoListItem({ row }: { row: TodosRow }) {
  const { id, title, isCompleted } = row;
  const { update } = useEvolu();

  return (
    <div className={`todo-item ${isCompleted ? 'complete' : 'pending'}`}>
      <div className="todo-item-content">{title}</div>
      <div className="todo-item-actions">
        <button
          type="button"
          className={`todo-item-toggle ${isCompleted ? 'complete' : 'pending'}`}
          onClick={(): void => {
            update('todo', {
              id,
              isCompleted: Evolu.booleanToSqliteBoolean(!isCompleted),
            });
          }}
        >
          {isCompleted ? 'Completed' : 'Pending'}
        </button>
        <button
          type="button"
          className="todo-item-delete"
          onClick={(): void => {
            update('todo', { id, isDeleted: Evolu.sqliteTrue });
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function TodoListForm() {
  const [message, setMessage] = useState('');
  const { insert } = useEvolu();

  return (
    <form
      className="todo-list-form"
      onSubmit={(e): void => {
        e.preventDefault();
        const result = insert(
          'todo',
          { title: message.trim() },
          { onComplete: () => setMessage('') },
        );
        if (!result.ok) {
          alert(formatTypeError(result.error));
        }
      }}
    >
      <input
        type="text"
        value={message}
        onInput={(e): void => {
          setMessage((e.target as HTMLInputElement).value);
        }}
      />
      <button type="submit" disabled={message === ''}>
        Add
      </button>
    </form>
  );
}

function TodoList() {
  const todos = useQuery(todosQuery);

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoListItem key={todo.id} row={todo} />
      ))}
    </div>
  );
}

export default function App() {
  return (
    <div className="app">
      <h1>Todo List</h1>
      <EvoluProvider value={evolu}>
        <TodoListForm />
        <Suspense>
          <TodoList />
        </Suspense>
      </EvoluProvider>
    </div>
  );
}
