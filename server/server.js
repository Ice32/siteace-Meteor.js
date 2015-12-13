/**
 * Created by Keno on 12/1/2015.
 */

Meteor.methods({
    autofill:function(submittedLink){
        if(submittedLink){
            if(submittedLink.indexOf("http") == -1){
                var stringTemp = "http://";
                stringTemp += submittedLink;
                submittedLink = stringTemp;
            }
            var url = Npm.require("url");
            var parsedUrl = url.parse(submittedLink);

        HTTP.call("GET", submittedLink,
            function(error, result){
                if(!error){
                    var cheerio = Meteor.npmRequire('cheerio');
                    $ = cheerio.load(result.content);

                    var description = $('meta[name=description]').attr('content');
                    var titleCheerio = $(result.content).find('title').text();
                    if(!description){
                        description = $('meta[name=keywords]').attr('content');
                        if(!description){
                            description = $('meta[itemprop=description]').attr('content');
                            if(!description){
                                //for debugging purposes
                                /*console.log(result.content);
                                console.log(result.content.indexOf("description"));
                                console.log(result.content.indexOf("keywords"));*/
                            }
                        }
                    }
                    var urlToInsert = parsedUrl.href;
                    urlToInsert = urlToInsert.replace(/\/$/, "");
                    if(autofillCollection.find({url:urlToInsert}).count() == 0){
                        autofillCollection.insert({url:urlToInsert, titleAutofill:titleCheerio, descriptionAutofill:description});
                    }
                }
                else{
                    throw new Meteor.Error("not found", "bad status code returned");
                }
            });
    }
    },
    addWebsite:function(website){
        var validator = Meteor.npmRequire('validator');
        if(!validator.isURL(website.url)){
            throw new Meteor.Error("invalid url", "url should be using the strict formatting");
        }
        if(!Meteor.userId()){
            return false;
        }
        if(Websites.findOne({url:website.url})){
            return "exists";
        }
        if(website.title.length > 70){
            website.title = website.title.substring(0, 67);
            website.title += "...";
        }
        if(website.description.length > 220){
            website.description = website.description.substring(0, 217);
            website.description += "...";
        }
        Websites.insert(website, function(error, result){
            userAccounts.update({user:Meteor.userId()}, {$addToSet:{addedWebsites:result}});
        });


    },
    newUser:function(){
        if(userAccounts.find({user:Meteor.userId()}).count() == 0){
            userAccounts.insert({
                user:Meteor.userId(),
                addedWebsites:[],
                upvoted:[],
                downvoted:[],
                commented:[]
            })
        }
    },
    upvote:function(websiteId){
        if(!Meteor.user()){
            return false;
        }
        var website = Websites.findOne({_id:websiteId});
        var votesList = website.votedBy;
        for(var x in votesList){
            if(votesList[x] == Meteor.userId()){
                return false;
            }
        }
        Websites.update({_id:websiteId}, {$inc:{upvotes:1}} );
        Websites.update({_id:websiteId}, {$addToSet:{votedBy:Meteor.userId()}});
        userAccounts.update({user:Meteor.userId()}, {$addToSet:{upvoted:websiteId}});
    },
    downvote:function(websiteId){
        if(!Meteor.user()){
            return false;
        }
        var website = Websites.findOne({_id:websiteId});
        var votesList = website.votedBy;
        for(var x in votesList){
            if(votesList[x] == Meteor.userId()){
                return false;
            }
        }
        Websites.update({_id:websiteId}, {$inc:{downvotes:1}} );
        Websites.update({_id:websiteId}, {$addToSet:{votedBy:Meteor.userId()}});
        userAccounts.update({user:Meteor.userId()}, {$addToSet:{downvoted:websiteId}});
    },
    comment:function(comment, websiteId){
        if(!Meteor.userId()){
            return false;
        }
        var website = Websites.findOne({_id:websiteId});
        var commentsList = website.commentedBy;
        for(var x in commentsList){
            if(commentsList[x] == Meteor.userId()){
                return false;
            }
        }
        Websites.update({_id:websiteId}, {$addToSet:{comments:comment}});
        Websites.update({_id:websiteId}, {$addToSet:{commentedBy:Meteor.userId()}});
        userAccounts.update({user:Meteor.userId()}, {$addToSet:{commented:websiteId}});
    }
});


Meteor.startup(function () {
    if (!Websites.findOne()){
        console.log("No websites yet. Creating starter data.");
        Websites.insert({
            title:"Goldsmiths Computing Department",
            url:"http://www.gold.ac.uk/computing/",
            description:"This is where this course was developed.",
            createdOn:new Date(),
            upvotes:0,
            downvotes:0,
            comments:[],
            votedBy:[],
            commentedBy:[]
        });
        Websites.insert({
            title:"University of London",
            url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route",
            description:"University of London International Programme.",
            createdOn:new Date(),
            upvotes:0,
            downvotes:0,
            comments:[],
            votedBy:[],
            commentedBy:[]
        });
        Websites.insert({
            title:"Coursera",
            url:"http://www.coursera.org",
            description:"Universal access to the world’s best education.",
            createdOn:new Date(),
            upvotes:0,
            downvotes:0,
            comments:[],
            votedBy:[],
            commentedBy:[]
        });
        Websites.insert({
            title:"Google",
            url:"http://www.google.com",
            description:"Popular search engine.",
            createdOn:new Date(),
            upvotes:0,
            downvotes:0,
            comments:[],
            votedBy:[],
            commentedBy:[]
        });
    }
});