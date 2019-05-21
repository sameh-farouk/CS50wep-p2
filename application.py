import os

from flask import Flask, render_template, request, session, url_for, send_from_directory
from flask_session import Session
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms, disconnect, send
from collections import deque
from werkzeug.utils import secure_filename


app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

app.config['UPLOAD_FOLDER'] = './uploads'
ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])

Session(app)
socketio = SocketIO(app, manage_session=False)
chat_rooms = ["General Talk"]
default_room = "General Talk"
# here we keep track of online users
# using dictionary, where key is unique session id of every user,
# and value is username
active_users = {}
# here we store last 100 message for every specific chat-room
# using dictionary, where key is room name,
# and the value is list of dictionarys( every dictionary contain a message and the sender name). 
history = {}

@app.route("/")
def index():
	return render_template('index.html')


@socketio.on('connect')
def connect():
	print(session.sid)
	if 'user' in session:
		check(session['user'])
	else:
		emit('authentication required', 'hello')
		

@socketio.on('message')
def pass_message(msg):
	if 'user' in session:
		# pass this message to all clients connected in the same room
		send(msg, room=session['current_room'])
		# lets keep track of last 100 message in every specifec room
		# history is a dictionary where kye is room name and value is list of dictionares,
		# every dictionary in that list represent a message (message body, and sender)
		if session['current_room'] in history:
			# make sure to limit message storage to 100 message in each room
			if len(history[session['current_room']]) >= 100:
				history[session['current_room']].popleft()
			history[session['current_room']].append(msg)
		else:
			# first message in this room.
			# we will use deque collection to store messages so we can pop old message easy and fast
			history[session['current_room']] = deque([msg])


@socketio.on('authentication request')
def check(name):
	if (name):
		# TO DO: check if this name currently used
		# we call a function to first save the username in the server side session,
		# and to add user to online-users list, so we can track the number of online users
		# if this function return false then user did not added as he is already online from other tab
		res = add_user(name)
		if res:
			# lets find a room to the user. we call a function that add new users to default room,
			# and add old users to last room they was in.
			switch_room()
			# send a loged in event to the client, with a lot of useful info,
			# number of online users,
			# list of all rooms,
			# user current room,
			emit('loged in', {'name': session['user'], 'active_users': len(active_users), 'rooms': chat_rooms, 'current_room': session['current_room']})
			print(f"loged in with name: {session['user']}")
		else:
			print('user have other active session')


@socketio.on('disconnect')
def remove_user():
	if session.sid in active_users:
		# remove loged in user from online users
		active_users.pop(session.sid, None)
		print(session['user'] + 'has disconnected. now users are' + str(len(active_users)))
	else:
		# user did not loged in properly yet. so he did not exesit in online users list. no further action required
		print('no need to remove this client from active users list becouse he did not loged in yet')


@socketio.on('request create room')
def create_room(room):
	# check if room is valid and not already exists.
	if room['name'] and room['name'] not in chat_rooms:
		chat_rooms.append(room['name'])
		switch_room(room['name'])
		# send all rooms , so it can build rooms list 
		socketio.emit('refresh rooms', {'rooms': chat_rooms}, broadcast=True)


def add_user(username):
	# if user not in server session add it so we can remember him later
	if 'user' not in session:
		session['user']=username
	# if user not in online-users list, add him to the list
	if session.sid not in active_users:
		active_users.update({session.sid: username})
		return True
	# user is already loged in , this mean he try to open 2nd browser tab 
	# if this behaviour  allowd , it will cause problem when user close one of the multible tabs,
	# as disconnect event will log user out or miss-count online-users.
	else:
		print('user already loged in')
		return False


@socketio.on('switch room')
def switch_room(room=None):
	if not room:	
		# user try to log in. let's rememberd last room he was in.
		if 'current_room' in session and session['current_room'] in chat_rooms:
			room = session['current_room']
		# or log him in the server default room , till he choose later other room ( this included when rooms deleted after server restarted)
		else:	
			room = default_room
			session['current_room'] = room
	elif room in chat_rooms:
		# user switch current room. so first lets remove him from current room
		leave_room(session['current_room'])
		# then make sure to remmember his choise later when he came back
		session['current_room'] = room
	else:
		room = default_room
		session['current_room'] = room
	join_room(room)
	if history.get(session['current_room']):
		# we need to convert deque collection to list before send it to the client, deque not supported to send in json data
		last100msg = list(history[session['current_room']])
	else:
		last100msg = []
	emit('joined a room', {'current_room': room, 'last100msg': last100msg})


@socketio.on('upload')
def upload(data):
	# save the binary data to new file
	# if the file already file will not save
	# To DO : limit allowed file size , upload in chunks instead of whole file.
	if data['data'] and data['name'] != '' and allowed_file(data['name']):
		filename = secure_filename(data['name'])
		with open(os.path.join(app.config['UPLOAD_FOLDER'], filename), "xb") as newFile:
			newFile.write(data['data'])
		# here we call function to pass a message contain file name in message body , sender name and file url
		pass_message({'file': url_for('uploads',filename=filename), 'message': filename, 'sender': session['user']})
	else:
		print('invalid file or extension not allowed')


@app.route('/uploads/<filename>')
def uploads(filename):
	# serving uploaded files 
	return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


def allowed_file(filename):
	# check if the file extension in the server extensions white list
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


if __name__ == '__main__':
	socketio.run(app, debug = True, host = '0.0.0.0')
