document.addEventListener("DOMContentLoaded", () => {
    // Initialize Chart.js and jsPDF
    if (!window.Chart || !window.jspdf) {
        console.error("Required libraries not loaded");
        return;
    }

    // Splash screen with smooth transition
    const mainApp = document.getElementById("main-app");
    const splashScreen = document.getElementById("splash-screen");
    
    if (!mainApp || !splashScreen) {
        console.error("Required elements not found");
        return;
    }

    // Initially show splash and hide main app
    mainApp.style.display = "none";
    splashScreen.style.display = "flex";

    setTimeout(() => {
        splashScreen.style.opacity = "0";
        setTimeout(() => {
            splashScreen.style.display = "none";
            mainApp.style.display = "block";
        }, 500);
    }, 2000);

    // DOM elements with error checking
    const subjectForm = document.getElementById("subject-form");
    const subjectList = document.getElementById("subject-list");
    const cumulativeGpa = document.getElementById("cumulative-gpa");
    const exportBtn = document.getElementById("export-btn");
    const performanceChartCanvas = document.getElementById("performance-chart");

    // Verify all elements exist
    if (!subjectForm || !subjectList || !cumulativeGpa || !exportBtn || !performanceChartCanvas) {
        console.error("One or more required elements not found");
        return;
    }

    let subjects = [];
    let chart = null;

    // Grade calculation with color coding
    const calculateGrade = (marks, totalMarks) => {
        const percentage = (marks / totalMarks) * 100;
        if (percentage >= 90) return { grade: "O", color: "#4CAF50" }; // Outstanding
        if (percentage >= 80) return { grade: "A", color: "#5A189A" }; // Excellent
        if (percentage >= 70) return { grade: "B", color: "#7B2CBF" }; // Good
        if (percentage >= 60) return { grade: "C", color: "#F9C74F" }; // Average
        if (percentage >= 50) return { grade: "D", color: "#FFA07A" }; // Below Average
        if (percentage >= 40) return { grade: "E", color: "#FF7F50" }; // Pass
        return { grade: "F", color: "#D90429" }; // Fail
    };

    const getMotivationalQuote = (gpa) => {
        if (gpa >= 90) return "Exceptional performance! Keep shining bright!";
        if (gpa >= 80) return "Outstanding work! You're on the path to excellence!";
        if (gpa >= 70) return "Great progress! Keep pushing your boundaries!";
        if (gpa >= 60) return "Good effort! Keep working towards your goals!";
        return "Every step forward is progress. Keep going!";
    };

    const calculateGPA = () => {
        if (subjects.length === 0) return 0;
        const totalMarks = subjects.reduce((acc, subject) => acc + subject.marks, 0);
        const totalMaxMarks = subjects.reduce((acc, subject) => acc + subject.totalMarks, 0);
        return ((totalMarks / totalMaxMarks) * 100).toFixed(2);
    };

    const updateChart = () => {
        const gpaPercentage = Number(calculateGPA());
        
        if (chart) {
            chart.destroy();
        }
        
        try {
            chart = new Chart(performanceChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['GPA', 'Remaining'],
                    datasets: [{
                        data: [gpaPercentage, 100 - gpaPercentage],
                        backgroundColor: ['#5A189A', '#F9C74F'],
                        borderColor: ['#5A189A', '#F9C74F'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '70%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error creating chart:", error);
        }
    };

    // Form submission handler
    subjectForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const subjectNameInput = document.getElementById("subject-name");
        const subjectMarksInput = document.getElementById("subject-marks");
        const totalMarksInput = document.getElementById("total-marks");

        if (!subjectNameInput || !subjectMarksInput || !totalMarksInput) {
            alert("Error: Form inputs not found");
            return;
        }

        const subjectName = subjectNameInput.value.trim();
        const marks = Number(subjectMarksInput.value);
        const totalMarks = Number(totalMarksInput.value);

        // Validation
        if (!subjectName) {
            alert("Please enter a subject name");
            return;
        }

        if (isNaN(marks) || isNaN(totalMarks)) {
            alert("Please enter valid numbers for marks");
            return;
        }

        if (marks > totalMarks) {
            alert("Marks obtained cannot be greater than total marks!");
            return;
        }

        if (totalMarks <= 0) {
            alert("Total marks must be greater than 0");
            return;
        }

        const gradeInfo = calculateGrade(marks, totalMarks);
        subjects.push({
            name: subjectName,
            marks,
            totalMarks,
            grade: gradeInfo.grade,
            color: gradeInfo.color
        });

        // Reset form and update display
        subjectForm.reset();
        renderSubjects();
        cumulativeGpa.textContent = calculateGPA() + "%";
        updateChart();

        // Animate GPA update
        cumulativeGpa.style.transform = "scale(1.1)";
        setTimeout(() => {
            cumulativeGpa.style.transform = "scale(1)";
        }, 200);
    });

    const renderSubjects = () => {
        subjectList.innerHTML = '';
        subjects.forEach((subject, index) => {
            const div = document.createElement("div");
            div.className = "subject-item";
            div.style.borderLeft = `4px solid ${subject.color}`;
            div.innerHTML = `
                <span>${subject.name}: ${subject.marks}/${subject.totalMarks} 
                    <strong style="color: ${subject.color}">(${subject.grade})</strong>
                </span>
                <button onclick="deleteSubject(${index})">Delete</button>
            `;
            subjectList.appendChild(div);
        });
    };

    // Make deleteSubject function available globally
    window.deleteSubject = (index) => {
        if (index >= 0 && index < subjects.length) {
            subjects.splice(index, 1);
            renderSubjects();
            cumulativeGpa.textContent = calculateGPA() + "%";
            updateChart();
        }
    };

    // PDF Export
    exportBtn.addEventListener("click", () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Header
            doc.setFillColor(90, 24, 154);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            // Title
            doc.setTextColor(249, 199, 79);
            doc.setFontSize(24);
            doc.text("Grade Report", pageWidth/2, 25, { align: "center" });

            // Content
            doc.setTextColor(13, 13, 13);
            doc.setFontSize(12);
            
            let yPosition = 50;
            
            // GPA
            doc.text(`Cumulative GPA: ${calculateGPA()}%`, 15, yPosition);
            
            // Subjects Table
            yPosition += 20;
            subjects.forEach((subject, index) => {
                doc.text(`${subject.name}: ${subject.marks}/${subject.totalMarks} (${subject.grade})`, 15, yPosition);
                yPosition += 10;
            });

            doc.save("grade_report.pdf");
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Please try again.");
        }
    });

    // Initial chart render
    updateChart();
});