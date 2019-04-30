const fs = require('fs');
const electron = require('electron');
const remote = electron.remote;

var data = fs.readFileSync('./config/config.json');
var json = JSON.parse(data)

document.getElementsByName('email').item(0).value = json['email'];
document.getElementsByName('firstName').item(0).value = json['firstName'];
document.getElementsByName('lastName').item(0).value = json['lastName'];
document.getElementsByName('firstAddress').item(0).value = json['firstAddress'];
document.getElementsByName('secondAddress').item(0).value = json['secondAddress'];
document.getElementsByName('city').item(0).value = json['city'];
document.getElementsByName('country').item(0).value = json['country'];
document.getElementsByName('postal').item(0).value = json['postal'];
document.getElementsByName('cardNum').item(0).value = json['cardNum'];
document.getElementsByName('cardName').item(0).value = json['cardName'];
document.getElementsByName('cardExpire').item(0).value = json['cardExpire'];
document.getElementsByName('ccv').item(0).value = json['ccv'];
document.getElementsByName('issueDate').item(0).value = json['issueDate'];
document.getElementsByName('issue').item(0).value = json['issue'];
document.getElementsByName('shoeLink').item(0).value = json['shoeLink'];

const saveProfileBtn = document.getElementById('saveBtn')

saveProfileBtn.addEventListener('click', function(event){
    json['email'] = document.getElementsByName('email').item(0).value;
    json['firstName'] = document.getElementsByName('firstName').item(0).value;
    json['lastName'] = document.getElementsByName('lastName').item(0).value;
    json['firstAddress'] = document.getElementsByName('firstAddress').item(0).value;
    json['secondAddress'] = document.getElementsByName('secondAddress').item(0).value;
    json['city'] = document.getElementsByName('city').item(0).value;
    json['country'] = document.getElementsByName('country').item(0).value;
    json['postal'] = document.getElementsByName('postal').item(0).value;
    json['cardNum'] = document.getElementsByName('cardNum').item(0).value;
    json['cardName'] = document.getElementsByName('cardName').item(0).value;
    json['cardExpire'] = document.getElementsByName('cardExpire').item(0).value;
    json['ccv'] = document.getElementsByName('ccv').item(0).value;
    json['issueDate'] = document.getElementsByName('issueDate').item(0).value;
    json['issue'] = document.getElementsByName('issue').item(0).value;
    json['shoeLink'] = document.getElementsByName('shoeLink').item(0).value;

    fs.writeFileSync('./config/config.json', JSON.stringify(json));

    var window = remote.getCurrentWindow();
    window.close();

})




