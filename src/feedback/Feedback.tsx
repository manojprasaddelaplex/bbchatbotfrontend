import React, { useState } from 'react';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import axios from 'axios';

interface FeedbackProps {
  id: string; // New prop for exception
}

const Feedback: React.FC<FeedbackProps> = ({ id }) => {
  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleFeedback = async (isCorrect: boolean) => {
    if (feedbackGiven) return;

    const resID = id;
    const feedback = isCorrect;
    try {
      await axios.post('http://127.0.0.1:5000/feedback', {
        resID: resID,
        feedback: feedback
      });
      setLiked(isCorrect);
      setFeedbackGiven(true);
    } catch (error) {
      alert(`Error sending feedback: ${error}`)
    }
  };

  return (
    <div className="feedback">
      <div>
        <ThumbUpIcon
          className={`feedback-icon ${feedbackGiven ? 'disabled' : ''}`}
          onClick={() => handleFeedback(true)}
          style={{
            cursor: feedbackGiven ? 'not-allowed' : 'pointer',
            width: '20px', height: "20px",
            color: liked === true ? '#1b3765' : 'grey',
          }}
        />
      </div>
      <div>
        <ThumbDownIcon
          className={`feedback-icon ${feedbackGiven ? 'disabled' : ''}`}
          onClick={() => handleFeedback(false)}
          style={{
            cursor: feedbackGiven ? 'not-allowed' : 'pointer',
            width: '20px', height: "20px",
            color: liked === false ? '#1b3765' : 'grey',
          }}
        />
      </div>
    </div>
  );
};

export default Feedback;
