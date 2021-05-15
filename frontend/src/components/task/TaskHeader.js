import React from "react";
import "./Task.css";
import styled from "styled-components";

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

export default function TaskHeader(props) {
  return (
    <Header>
      <HeaderSide>
        <Domino src="images/domino.svg" alt="" />
        <Icon src={props.icon_url} alt="icon"></Icon>
        <div>{props.title}</div>
      </HeaderSide>
      <div>
        <Source>{props.sender}</Source>
      </div>
    </Header>
  );
}
