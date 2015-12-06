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

Accounts.ui.config({
	passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
});

//all of the routing
Router.configure({
    layoutTemplate: 'layout'
});
Router.route("/", function(){
    this.render("mainTemplate", {
        to:"main"
    })
});
Router.route("/image/:_id", function(){
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
            return Websites.find({}, {sort:{upvotes:-1}});
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
        if(this.comments.length > 0){
            return true;
        }
        else{
            return false;
        }

    }
});

	Template.website_form.events({
		"click .js-toggle-website-form":function(){
			$("#website_form").toggle('slow');
		}, 
		"submit .js-save-website-form":function(event){
			// here is an example of how to get the url out of the form:
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
    }
});
