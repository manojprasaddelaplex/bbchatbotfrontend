import React, { useRef } from 'react';
import { CSVLink } from 'react-csv';
import html2canvas from 'html2canvas';
import { Chart } from 'react-chartjs-2';
import jsPDF from 'jspdf';
// import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import './Export_data.css';


const ExportData = ({ message }) => {
    const chartRef = useRef(null);
    const convertMessageToCSVData = (message) => {
        const csvData = [];

        // Add user_query at the top of the CSV data
        if (message.user_query) {
            csvData.push([`User Query: ${message.user_query}`]);
            csvData.push([]); // Add an empty row for separation
        }

        // Convert message data to CSV format
        if (message.table && message.table.headers && message.table.rows) {
            csvData.push(message.table.headers);
            csvData.push(...message.table.rows);
        } else if (message.text) {
            csvData.push([message.text]);
        }

        return csvData;
    };

    const downloadChartAsPDF = async () => {
        if (chartRef.current) {
            try {
                const canvas = await html2canvas(chartRef.current, {
                    scale: 2, // Increase resolution
                    useCORS: true, // Handle cross-origin images
                    backgroundColor: null, // Transparent background
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width, canvas.height], // Match PDF size to canvas size
                });

                // Add user_query at the top of the PDF
                if (message.user_query) {
                    pdf.text(`User Query: ${message.user_query}`, 10, 10);
                }

                pdf.addImage(imgData, 'PNG', 0, 20, canvas.width, canvas.height); // Adjust Y position for chart
                pdf.save(`chart-${new Date().toISOString()}.pdf`);
            } catch (error) {
                console.error("Failed to download chart as PDF", error);
            }
        }
    };

    const csvData = convertMessageToCSVData(message, message.user_query);
    const fileName = `chatbot-response-${new Date().toISOString()}.csv`;

    return (
        <div>
            {message.chart && Object.keys(message.chart).length > 0 ? (
                <>
                    <button onClick={downloadChartAsPDF} style={{border:'none', backgroundColor:'transparent', padding:0}}>
                        <img src="report.svg" alt="Download" title='Download to PDF' className='download'/>
                    </button>
                    <div
                        id="chart-container"
                        ref={chartRef}
                        style={{
                            position: 'fixed',
                            top: '-10000px', 
                            left: '-10000px', 
                            width: '600px',
                            height: '400px',
                            pointerEvents: 'none',
                        }}
                    >
                        <Chart type={message.chart.type} data={message.chart.data} options={message.chart.options} />
                    </div>
                </>
            ) : (
                <CSVLink data={csvData} filename={fileName} className="download">
                    {/* <FaFileExcel title='Download Excel'/> */}
                    <img src="report.svg" alt="Download" title='Download to Excel'/>
                </CSVLink>
            )}
        </div>
    );
};

export default ExportData;
