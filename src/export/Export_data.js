import React, { useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import html2canvas from 'html2canvas';
import { Chart } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import './Export_data.css';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart as ChartJS } from 'chart.js';
ChartJS.register(ChartDataLabels);

const ExportData = ({ message }) => {
    const chartRef = useRef(null);
    const [isPdfExporting, setIsPdfExporting] = useState(false);

    // Add data labels for PDF export only
    const addDataLabelsToChart = (chart) => {
        if (chart && chart.options) {
            return {
                ...chart,
                options: {
                    ...chart.options,
                    plugins: {
                        ...chart.options.plugins,
                        datalabels: {
                            display: true,
                            color: '#545454',
                            anchor: 'center', // Centering inside chart
                            align: 'center',
                            formatter: (value) => value.toString(),
                            font: {
                                weight: 'bold',
                                size: 14,
                            },
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                padding: 5, // Add distance between labels and doughnut
                            },
                        },
                    },
                },
            };
        }
        return chart;
    };

    const convertMessageToCSVData = (message) => {
        const csvData = [];
        if (message.user_query) {
            csvData.push([`User Query: ${message.user_query}`]);
            csvData.push([]);
        }
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
                setIsPdfExporting(true);

                // Wait for the chart to re-render with data labels
                await new Promise(resolve => setTimeout(resolve, 100));

                // Set desired width and height for the canvas
                const width = 800; // Adjust this as needed
                const height = 600; // Adjust this as needed

                const canvas = await html2canvas(chartRef.current, {
                    scale: 4, // Increase scale for better quality
                    width, // Set explicit width
                    height, // Set explicit height
                    useCORS: true,
                    backgroundColor: null,
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [width, height], // Use the same dimensions as the canvas
                });

                if (message.user_query) {
                    pdf.setFontSize(16);
                    pdf.text(`User Query: ${message.user_query}`, 10, 30);
                }

                // Add the image to the PDF
                pdf.addImage(imgData, 'PNG', 0, 40, width, height);
                pdf.save(`chatbot-response-${new Date().toISOString()}.pdf`);
            } catch (error) {
                console.error("Failed to download chart as PDF", error);
            } finally {
                setIsPdfExporting(false);
            }
        }
    };

    const csvData = convertMessageToCSVData(message);
    const fileName = `chatbot-response-${new Date().toISOString()}.csv`;

    // Use the original chart for UI and the modified chart with data labels for PDF export
    const uiChart = message.chart;
    const pdfChart = isPdfExporting ? addDataLabelsToChart({ ...message.chart }) : null;

    return (
        <div>
            {uiChart && Object.keys(uiChart).length > 0 ? (
                <>
                    <button onClick={downloadChartAsPDF} style={{ border: 'none', backgroundColor: 'transparent', padding: 0 }}>
                        <img src="report.svg" alt="Download" title='Download to PDF' className='download' />
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
                        <Chart
                            type={isPdfExporting ? pdfChart.type : uiChart.type}
                            data={isPdfExporting ? pdfChart.data : uiChart.data}
                            options={isPdfExporting ? pdfChart.options : uiChart.options}
                        />
                    </div>
                </>
            ) : (
                <CSVLink data={csvData} filename={fileName} className="download">
                    <img src="report.svg" alt="Download" title='Download to Excel' />
                </CSVLink>
            )}
        </div>
    );
};

export default ExportData;