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

                // Dynamically set the chart container dimensions
                const chartContainer = chartRef.current;
                const chartWidth = chartContainer.clientWidth;
                const chartHeight = chartContainer.clientHeight;

                // Increase scale for better quality (e.g. scale: 4 means 4x resolution)
                const canvas = await html2canvas(chartContainer, {
                    scale: 5, // Increase scale for higher resolution
                    width: chartWidth,
                    height: chartHeight,
                    useCORS: true,
                    backgroundColor: null,
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [chartWidth + 100, chartHeight + 120], // Dynamically adjust PDF size
                });

                // Add user query text
                if (message.user_query) {
                    pdf.setFontSize(16);
                    const splitUserQuery = pdf.splitTextToSize(`User Query: ${message.user_query}`, chartWidth); // Dynamic text wrapping
                    pdf.text(splitUserQuery, 10, 30);
                }

                // Add the chart image to the PDF
                pdf.addImage(imgData, 'PNG', 10, 50, chartWidth, chartHeight);
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
                            width: 1000, // Auto width to match the chart
                            height: 'auto', // Auto height to match the chart
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
