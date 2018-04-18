function isWeekDay(date){
  if (date.getDay() == 0 || date.getDay() == 6) {
    return false;
  }
  return true;
}

function setTrigger() {
  var triggerDay = new Date();
  if(!isWeekDay(triggerDay)){
    return;
  }
  triggerDay.setHours(21);
  triggerDay.setMinutes(30);
  ScriptApp.newTrigger("main").timeBased().at(triggerDay).create();
}

function deleteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == "main") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function checkFuture(date){
  var today = new Date();
  var due = new Date(date);
  return(today.getDate() < due.getDate());
}

function main() {
  deleteTrigger();
  
  var token = 'xxx';
  var nextactionProjectId = 0;
  
  var todoistEndpoint = 'https://beta.todoist.com/API/v8/tasks?token='+ token;
  
  var response = JSON.parse(UrlFetchApp.fetch(todoistEndpoint).getContentText());
  
  
  var url = "xxx";
  var sheet_name = "xxx";
  var dbManager = GasSpreadsheetsDBManager.createSpreadsheetsDBManager(url, sheet_name);
  var db = dbManager.getDb();
  
  
  for(i in response){
    var task = response[i];
    if(!(task['content'] in db[0])){
      dbManager.addColumn(task['content']);
    }
  }
  
  var todayTask = dbManager.create();
  
  var resultInNextaction = '本日の進捗\n\n';
  
  var count = 0;
  var completedCount = 0;
  
  for(i in response){
    var task = response[i];
    count++;
    if(task['project_id'] == nextactionProjectId){
      if(checkFuture(task['due']['date'])){
        result = 'Done!';
        todayTask[task['content']] = true;
        completedCount++;
      }else{
        result = 'Undone…';
        todayTask[task['content']] = false;
      }
        resultInNextaction = resultInNextaction + task['content'] + ':' + result + ' \n\n';
    }
  }
  
  overall = (completedCount/count)*100;
  
  todayTask['総評'] = overall;
  dbManager.update(todayTask);
  dbManager.save();
  
  var overallMessage = '総評:' +overall + '%' + '\n'
  
  var message = resultInNextaction + overallMessage
  var slackWebhockEndpoint = "xxx";
  postMessage(message,slackWebhockEndpoint);
}

function postMessage(message, hookPoint) {
  var payload = {
    "text": message,
    "icon_emoji": ':sparkles:',
    "username": 'bot'
  }
  var options = {
    "method" : "POST",
    "payload" : JSON.stringify(payload),
    "headers": {
      "Content-type": "application/json",
    }
  }
  var response = UrlFetchApp.fetch(hookPoint, options);

  if (response.getResponseCode() == 200) {
    return response;
  }
  return false;
}