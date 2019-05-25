document.addEventListener('DOMContentLoaded', () => {
  // Initialize variables
  // login page
  let $loginPage = document.querySelector('#login_page')
  let $usernameInput = document.querySelector('#name_input')
  // chat page
  let $chatPage = document.querySelector('#chat_page')
  let $roomName = document.querySelector('#room_name')
  let $msgBox = document.querySelector('#msg_Box')
  let $msgInput = document.querySelector('#msg_input')
  let $sendButton = document.querySelector('#send')
  let $uploadInput = document.querySelector('#upload')
  let $displayName = document.querySelector('#display_name')
  let $cards = document.querySelector('#cards')
  let $createRoom = document.querySelector('#create_room')

  const now = function (timestamp=null) {
    let today;
    if (timestamp) {
      today = new Date(timestamp);
    } else {
      today = new Date();
    }
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + ' ' + time;
    return dateTime;
  }
  
  const GetCurrentTimestamp = function () {
    let n = new Date();
    return n.getTime();
  }

  let userName = null;
  let logedIn = false;
  let currentRoom = null;
  let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);


  function addUser(username) {
    // send client username to the server
    socket.emit('authentication request', username);
  }


  function send(msg) {
    if (logedIn) {
      socket.send({ message: msg, sender: userName, timestamp: GetCurrentTimestamp()});
    }
  }


  function notify_user(msg) {
    const li = document.createElement('li');
    li.innerHTML = `<small>${now()}</small>  ${msg}`
    li.style = 'color: goldenrod;'
    $msgBox.insertBefore(li, $msgBox.firstChild);
  }


  function add_message(msg) {
    let li = document.createElement('li');
    let p = document.createElement('p');
    p.innerHTML = `<small>${now(msg.timestamp)}</small> <strong>${msg.sender}</strong> : ${msg.message}`;
    if (msg.file) {
      let a = document.createElement('a');
      a.setAttribute('href', msg.file)
      a.setAttribute('target', '_blank')
      a.setAttribute('rel', 'noopener noreferrer')
      a.textContent = " Open this File (only if you trust it)";
      p.appendChild(a)
    }
    li.appendChild(p)
    if (msg.sender !== userName) {
      li.style = 'color: blue;'
    }
    $msgBox.insertBefore(li, $msgBox.firstChild);
  }


  function refresh_rooms(current = currentRoom, rooms) {
    $cards.innerHTML = '';
    for (room in rooms) {
      const button = document.createElement('button');
      button.innerHTML = `<strong>${rooms[room]}</strong>`
      button.dataset.room = rooms[room]
      button.classList.add('room_button')
      if (rooms[room] == current) {
        button.style = 'color: green;'
      }
      button.addEventListener('click', function (event) {
        socket.emit('switch room', this.dataset.room)
        const buttons = document.querySelectorAll(".room_button")
        for (const button of buttons) {
          button.style = 'color: black;'
        }
        this.style = 'color: green;'

      });
      $cards.append(button);
    }
  }


  function FileChosen(event) {
    selectedFile = event.target.files[0];
    let name = selectedFile.name
    FReader = new FileReader();
    FReader.onload = function (evnt) {
      socket.emit('upload', { 'name': name, 'data': evnt.target.result, 'size': selectedFile.size, 'type': selectedFile.type });
    }
    FReader.readAsArrayBuffer(selectedFile);
  }


  // Keyboard events
  $usernameInput.addEventListener('keypress', (event) => {
    if (event.keyCode == 13) {
      let user_name = $usernameInput.value
      if (user_name) {
        addUser(user_name);
      }
    }
  });

  $msgInput.addEventListener('keypress', (event) => {
    if (event.keyCode == 13) {
      let msg = $msgInput.value
      if (msg) {
        $msgInput.value = ''
        send(msg);
      }
    }
  });

  // click event
  $createRoom.addEventListener('click', () => {
    let room = prompt('give your new channel a name: ');
    if (room.length > 0) {
      socket.emit("request create room", { "name": room });
      // maybe a callback function to make sure server create the room?

    }
  });

  $sendButton.addEventListener('click', () => {
    let msg = $msgInput.value
    if (msg) {
      $msgInput.value = ''
      send(msg);
    }
  });

  // on file selected change
  $uploadInput.addEventListener('change', FileChosen);


  // socket events
  socket.on('connect', () => {
    console.log('connected, socket id is ' + socket.id);
  });


  socket.on('authentication required', () => {
    $loginPage.style.display = 'block';
    $chatPage.style.display = 'none';
  });


  socket.on('loged in', (data) => {
    $loginPage.style.display = 'none';
    $chatPage.style.display = 'block';
    userName = data.name;
    logedIn = true;
    $displayName.textContent = userName
    document.querySelector('#status').classList.replace('text-warning', 'text-success');
    refresh_rooms(data.current_room, data.rooms);
    notify_user(`You've been logged in successfully, active users : ${data.active_users}`);
  });


  socket.on('joined a room', (room) => {
    $roomName.textContent = room.current_room;
    currentRoom = room.current_room;
    let active_button = document.querySelectorAll(`[data-room~="${room.current_room}"]`);
    if (active_button) {
      active_button.style = 'color: green;'
    }
    $msgBox.innerHTML = ''
    notify_user(`you are now in ${room.current_room} room`)
    room.last100msg.forEach(msg => {
      add_message(msg)
    });
    notify_user('all messages below have already been sent before you join this room now.')
  });


  socket.on('message', (msg) => {
    add_message(msg)
  });


  socket.on('refresh rooms', (data) => {
    refresh_rooms(currentRoom, data.rooms)
  });


  socket.on('disconnect', (reason) => {
    if (logedIn) {
      notify_user("You've been disconnected because " + reason + " !");
      logedIn = false
      document.querySelector('#status').classList.replace('text-success', 'text-warning');

    }
    console.log('you have been disconnected because ' + reason);
  });

});