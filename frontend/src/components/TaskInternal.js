import React from 'react';

class TaskInternal extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            title: this.props.title,
        }
    }
    // not proper redux but works for styling now
    handleDone() {
        this.setState({title: "Oopsie Test"}); 
    }
    
    handleNoTime() {
        this.setState({title: "Oopsie no time"});
    }
    render(){
        return(
            <div>
                <h2>{this.state.title}</h2>
                <span>{this.props.index}</span><br/><br/>
                <button onClick={() => this.handleDone()}>Done</button> <button onClick={() => this.handleNoTime()}>I don't have time</button>
            </div>
        );
    }
}

export default TaskInternal;