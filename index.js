const electron = require('electron');
const { findShoe } = require('./botFiles/getShoeFromShopify');
const { pay } = require('./botFiles/autofill');
const axios = require("axios");
const fs = require('fs');
const BrowserWindow = electron.remote.BrowserWindow;


//var selected;



let $ = require('jquery');
$(document).on("click", ".shoebtn", function(){
    var id = this.id
    if (this.classList.contains('monitor')){
        document.getElementById('monitorGuide').innerHTML ="Monitoring in progress!";
        var data = fs.readFileSync('./config/config.json');
        var json = JSON.parse(data)
        if(json['activeMonitor'] != ""){
            var oldId = json['activeMonitor'];
            document.getElementById(oldId).classList.add('monitor');
            document.getElementById(oldId).classList.remove('stopmonitor');
            document.getElementById(oldId).innerHTML = "Monitor";
        }
        json['activeMonitor'] = id;
        fs.writeFileSync('./config/config.json', JSON.stringify(json));
        
        this.classList.remove('monitor');
        this.classList.add('stopmonitor');
        this.innerHTML = "No Monitor";

        var qty = document.getElementById('quant'+id).value;
        let tryNum = 1;
        getShoe(shoes[id], id, qty, tryNum);
    } else {
        document.getElementById('monitorGuide').innerHTML ="";
        this.classList.add('monitor');
        this.classList.remove('stopmonitor');
        this.innerHTML = "Monitor";
        var data = fs.readFileSync('./config/config.json');
        var json = JSON.parse(data)
        json['activeMonitor'] = "";
        fs.writeFileSync('./config/config.json', JSON.stringify(json));
    }
    
});

var shoes = null;
var data = fs.readFileSync('./config/config.json');
var shoelink = JSON.parse(data)['shoeLink']
const shoesUrl = shoelink;

function initShoes(){

    axios.get(shoesUrl).then(function (response) {
        shoes = response.data;
        console.log(shoes);
        shoes.sort(function(a, b){return  b.soldAvgProfit - a.soldAvgProfit})
        var html1 = '<div class="card ' 
        var html2 = '"><img src="';
        var html3 = '" alt="Avatar" style="width:100%"><div class="container"><h4><b>'
        var html4 = '</b></h4><p>Retail: &#163;'
        var html5 = '</p><p>Sold Resell Average: &#163;'
        var html6 = '</p><p>Profit from resell: &#163;'
        var html7 = '</b><p>Amount sold: '
        var html8 = '</p><p><b>Release Date: '
        var html9 = '</b></p><p>Current Resell Average: &#163;'
        var html10 = '</p><button class="smallbtn collapsible viewSizes">View Sizes</button><div class="content"><p>'
        var html11 = '</p></div><br><br><button id="'
        var html12 = '" class="btn shoebtn monitor">Monitor</button><br><label>Qty:</label><input id="quant'
        var html13 =  '" type="number" class="quantity" min="1" value="1" step="1"></div></div>';
        var bightml = '';
        

        for(let i=0;i<shoes.length;i++){
            var htmlColour = "";

            if(shoes[i].soldAmount > 20){
                htmlColour = "trusted";
            } else if (shoes[i].soldAmount > 5){
                htmlColour = "semi-trusted";
            } else if (shoes[i].soldAmount > 0){
                htmlColour = "okay";
            } else {
                htmlColour = "noSales";
            }

            bightml += html1 + htmlColour + html2 + shoes[i].imageUrl;
            bightml +=  html3 + shoes[i].name + html4;
            bightml += shoes[i].retailPrice + html5 + shoes[i].soldAvgPrice;
            bightml += html6 + shoes[i].avgProfitCombined + html7;
            bightml += shoes[i].soldAmount + html8 + shoes[i].releaseDate + html9 + shoes[i].currentResellAvgPrice +html10
            for(let j=0;j<shoes[i].sizes.length;j++){
                bightml += 'Size: ' + shoes[i].sizes[j].size  + "&emsp;Price: &#163;" + parseInt(shoes[i].sizes[j].price).toFixed(2) + '<br>';
            }
            bightml += html11 +i + html12 + i + html13;
        }

        document.getElementById('theContainer').innerHTML = bightml;
        removeFromMonitorInit();

        var coll = document.getElementsByClassName("collapsible");
        var i;

        for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
            content.style.display = "none";
            } else {
            content.style.display = "block";
            }
        });
        }
    });
}

initShoes();


async function getShoe(shoe, id, qty, tryNum) {
    findShoe(shoe, function(error, styleID) {
        console.log("Running");
        var data  = fs.readFileSync('./config/config.json');
        var json = JSON.parse(data)
        var monitored = json['activeMonitor'];

        if (error) {
            if(monitored != id){
                return;
            };
            setTimeout(() => {
                console.log("Error trying again!");
                updateMonitorHeader(tryNum);
                tryNum =  tryNum + 1;
                return getShoe(shoe,id, qty, tryNum);
            }, 2000);
        } else {
            console.log("Found shoes!");
            removeFromMonitor();
            var data = fs.readFileSync('./config/config.json');
            var jsonToPay= JSON.parse(data)
            pay(shoe, styleID, qty, jsonToPay);
        }
    }); 
};


const editProfileBtn = document.getElementById('editBtn')

editProfileBtn.addEventListener('click', function(event){
    let win = new BrowserWindow({ width: 400, height: 800});
    win.on('close', function() { win = null });
    win.loadFile('editProfile.html');
    win.show();
})

function updateMonitorHeader(tryNo){
    document.getElementById('monitorGuide').innerHTML ="Monitoring in progress! Try #" + tryNo;
}

function removeFromMonitor(){
    var data = fs.readFileSync('./config/config.json');
    var json = JSON.parse(data)
    var oldId = json['activeMonitor'];
    document.getElementById(oldId).classList.add('monitor');
    document.getElementById(oldId).classList.remove('stopmonitor');
    document.getElementById(oldId).innerHTML = "Monitor";
    json['activeMonitor'] = "";
    fs.writeFileSync('./config/config.json', JSON.stringify(json));

    document.getElementById('monitorGuide').innerHTML ="";
}

function removeFromMonitorInit(){
    var data = fs.readFileSync('./config/config.json');
    var json = JSON.parse(data)
    json['activeMonitor'] = "";
    fs.writeFileSync('./config/config.json', JSON.stringify(json));
    document.getElementById('monitorGuide').innerHTML ="";
}


const refreshBtn = document.getElementById('refresh')

refreshBtn.addEventListener('click', function(event){
    initShoes();
    alert("Refreshed!");
})


