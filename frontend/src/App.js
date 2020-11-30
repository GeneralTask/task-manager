import React, { useState } from 'react';

import './App.css';

function Task(props) {
  const [title, setTitle] = useState(props.title);
  const [description, setDescription] = useState(props.description);

  function handleDone() {
    setTitle("Oopsie done");
    props.onDone();
  }

  function handleNoTime() {
    setTitle("Oopsie no time");
  }

  return (
    <div className="Task" style={{border: "1px solid black", width: "200px"}}>
      <h2>{title}</h2>
      <span>{description}</span><br/><br/>
      <button onClick={() => handleDone()}>Done</button> <button onClick={() => handleNoTime()}>I don't have time</button>
    </div>
  );
}

function App() {
  const initialTasks = [
    {
      id: 1,
      title: "This is an important task",
      description: "Do it now or else",
    },
    {
      id: 2,
      title: "This is less important task",
      description: "Do it maybe",
    }
  ];
  const [tasks, setTasks] = useState(initialTasks);

  function handleDone(task_id) {
    const newTasks = tasks.splice(task_id, 1)
    setTasks(newTasks);
    console.log(newTasks, task_id);
  }

  return (
    <div className="App">
      {tasks.map((task, task_index) =>
        <Task title={task.title} description={task.description} onDone={() => handleDone(task_index)}></Task>
      )}
    </div>
  );
}

export default App;
