
let GitHubApi = require("github");

let github = new GitHubApi({
    debug: false,
    protocol: "https",
    host: "api.github.com",
    pathPrevix: "",
    headers: {
        "user-agent": "CE Phydeaux"
    },
    promise: require('bluebird'),
    followRedirects: false,
    timeout: 5000
});


github.authenticate({
    type: "oauth",
    token: "331e2da771ddc0ab3dc5e2e594911c8109c7e513",
});


github.repos.getAll({
    "visibility": "private",
    "affiliation": "organization_member"
}, function(err,res){
    //console.log('STATUS: ' + JSON.stringify(res[4]));
});


exports.getActiveBranches = function(repo, cb) {
    github.repos.getBranches({
        "owner": "CovenantEyes",
        "repo": repo
    }, function(err, res) {
        cb(res);
    });
}

// exports.getActiveBranches = getActiveBranches;

//getActiveBranches(repo, function(cb) {
//    return cb;
//});


//console.log(JSON.stringify(github.authorization.create));



//console.log(github)

/*

var https = require("https");
var userName='cblairce';

var options = {
    host :"api.github.com",
    path : '/users/'+userName+'/repos',
    method : 'GET',
    headers: {
        "user-agent": "CE Phydeaux"
    }
}

var request = https.request(options, function(response){
var body = '';

response.on('data',function(chunk){
    body+=chunk;
});

response.on('end',function(){
    var json = JSON.parse(body);
    var repos =[];
    json.forEach(function(repo){
        repos.push({
            name : repo.name,
            description : repo.description
        });
    });
    console.log('the repos are  '+ JSON.stringify(repos));
});

});
request.on('error', function(e) {
console.error('and the error is '+e);
});
request.end();
*/
