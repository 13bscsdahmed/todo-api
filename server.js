var express=require('express');
var app=express();
var bcrypt= require('bcrypt');
var PORT= process.env.PORT || 3000;
var bodyParser= require('body-parser');
var _= require('underscore');
var db=require('./db.js');
var middleware=require('./middleware.js')(db);

var todos=[];
var todoNextId= 1;

app.use(bodyParser.json());
app.get('/',function(req,res){
	res.send('TODO API Root');
});

app.get('/todos', middleware.requireAuthentication,function(req,res){
	
	var query= req.query;	//query parameters

	var where={
		userId: req.user.get('id')
	};
	if(query.hasOwnProperty('completed') && query.completed=== 'true'){
		where.completed=true;
	}
	else if(query.hasOwnProperty('completed') && query.completed=== 'false'){
		where.completed=false;
	}

	if (query.hasOwnProperty('q') &&  query.q.length>0){
		where.description={
			$like:'%'+query.q+'%'
		};


	}

	db.todo.findAll({where:where}).then(function(todos){

		res.json(todos);

	}, function(e){
		res.status(500).send();

	});



	// 	filteredTodos=_.where(filteredTodos,{completed:true});
	// }
	// else if(queryParams.hasOwnProperty('completed') && queryParams.completed=== 'false'){


	});



	// var filteredTodos= todos;
	
	// if(queryParams.hasOwnProperty('completed') && queryParams.completed=== 'true'){

	// 	filteredTodos=_.where(filteredTodos,{completed:true});
	// }
	// else if(queryParams.hasOwnProperty('completed') && queryParams.completed=== 'false'){

	// 	filteredTodos=_.where(filteredTodos,{completed:false});
	// }

	// if (queryParams.hasOwnProperty('q') &&  queryParams.q.length>0){

	// 	filteredTodos= _.filter(filteredTodos, function callback(todo){
	// 		if(todo.description.indexOf(queryParams.q)>=0){
	// 			return todo;

	// 		}
	// 	});
	// }

	// res.json(filteredTodos);


app.get('/todos/:id',middleware.requireAuthentication, function(req,res){
	var todoID= parseInt(req.params.id,10);



	db.todo.findOne({
		where:{
			id:todoID,
			userId: req.user.get('id')	
		}
	}).then(function(todo){
		if(!!todo){
		res.json(todo.toJSON());
		}
		else{
			res.status(404).send();
		}
		
	},function(e){
		return res.status(500).json(e);


	});

	//var matchdedtodo= _.findWhere(todos,{id: todoID}); //underscore library
	//var matchdedtodo;
	//res.send('Asking for todo with id of:'+req.params.id);
	//res.send(todos.length);
	// todos.forEach(function(todo){
	// 	if(todoID === todo.id) {


	// 		matchdedtodo= todo;

	// 	}
			
	// });

	// if(matchdedtodo){

	// 	res.json(matchdedtodo);

	// }
	// else{
	// 	res.status(404).send();
	// }
	

});
		


app.post('/todos',middleware.requireAuthentication, function (req,res){
	var body= _.pick(req.body,'description','completed');
	db.todo.create(body).then(function(todo){

		 //res.json(todo.toJSON());

		 req.user.addTodo(todo).then(function(){
		 	return todo.reload();
		 }).then(function(todo){
		 	res.json(todo.toJSON());
		 });
		}, function (e){
			
			return res.status(400).json(e);
	});	
 		
 			
 		

	// if(!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length===0){


	// 	return res.status(400).send();
	// }


	// body.description=body.description.trim();
	// body.id=todoNextId;
	// todoNextId+=1
	// //console.log('description:'+body.description);
	// todos.push(body);
	// res.json(body);

});


app.delete('/todos/:id',middleware.requireAuthentication, function(req,res){
	var todoID= parseInt(req.params.id,10);
	
	
		db.todo.destroy({
		where:{
			id:todoID,
			userId: req.user.get('id') 
		
				}
			}).then(function(rowsDeleted){
				if(rowsDeleted===0){
					res.status(404).json({"Error":"No Todo found with that id"});

				}

				else{
					res.status(204).send();
				}

			},function(){
				res.status(500).send();
			
		

	});


	//var matchedtodo= _.findWhere(todos,{id: todoID});
	// if(!matchedtodo){
	// 	return res.status(404).json({"Error":"No Todo found with that id"});
	// }

	// else{
	// todos=_.without(todos,matchedtodo);
	
	// res.json(todos);

	// }

});







app.put('/todos/:id', function(req,res){
	var body= _.pick(req.body,'description','completed');
	var attributes={};
	var todoID= parseInt(req.params.id,10);
	
	//console.log(typeof(body.completed));
	

	if(body.hasOwnProperty('completed')){ 
		attributes.completed= body.completed;
		
	}
	

	if(body.hasOwnProperty('description')) {  
		attributes.description=body.description;
		
	}
	

	//if code executes till this point we know that there's something right provided to be updated
	db.todo.findOne({
		where:{
			id:todoID,
			userId: req.user.get('id') 
		}
	}).then(function(todo){
		if(todo){
			todo.update(attributes).then (function(todo){
			res.json(todo.toJSON());
	}, function(e){

		res.status(400).json(e);

	});

	}
		else{
			res.status(404).send();
		}
	}, function(){
		res.status(500).send();

	});
	// _.extend(matchedtodo,validAttributes);
	// res.json(matchedtodo);

});








app.post('/user', function (req,res){
	var body= _.pick(req.body,'email','password');
	db.user.create(body).then(function(user){
		 res.json(user.toPublicJSON());
		}, function (e){
			
			return res.status(400).json(e);
	});	

});

app.post('/user/login', function (req,res){
	var body= _.pick(req.body,'email','password');

	db.user.authenticate(body).then(function(user){
	var token=user.generateToken('authentication');
	if (token){
		res.header('Auth',token).json(user.toPublicJSON());
	}
	else{
		res.status(401).send();
	}

	},function( ){
		res.status(401).send();

	});


});





db.sequelize.sync({force:true}).then(function(){	//if force set to true db created everytime
	app.listen(PORT,function(){
	console.log('Express listening on PORT'+ PORT+'!');
	});
 
});

