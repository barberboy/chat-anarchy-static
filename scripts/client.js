var channel = {
    name: location.pathname,
    count: 0,
    counter: document.querySelector(".count"),
    title: document.querySelector(".channel"),
    messages: document.querySelector(".messages"),
    input: document.querySelector(".message-box"),
    init: function() {
        var socket = io()
            .on("connect", function() {
                socket.emit("join", channel.name);
            })
            .on("announce", channel.text)
            .on("inject", channel.html)
            .on("message", channel.message)
            .on("roster", function(roster) {
                channel.count = roster.length;
                channel.changed();
            })
            .on("history", channel.history);

        channel.input.addEventListener("change", function(event) {
            if (channel.input.value.trim()) {
                socket.send(channel.input.value);
                channel.input.value = "";
            }
        }, false);

        channel.input.addEventListener("keyup", function(event) {
            if (event.keyCode == 13 && channel.input.value.trim()) {
                socket.send(channel.input.value);
                channel.input.value = "";
            }
        }, false);

        channel.input.addEventListener("focus", function() {
            channel.realign();
        });

        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) channel.changed();
        }, false);

        if (navigator.standalone) {
            document.body.className = "standalone";
        }
    },
    lastUser: "",
    changed: function() {
        var name = decodeURIComponent(channel.name.replace("/", ""));
        if (name) {
            channel.title.textContent = name;
        }
        else {
            channel.title.textContent = "home";
        }
        channel.counter.textContent = channel.count;
        document.title = (document.hidden ? "• " : "") + (name ? name + " | " : "") + "chat anarchy";
    },
    html: function html(html) {
        var div = document.createElement("div");
        div.innerHTML = html;
        channel.append(div);
    },
    message: function text(data) {
        var lastUser = channel.lastUser;
        channel.lastUser = data.u;
        var message = document.createElement("div");
        message.className = "body";
        message.title = data.timestamp;
        if (lastUser !== data.u) {
            var user = document.createElement("span");
            user.className = "user";
            user.appendChild(document.createTextNode(data.u));
            message.appendChild(document.createTextNode(data.m));
            channel.append(user, message);
        }
        else {
            message.appendChild(document.createTextNode(data.m));
            channel.append(message);
        }
    },
    text: function text(m) {
        channel.lastUser = "";
        var p = document.createElement("div");
        p.className = "announcement";
        p.title = Date();
        p.appendChild(document.createTextNode(m));
        channel.append(p);
    },
    append: function() {
        var div = document.createElement("div");
        div.className = "message";
        for (var i = 0, mx = arguments.length; i < mx; i++) {
            div.appendChild(arguments[i]);
        }
        channel.messages.appendChild(div);
        channel.realign();
        channel.changed();
    },
    // TODO: Removed duplicate logic in `message`
    history: function(messages) {
        var lastUser;
        var historyItem = document.createElement('div');
        historyItem.className = 'history';

        messages.forEach(function(m) {
            var data = m.data;
            var message = document.createElement('div');
            message.className = 'message';
            var body = document.createElement("div");
            body.className = "body";
            body.title = m.data.timestamp;
            if (lastUser !== data.u) {
                var user = document.createElement("span");
                user.className = "user";
                user.appendChild(document.createTextNode(data.u));
                message.appendChild(user);
                lastUser = data.u;
            }
            body.appendChild(document.createTextNode(data.m));
            message.appendChild(body);
            historyItem.appendChild(message);
        });

        channel.messages.insertBefore(historyItem, channel.messages.firstChild);
    },
    realign: function() {
        window.scrollTo(window.scrollX, channel.messages.clientHeight - 148);
    }
};
channel.init();