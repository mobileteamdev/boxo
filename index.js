// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));
//
io.on('connection', function(socket){

	//
	socket.on('inWaitingRoomS', function(giveUp){
		if(giveUp){
			io.sockets.connected[socket.oppoId].emit('opponentGiveUpC');
		}
		socket.oppoId = null;
		socket.leave(socket.room);
		socket.room = 'WaitingRoom';
		socket.join('WaitingRoom');// send client to WaitingRoom
		socket.emit('inWaitingRoomC');
		//socket.readytoplay = false;
		//
		//var clients = io.sockets.adapter.rooms['WaitingRoom']; // all users from WaitingRoom
		//console.log('all users from WaitingRoom: '+Object.keys(clients).length);
	});
	//
	socket.on('confirmedOpponentGiveUpS', function(){
		socket.oppoId = null;
	});
  	//
  	socket.on('sendReadyToPlayS', function(){
	  	//socket.readytoplay = true;
		socket.leave(socket.room);
		socket.room = 'ReadyToPlayRoom';
		socket.join('ReadyToPlayRoom');
		//
		var clients = io.sockets.adapter.rooms['ReadyToPlayRoom'];
		//console.log('all users from ReadyToPlayRoom truoc: '+Object.keys(clients).length);
		if(clients){
			for(var id in clients){
				if(socket.id != id){
					socket.leave(socket.room);
					socket.room = 'Room'+socket.id;
					socket.join('Room'+socket.id);
					socket.oppoId = id;
    				socket.emit('getOpponentReadyToPlayC', id);
					io.sockets.connected[id].emit('sendToInvitedOpponentC', socket.id);
					//
					//var clients2 = io.sockets.adapter.rooms['Room'+socket.id];
					//console.log('all users from '+'Room'+socket.id+':'+Object.keys(clients2).length);
				}
			}
		}
		//
		//console.log('all users from ReadyToPlayRoom sau: '+Object.keys(clients).length);
  	});
  	//
  	socket.on('goToGameRoomS', function(id){
	  	socket.leave(socket.room);
		socket.room = 'Room'+id;
		socket.join('Room'+id);
		socket.oppoId = id;
		io.sockets.connected[id].emit('opponentAlreadyInGameRoomC');
		//
		//var clients = io.sockets.adapter.rooms['Room'+id];
		//console.log('all users from Game room: '+Object.keys(clients).length);
  	});
  	//*************************
  	socket.on('player1ReadyReplayS', function(){
		io.sockets.connected[socket.oppoId].emit('player1ReadyReplayC');
  	});
	//
  	socket.on('player2ReadyReplayS', function(){
		io.sockets.connected[socket.oppoId].emit('player2ReadyReplayC');
  	});
	//*************************
	socket.on('player1SendMapS', function(map){
		io.sockets.connected[socket.oppoId].emit('player1SendMapC', map);
	});
	//
	socket.on('sendPostNumHS', function(data){
		io.sockets.connected[socket.oppoId].emit('sendPostNumHC', data);
	});
	//
	socket.on('sendPostNumVS', function(data){
		io.sockets.connected[socket.oppoId].emit('sendPostNumVC', data);
	});
	//when the user disconnects.. perform this
	socket.on('disconnect', function(){
		/*if(socket.oppoId){
			io.sockets.connected[socket.oppoId].emit('opponentDisconnectC');
		}*/
		if(socket.room != 'WaitingRoom' && socket.room != 'ReadyToPlayRoom'){
			io.sockets.to(socket.room).emit('opponentDisconnectC');
		}
	});
});
