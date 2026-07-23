const salaryForm = document.getElementById("salaryForm");
const expenseForm = document.getElementById("expenseForm");

const salaryBtn = document.getElementById("salaryBtn");
const editSalaryBtn = document.getElementById("editSalaryBtn");
const downloadReportBtn = document.getElementById("downloadReportBtn");

const salaryInput = document.getElementById("salaryInput");
const expenseNameInput = document.getElementById("expenseNameInput");
const expenseAmountInput = document.getElementById("expenseAmountInput");

const displaySalary = document.getElementById("displaySalary");
const displayExpenses = document.getElementById("displayExpenses");
const displayBalance = document.getElementById("displayBalance");

const expenseList = document.getElementById("expenseList");

const currencyToggle = document.getElementById("currencyToggle");

const thresholdAlert = document.getElementById("thresholdAlert");
const errorBanner = document.getElementById("errorBanner");
const errorMessage = document.getElementById("errorMessage");

let salary = 0;
let expenses = [];

let currentCurrency = "INR";
let exchangeRate = 1;

let analyticsChart = null;

function saveData(){

    localStorage.setItem(
        "salary",
        JSON.stringify(salary)
    );

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

}

function loadData(){

    const savedSalary =
        localStorage.getItem("salary");

    const savedExpenses =
        localStorage.getItem("expenses");

    if(savedSalary){

        salary = JSON.parse(savedSalary);

    }

    if(savedExpenses){

        expenses = JSON.parse(savedExpenses);

    }

}

function showError(message){

    errorMessage.textContent = message;

    errorBanner.classList.remove("hidden");

    clearTimeout(showError.timer);

    showError.timer = setTimeout(function(){

        errorBanner.classList.add("hidden");

    },3000);

}

function formatCurrency(amount){

    if(currentCurrency === "USD"){

        return "$" +
            (amount * exchangeRate).toFixed(2);

    }

    return "₹" +
        amount.toFixed(2);

}

function getTotalExpenses(){

    let total = 0;

    expenses.forEach(function(expense){

        total += expense.amount;

    });

    return total;

}

function getRemainingBalance(){

    return salary - getTotalExpenses();

}

function checkThreshold(){

    if(salary <= 0){

        thresholdAlert.classList.add("hidden");

        displayBalance.style.color = "";

        return;

    }

    const balance = getRemainingBalance();

    if(balance <= salary * 0.10){

        thresholdAlert.classList.remove("hidden");

        displayBalance.style.color = "#ef4444";

    }else{

        thresholdAlert.classList.add("hidden");

        displayBalance.style.color = "";

    }

}

function updateDashboard(){

    displaySalary.textContent =
        formatCurrency(salary);

    displayExpenses.textContent =
        formatCurrency(getTotalExpenses());

    displayBalance.textContent =
        formatCurrency(getRemainingBalance());

    renderExpenseList();

    updateChart();

    checkThreshold();

    saveData();

}
salaryForm.addEventListener("submit",function(e){

    e.preventDefault();

    let enteredSalary = Number(salaryInput.value);

    if(enteredSalary <= 0){

        showError("Please enter a valid salary.");

        return;

    }

    if(currentCurrency === "USD"){

        salary = enteredSalary / exchangeRate;

    }else{

        salary = enteredSalary;

    }

    salaryInput.readOnly = true;

    salaryInput.classList.add("readonly-input");

    salaryBtn.classList.add("hidden");

    editSalaryBtn.classList.remove("hidden");

    if(currentCurrency === "USD"){

        salaryInput.value =
            (salary * exchangeRate).toFixed(2);

    }else{

        salaryInput.value =
            salary.toFixed(2);

    }

    updateDashboard();

});

editSalaryBtn.addEventListener("click",function(){

    salaryInput.readOnly = false;

    salaryInput.classList.remove("readonly-input");

    salaryBtn.classList.remove("hidden");

    editSalaryBtn.classList.add("hidden");

    salaryInput.value = salary.toFixed(2);

    salaryInput.focus();

});

salaryInput.addEventListener("click",function(){

    if(salaryInput.readOnly){

        showError(
            "Click 'Edit Salary' to modify your salary."
        );

    }

});

async function updateExchangeRate(){

    if(currentCurrency === "INR"){

        exchangeRate = 1;

    }else{

        try{

            const response = await fetch(
                "https://open.er-api.com/v6/latest/INR"
            );

            if(!response.ok){

                throw new Error("Failed to fetch exchange rate.");

            }

            const data = await response.json();

            exchangeRate = data.rates.USD;

        }catch(error){

            console.error(error);

            showError("Currency conversion failed.");

            exchangeRate = 0.0116;

        }

    }

    if(salaryInput.readOnly){

        if(currentCurrency === "USD"){

            salaryInput.value =
                (salary * exchangeRate).toFixed(2);

        }else{

            salaryInput.value =
                salary.toFixed(2);

        }

    }

    updateDashboard();

}

currencyToggle.addEventListener("change",async function(){

    currentCurrency = this.value;

    await updateExchangeRate();

});
expenseForm.addEventListener("submit",function(e){

    e.preventDefault();

    const expenseName = expenseNameInput.value.trim();

    let expenseAmount = Number(expenseAmountInput.value);

    if(expenseName === ""){

        showError("Please enter an expense name.");

        return;

    }

    if(expenseAmount <= 0){

        showError("Please enter a valid expense amount.");

        return;

    }

    if(currentCurrency === "USD"){

        expenseAmount = expenseAmount / exchangeRate;

    }

    expenses.push({

        id: Date.now(),

        name: expenseName,

        amount: expenseAmount

    });

    expenseNameInput.value = "";

    expenseAmountInput.value = "";

    updateDashboard();

});

