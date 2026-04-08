
### 1 USER get to /
+ if user is known -> return {is_known: true} -> front render menu
    else
    + server returns {is_known: false}
    + front render /register -> and send POST register params: {username: XXX}

### 2 Sever recevive POST register 
+ if username is taken OR any errors -> retrun {success:false, reason:string}
    else
    + add username to stores and create unique Id + socketId
    + returns {success:true , Id:XXX, socket:XXX, CSRF_tok:XXX}
    + front redirect to /

### 3 Server receive POST create
+ if user is in not in state 'init' -> block him
+ create gameId + join Link + update games list trough socket
+ add user in game with 'waiting oppenent' state

###