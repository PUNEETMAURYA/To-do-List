//jshint esversion:6

const express = require("express");

const date = require(__dirname + "/date.js");
const lodash = require('lodash');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
const port = process.env.PORT || 5000;
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin-puneet:Puneet123@cluster0.y2iem.mongodb.net/toDolistDB',{useNewUrlParser:true,useUnifiedTopology:true});

const itemSchema = new mongoose.Schema({
    item : {
      type:String,
      required:[true,"Insert valid item"]
    }
});

const Item = mongoose.model('item',itemSchema);

const item1 = new Item({item:"Welcome to your ToDo list!"});

const defaultItems = [item1];


/* TO insert data only once, use with if else in app.get */

app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({},function(err,data){
    // to avoid multiple entries of default data,using with conditionals
    // fill defauldata only iff collection is empty
    if(data.length==0){
      //  console.log(data.length);
        
        Item.insertMany(defaultItems)
        .then(()=>{console.log("Items Inserted")})
        .catch((err)=>console.log("Error"+err));
        res.redirect('/');
        // after filling the empty db, we redirect to same(home) again,but this time
        //onwards ,it will go to else block only.So,no multiole entries
    }
      else{
    //  console.log(data);
           res.render("list", {listTitle: day, newListItems: data});
        }
       
      }
  );

});

//creating new list for custom routes
const listSchema = {
  name:String,
  items: [itemSchema]
};
const List = mongoose.model("List",listSchema);
 
app.get("/:work",function(req,res){
  let collectionName = lodash.capitalize(req.params.work);

  // To avoid  redundant insert,use findOne method
  //NOTE: find() returns emoty arrray [] ,but findone returns object true/false.So,diff approach
 
  List.findOne({name:collectionName},function(err,result){
    if(err) console.log("Error");
    else if(!result) {
      // console.log("New data inserted in collection");
      let newlist = new List({
              name:collectionName,
              items:defaultItems
            });
            newlist.save();
         
           res.redirect('/'+collectionName); 
    }
    else {
      // console.log(result); //If that item data is already present
      res.render("list", {listTitle: collectionName, newListItems: result.items});
    }
  })
  
  
})

app.post("/", function(req, res){
  // console.log(req.body);
  
  let myday = date.getDate();
  // console.log(myday);  
  let myroute=req.body.list;
  
  const newwork = req.body.newItem;

  //instead of using insertmany,use object so that we can save it in desired colelction
  
  const item = new Item({
    item:newwork
  });
  //Irrespective of route data has to be inserted, so write it after insert
  if(myroute!=myday){     //mere list ka name aaj ka day,date h:joki dynamic h;isliye aise equate kie h
    // if post came from any route,other than home,check if that list exist in collection
    //if yes,then add to that lists' item ARRAY

    List.findOne({name:myroute},function(err,foundList){
      if(!err){
        
          foundList.items.push(item);
          foundList.save();   //important

          
      }
    })
    res.redirect('/'+myroute);
  }else{
    item.save();
    res.redirect('/');
  }

});

app.post('/delete',function(req,res){
  // console.log(req.body.workdone);  ->gives _id of deleted item
  // console.log(req.body.listname);  ->gives /page from where list is deleted
  let myid = req.body.workdone;
  let itemroute = req.body.listname;
  let myday = date.getDate();
  if(itemroute!=myday){
      List.findOneAndUpdate({name:itemroute},{$pull:{items:{_id:myid}}},function(err,found){
        
          // found.items.findByIdAndDelete(myid); ->this wont work beacuse we have to
          //delete from array of lists,one way is to loop in array and delete
          //other more efficient way is using $pull.{$ means w'll have to combine it with mongoDB}

          if(!err)
            res.redirect('/'+itemroute);
        
      })
  }
  else{
      Item.deleteMany({_id:myid})
      .then(()=>{console.log("Deleted")})
      .catch((error)=>{console.log("Not deleted")})
      res.redirect('/');
  }
})

app.listen(port, function() {
  // console.log("Server started on port 5000");
});
