// Core object for objects in the universe. 
define(["history",
        "state",
        "registry"], function(history, state, registry){

var public = {};
var private = {};

public.InteractiveObject = function(){
    this.name = "interactive_object";  
    if( ! this.get_state("initialized") ){
        this.setup();
    }
};
registry.register_object( "interactive_object", public.InteractiveObject );

public.InteractiveObject.prototype = new state.WithState();

public.InteractiveObject.prototype.setup = function() {
    return;
}

public.InteractiveObject.prototype.children = function() {
    return this.get_state("contains");
}

public.InteractiveObject.prototype.verbs = function(){ 
    return _.difference( _.keys( this.__proto__ ), _.keys( public.InteractiveObject.prototype ) );
}

public.InteractiveObject.prototype.visible_children = function(){
    var hidden_objects = this.get_state("hidden_objects");
    return _.filter( this.children(), function(item){
        return !_.contains( hidden_objects, item.name );
    });
};

public.InteractiveObject.prototype.visible_verbs = function(){
    var hidden_verbs = this.get_state("hidden_verbs");
    return _.filter( this.verbs(), function( verb ){
        return !_.contains( hidden_verbs, verb );
    });
};

public.InteractiveObject.prototype.recursive_find = function recursive_find(noun){
    if (this.name === noun){
        return this;
    }
    var visible_children = this.visible_children();
    if (visible_children.length > 0){
        var results = _.map(visible_children, 
            function(child){ return child.recursive_find(noun); }); 
        var list = _.filter( results, function( result ){ return result; } );
        if( list.length > 0 ){
            return list[0];
        }
    }
    return false;
};

public.InteractiveObject.prototype.parent = function( obj ){
    return this.get_state( "parent" );
};

public.InteractiveObject.prototype.add_child = function( obj ){
    var children = this.children();
    if(!_.any( children, function(child) {return child.name === obj.name;})){
        obj.set_state( "parent", this);
        children.push(obj);
        this.set_state("contains", children );
        return true;
    }
    return false;
};

public.InteractiveObject.prototype.remove_child = function( obj ){
    var children = _.filter(this.children(), function(child){
        return !obj.name == child.name;
    });
    this.set_state("contains", children);
};

public.InteractiveObject.prototype.has_child = function( name ){
    return _.any( this.children(), function(child){
        return child.name === name;
    });
}

public.InteractiveObject.prototype.has_visible_child = function( name ){
    return _.any( this.visible_children(), function(child){
        return child.name === name;
    });
}

public.InteractiveObject.prototype.hide_child = function( obj ){
    if( typeof(obj) !== "string" ){
        obj = obj.name;
    }
    var hidden_children = this.get_state("hidden_objects");
    if(!_.any( hidden_children, function(hidden_child) {
            return hidden_child === obj;})){
        hidden_children.push(obj);
        this.set_state("hidden_objects", hidden_children );
        return true;
    }
    return false;
};

public.InteractiveObject.prototype.show_child = function( obj ){
    if( typeof(obj) !== "string" ){
        obj = obj.name;
    }
    var hidden_children = _.filter(this.get_state("hidden_objects"), function(child){
        return obj !== child;
    });
    this.set_state("hidden_objects", hidden_children);
};

public.InteractiveObject.prototype.hide_verb = function( verb ){
    var hidden_verbs = this.get_state("hidden_verbs");
    if(!_.any( hidden_verbs, function(hidden_verb) {return hidden_verb === verb;})){
        hidden_verbs.push(verb);
        this.set_state("hidden_verbs", hidden_verbs );
        return true;
    }
    return false;
};

public.InteractiveObject.prototype.show_verb = function( verb ){
    var hidden_verbs = _.filter(this.get_state("hidden_verbs"), function(v){
        return !v == verb;
    });
    this.set_state("hidden_verbs", hidden_verbs);
};

public.InteractiveObject.prototype.delete = function(){
    if( this.get_state("parent") === null ){
        console.error("Cannot delete element without parent.");
    }
    this.get_state("parent").remove_child(this);
};

public.sample_objects = {}

public.sample_objects.orange = function(){
    this.name = "orange";    
};
public.sample_objects.orange.prototype = new public.InteractiveObject();
public.sample_objects.orange.prototype.eat = function(){
    history.append("The orange is delicious.");
    this.delete();
}
registry.register_object( "orange", public.sample_objects.orange );

public.sample_objects.fridge = function(){
    this.name = "fridge";
};
public.sample_objects.fridge.prototype = new public.InteractiveObject();
public.sample_objects.fridge.prototype.setup = function(){
    this.hide_verb("close");
    var orange = new public.sample_objects.orange();
    this.add_child( orange );
    this.hide_child( orange );
    this.set_state("initialized", true); 
}
public.sample_objects.fridge.prototype.default_state = {
    open: false,
};
public.sample_objects.fridge.prototype.smell = function() {
    history.append("It smells fridgy.");
};
public.sample_objects.fridge.prototype.eat = function() {
    history.append("You can't fit the entire thing in your mouth.");
};
public.sample_objects.fridge.prototype.look = function() {
    if( ! this.get_state('open') ){ 
        history.append("It's a Fridgit Jones 5000.");
    }
    else{
        history.append("It's an open Fridgit Jones 5000.");
        if(this.has_child('orange')){
            history.append("There's an orange in there. ");
        }
    }
};
public.sample_objects.fridge.prototype.open = function() {
    if( ! this.get_state('open') ){
        this.set_state('open', true); 
        this.show_verb("close");
        this.hide_verb("open");
        history.append( "You open the fridge." );
        this.show_child( "orange" );
        if( this.has_child( "orange" ) )
        {
            history.append( "There's an orange in there." );
        }
    }
    else{
        history.append( "The fridge remains open." );
    }
};
public.sample_objects.fridge.prototype.close = function() {
    if( this.get_state('open') ){
        this.set_state('open', false); 
        this.show_verb("open");
        this.hide_verb("close");
        history.append( "You close the fridge.");
        this.hide_child( "orange" );
    }
    else{
        history.append( "The fridge remains closed.");
    }
};
public.sample_objects.fridge.prototype.take = function() {
    history.append( "The fridge is a little too heavy for that." );
};
public.sample_objects.fridge.prototype.use = function(obj){
    if( typeof(obj) === "undefined" ){
        history.append( "Use the fridge? Okay. You use it." );
    }
    else if( obj.name === "orange" ){
        history.append( "You rub the orange sensually against the fridge." );
    }
    else{
        history.append( "I'm not sure how to use that on the orange." );
    }
};

registry.register_object( "fridge", public.sample_objects.fridge );

return public;
});
