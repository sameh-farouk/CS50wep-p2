# Project 2

Web Programming with Python and JavaScript
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

extra dependencies:
  Flask-Session:
    Flask-Session is an extension for Flask that adds support for Server-side Session to web applications.

how i implement the requirements:
  display name should remembered:
    i used Server-side Session to store the username in the server filesystem 
    0-user log in for first time
    1-server look for previously stored username , if the username not in user server-side session, authintcation request sent to th client.
    2-client ask the user for a display name, then send it to the server.
    3-server recieve the display name and store it in the user server-side session (filesystem) to be remembered when user comeback any time.

  channel creation and channel list:
    0-when user joined for first time he loged in to a default channel, called General Talk, 
    1-when user create new channel the client send event to the server with the room name
    2-the server check for name availability, then add the channel room to a list
    3-then server will send un event to clients with a complete list of channels to refresh the new changes, log in the user his new room.
    4-clients refresh the available channels.

  message view and store 100 most recent messages per channel in server-side memory:
    for this requirement, i chooses to use a dictionary, where keys are channels name, and values are lists(deque) of dictionarys ( every dictionary represent a message and contain body, sender, and file url if the message are uploaded file).
    deque is list-like container with fast appends and pops on either end. it allow to pop items from left so we keep most recent messages.
    more info about deque:
        https://docs.python.org/3/library/collections.html#collections.deque
    0-when user log in and join the default room , or last visited room, he receive a list of messages(dictionares) and display it to user.
    1-when user send a message, the server store it in memory in the data-container mentioned before. if the count reach 100 we pop left a message before we store the new message. 
    
  sending message associated with the sender display name and the timestamp:
    0-the server will receive the message from a sender
    1-the server will add the sender info before passing the message as sender info are stored in the session.
    2-client will receive the message, add the local time to message and display it to the user.
  remembering the channel the user was on previously:

  the personal touch:
    user can send txt, pdf, png, jpg, jpeg, gif files to others
    there is a status animated icon, light green when connected or yellow when there are connections issues.
    also online users counter. display to user when he loged in.