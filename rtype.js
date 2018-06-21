window.CANVAS_WIDTH = 360;
window.CANVAS_HEIGTH = 640;

window.sendData = function(data) {

    var xhr = new XMLHttpRequest();

    var body = JSON.stringify(data);

    xhr.open("POST", 'http://bot.wizbox.ru/api', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (this.readyState != 4) return;

        // console.log(data);
    };

    xhr.send(body);
}

window.rtype = (function () {
    var ratingElement = document.getElementById('rating');

    var fields = {
        'position': '#',
        'score': 'score',
        'wave': 'wave',
        'hits': 'hits',
        'misses': 'misses',
        'accuracy': 'acc%'
    };

    var keys = Object.keys(fields);

    function drawUserRating(games) {
        var tbl = document.createElement('table');
        tbl.className = 'tbl';
        for (var i = -1; i < games.length && i < 20; i++) {
            if (i >= 0) {
                games[i]['position'] = i + 1;
                var accuracy = games[i].hits ? games[i].hits / (games[i].hits + games[i].misses) * 100 : 0;
                games[i]['accuracy'] = accuracy.toFixed(2);

            }
            var tr = document.createElement('tr');
            keys.forEach(function(key) {
                var e;
                if (i < 0) {
                    tr.className = 'thead';
                    e = document.createElement('th');
                    e.innerHTML = fields[key];
                } else {
                    e = document.createElement('td');
                    e.innerHTML = games[i][key];
                }
                tr.appendChild(e);
            })
            tbl.appendChild(tr);
        }
        ratingElement.style.left = 'calc(50% + ' + (CANVAS_WIDTH / 2 + 50) + 'px)';
        ratingElement.style.top = 'calc(50% - ' + (tbl.offsetHeight / 2 + CANVAS_HEIGTH / 2) + 'px)';
        ratingElement.innerHTML = tbl.outerHTML;
        ratingElement.style.display = 'inline-block';
        console.log(ratingElement);
    }

    function attachListeners() {
        var btns = document.getElementsByClassName('footer_btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener('click', function(e) {
                sendData({
                    action: 'btn_click',
                    btn_name: this.dataset.name
                });
            })
        }
    }

    return {
        init: function() {
            this.drawRating();
            attachListeners();
        },
        drawRating: function() {
            var games = rStorage.getGames();
            console.log(games);
            if (games && games.length > 0) {
                drawUserRating(games);
            }
        }
    }
}());