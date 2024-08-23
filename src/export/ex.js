import React, { useRef } from 'react';
import { CSVLink } from 'react-csv';
import html2canvas from 'html2canvas';
import DownloadSharpIcon from '@mui/icons-material/DownloadSharp';
import { Chart } from 'react-chartjs-2';
import jsPDF from 'jspdf';

const ExportData = ({ message }) => {
    const chartRef = useRef(null);

    const convertMessageToCSVData = (message) => {
        if (message.table && message.table.headers && message.table.rows) {
            return [message.table.headers, ...message.table.rows];
        } else if (message.text) {
            return [[message.text]];
        } else {
            return [];
        }
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

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`chart-${new Date().toISOString()}.pdf`);
            } catch (error) {
                console.error("Failed to download chart as PDF", error);
            }
        }
    };

    const csvData = convertMessageToCSVData(message);
    const fileName = `chatbot-response-${new Date().toISOString()}.csv`;

    return (
        <div>
            {message.chart && Object.keys(message.chart).length > 0 ? (
                <>
                    <button onClick={downloadChartAsPDF} className="download-button">
                        <DownloadSharpIcon />
                    </button>
                    {/* Off-screen chart container, but within the viewport */}
                    <div
                        id="chart-container"
                        ref={chartRef}
                        style={{
                            position: 'fixed',
                            top: '-10000px', // Off-screen but within renderable area
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
                <CSVLink data={csvData} filename={fileName} className="download-csv-link">
                    <DownloadSharpIcon />
                </CSVLink>
            )}
        </div>
    );
};

export default ExportData;
