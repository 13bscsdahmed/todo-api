var Sequelize= require('sequelize');
var env= process.env.NODE_ENV || 'development';
var sequelize;

if(env==='production'){  	//this will be true when only running on heroku
	sequelize= new Sequelize(process.env.DATABASE_URL,{
		dialect:'postgres'

	});

}
else{
	var sequelize= new Sequelize(undefined, undefined,undefined,{
	'dialect': 'sqlite',
	'storage': __dirname+ '/Data/dev-todo-api.sqlite'
	});
}

var db={};
db.todo=sequelize.import(__dirname+'/models/todo.js');
db.user=sequelize.import(__dirname+'/models/user.js');
db.sequelize=sequelize;
db.Sequelize=Sequelize;

db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);


module.exports=db;