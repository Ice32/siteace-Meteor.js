/**
 * Created by Keno on 12/1/2015.
 */
Websites = new Mongo.Collection("websites");
autofillCollection = new Mongo.Collection("autofillCollection");
userAccounts = new Mongo.Collection("userAccounts");
/*
Websites.allow({
    insert:function(userId, doc){
        if(userId){
            return true;
        }
        else{
            return false;
        }
    },
    update:function(userId, doc){
        if(userId){
            return true;
        }
        else{
            return false;
        }
    },
    remove:function(){
        return true;
    }

})*/