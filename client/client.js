document.title = "siteace";

function addHttp(link){
    if(link.indexOf("http") == -1){
        var stringTemp = "http://";
        stringTemp += link;
        return stringTemp;
    }
    return link;
}

Session.set("host", undefined);
Session.set("searchTerm", undefined);
Accounts.ui.config({
	passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
});

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
            if(Session.get("searchTerm")){
                if(Websites.find({$or: [{title: { $regex: Session.get("searchTerm"), $options: 'i' }}, {description: { $regex: Session.get("searchTerm"), $options: 'i' }}]}, {sort:{upvotes:-1} }).count() != 0){
                    $("#noResults").html("");
                    return Websites.find({$or: [{title: { $regex: Session.get("searchTerm"), $options: 'i' }}, {description: { $regex: Session.get("searchTerm"), $options: 'i' }}]}, {sort:{upvotes:-1} });
                }
                else{
                    $("#noResults").html("No results found...");
                    return [];
                }
            }
            return Websites.find({}, {sort:{upvotes:-1}});
        }
	});

	Template.website_item.events({
		"click .js-upvote":function(event){
            var userId = Meteor.userId();
            if(!userId){
                return false;
            }
            var votesList = this.votedBy;
			// put the code in here to add a vote to a website!
            for(var x in votesList){
                if(votesList[x] == userId){
                    return false;
                }
            }
            Websites.update({_id:this._id}, {$inc:{upvotes:1}} );
            Websites.update({_id:this._id}, {$addToSet:{votedBy:userId}});

			return false;// prevent the button from reloading the page
		}, 
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
            var userId = Meteor.userId();
            if(!userId){
                return false;
            }
			//console.log("Down voting website with id "+website_id);
            var votesList = this.votedBy;
            for(var x in votesList){
                if(votesList[x] == userId){
                    return false;
                }
            }
            Websites.update({_id:this._id}, {$inc:{downvotes:1}} );
            Websites.update({_id:this._id}, {$addToSet:{votedBy:userId}});
			// put the code in here to remove a vote from a website!

			return false;// prevent the button from reloading the page
		},
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
		"click .js-toggle-website-form":function(event){
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
                Meteor.call("addWebsite", theWebsite);
                $("#website_form").toggle('slow');
                $("#url").val("");
                $("#title").val("");
                $("#description").val("");

            }

			//  put your website saving code in here!	

			return false;// stop the form submit from reloading the page

		},
        "blur #url":function(event){
            function getLocation(href) {
                var l = document.createElement("a");
                l.href = href;
                return l;
            }

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
        var id = textarea.attr("id");
        var comment = textarea.val();

        var commentsList = this.commentedBy;
        for(var x in commentsList){
            if(commentsList[x] == Meteor.userId()){
                textarea.val("You have already commented!");
                return false;
            }
        }

        Websites.update({_id:id}, {$addToSet:{comments:comment}});
        Websites.update({_id:this._id}, {$addToSet:{commentedBy:Meteor.userId()}});
        textarea.val("");
        return false;
    }
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