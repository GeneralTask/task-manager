import React from "react"
import "./Task.css"
import {TASKS_URL} from '../../constants'
import store from '../../redux/store'
import {removeTaskById} from '../../redux/actions'
import {getHeaders} from '../../helpers/utils'
import ExpandButton from './ExpandButton'

import styled from "styled-components"


const Header = styled.div`
  font-size: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
`;

const HeaderSide = styled.div`
  text-align: left;
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
`;
const Domino = styled.img`
  height: 18px;
`;
const Icon = styled.img`
  max-width: 40px;
  padding-left: 12px;
  padding-right: 12px;
`;
const Source = styled.div`
  color: #cccccc;
`;
const DoneButton = styled.button`
  background-color: white;
  border-radius: 2px;
  border: 2px solid black;
  margin-left: 10px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 4px 6px 4px 6px;
  font-weight: 500;
  &:hover{
    background-color: black;
    color: white;
  }
`;

const TaskHeader = ({ icon_url, title, sender, task_id, is_completable, has_body }) => {
  console.log("header", has_body)
  return (
    <Header>
      <HeaderSide>
        <Domino src="images/domino.svg" alt="" />
        <Icon src={icon_url} alt="icon"></Icon>
        <div>{title}</div>
      </HeaderSide>
      <Source>{sender}</Source>
      {is_completable ?
      <DoneButton
        onClick={(e) => {
          e.stopPropagation();
          done(task_id)
        }}
      >
        Done
      </DoneButton>
      : null}
      <ExpandButton has_body={has_body} task_id={task_id}/>
    </Header>
  );
};

const done = async (task_id) => {
  try {
    store.dispatch(removeTaskById(task_id));

    const response = await fetch(TASKS_URL + task_id + '/', {
      method: "PATCH",
      mode: "cors",
      headers: getHeaders(),
      body: JSON.stringify({ "is_completed": true })
    });
    
    if (!response.ok) {
      throw new Error("PATCH /tasks api call failed");
    } 
  } catch (e) {
    console.log({e});
  }
};

export default TaskHeader;
