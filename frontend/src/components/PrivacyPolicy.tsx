import React from 'react'
import styled from 'styled-components'

const PrivacyContent = styled.div`
  width: 75%;
  margin: auto;
  text-indent: 30px;
`;

const Title = styled.h1`
  text-align: center;
`;

const PrivacyPolicy: React.FC = () =>
    <div>
      <Title>Privacy Policy</Title>
      <PrivacyContent>
        <p>
          Bee Movie Script - Dialogue Transcript According to all known laws of
          aviation, there is no way a bee should be able to fly. Its wings are
          too small to get its fat little body off the ground. The bee, of
          course, flies anyway because bees don't care what humans think is
          impossible. Yellow, black. Yellow, black. Yellow, black. Yellow,
          black. Ooh, black and yellow! Let's shake it up a little. Barry!
          Breakfast is ready! Ooming! Hang on a second. Hello? - Barry? - Adam?
          - Oan you believe this is happening? - I can't. I'll pick you up.
          Looking sharp. Use the stairs. Your father paid good money for those.
          Sorry. I'm excited. Here's the graduate. We're very proud of you, son.
          A perfect report card, all B's. Very proud. Ma! I got a thing going
          here. - You got lint on your fuzz. - Ow! That's me! - Wave to us!
          We'll be in row 118,000. - Bye! Barry, I told you, stop flying in the
          house! - Hey, Adam. - Hey, Barry. - Is that fuzz gel? - A little.
          Special day, graduation. Never thought I'd make it. Three days grade
          school, three days high school. Those were awkward. Three days
          college. I'm glad I took a day and hitchhiked around the hive. You did
          come back different. - Hi, Barry. - Artie, growing a mustache? Looks
          good. - Hear about Frankie? - Yeah. - You going to the funeral? - No,
          I'm not going.
        </p>
        <p>Also we promise not to steal your information</p>
      </PrivacyContent>
    </div>

export default PrivacyPolicy;
