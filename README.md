# Project 2

### built to satisfy the requirements for project 2: in CS50 Web Programming with Python and JavaScript , programming course by Harvard University. 

Chit-Chat is online messaging service built with flask and javascript.

the project folder contain this files and folders:

    static
      /index.js       
    templates
      /index.html      
    uploads
    /application.py
    /REAME.md
    /requirements.txt

#### extra dependencies:
- Flask-Session:
Flask-Session is an extension for Flask that adds support for Server-side Session to web applications.

#### how i implement the requirements:
- display name should remembered:
i used Server-side Session to store the username in the server filesystem

  1. user log in for first time
  2. server look for previously stored username , if the username not in user server-side session, authintcation request sent to th client.
  3. client ask the user for a display name, then send it to the server.
  4. server recieve the display name and store it in the user server-side session (filesystem) to be remembered when user comeback any time.

- channel creation and channel list:
  1. when user joined for first time he loged in to a default channel, called General Talk, 
  2. when user create new channel the client send event to the server with the room name
  3. the server check for name availability, then add the channel room to a list
  4. then server will send un event to clients with a complete list of channels to refresh the new changes, log in the user his new room.
  5. clients refresh the available channels.

- message view and store 100 most recent messages per channel in server-side memory:
for this requirement, i chooses to use a dictionary, where keys are channels name, and values are lists(deque*) of dictionarys ( every dictionary represent a message and contain body, sender, and file url if the message are uploaded file).
    
deque is list-like container with fast appends and pops on either end. it allow to pop items from left so we keep most recent messages.

[read here](https://docs.python.org/3/library/collections.html#collections.deque) for more info about deque

  1. when user log in and join the default room , or last visited room, he receive a list of messages(dictionares) and display it to user.
  2. when user send a message, the server store it in memory in the data-container mentioned before. if the count reach 100 we pop left a message before we store the new message. 
 
- sending message associated with the sender display name and the timestamp:
  1. the client will send the message alongside sender name and timestamp derived from Unix time, which is a value consisting of the number of milliseconds that have passed since midnight on January 1st, 1970.
  2. the server will pass it to other clients.
  3. clients will receive the message object, and Retrieving message and sender info and  convert the timestamp associated with the message to local time and string format for display to users.

- remembering the channel the user was on previously:
the last channel user was on are stored in the user session on server-side's file-system.

- the personal touch:
  - user can send txt, pdf, png, jpg, jpeg, gif files to others
  - there is a status animated icon, light green when connected or yellow when there are connections issues.
  - also online users counter. display to user when he loged in.
