document.title = "siteace";

/*check if the user has his own document in the userAccounts colletion
I tried to have that document created right after the user registers, but don't really know how*/
Deps.autorun(function () {
    if (Meteor.user()){
        Meteor.call("newUser");
    }
});

//function that adds prefix http:// if the user didnt enter it
function addHttp(link){
    if(link.indexOf("http") == -1){
        var stringTemp = "http://";
        stringTemp += link;
        return stringTemp;
    }
    return link;
}

//got hostname of the link on the client-side
function getLocation(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
}

//upvote a website
function upvote(){
    var userId = Meteor.userId();
    if(!userId){
        return false;
    }
    Meteor.call("upvote", this._id);
    return false;
}

//downvote a website
function downvote(){
    var userId = Meteor.userId();
    if(!userId){
        return false;
    }
    Meteor.call("downvote", this._id);
    return false;
}

//user for autofill
Session.set("host", undefined);

//user isn't searching
Session.set("searchTerm", undefined);

//user is on the homepage
Session.set("tab", "popularNav");

Accounts.ui.config({
	passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
});

//all of the routing
Router.configure({
    layoutTemplate: 'mainTemplate'
});
Router.route("/", function(){
    $("#searchField").show();
    this.render("formAndList", {
        to:"main"
    })
});
Router.route("/image/:_id", function(){
    $("#searchField").hide();
    this.render("websiteDetail", {
        to: "main",
        data:function(){
            return Websites.findOne({_id:this.params._id});
        }
    })
});

	// helper function that returns all available websites
	Template.website_list.helpers({
        websites:function(){
            var tab = Session.get("tab");
            $("#searchField").show();

            if(tab == "suggestedNav"){
                //suggest websites to user based on what he/she has upvoted/commented
                $("#searchField").hide();
                //get everything the user has commented or upvoted (from the userAccounts collection)
                var selectedS = userAccounts.findOne({user:Meteor.userId()}, {commented:1, _id:0}).commented;
                var $selectedS = $(selectedS).toArray();
                var selectedS2 = userAccounts.findOne({user:Meteor.userId()}, {upvoted:1, _id:0}).upvoted;
                var $selectedS2 = $(selectedS2).toArray();
                //$selectedS contains IDs all of the websites the current user has commented or upvoted
                $selectedS = $selectedS.concat($selectedS2);
                if($selectedS.length == 0){
                    $("#noResults").html("No results...you haven't showed us what you like yet!");
                    return [];
                }
                $("#noResults").html("");
                //searchTerms contains titles and descriptions of all those websites, separated in words
                var searchTerms = [];
                for(let element of $selectedS){
                    var title = Websites.findOne({_id:element}).title;
                    title = title.split(" ").filter(function(el) {return el.length != 0});
                    var description = Websites.findOne({_id:element}).description;
                    description = description.split(" ").filter(function(el) {return el.length != 0});
                    searchTerms = searchTerms.concat(title);
                    searchTerms = searchTerms.concat(description);
                }
                //now remove the duplicates and the works like "a" and "an"
                var uniqueTerms = [];
                $.each(searchTerms, function(i, el){
                    if($.inArray(el, uniqueTerms) === -1){
                        if(el != "a" && el != "to"&& el != "an"&& el != "do"&& el != "is"&& el != "and"&& el != "the"){
                            uniqueTerms.push(el);
                        }
                    }
                });
                //termsFinal contains all of the websites found based on regex search through uniqueTerms
                var termsFinal = [];
                var escape = function(text) {
                    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                };
                for(let term of uniqueTerms){
                    term = escape(term);
                    var expression = "(\\s|\\b)" + term + "(\\s|\\b)";
                    var objectToConcat = Websites.find({$or: [{title: { $regex: expression, $options: 'ig' }}, {description: { $regex: expression, $options: 'ig' }}]}, {sort:{upvotes:-1} }).fetch();
                    var doConcat = true;
                    var first, second;
                    for(var i = 0; i < objectToConcat.length;i++){
                        first = objectToConcat[i].title;
                        for(var j = 0; j < termsFinal.length;j++){
                            second = termsFinal[j].title;
                            if(first == second){
                                doConcat = false;
                            }
                        }
                        if(doConcat){
                            termsFinal = termsFinal.concat(objectToConcat);
                        }
                    }
                }
                return termsFinal;
            }

            else if(tab == "yourNav"){
                $("#searchField").hide();
                var selected = userAccounts.findOne({user:Meteor.userId()}, {addedWebsites:1, _id:0}).addedWebsites;
                if(Websites.find({_id:{$in: selected}}).count() == 0){
                    $("#noResults").html("You haven't added any websites yet :(");
                    return [];
                }
                $("#noResults").html("");
                return Websites.find({_id:{$in: selected}});

            }
            else if(tab == "popularNav"){
                //if the user is searching, return only websites that contain the search term
                if(Session.get("searchTerm")){
                    if(Websites.find({$or: [{title: { $regex: Session.get("searchTerm"), $options: 'i' }}, {description: { $regex: Session.get("searchTerm"), $options: 'i' }}]}).count() != 0){
                        $("#noResults").html("");
                        return Websites.find({$or: [{title: { $regex: Session.get("searchTerm"), $options: 'i' }}, {description: { $regex: Session.get("searchTerm"), $options: 'i' }}]}, {sort:{upvotes:-1} });
                    }
                    else{
                        $("#noResults").html("No results found...");
                        return [];
                    }
                }
                //otherwise return all of the websites
                return  Websites.find({}, {sort:{upvotes:-1}});
            }
            $("#noResults").html("");
            return  Websites.find({}, {sort:{upvotes:-1}});
        },
        header:function(){
            var tab = Session.get("tab");
            if(tab == "popularNav"){
                return "Most upvoted websites";
            }
            else if(tab == "suggestedNav"){
                return "Websites suggested for you";
            }
            else if(tab == "yourNav"){
                return "Websites you've added";
            }
            else{
                return "";
            }
        }
	});

	Template.website_item.events({
		"click .js-upvote":upvote,
		"click .js-downvote":downvote,
        "click .openComments":function(e){
            var button = $(e.target);
            button = button.next();
            button.toggle("slow");
        }
	});

