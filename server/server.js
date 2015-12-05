/**
 * Created by Keno on 12/1/2015.
 */
    // start up function that creates entries in the Websites databases.

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
            if(!parsedUrl.hostname){
                throw new Meteor.Error("invalid url", "url should be using the strict formating");
            }


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
                                console.log(result.content);
                                console.log(result.content.indexOf("description"));
                                console.log(result.content.indexOf("keywords"));
                            }
                        }
                    }
                    console.log("host na serveru je " + parsedUrl.hostname);

                    if(autofillCollection.find({hostname:parsedUrl.hostname}).count() == 0){
                        autofillCollection.insert({hostname:parsedUrl.hostname, titleAutofill:titleCheerio, descriptionAutofill:description});
                    }
                }
                else{
                    throw new Meteor.Error("not found", "bad status code returned");
                }
            });
    }
    },
    addWebsite:function(website){
        if(!Meteor.userId()){
            return false;
        }
        if(Websites.findOne({url:website.url})){
            return "exists";
        }
        Websites.insert(website);
    }

});


Meteor.startup(function () {
    // code to run on server at startup
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