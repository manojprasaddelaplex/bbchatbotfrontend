import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.scss';
import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';
import { HeadsetMic as HeadsetMicIcon, Person as PersonIcon, RestartAlt as RestartAltIcon, Send as SendIcon } from '@mui/icons-material';
import ExportData from './export/Export_data';
import axios from 'axios';
import { CHART_COLORS } from './assets/utils';
import { DataGrid } from '@mui/x-data-grid';
import Feedback from './feedback/Feedback';

interface Message {
  text: string;
  sender: 'bot' | 'user';
  chart?: any;
  table?: {
    headers: string[];
    rows: any[];
  };
  user_query?: string;
  sql_query?: string;
  similar_questions?: string[];
}

function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ text: 'Hello! How can I assist you today?', sender: 'bot' }]);
  const [loading, setLoading] = useState(false);
  const [resID, setResID] = useState('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const submitQuestion = useCallback(async () => {
    if (!query.trim()) return;

    setQuery('');
    setLoading(true);
    setResID('');

    const userMessage: Message = { text: query, sender: 'user' };
    let botMessage: Message = { text: '', sender: 'bot', user_query: query };

    try {
      const response = await axios.post('https://blueberry-dev.azurewebsites.net/query', { query });
      const { results: data, id, sql_query } = response.data;
      setResID(id);

      if (data.text) {
        botMessage.text = data.text;
      } else if (data.type === 'doughnut' || data.type === 'bar') {
        botMessage.text = `Here is a ${data.type === 'doughnut' ? 'chart' : 'graph'} you requested.`;
        botMessage.chart = {
          type: data.type,
          data: {
            labels: data.labels,
            datasets: [{
              label: 'Count',
              data: data.data,
              backgroundColor: Object.values(CHART_COLORS),
              borderWidth: 1,
              ...(data.type === 'doughnut' && { hoverOffset: 10 })
            }]
          },
          options: {
            responsive: true,
            ...(data.type === 'doughnut' && { layout: { padding: 10 } })
          }
        };
      } else if (data.headers && data.rows) {
        botMessage.text = `Here is a table you requested.`;
        botMessage.table = { headers: data.headers, rows: data.rows };
      }

      // Extracting sql_query from the response
      if (sql_query) {
        botMessage.sql_query = sql_query;
      }

    } catch (error: any) {
      const errorId = error.response.data.id;
      const errorData = error.response.data.error;
      const errorSqlQuery = error.response.data.sql_query;
      const similarQuestions = error.response.data.similar_questions;
      setResID(errorId);
      botMessage.text = errorData;
      if (errorSqlQuery) {
        botMessage.sql_query = errorSqlQuery;
      }
      if (similarQuestions) {
        botMessage.similar_questions = similarQuestions;
      }
    }

    setMessages(prev => [...prev, userMessage, botMessage]);
    setLoading(false);
  }, [query]);

  const handleReset = useCallback(() => {
    setQuery('');
    setMessages([{ text: 'Hello! How can I assist you today?', sender: 'bot' }]);
    setLoading(false);
  }, []);

  const renderMessage = useCallback((message: Message, index: number) => {
    const isBot = message.sender === 'bot';
    const isLatest = index === messages.length - 1;

    return (
      <div key={index} className='message-wrapper'>
        {isBot && (
          <div className="icon-container">
            <HeadsetMicIcon />
          </div>
        )}
        <div className={`${message.sender}-container`}>
          <div className={`message ${message.sender}`}>
            {isBot && !loading && index !== 0 && (
              <div className='upper-right'>
                {isLatest && (
                  <Feedback id={resID} userQuestion={message.user_query}/>
                )}
                <ExportData message={message} />
              </div>
            )}
            <p>{message.text}</p>

            {message.chart && <Chart {...message.chart} />}
            {message.table && (
              <DataGrid
                rows={message.table.rows.map((row, rowIndex) => ({
                  id: rowIndex + 1,
                  ...Object.fromEntries(message.table!.headers.map((header, i) => [header, row[i]]))
                }))}
                columns={message.table.headers.map(header => ({
                  field: header,
                  headerName: header,
                  minWidth: 100,
                  flex: 1,
                  headerClassName: 'table-header'
                }))}
                initialState={{
                  pagination: { paginationModel: { pageSize: 5 } },
                }}
                pageSizeOptions={[5]}
                sx={{
                  '& .MuiDataGrid-menuIconButton': { color: 'white' }
                }}
              />
            )}
            {/* Display similar questions if available */}
            {message.similar_questions && message.similar_questions.length > 0 && (
              <div className="similar-questions">
                <strong>Similar Questions:</strong>
                <ul>
                  {message.similar_questions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
            {message.sql_query && (
              <div className="sql-query">
                <strong>SQL Query:</strong> <pre>{message.sql_query}</pre>
              </div>
            )}
          </div>
        </div>
        {!isBot && (
          <div className="icon-container-user" style={{ alignSelf: 'center' }}>
            <PersonIcon />
          </div>
        )}
      </div>
    );
  }, [loading, messages.length, resID]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && query.trim()) {
      submitQuestion();
    }
  }, [loading, query, submitQuestion]);
  const isSubmitDisabled = useMemo(() => loading || !query.trim(), [loading, query]);

  return (
    <div className="chatbot-interface">
      <div className='chatbot-header'>
        <div className='flex-area'>
          <div className="icon-container">
            <img src="sonar-logo.png" alt="Logo" />
          </div>
          <div className='right-content'>
            <p>Sonar ChatBot</p>
          </div>
        </div>
      </div>
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map(renderMessage)}
        {loading && (
          <div className='bot-loading'>
            <div className='message-wrapper'>
              <div className="icon-container">
                <HeadsetMicIcon />
              </div>
              <div className='loading-message bot'>
                <div className='padding-snippet'>
                  <div className="snippet" data-title="dot-elastic">
                    <div className="stage">
                      <div className="dot-elastic"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Please enter your topic and details for the chart"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="input-field"
        />
        <button
          onClick={handleReset}
          disabled={loading}
          className={`send-button chat-reset-button ${loading ? 'disabled' : ''}`}
          style={{ backgroundColor: '#1b3765' }}
        >
          <RestartAltIcon />
        </button>
        <button
          onClick={submitQuestion}
          disabled={isSubmitDisabled}
          className={`send-button ${isSubmitDisabled ? 'disabled' : ''}`}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default App;