Template.website_item.helpers({
    commentsExist:function(){
       if(this.comments){
           if(this.comments.length > 0){
               return true;
           }
           else{
               return false;
           }
       }

    }
});

	Template.website_form.events({
		"click .js-toggle-website-form":function(){
			$("#website_form").toggle('slow');
		}, 
		"submit .js-save-website-form":function(event){
			var url = event.target.url.value;
			var title = event.target.title.value;
			var description = event.target.description.value;

            if(url){
                url = addHttp(url);
                if(Websites.findOne({url:url})){
                    alert("already exists");
                    return false;
                }
                var theWebsite = {
                    title:title,
                    url:url,
                    description:description,
                    createdOn:new Date(),
                    upvotes:0,
                    downvotes:0,
                    comments:[],
                    votedBy:[],
                    commentedBy:[]
                };
                if(!theWebsite.title){
                    var defaultTitle = getLocation(theWebsite.url);
                    defaultTitle = defaultTitle.hostname;
                    theWebsite.title = defaultTitle;
                }
                Meteor.call("addWebsite", theWebsite);

                $("#website_form").toggle('slow');
                $("#url").val("");
                $("#title").val("");
                $("#description").val("");
            }
			return false;
		},
        "blur #url":function(event){
            var $target = $(event.target);
            var targetValue = $target.val();
            if(targetValue){
                targetValue = addHttp(targetValue);
                var host = getLocation(targetValue);
                if(host){
                    Session.set("host", host.hostname);
                }
                Meteor.call("autofill", targetValue);
            }
        }
	});
Template.websiteDetail.events({
    "submit #submitComment":function(e){
        e.preventDefault();
        var textarea = $(".commentBox");
        var comment = textarea.val();

        var commentsList = this.commentedBy;
        for(var x in commentsList){
            if(commentsList[x] == Meteor.userId()){
                textarea.val("You have already commented!");
                return false;
            }
        }
        Meteor.call("comment", comment, this._id);
        textarea.val("");
        return false;
    },
    "click .js-upvote":upvote,
    "click .js-downvote":downvote
});

Template.website_form.helpers({
    titleAutofill:function(){
        if(Session.get("host")){
            var title = autofillCollection.findOne({hostname:Session.get("host")});
            if(title){
                return title.titleAutofill;
            }
        }

    },
    descriptionAutofill:function(){
        if(Session.get("host")){
            var description = autofillCollection.findOne({hostname:Session.get("host")});
            if(description){
                return description.descriptionAutofill;
            }
        }
    }
});

Template.mainTemplate.events({
    "keyup #searchForm":function(e){
        e.preventDefault();
        var $searchField = $("#searchField");
        var reg = ".*";
        reg += $searchField.val() + ".*";
        Session.set("searchTerm", reg);
    },
    "click .navigation":function(e){
        var $target = $(e.target);
        var clickedNav = $target.attr("id");
        Session.set("tab", clickedNav);
        $(".active").removeClass("active");
        $target.parent().addClass("active");
    }
});
