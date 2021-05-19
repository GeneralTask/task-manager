import Cookies from "js-cookie";
import styled from "styled-components";

import TaskList from "./task/TaskList";
import GLButton from "./login/GoogleLogin";
import { LOGIN_URL } from "../constants";

const Logo = styled.div`
  font-weight: bold;
  font-size: 32px;
  margin-left: 10px;
  margin-top: 10px;
`;
const Container = styled.div`
  width: 65%;
  margin: auto;
`;
const Title = styled.div`
  font-size: 58px;
  text-align: center;
  margin-top: 60px;
  margin-bottom: 40px;
`;
const Subtitle = styled.div`
  font-size: 27px;
  color: #969696;
  text-align: center;
  margin-bottom: 30px;
`;
const WaitlistInput = styled.input`
  width: 250px;
  height: 100%;
  border: 1.5px solid black;
  border-radius: 2px;
  color: #969696;
  box-sizing: border-box;
  text-align: center;
`;
const JoinWaitlistButton = styled.button`
  width: 200px;
  height: 100%;
  border: 1.5px solid black;
  border-radius: 2px;
  color: white;
  background-color: black;
`;
const WaitlistInputs = styled.div`
  height: 34px;
  text-align: center;
  margin-bottom: 40px;
`;
const LoginWithGoogle = styled.a`
  border: 1px solid #cccccc;
  border-radius: 2px;
  margin: auto;
  display: flex;
  width: 200px;
  color: #969696;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 4px;
`;

function LandingPage() {
  if (Cookies.get("authToken")) {
    return <TaskList />;
  }
  return (
    <div>
      <Logo>General Task</Logo>
      <Container>
        <Title>
          The task manager for
          <br /> highly productive people.
        </Title>
        <Subtitle>
          General Task pulls together your emails, messages, and tasks 
          <br/>and prioritizes what matters most.
        </Subtitle>
        <WaitlistInputs>
          <WaitlistInput placeholder="Enter email address" />
          <JoinWaitlistButton
            onClick={() => {
              alert("Waitlist is closed currently.");
            }}
          >
            Join the Waitlist
          </JoinWaitlistButton>
        </WaitlistInputs>
        <LoginWithGoogle href={LOGIN_URL} role="button">
          <GLButton />
          Sign in with Google
        </LoginWithGoogle>
      </Container>
    </div>
  );
}

export default LandingPage;
