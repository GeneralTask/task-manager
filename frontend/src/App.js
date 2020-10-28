import React from 'react';

import './App.css';

class Task extends React.Component {
  constructor(props) {
    super(props);
    this.state = {title: props.title, description: props.description};
  }

  handleDone() {
    this.setState({title: "Oopsie done"});
  }

  handleNoTime() {
    this.setState({title: "Oopsie no time"});
  }

  render() {
    return (
      <div className="Task">
        <h2>{this.state.title}</h2>
        <span>{this.state.description}</span><br/><br/>
        <button onClick={() => this.handleDone()}>Done</button> <button onClick={() => this.handleNoTime()}>I don't have time</button>
      </div>
    );
  }
}

function App() {
  var title = "This is a task 2";
  var description = "This is a description 3";
  return (
    <div className="App">
      <Task title={title} description={description}></Task>
    </div>
  );
}

export default App;
