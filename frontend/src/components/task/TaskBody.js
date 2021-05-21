import { connect, useSelector } from "react-redux";
import styled from "styled-components";

const BodyHTML = styled.iframe`
  border: none;
  border-radius: 2px;
  width: 100%;
`;
const BodyDiv = styled.div`
  margin: auto;
  width: 95%;
  padding: 6px;
`;
const Deeplink = styled.div`
  margin: auto;
  text-align: center;
  width: 100%;
  color: black;
`;

// no body: no body
// has_body, expanded_body != task_id: no body
// has_body, expanded_body == task_id: show body
const TaskBody = ({ body, task_id, deeplink, source }) => {
  const expanded_body = useSelector((state) => state.expanded_body);
  const has_body = body || deeplink;
  return (
    <div>
      {has_body && expanded_body === task_id ? (
        <div>
          {body ? (
            <BodyDiv>
              <BodyHTML title={"Body for task: " + task_id} srcDoc={body} />
            </BodyDiv>
          ) : null}
          {deeplink ? (
            <Deeplink>
              <p>
                See more at <a href={deeplink}>{source}</a>
              </p>
            </Deeplink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default connect((state) => ({ expanded_body: state.expanded_body }))(
  TaskBody
);