function renderExpenseList(){

    expenseList.innerHTML = "";

    if(expenses.length === 0){

        expenseList.innerHTML = `
            <li class="empty-expense">
                No expenses added yet.
            </li>
        `;

        return;

    }

    expenses.forEach(function(expense){

        const li = document.createElement("li");

        let displayAmount;

        if(currentCurrency === "USD"){

            displayAmount =
                "$" + (expense.amount * exchangeRate).toFixed(2);

        }else{

            displayAmount =
                "₹" + expense.amount.toFixed(2);

        }

        li.innerHTML = `

            <div class="expense-info">

                <h4>${expense.name}</h4>

                <small>ID : ${expense.id}</small>

            </div>

            <div class="expense-actions">

                <strong>${displayAmount}</strong>

                <button
                    class="delete-btn"
                    data-id="${expense.id}">
                    Delete
                </button>

            </div>

        `;

        expenseList.appendChild(li);

    });

    document.querySelectorAll(".delete-btn").forEach(function(button){

        button.addEventListener("click",function(){

            const expenseId =
                Number(this.dataset.id);

            expenses = expenses.filter(function(expense){

                return expense.id !== expenseId;

            });

            updateDashboard();

        });

    });

}

function updateChart(){

    const ctx =
        document.getElementById("analyticsChart").getContext("2d");

    if(analyticsChart){

        analyticsChart.destroy();

    }

    const balance =
        Math.max(getRemainingBalance(),0);

    const totalExpenses =
        getTotalExpenses();

    const savingGradient =
        ctx.createLinearGradient(0,0,0,400);

    savingGradient.addColorStop(0,"#06B6D4");
    savingGradient.addColorStop(1,"#3B82F6");

    const expenseGradient =
        ctx.createLinearGradient(0,0,0,400);

    expenseGradient.addColorStop(0,"#8B5CF6");
    expenseGradient.addColorStop(1,"#6366F1");

    analyticsChart = new Chart(ctx,{

        type:"doughnut",

        data:{

            labels:[
                "Savings",
                "Expenses"
            ],

            datasets:[{

                data:[
                    balance,
                    totalExpenses
                ],

                backgroundColor:[
                    savingGradient,
                    expenseGradient
                ],

                hoverBackgroundColor:[
                    "#2563EB",
                    "#7C3AED"
                ],

                borderColor:"#ffffff",

                borderWidth:4,

                hoverOffset:18

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            cutout:"65%",

            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        color:"#ffffff",

                        usePointStyle:true,

                        padding:20,

                        font:{

                            size:14,

                            weight:"bold"

                        }

                    }

                },

                tooltip:{

                    backgroundColor:"#1E293B",

                    titleColor:"#ffffff",

                    bodyColor:"#ffffff",

                    padding:12,

                    cornerRadius:10

                }

            }

        }

    });

}
function generatePDFReport(){

    if(typeof window.jspdf === "undefined"){

        showError("jsPDF library not loaded.");

        return;

    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    function pdfCurrency(amount){

        if(currentCurrency === "USD"){

            return "$" + (amount * exchangeRate).toFixed(2);

        }

        return "Rs. " + amount.toFixed(2);

    }

    let y = 20;

    doc.setFontSize(22);
    doc.setTextColor(37,99,235);
    doc.text("SpentWise Financial Report",20,y);

    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(0,0,0);

    doc.text(
        "Generated : " + new Date().toLocaleString(),
        20,
        y
    );

    y += 15;

    doc.setFontSize(14);

   doc.text("Total Salary : " + pdfCurrency(salary),20,y);

    y += 10;

   doc.text("Total Expenses : " + pdfCurrency(getTotalExpenses()),20,y);
    y += 10;

    doc.text(
        "Remaining Balance : " + pdfCurrency(getRemainingBalance()),
        20,
        y
    );

    y += 20;

    doc.setFontSize(16);

    doc.text("Expense Ledger",20,y);

    y += 12;

    if(expenses.length === 0){

        doc.text(
            "No expenses added.",
            20,
            y
        );

        y += 10;

    }else{

        expenses.forEach(function(expense,index){

            doc.text(
                (index + 1) +
                ". " +
                expense.name +
                " : " +
                pdfCurrency(expense.amount),
                20,
                y
            );

            y += 8;

            if(y > 260){

                doc.addPage();

                y = 20;

            }

        });

    }

    const chartCanvas =
        document.getElementById("analyticsChart");

    if(chartCanvas){

        const chartImage =
            chartCanvas.toDataURL("image/png",1.0);

        if(y > 150){

            doc.addPage();

            y = 20;

        }

        y += 10;

        doc.setFontSize(16);

        doc.text(
            "Expense Analysis",
            20,
            y
        );

        y += 8;

        doc.addImage(
            chartImage,
            "PNG",
            20,
            y,
            170,
            90
        );

    }

    doc.save("SpentWise_Report.pdf");

}

downloadReportBtn.addEventListener(
    "click",
    generatePDFReport
);
function pdfCurrency(amount){

    if(currentCurrency === "USD"){

        return "$" + (amount * exchangeRate).toFixed(2);

    }

    return "Rs. " + amount.toFixed(2);

}

function initializeDashboard(){

    loadData();

    if(salary>0){

        salaryInput.readOnly=true;

        salaryInput.classList.add(

            "readonly-input"

        );

        salaryBtn.classList.add(

            "hidden"

        );

        editSalaryBtn.classList.remove(

            "hidden"

        );

    }

    updateExchangeRate();

    updateDashboard();

}

initializeDashboard();
