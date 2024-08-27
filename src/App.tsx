import React, { useState, useEffect, useRef } from 'react';
import './App.scss';
import 'chart.js/auto';
import { Chart } from 'react-chartjs-2';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import PersonIcon from '@mui/icons-material/Person';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SendIcon from '@mui/icons-material/Send';
import ExportData from './export/Export_data';
import axios from 'axios';
import { CHART_COLORS } from './assets/utils';
import { DataGrid } from '@mui/x-data-grid';
import Feedback from './feedback/Feedback';


function App() {
  const [query, setQuestion] = useState<string>('');
  const [messages, setMessages] = useState<any>([{ text: 'Hello! How can I assist you today?', sender: 'bot', chart: {}, table: {}, user_query: '' }]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resID, setResID] = useState('');

  const messagesContainerRef = useRef<any>(null);
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const submitQuestion = async () => {
    setQuestion('');
    setLoading(true);
    setResID('');
    let botMessage: any = { text: '', sender: 'bot', chart: {}, table: {}, user_query: query };
    const userMessage = { text: query, sender: 'user' };

    try {
      const response = await axios.post('https://blueberry.azurewebsites.net/query', { query });
      const data = await response.data.results;
      const id = await response.data.id
      setResID(id)

      setMessages([...messages, userMessage]);


      switch (true) {
        case data.text !== undefined:
          botMessage.text = data.text;
          break;
        case data.type === 'doughnut' && data.labels !== undefined && data.data !== undefined:
          botMessage.text = 'Here is a chart you requested.';
          botMessage.chart = {
            type: data.type,
            data: {
              labels: data.labels,
              datasets: [
                {
                  label: 'Count',
                  data: data.data,
                  backgroundColor: Object.values(CHART_COLORS),
                  borderWidth: 1,
                  hoverOffset: 10
                },
              ],
            },
            options: {
              responsive: true,
              layout: {
                padding: 10
              }
            },
          };
          break;
        case data.type === 'bar' && data.labels !== undefined && data.data !== undefined:
          botMessage.text = 'Here is a graph you requested.';
          botMessage.chart = {
            type: data.type,
            data: {
              labels: data.labels,
              datasets: [
                {
                  label: 'Count',
                  data: data.data,
                  backgroundColor: Object.values(CHART_COLORS),
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
            },
          };
          break;
        case data.headers !== undefined && data.rows !== undefined:
          botMessage.text = 'Here is a table you requested.';
          botMessage.table = {
            headers: data.headers,
            rows: data.rows
          };
          break;
        default:
          botMessage.text = data.text;
      }
    } catch (error: any) {
      botMessage.text = "Some error occurred!!";
    }

    setMessages([...messages, userMessage, botMessage]);
    setLoading(false);
  };

  const handleReset = () => {
    setQuestion('');
    setMessages([{ text: 'Hello! How can I assist you today?', sender: 'bot' }]);
    setLoading(false);
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <div className="chatbot-interface">
      <div className='chatbot-header'>
        <div className='flex-area'>
          <div className="icon-container">
            <img src="sonar-logo.png" alt="Logo" />
          </div>
          <div className='right-content'>
            {/* <h1>ChatBot for Custody Portal</h1> */}
            <p>Sonar ChatBot</p>
          </div>
        </div>
      </div>
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message: any, index: number) => (
          <div key={index}>
            <div className='message-wrapper'>
              {message.sender === 'bot' && (
                <div className="icon-container">
                  <HeadsetMicIcon />

                </div>
              )}
              <div className={`${message.sender}-container`}>
                <div className={`message ${message.sender}`}>
                  <div className='upper-right'>
                    {message.sender === 'bot' && !loading && latestMessage === message && index !== 0 && (
                      <Feedback
                        id={resID}
                      />
                    )}
                    {message.sender === 'bot' && !loading && index !== 0 && (
                      <ExportData message={message} />
                    )}
                  </div>
                  <p>{message.text}</p>
                  {message.chart && Object.keys(message.chart).length > 0 && (
                    <div className='chatbot-chart-style' key={index}>
                      <Chart type={message.chart.type} data={message.chart.data} options={message.chart.options} />
                    </div>
                  )}
                  {message.table && message.table.headers && (
                    <div className='chatbot-table-style' key={index}>
                      <DataGrid
                        rows={message.table.rows.map((row: any, rowIndex: any) => ({
                          id: rowIndex + 1, // Generate a unique ID for each row
                          ...row.reduce((acc: any, cell: any, cellIndex: any) => {
                            acc[message.table.headers[cellIndex]] = cell;
                            return acc;
                          }, {}),
                        }))}
                        columns={message.table.headers.map((header: any) => ({
                          field: header,
                          headerName: header,
                          width: 100,
                          headerClassName: 'table-header'
                        }))}
                        initialState={{
                          pagination: {
                            paginationModel: {
                              pageSize: 5,
                            },
                          },
                        }}
                        pageSizeOptions={[5]}
                      />
                    </div>
                  )}
                </div>

              </div>
              {message.sender === 'user' && (
                <div className="icon-container-user" style={{ alignSelf: 'center' }}>
                  <PersonIcon />
                </div>
              )}
            </div>

          </div>

        ))}

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
          onChange={(e) => setQuestion(e.target.value)}
          className="input-field"
          onKeyPress={(e) => e.key === 'Enter' && submitQuestion()}
        />
        <button onClick={handleReset} disabled={loading} className={`send-button chat-reset-button ${loading ? 'disabled' : ''}`} style={{ backgroundColor: '#1b3765' }}>
          <RestartAltIcon />
        </button>

        <button onClick={submitQuestion} disabled={loading || !query} className={`send-button ${loading || !query ? 'disabled' : ''}`}>
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default App;
