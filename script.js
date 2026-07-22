const salaryForm = document.getElementById("salaryForm");
const salaryBtn = document.getElementById("salaryBtn");
const editSalaryBtn = document.getElementById("editSalaryBtn");
const expenseForm = document.getElementById("expenseForm");

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

const balanceCard = document.getElementById("balanceCard");

let salary = 0;
let expenses = [];
let currentCurrency = "INR";
let analyticsChart = null;

const exchangeRate = 83;

function saveData(){

    localStorage.setItem("salary", salary);

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

}

function loadData(){

    const savedSalary = localStorage.getItem("salary");
    const savedExpenses = localStorage.getItem("expenses");

    if(savedSalary){
        salary = Number(savedSalary);
    }

    if(savedExpenses){
        expenses = JSON.parse(savedExpenses);
    }

}

function showError(message){

    errorMessage.textContent = message;

    errorBanner.classList.remove("hidden");
    errorBanner.classList.add("alert-warning");
    setTimeout(function(){

        errorBanner.classList.add("hidden");
         errorBanner.classList.rem("alert-warning");

    },3000);

}

function formatCurrency(amount){

    if(currentCurrency === "USD"){

        return "$" + (amount / exchangeRate).toFixed(2);

    }

    return "₹" + amount.toFixed(2);

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


function updateDashboard(){

    const totalExpenses = getTotalExpenses();
    const balance = getRemainingBalance();

    displaySalary.textContent = formatCurrency(salary);

    displayExpenses.textContent = formatCurrency(totalExpenses);

    displayBalance.textContent = formatCurrency(balance);

    if(balance < 0){

        displayBalance.style.color = "red";

    }else{

        displayBalance.style.color = "#111";

    }

    renderExpenseList();

    updateChart();

    checkThreshold();

    saveData();

}

salaryForm.addEventListener("submit", function(e){

    e.preventDefault();

    const value = Number(salaryInput.value);

    if(value <= 0){

        showError("Enter a valid salary.");

        return;

    }

    salary = value;

    salaryInput.value = salary;

    salaryInput.readOnly = true;
    
    salaryInput.classList.add("readonly-input");
    if(this.readOnly){
        showError("click 'Edit Salary' to modifly your salary");
    }
    salaryBtn.textContent = "Update Salary";

    salaryBtn.classList.add("hidden");

    editSalaryBtn.classList.remove("hidden");

    updateDashboard();

});
editSalaryBtn.addEventListener("click", function(){

    salaryInput.readOnly = false;

    salaryInput.classList.remove("readonly-input");

    salaryInput.focus();

    salaryBtn.classList.remove("hidden");

    editSalaryBtn.classList.add("hidden");

});
salaryInput.addEventListener("click", function(){

    if(salaryInput.readOnly){

        showError("Click 'Edit Salary' to modify your salary.");

    }

});

expenseForm.addEventListener("submit", function(e){

    e.preventDefault();

    const name = expenseNameInput.value.trim();

    const amount = Number(expenseAmountInput.value);

    if(name === ""){

        showError("Expense name is required.");

        return;

    }

    if(amount <= 0){

        showError("Enter a valid amount.");

        return;

    }

    expenses.push({

        id: Date.now(),

        name: name,

        amount: amount

    });

    expenseNameInput.value = "";
    expenseAmountInput.value = "";

    updateDashboard();

});
function renderExpenseList(){

    expenseList.innerHTML = "";

    if(expenses.length === 0){

        expenseList.innerHTML = `
            <li style="justify-content:center;">
                No expenses added.
            </li>
        `;

        return;

    }

    expenses.forEach(function(expense){

        const li = document.createElement("li");

        li.innerHTML = `
            <span>${expense.name}</span>

            <div style="display:flex;align-items:center;gap:12px;">

                <strong>${formatCurrency(expense.amount)}</strong>

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

        button.addEventListener("click", function(){

            const id = Number(this.dataset.id);

            expenses = expenses.filter(function(expense){

                return expense.id !== id;

            });

            updateDashboard();

        });

    });

}

function checkThreshold(){

    if(salary <= 0){

        thresholdAlert.classList.add("hidden");

        return;

    }

    const balance = getRemainingBalance();

    if(balance <= salary * 0.10){

        thresholdAlert.classList.remove("hidden");

        displayBalance.style.color = "red";

    }else{

        thresholdAlert.classList.add("hidden");

        displayBalance.style.color = "#111";

    }

}

currencyToggle.addEventListener("change", function(){

    currentCurrency = this.value;

    updateDashboard();

});

function updateChart(){

    const ctx = document
        .getElementById("analyticsChart")
        .getContext("2d");

    if(analyticsChart){

        analyticsChart.destroy();

    }

    analyticsChart = new Chart(ctx,{

        type:"pie",

        data:{

            labels:["Remaining Balance","Total Expenses"],

            datasets:[{

                data:[
                    getRemainingBalance(),
                    getTotalExpenses()
                ],

                backgroundColor:[
                    "#111111",
                    "#BBBBBB"
                ],

                borderColor:"#ffffff",

                borderWidth:2

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{
                    position:"bottom"
                }

            }

        }

    });

}
const downloadReportBtn = document.getElementById("downloadReportBtn");

downloadReportBtn.addEventListener("click", generatePDFReport);

async function updateExchangeRate(){

    if(currentCurrency === "INR"){

        exchangeRate = 1;

        updateDashboard();

        return;

    }

    try{

        const response = await fetch("https://api.frankfurter.app/latest?from=INR&to=USD");

        const data = await response.json();

        exchangeRate = data.rates.USD;

        updateDashboard();

    }catch(error){

        showError("Currency conversion failed.");

    }

}

currencyToggle.addEventListener("change", function(){

    currentCurrency = this.value;

    updateExchangeRate();

});
function updateChart(){

    const canvas = document.getElementById("analyticsChart");
    const ctx = canvas.getContext("2d");

    if(analyticsChart){
        analyticsChart.destroy();
    }

    const expenses = getTotalExpenses();

    const remainingBalance = getRemainingBalance();

    const savings = remainingBalance > 0 ? remainingBalance : 0;

    const expenseGradient = ctx.createLinearGradient(0,0,0,400);
    expenseGradient.addColorStop(0,"#8B5CF6");
    expenseGradient.addColorStop(1,"#6366F1");

    const savingsGradient = ctx.createLinearGradient(0,0,0,400);
    savingsGradient.addColorStop(0,"#06B6D4");
    savingsGradient.addColorStop(1,"#3B82F6");

    analyticsChart = new Chart(ctx,{

        type:"doughnut",

        data:{

            labels:[
                "Remaining Balance",
                "Total Expenses"
            ],

            datasets:[{

                data:[
                  getRemainingBalance(),
                 getTotalExpenses()
                ],

                backgroundColor:[
                    savingsGradient,
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

            animation:{
                animateRotate:true,
                animateScale:true
            },

            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        color:"#ffffff",

                        padding:20,

                        usePointStyle:true,

                        pointStyle:"circle",

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

                    cornerRadius:10,

                    padding:12

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

    let y = 20;

    doc.setFontSize(18);

    doc.text("Cash-Flow Dashboard Report",20,y);

    y += 15;

    doc.setFontSize(12);

    doc.text(`Total Salary: ${salary}`,20,y);

    y += 10;

    doc.text(`Total Expenses: ${getTotalExpenses()}`,20,y);

    y += 10;
    
  

    doc.text("Expense List",20,y);

    y += 10;

    if(expenses.length === 0){

        doc.text("No expenses added.",20,y);

    }else{

        expenses.forEach(function(expense,index){

            doc.text(
                `${index+1}. ${expense.name} - ${expense.amount}`,
                20,
                y
            );

            y += 8;

            if(y > 270){

                doc.addPage();

                y = 20;

            }

        });

    }

    doc.save("SpentWise_Report.pdf");

}
function initializeDashboard(){

    loadData();

    if(salary > 0){

    salaryInput.value = salary;

    salaryInput.readOnly = true;

    salaryInput.classList.add("readonly-input");

    salaryBtn.textContent = "Update Salary";

    salaryBtn.classList.add("hidden");

    editSalaryBtn.classList.remove("hidden");

}

    updateExchangeRate();

    updateDashboard();

}

initializeDashboard();


