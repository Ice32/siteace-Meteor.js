/**
 * Created by Keno on 12/1/2015.
 */
Websites = new Mongo.Collection("websites");
misc = new Mongo.Collection("misc");

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

})